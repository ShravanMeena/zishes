import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, RefreshControl, Alert, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, CheckCircle2, Trophy } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import tournaments from '../../services/tournaments';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import fulfillmentsService from '../../services/fulfillments';
import { hasAddress } from '../../utils/pickupAddresses';

export default function TournamentsWonScreen({ navigation, route }) {
  const authUser = useSelector((s) => s?.auth?.user || null);
  const token = useSelector((s) => s?.auth?.token || null);
  const currentUserId = useMemo(() => (
    authUser?._id || authUser?.id || authUser?.userId || null
  ), [authUser]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [fulfillmentMap, setFulfillmentMap] = useState({});
  const lastForceKeyRef = useRef(null);

  const mapTitle = (it) => it?.product?.name || it?.game?.name || it?.tournament?.game?.name || 'Tournament';
  const mapDate = (it) => {
    const d = it?.tournament?.createdAt || it?.tournament?.startAt || it?.createdAt;
    try { return d ? new Date(d).toLocaleDateString() : '-'; } catch { return '-'; }
  };
  const mapImage = (it) => {
    const pimg = Array.isArray(it?.product?.images) && it.product.images.length > 0 ? it.product.images[0] : null;
    return pimg || it?.game?.thumbnail || it?.tournament?.game?.thumbnail || undefined;
  };
  const mapStatus = (it) => it?.tournament?.status || '-';
  const mapSeller = (it) => (it?.seller?.username ? it.seller.username : 'Unknown');
  const mapWinnerId = (it) => (
    it?.winner?._id || it?.winner || it?.tournament?.winner?._id || it?.tournament?.winner || null
  );
  const mapProductId = (it) => {
    const product = it?.product || it?.raw?.product || {};
    return product._id || product.id || it?.productId || it?.raw?.productId || null;
  };

  const extractReceiverEvents = useCallback((fulfillment, fallbackItem) => {
    const lists = [];
    const pushIfArray = (val) => {
      if (Array.isArray(val)) lists.push(val);
    };
    if (fulfillment) {
      pushIfArray(fulfillment?.events?.receiver?.events);
      pushIfArray(fulfillment?.events?.receiver);
      pushIfArray(fulfillment?.receiver?.events);
      pushIfArray(fulfillment?.receiverEvents);
      pushIfArray(fulfillment?.events);
    }
    if (fallbackItem) {
      pushIfArray(fallbackItem?.fulfillment?.events?.receiver?.events);
      pushIfArray(fallbackItem?.fulfillment?.events?.receiver);
      pushIfArray(fallbackItem?.fulfillment?.receiver?.events);
      pushIfArray(fallbackItem?.fulfillment?.receiverEvents);
    }
    const merged = lists.flat().filter(Boolean);
    return merged.map((ev) => String(ev).toUpperCase());
  }, []);

  const hydrateFulfillments = useCallback(async (list) => {
    if (!token || !currentUserId || !Array.isArray(list) || list.length === 0) return;
    const uniqueProductIds = new Set();
    list.forEach((item) => {
      const productId = mapProductId(item);
      const winnerId = mapWinnerId(item);
      if (
        productId &&
        winnerId &&
        String(winnerId) === String(currentUserId)
      ) {
        uniqueProductIds.add(productId);
      }
    });
    if (uniqueProductIds.size === 0) return;
    try {
      const entries = await Promise.all(
        Array.from(uniqueProductIds).map(async (productId) => {
          try {
            const data = await fulfillmentsService.getByProduct(productId, { token });
            return [productId, data];
          } catch (err) {
            console.warn('[TournamentsWon] Failed to fetch fulfillment', productId, err?.message);
            return [productId, null];
          }
        })
      );
      setFulfillmentMap((prev) => {
        const next = { ...prev };
        entries.forEach(([productId, data]) => {
          if (data) next[productId] = data;
        });
        return next;
      });
    } catch (err) {
      console.warn('[TournamentsWon] Hydration error', err?.message);
    }
  }, [token, currentUserId]);

  const fetchJoined = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await tournaments.getJoinedTournaments({});
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setFulfillmentMap({});
      setItems(list);
      await hydrateFulfillments(list);
    } catch (e) {
      setItems([]);
      setError(e?.message || 'Failed to fetch joined tournaments');
    } finally {
      setLoading(false);
    }
  }, [hydrateFulfillments]);

  useEffect(() => {
    fetchJoined();
  }, [fetchJoined]);

  useFocusEffect(
    useCallback(() => {
      const forceKey = route?.params?.forceRefreshKey;
      if (forceKey && lastForceKeyRef.current !== forceKey) {
        lastForceKeyRef.current = forceKey;
        fetchJoined();
        if (route?.params) {
          const nextParams = { ...route.params };
          delete nextParams.forceRefreshKey;
          navigation.setParams?.(nextParams);
        }
      } else {
        hydrateFulfillments(items);
      }

      const handleBackPress = () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('ProfileHome');
        }
        return true;
      };

      const sub = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => {
        sub.remove();
      };
    }, [route?.params?.forceRefreshKey, route?.params, fetchJoined, hydrateFulfillments, items, navigation])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetchJoined(); } finally { setRefreshing(false); }
  }, [fetchJoined]);

  const renderItem = ({ item }) => {
    const title = mapTitle(item);
    const date = mapDate(item);
    const img = mapImage(item);
    const status = mapStatus(item);
    const seller = mapSeller(item);
    const statusNorm = String(status || '').toUpperCase();
    const isClosed = statusNorm === 'CLOSED' || statusNorm === 'ENDED' || statusNorm === 'OVER';
    const winnerId = mapWinnerId(item);
    const isWinner = !!(winnerId && currentUserId && String(winnerId) === String(currentUserId));
    const productId = mapProductId(item);
    const hydratedFulfillment = productId ? fulfillmentMap[productId] : null;

    const onPress = () => {
      const product = item?.product || {};
      const prodId = product?._id || product?.id;
      if (!prodId) {
        Alert.alert('Unavailable', 'Unable to open tournament details for this item.');
        return;
      }
      const detailsItem = {
        id: prodId,
        _id: prodId,
        images: product?.images || [],
        image: (product?.images || [])[0],
        title: product?.name || title,
      };
      navigation.push('Details', { item: detailsItem, origin: 'TournamentsWon' });
    };
    const verificationStatus = String(
      hydratedFulfillment?.verificationStatus ||
      hydratedFulfillment?.status ||
      item?.raw?.fulfillment?.verificationStatus ||
      item?.fulfillment?.verificationStatus ||
      item?.verificationStatus ||
      item?.fulfillmentStatus ||
      ''
    ).toUpperCase();
    const isAcknowledged = verificationStatus === 'VERIFIED';
    const receiverEvents = extractReceiverEvents(hydratedFulfillment, item);
    const receiverEventSet = new Set(receiverEvents);
    const addressFilledEvent = receiverEventSet.has('ADDRESS_FILLED');
    const proofGivenEvent = receiverEventSet.has('PROOF_GIVEN');
    const receiverAddress = hydratedFulfillment?.pickupAddresses?.receiver
      || item?.fulfillment?.pickupAddresses?.receiver
      || item?.raw?.fulfillment?.pickupAddresses?.receiver
      || null;
    const hasReceiverAddress = hasAddress(receiverAddress) || addressFilledEvent;
    const showProofSubmitted = isWinner && !isAcknowledged && proofGivenEvent;
    const showAddAddress = isWinner && !isAcknowledged && !hasReceiverAddress && !proofGivenEvent;
    const showAcknowledgeButton = isWinner && !isAcknowledged && !showAddAddress && !showProofSubmitted;

    const handleAddAddress = () => {
      navigation.navigate('AcknowledgeReceipt', { item, focus: 'address' });
    };
    const handleAcknowledge = () => {
      navigation.navigate('AcknowledgeReceipt', { item });
    };

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        {isWinner ? (
          <LinearGradient
            colors={["#F8E07E", "#E9C46A", "#D4AF37"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.winnerBorder}
          >
            <View style={[styles.card, styles.cardInside]}>
              <Image source={{ uri: img || 'https://via.placeholder.com/300x150?text=Tournament' }} style={styles.hero} />
              <View style={styles.rowBetween}>
                <Text style={styles.title}>{title}</Text>
                <LinearGradient colors={["#F8E07E", "#EACD5E"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.winnerBadgeGrad}>
                  <Trophy size={14} color={'#2B2443'} />
                  <Text style={styles.winnerTxt}>Winner</Text>
                </LinearGradient>
              </View>
              <Text style={styles.meta}>Joined on: {date}</Text>
              <Text style={styles.meta}>Seller: {seller}</Text>

              <View style={styles.rowBetween}>
                <Text style={styles.meta}>Status</Text>
                <View style={[styles.badge, styles.badgeAck]}>
                  <CheckCircle2 size={14} color={colors.white} />
                  <Text style={styles.badgeText}>{' '}{status}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <Text style={styles.caption}>Congratulations! You won this tournament. Please acknowledge once you receive the item.</Text>
              {isAcknowledged ? (
                <View style={[styles.primary, styles.acknowledgedBanner]}>
                  <Text style={styles.acknowledgedText}>Acknowledged. Enjoy!!</Text>
                </View>
              ) : showProofSubmitted ? (
                <LinearGradient
                  colors={["#F8E07E", "#EACD5E", "#D4AF37"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.primary, styles.winnerCTAGrad]}
                >
                  <TouchableOpacity onPress={handleAcknowledge} style={{ width: '100%', alignItems: 'center' }}>
                    <Text style={[styles.primaryTxt, { color: '#2B2443' }]}>Acknowledgement submitted – view details</Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : showAddAddress ? (
                <LinearGradient
                  colors={["#6D5BD0", "#8F6FF5", "#A98CFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.primary, styles.winnerCTAGrad]}
                >
                  <TouchableOpacity onPress={handleAddAddress} style={{ width: '100%', alignItems: 'center' }}>
                    <Text style={[styles.primaryTxt, { color: '#FFFFFF' }]}>Add Delivery Address</Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : showAcknowledgeButton ? (
                <LinearGradient
                  colors={["#F8E07E", "#EACD5E", "#D4AF37"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.primary, styles.winnerCTAGrad]}
                >
                  <TouchableOpacity onPress={handleAcknowledge} style={{ width: '100%', alignItems: 'center' }}>
                    <Text style={[styles.primaryTxt, { color: '#2B2443' }]}>Acknowledge Item Received</Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : null}
              <TouchableOpacity
                style={[styles.primary, styles.secondaryBtn]}
                onPress={() => {
                  const product = item?.product || {};
                  const prodId = product?._id || product?.id;
                  if (prodId) {
                    navigation.push('Leaderboard', { productId: prodId, item });
                  }
                }}>
                <Text style={[styles.primaryTxt]}>View Leaderboard</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.card}>
            <Image source={{ uri: img || 'https://via.placeholder.com/300x150?text=Tournament' }} style={styles.hero} />
            <View style={styles.rowBetween}>
              <Text style={styles.title}>{title}</Text>
            </View>
            <Text style={styles.meta}>Joined on: {date}</Text>
            <Text style={styles.meta}>Seller: {seller}</Text>

            <View style={styles.rowBetween}>
              <Text style={styles.meta}>Status</Text>
              <View style={[styles.badge, isClosed ? styles.badgeAck : styles.badgePending]}>
                {isClosed ? <CheckCircle2 size={14} color={colors.white} /> : null}
                <Text style={styles.badgeText}>{' '}{status}</Text>
              </View>
            </View>
            <View style={styles.divider} />
              <Text style={styles.caption}>Track your joined tournaments here.</Text>
              <TouchableOpacity
                style={[styles.primary, styles.secondaryBtn]}
                onPress={() => {
                  const product = item?.product || {};
                  const prodId = product?._id || product?.id;
                  if (prodId) {
                    navigation.push('Leaderboard', { productId: prodId, item });
                  }
                }}>
                <Text style={[styles.primaryTxt]}>View Leaderboard</Text>
              </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // console.log(JSON.stringify(items[0],null,2))
  const handleHeaderBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('ProfileHome');
  }, [navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleHeaderBack} style={styles.iconBtn}><ChevronLeft color={colors.white} size={20} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Tournaments Played</Text>
        <View style={styles.iconSpacer} />
      </View>
      {loading ? (
        <FlatList
          data={[1,2,3]}
          keyExtractor={(i, idx) => `skel-${idx}`}
          renderItem={() => <SkeletonWonCard />}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it, idx) => it?._id || it?.tournament?._id || String(idx)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 24, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />}
          ListEmptyComponent={() => (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <Text style={{ color: colors.textSecondary }}>{error || 'No joined tournaments yet.'}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18, flex: 1, textAlign: 'center' },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },
  iconSpacer: { width: 32, height: 32 },

  card: { backgroundColor: '#2B2F39', borderRadius: 18, borderWidth: 1, borderColor: '#343B49', padding: 12 },
  hero: { width: '100%', height: 150, borderRadius: 12, backgroundColor: '#222', marginBottom: 10 },
  title: { color: colors.white, fontWeight: '800', fontSize: 18 },
  meta: { color: colors.textSecondary, marginTop: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#3A4051', marginVertical: 10 },
  caption: { color: colors.textSecondary },
  primary: { backgroundColor: colors.primary, borderRadius: 16, alignItems: 'center', paddingVertical: 14, marginTop: 12 },
  primaryTxt: { color: colors.white, fontWeight: '800' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  badgePending: { backgroundColor: '#E2B93B' },
  badgeAck: { backgroundColor: '#6D5BD0' },
  badgeText: { color: colors.white, fontWeight: '700' },
  winnerBorder: { borderRadius: 20, padding: 1, marginBottom: 16 },
  cardInside: { borderWidth: 0, borderRadius: 19 },
  winnerBadgeGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  winnerTxt: { color: '#2B2443', fontWeight: '900' },
  winnerCTAGrad: { borderRadius: 16 },
  acknowledgedBanner: {
    backgroundColor: '#2B2443',
    borderRadius: 16,
    borderWidth: 0,
    marginTop: 12,
  },
  acknowledgedText: { color: '#F8E07E', fontWeight: '800' },
  secondaryBtn: { backgroundColor: '#3A4051', marginTop: 10 },
});

function SkeletonWonCard() {
  return (
    <View style={styles.card}>
      <View style={[styles.hero, { backgroundColor: '#22252C' }]} />
      <View style={{ height: 14, borderRadius: 6, backgroundColor: '#3A4051', marginTop: 8, width: '60%' }} />
      <View style={{ height: 12, borderRadius: 6, backgroundColor: '#3A4051', marginTop: 8, width: '40%' }} />
      <View style={{ height: 12, borderRadius: 6, backgroundColor: '#3A4051', marginTop: 8, width: '50%' }} />
      <View style={styles.divider} />
      <View style={{ height: 44, borderRadius: 12, backgroundColor: '#2E3440' }} />
    </View>
  );
}
