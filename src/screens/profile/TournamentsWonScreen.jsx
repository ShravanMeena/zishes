import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, Filter, CheckCircle2, Trophy } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import tournaments from '../../services/tournaments';
import { useSelector } from 'react-redux';

export default function TournamentsWonScreen({ navigation }) {
  const currentUserId = useSelector((s) => s?.auth?.user?._id || s?.auth?.user?.id || null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchJoined = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await tournaments.getJoinedTournaments({});
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setItems(list);
    } catch (e) {
      setItems([]);
      setError(e?.message || 'Failed to fetch joined tournaments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJoined();
  }, [fetchJoined]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetchJoined(); } finally { setRefreshing(false); }
  }, [fetchJoined]);

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

    const onPress = () => {
      // Navigate to product details for full-card press
      const product = item?.product || {};
      const prodId = product?._id || product?.id;
      const detailsItem = prodId ? { id: prodId, _id: prodId, images: product?.images || [], image: (product?.images || [])[0], title: product?.name || title } : null;
      navigation.navigate('Home', { screen: 'Details', params: { item: detailsItem } });
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
              <LinearGradient
                colors={["#F8E07E", "#EACD5E", "#D4AF37"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.primary, styles.winnerCTAGrad]}
              >
                <TouchableOpacity onPress={() => navigation.navigate('AcknowledgeReceipt', { item })} style={{ width: '100%', alignItems: 'center' }}>
                  <Text style={[styles.primaryTxt, { color: '#2B2443' }]}>Acknowledge Item Received</Text>
                </TouchableOpacity>
              </LinearGradient>
              <TouchableOpacity style={[styles.primary, styles.secondaryBtn]} onPress={() => {
                const product = item?.product || {};
                const prodId = product?._id || product?.id;
                if (prodId) navigation.navigate('Leaderboard', { productId: prodId, item });
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
              <TouchableOpacity style={[styles.primary, styles.secondaryBtn]} onPress={() => {
                const product = item?.product || {};
                const prodId = product?._id || product?.id;
                if (prodId) navigation.navigate('Leaderboard', { productId: prodId, item });
              }}>
                <Text style={[styles.primaryTxt]}>View Leaderboard</Text>
              </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft color={colors.white} size={20} /></TouchableOpacity>
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
