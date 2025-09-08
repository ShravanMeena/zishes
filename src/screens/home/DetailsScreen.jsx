import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, FlatList, TouchableOpacity, useWindowDimensions, RefreshControl, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, TabBar } from 'react-native-tab-view';
import { useDispatch, useSelector } from 'react-redux';
import { addFavorite, removeFavorite } from '../../store/favorites/favoritesSlice';
import { colors } from '../../theme/colors';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/common/ProgressBar';
import ShareSheet from '../../components/common/ShareSheet';
import { buildShareUrlForProduct } from '../../utils/links';
import ImageViewerSheet from '../../components/common/ImageViewerSheet';
import RulesModal from '../../components/modals/RulesModal';
import InsufficientCoinsModal from '../../components/modals/InsufficientCoinsModal';
import { getProductById } from '../../services/products';
import tournaments from '../../services/tournaments';
import { fetchMyWallet } from '../../store/wallet/walletSlice';
import AppModal from '../../components/common/AppModal';
import { ChevronLeft, Bell, Star, Share2 } from 'lucide-react-native';
import DescriptionTab from './details/DescriptionTab';
import ProductDetailsTab from './details/ProductDetailsTab';
import SellerReviewTab from './details/SellerReviewTab';
import RulesTab from './details/RulesTab';
import LeaderboardTab from './details/LeaderboardTab';
import { mapProductToDetails } from '../../utils/productMapper';
import useNow from '../../hooks/useNow';
import DetailsSkeleton from '../../components/skeletons/DetailsSkeleton';

export default function DetailsScreen({ route, navigation }) {
  // Support deep link with just an id param: item or id
  const initialItem = route.params?.item || (route.params?.id ? { id: route.params.id } : undefined);
  const dispatch = useDispatch();
  const favItems = useSelector((s) => s.favorites.items);
  const [item, setItem] = useState(initialItem);
  const token = useSelector((s) => s.auth.token);
  const isFav = !!favItems.find((it) => it.id === item?.id);
  const toggleFav = () => {
    if (!item) return;
    if (isFav) dispatch(removeFavorite(item.id));
    else dispatch(addFavorite(item));
  };
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'desc', title: 'Description' },
    { key: 'details', title: 'Product Details' },
    { key: 'reviews', title: 'Seller Review' },
    { key: 'rules', title: 'Rules' },
    { key: 'leader', title: 'Leader Board' },
  ]);
  const [shareOpen, setShareOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [insufficientOpen, setInsufficientOpen] = useState(false);
  const [availableCoins, setAvailableCoins] = useState(0);
  const storeCoins = useSelector((s) => s.wallet.availableZishCoins);
  const [soldOutOpen, setSoldOutOpen] = useState(false);
  const [soldOutMsg, setSoldOutMsg] = useState('');
  const [alreadyOpen, setAlreadyOpen] = useState(false);
  const [alreadyMsg, setAlreadyMsg] = useState('');
  const [joining, setJoining] = useState(false);
  const { width, height: screenH } = useWindowDimensions();
  const [slide, setSlide] = useState(0);
  const sliderRef = useRef(null);
  const now = useNow(1000);
  const [refreshing, setRefreshing] = useState(false);

  const images = useMemo(() => (item?.images && item.images.length ? item.images : [item?.image, item?.image, item?.image]).filter(Boolean), [item]);
  const progress = item?.playsTotal ? Math.min(1, (item.playsCompleted || 0) / item.playsTotal) : 0;

  const playNow = async () => {
    const available = token ? Number(storeCoins || 0) : 0;
    setAvailableCoins(available);
    const required = Number(item?.coinPerPlay || 0);
    if (!token || available < required) {
      setInsufficientOpen(true);
      return;
    }
    setRulesOpen(true);
  };
  const confirmPlay = async () => {
    try {
      setJoining(true);
      if (!token) { setSoldOutMsg('Login required'); setSoldOutOpen(true); return; }
      const data = await getProductById(item?.id || item?._id, token);
      const status = data?.tournament?.status || data?.tournamentStatus;
      const playsCompleted = Number(data?.playsCompleted ?? data?.tournament?.playsCompleted ?? 0);
      const playsTotal = Number(data?.playsTotal ?? data?.tournament?.playsTotal ?? 0);
      const full = playsTotal > 0 && playsCompleted >= playsTotal;
      const ended = status === 'OVER' || status === 'UNFILLED';
      if (ended || full) {
        setRulesOpen(false);
        setSoldOutMsg('No seats left or game ended.');
        setSoldOutOpen(true);
        return;
      }
      // Attempt to join tournament (idempotent server-side)
      const tId = data?.tournament?._id || item?.tournament?._id || item?.raw?.tournament?._id;
      if (!tId) { setSoldOutMsg('Tournament unavailable'); setSoldOutOpen(true); return; }
      try {
        const res = await tournaments.joinTournament(tId, token);
        if (res?.alreadyJoined === true) {
          setRulesOpen(false);
          setAlreadyMsg('You have already joined this game. Please try again in some time.');
          setAlreadyOpen(true);
          return;
        }
      } catch (e) {
        if (e?.status === 402 || e?.data?.error === 'INSUFFICIENT_FUNDS') {
          setAvailableCoins(Number(item?.coinPerPlay || 0) - 1); // force show
          setInsufficientOpen(true);
          return;
        }
        throw e;
      }
      try { dispatch(fetchMyWallet()); } catch {}
      try { DeviceEventEmitter.emit('home:refresh'); } catch {}
      setRulesOpen(false);
      navigation.navigate('UnityGame', { scene: item.scene || 'Game1', tournamentId: tId, productId: item?.id || item?._id });
    } catch (e) {
      setRulesOpen(false);
      setSoldOutMsg(e?.message || 'Unable to verify availability');
      setSoldOutOpen(true);
    } finally {
      setJoining(false);
    }
  };

  const renderRouteContent = (key) => {
    switch (key) {
      case 'desc':
        return (
          <View style={styles.panel}>
            <ScrollView
              showsVerticalScrollIndicator
              nestedScrollEnabled
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              <DescriptionTab item={item} />
            </ScrollView>
          </View>
        );
      case 'details':
        return (
          <View style={styles.panel}>
            <ScrollView
              showsVerticalScrollIndicator
              nestedScrollEnabled
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              <ProductDetailsTab item={item} />
            </ScrollView>
          </View>
        );
      case 'reviews':
        return (
          <View style={styles.panel}>
            <ScrollView
              showsVerticalScrollIndicator
              nestedScrollEnabled
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              <SellerReviewTab item={item} />
            </ScrollView>
          </View>
        );
      case 'rules':
        return (
          <View style={styles.panel}>
            <ScrollView
              showsVerticalScrollIndicator
              nestedScrollEnabled
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              <RulesTab item={item} />
            </ScrollView>
          </View>
        );
      case 'leader':
        return (
          <View style={styles.panel}>
            <ScrollView
              showsVerticalScrollIndicator
              nestedScrollEnabled
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              <LeaderboardTab item={item} />
            </ScrollView>
          </View>
        );
      default:
        return null;
    }
  };

  const renderScene = ({ route }) => renderRouteContent(route.key);

  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    let alive = true;
    const id = initialItem?.id;
    if (!id) { setLoadingDetails(false); return; }
    (async () => {
      try {
        const data = await getProductById(id, token);
        const mapped = mapProductToDetails(data);
        if (alive) setItem(mapped);
      } catch (e) {
        // Keep initial item if fetch fails; UI remains functional
      }
      finally {
        if (alive) setLoadingDetails(false);
      }
    })();
    return () => { alive = false; };
  }, [initialItem?.id, token]);

  const priceText = useMemo(() => {
    if (item?.price === null || item?.price === undefined) return '{price}';
    // Show as INR without assuming subunits; keep simple formatting
    try { return `₹${Number(item.price).toLocaleString('en-IN')}`; } catch { return `₹${item.price}`; }
  }, [item]);

  const endText = useMemo(() => {
    // Prefer endedAt; fallback to endsAt if present
    const ts = item?.endedAt ? Date.parse(item.endedAt) : (typeof item?.endsAt === 'number' ? item.endsAt : null);
    if (!ts || Number.isNaN(ts)) return '{text}';
    const ms = Math.max(0, ts - now);
    if (ms <= 0) return 'Ended';
    const sec = Math.floor(ms / 1000);
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${String(d).padStart(2,'0')}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m`;
  }, [item, now]);

  const onRefresh = async () => {
    if (!initialItem?.id) return;
    setRefreshing(true);
    try {
      const data = await getProductById(initialItem.id, token);
      const mapped = mapProductToDetails(data);
      setItem(mapped);
    } finally {
      setRefreshing(false);
    }
  };

  const isEnded = useMemo(() => {
    const status = item?.tournament?.status;
    if (status === 'OVER' || status === 'UNFILLED') return true;
    // If status not provided, consider not ended; countdown is informational only
    return false;
  }, [item]);

  const calcReady = useMemo(() => {
    if (item?.endedAt) {
      const ts = Date.parse(item.endedAt);
      return !Number.isNaN(ts);
    }
    return typeof item?.endsAt === 'number';
  }, [item]);

  const msLeft = useMemo(() => {
    if (!calcReady) return null;
    const ts = item?.endedAt ? Date.parse(item.endedAt) : item?.endsAt;
    return Math.max(0, ts - now);
  }, [calcReady, item, now]);

  const showEndedUI = useMemo(() => isEnded, [isEnded]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <ChevronLeft size={22} color={colors.accent} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{item?.title || '{text}'}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.headerBtn}>
          <Bell size={20} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {loadingDetails ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          <DetailsSkeleton />
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />}
        >
        {/* Slider */}
        <FlatList
          ref={sliderRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(uri, i) => `${i}`}
          renderItem={({ item: uri, index: idx }) => (
            <View style={{ width }}>
              <TouchableOpacity activeOpacity={0.9} onPress={() => { setViewerIndex(idx); setViewerOpen(true); }}>
                <Image source={{ uri }} style={styles.hero} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.circle, styles.leftCircle]} onPress={toggleFav}>
                <Star color={colors.white} {...(isFav ? { fill: colors.accent } : {})} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.circle, styles.rightCircle]} onPress={() => setShareOpen(true)}>
                <Share2 color={colors.white} />
              </TouchableOpacity>
            </View>
          )}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setSlide(idx);
          }}
        />
        <View style={styles.dotsWrap}>
          {images.map((_, i) => (
            <View key={i} style={[styles.dot, i === slide && styles.dotActive]} />
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.title}>{item?.title || '{text}'}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Price:</Text>
            <Text style={styles.priceValue}>{priceText}</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.feeLabel}>Per Play Fee:</Text>
            <Text style={styles.feeValue}> {item?.coinPerPlay ?? '{price}'} ZC</Text>
          </View>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.rowBetween}>
          <Text style={styles.statusTitle}>Game Play Status</Text>
          <Text style={styles.statusPct}>{Math.round(progress * 100)}% Complete</Text>
          </View>
          <View style={{ marginTop: 8, marginBottom: 8 }}>
            <ProgressBar value={progress} />
          </View>
          {calcReady && !showEndedUI && endText !== '{text}' && endText !== 'Ended' ? (
            <Text style={styles.endsIn}>Ends in: {endText}</Text>
          ) : showEndedUI ? (
            <Text style={styles.endedMsg}>Game has ended</Text>
          ) : null}
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 12, marginBottom: 12 }}>
          {calcReady ? (
            <Button title={showEndedUI ? 'Game End' : 'Play Now'} onPress={playNow} disabled={showEndedUI} />
          ) : null}
        </View>

        {/* Tabs */}
        <View style={{ flex: 1 }}>
          <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            initialLayout={{ width }}
            style={{ height: Math.max(420, Math.round(screenH * 0.55)) }}
            renderTabBar={(props) => (
              <TabBar
                {...props}
                scrollEnabled
                style={{ backgroundColor: 'transparent' }}
                contentContainerStyle={styles.tabsRow}
                indicatorStyle={{ backgroundColor: colors.accent, height: 3, borderRadius: 2 }}
                tabStyle={{ width: 'auto' }}
                renderLabel={({ route, focused }) => (
                  <Text style={[styles.tab, focused && styles.tabActive]}>{route.title}</Text>
                )}
              />
            )}
          />
        </View>

        {/* Bottom share button removed per request */}
        </ScrollView>
      )}

      <ShareSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        url={item?.id ? buildShareUrlForProduct(item.id) : ''}
      />
      <ImageViewerSheet visible={viewerOpen} onClose={() => setViewerOpen(false)} images={images} initialIndex={viewerIndex} />
      <RulesModal visible={rulesOpen} onCancel={() => setRulesOpen(false)} onConfirm={confirmPlay} item={item} confirmLoading={joining} />
      <InsufficientCoinsModal
        visible={insufficientOpen}
        available={availableCoins}
        required={Number(item?.coinPerPlay || 0)}
        onClose={() => setInsufficientOpen(false)}
        onBuy={() => { setInsufficientOpen(false); navigation.navigate('BuyCoins'); }}
      />
      <AppModal
        visible={soldOutOpen}
        title="Game Unavailable"
        message={soldOutMsg || 'No seats left or game ended.'}
        confirmText="OK"
        cancelText="Close"
        onConfirm={() => setSoldOutOpen(false)}
        onCancel={() => setSoldOutOpen(false)}
      />
      <AppModal
        visible={alreadyOpen}
        title="Already Joined"
        message={alreadyMsg || 'You have already joined this game. Please try again later.'}
        confirmText="OK"
        cancelText="Close"
        onConfirm={() => setAlreadyOpen(false)}
        onCancel={() => setAlreadyOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerBtn: { padding: 8 },
  headerTitle: { color: colors.white, fontWeight: '700', fontSize: 18, maxWidth: '70%' },
  hero: { width: '100%', height: 220, backgroundColor: '#222' },
  circle: { position: 'absolute', top: 14, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  leftCircle: { left: 12 },
  rightCircle: { right: 12 },
  dotsWrap: { flexDirection: 'row', alignSelf: 'center', marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4E4E56', marginHorizontal: 3 },
  dotActive: { backgroundColor: colors.accent },
  card: { backgroundColor: '#2B2F39', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: '#343B49' },
  title: { color: colors.white, fontWeight: '800', fontSize: 20 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  priceLabel: { color: colors.white, fontWeight: '600' },
  priceValue: { color: colors.accent, fontWeight: '800', marginLeft: 6, fontSize: 18 },
  feeLabel: { color: colors.white, fontWeight: '600' },
  feeValue: { color: '#27c07d', fontWeight: '800' },
  statusCard: { backgroundColor: '#2B2F39', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: '#343B49' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusTitle: { color: colors.white, fontWeight: '700' },
  statusPct: { color: colors.white, fontWeight: '700' },
  endsIn: { color: colors.white, marginTop: 10 },
  endedMsg: { color: colors.error, marginTop: 10, fontWeight: '700' },
  tabsRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  tab: { color: colors.white, backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#3A4051', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 10, textAlign: 'center' },
  tabActive: { backgroundColor: '#3A2B52', borderColor: colors.accent },
  panel: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 10, flex: 1, minHeight: 0 },
});
