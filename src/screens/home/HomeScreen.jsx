// src/screens/HomeScreen.jsx
import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, RefreshControl, DeviceEventEmitter, Image } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from "../../theme/colors";
import CategoryChips from "../../components/common/CategoryChips";
import GameCard from "../../components/cards/GameCard";
import GameCardSkeleton from "../../components/skeletons/GameCardSkeleton";
import useHome from "../../hooks/useHome";
import { buildProductQueryFromUI } from "../../services/products";
import { Bell, Search, SlidersHorizontal } from 'lucide-react-native';
import ShareSheet from "../../components/common/ShareSheet";
import { buildShareUrlForProduct } from "../../utils/links";
import RulesModal from "../../components/modals/RulesModal";
import InsufficientCoinsModal from "../../components/modals/InsufficientCoinsModal";
import BottomSheet from "../../components/common/BottomSheet";
import EmptyState from "../../components/common/EmptyState";
import FiltersSheet from "../../components/common/FiltersSheet";
import useNow from "../../hooks/useNow";
import { useDispatch, useSelector } from 'react-redux';
import { setFilters, resetFilters } from '../../store/filters/filtersSlice';
import { getProductById } from "../../services/products";
import AppModal from "../../components/common/AppModal";
import tournaments from "../../services/tournaments";
import { fetchMyWallet } from "../../store/wallet/walletSlice";
import users from '../../services/users';
import { setUser } from '../../store/auth/authSlice';

export default function HomeScreen({ navigation }) {
  const { query, setQuery, selected, setSelected, categories, items, refreshing, refresh, loaded, applyFilters } = useHome();
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  const user = useSelector((s) => s.auth.user);
  const [shareItem, setShareItem] = useState(null);
  const [rulesItem, setRulesItem] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const savedFilters = useSelector((s) => s.filters?.selections);
  const coins = useSelector((s) => s.wallet.availableZishCoins);
  const walletStatus = useSelector((s) => s.wallet.status);
  const lastFetched = useSelector((s) => s.wallet.lastFetched);
  const [insufficientOpen, setInsufficientOpen] = useState(false);
  const [requiredCoins, setRequiredCoins] = useState(0);
  const [soldOutOpen, setSoldOutOpen] = useState(false);
  const [soldOutMsg, setSoldOutMsg] = useState('');
  const [alreadyOpen, setAlreadyOpen] = useState(false);
  const [alreadyMsg, setAlreadyMsg] = useState('');
  const [joining, setJoining] = useState(false);
  const now = useNow(1000);

  const fetchWallet = useCallback(async () => {
    if (!token) return;
    dispatch(fetchMyWallet());
  }, [token, dispatch]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Also refresh wallet when Home regains focus (e.g., after login or returning from other tabs)
  useFocusEffect(
    useCallback(() => {
      fetchWallet();
      // Background check: ensure user profile exists and has country; update if changed
      let cancelled = false;
      (async () => {
        if (!token) return;
        try {
          const me = await users.getMe();
          const doc = me?.data || me;
          if (cancelled) return;
          if (!doc?.address?.country) {
            // Update store and let RootNavigator switch to CountrySelect
            try { dispatch(setUser(doc)); } catch {}
            return;
          }
          if (!user || user?.address?.country !== doc.address.country) {
            try { dispatch(setUser(doc)); } catch {}
          }
        } catch {}
      })();
      return () => { cancelled = true; };
    }, [fetchWallet])
  );

  // Listen for external requests to refresh Home (e.g., after join from Details/Favorites)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('home:refresh', () => {
      refresh();
      fetchWallet();
    });
    return () => sub.remove();
  }, [refresh, fetchWallet]);

  const requestPlay = useCallback(async (it) => {
    if (!it) return;
    const available = Number(coins || 0);
    const required = Number(it?.coinPerPlay || 0);
    if (!token || available < required) {
      setRequiredCoins(required);
      setInsufficientOpen(true);
      return;
    }
    setRulesItem(it);
  }, [token, coins]);

  const renderItem = useCallback(({ item }) => (
    <GameCard
      item={item}
      now={now}
      onCardPress={() => navigation.navigate('Details', { item })}
      onPlay={() => requestPlay(item)}
      onShare={() => setShareItem(item)}
    />
  ), [navigation, now, requestPlay]);
  const keyExtractor = useCallback((it) => it.id, []);

  const onRefreshAll = useCallback(async () => {
    await Promise.allSettled([ refresh(), fetchWallet() ]);
  }, [refresh, fetchWallet]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandWrap}>
          <Image
            source={require('../../assets/zishes_logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandText}>Lets Zish it</Text>
        </View>
        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.pill} onPress={() => navigation.getParent()?.navigate('Wallet')}>
            <View style={styles.coinCircle}><Text style={{color: colors.white, fontWeight:'700'}}>Z</Text></View>
            {walletStatus === 'loading' && lastFetched === 0 ? (
              <View style={styles.pillSkeleton} />
            ) : (
              <Text style={styles.pillText}>{coins.toLocaleString()}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
            <Bell size={22} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search items..."
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setFiltersOpen(true)}>
          <SlidersHorizontal size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <CategoryChips categories={categories} selected={selected} onChange={setSelected} />

      {/* List / Skeleton */}
      {loaded ? (
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
          ListEmptyComponent={<EmptyState title="No results found" description="Try adjusting your search or filters." />}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          windowSize={7}
          removeClippedSubviews
          refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={onRefreshAll} tintColor={colors.white} />}
        />
      ) : (
        <FlatList
          data={[1,2,3,4,5,6]}
          keyExtractor={(i)=>String(i)}
          renderItem={() => <GameCardSkeleton />}
          contentContainerStyle={{ paddingVertical: 12 }}
          showsVerticalScrollIndicator={false}
        />
      )}
      <ShareSheet
        visible={!!shareItem}
        onClose={() => setShareItem(null)}
        url={shareItem ? buildShareUrlForProduct(shareItem.id) : ''}
      />
      <RulesModal
        visible={!!rulesItem}
        onCancel={() => setRulesItem(null)}
        onConfirm={async () => {
          const it = rulesItem;
          if (!it) return;
          try {
            setJoining(true);
            if (!token) { setSoldOutMsg('Login required'); setSoldOutOpen(true); return; }
            const data = await getProductById(it.id || it._id, token);
            const status = data?.tournament?.status || data?.tournamentStatus;
            const playsCompleted = Number(data?.playsCompleted ?? data?.tournament?.playsCompleted ?? 0);
            const playsTotal = Number(data?.playsTotal ?? data?.tournament?.playsTotal ?? 0);
            const full = playsTotal > 0 && playsCompleted >= playsTotal;
            const ended = status === 'OVER' || status === 'UNFILLED';
            if (ended || full) {
              setSoldOutMsg('No seats left or game ended.');
              setSoldOutOpen(true);
              setRulesItem(null);
              return;
            }
            // Attempt to join (idempotent server-side)
            const tId = data?.tournament?._id || it?.raw?.tournament?._id || it?.tournament?._id;
            if (!tId) { setSoldOutMsg('Tournament unavailable'); setSoldOutOpen(true); return; }
            try {
              const res = await tournaments.joinTournament(tId, token);
              if (res?.alreadyJoined === true) {
                setAlreadyMsg('You have already joined this game. Please try again in some time.');
                setAlreadyOpen(true);
                setRulesItem(null);
                return;
              }
            } catch (e) {
              if (e?.status === 402 || e?.data?.error === 'INSUFFICIENT_FUNDS') {
                setRequiredCoins(Number(it?.coinPerPlay || 0));
                setInsufficientOpen(true);
                setRulesItem(null);
                return;
              }
              throw e;
            }
            // Refresh wallet and home list after successful join
            try { dispatch(fetchMyWallet()); } catch {}
            try { await refresh(); } catch {}
            setRulesItem(null);
            navigation.navigate('UnityGame', { scene: it.scene || 'Game1', tournamentId: tId, productId: it?.id || it?._id });
          } catch (e) {
            setSoldOutMsg(e?.message || 'Unable to verify availability');
            setSoldOutOpen(true);
          } finally {
            setJoining(false);
          }
        }}
        item={rulesItem}
        confirmLoading={joining}
      />

      <InsufficientCoinsModal
        visible={insufficientOpen}
        available={coins || 0}
        required={requiredCoins}
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

      <BottomSheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} full maxRatio={0.9} noPadding>
        <FiltersSheet
          categories={categories}
          initialCategory={selected}
          initialFilters={savedFilters}
          onClose={() => setFiltersOpen(false)}
          onApply={(filters) => {
            try { console.log('[HomeScreen] onApply from FiltersSheet', filters); } catch {}
            setFiltersOpen(false);
            if (filters?.category) setSelected(filters.category);
            const params = buildProductQueryFromUI(filters);
            try { console.log('[HomeScreen] mapped API params', params); } catch {}
            // Persist UI selections
            try { dispatch(setFilters(filters)); } catch {}
            applyFilters(params);
          }}
          onReset={(defaults) => {
            try { console.log('[HomeScreen] reset filters'); } catch {}
            try { dispatch(resetFilters()); } catch {}
            setSelected('all');
            setFiltersOpen(false);
            applyFilters({});
          }}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: 12 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8,
  },
  brandWrap: { flexDirection: 'row', alignItems: 'center' },
  brandLogo: { height: 56, width: 56, marginRight: 6 },
  brandIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 1, borderColor: '#3A4051' },
  brandText: { color: colors.white, fontWeight: '700', fontSize: 18 },
  rightActions: { flexDirection: 'row', alignItems: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2B2F39', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#3A4051' },
  coinCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  pillText: { color: colors.white, fontWeight: '700' },
  pillSkeleton: { width: 44, height: 12, borderRadius: 6, backgroundColor: '#3A4051' },
  bellBtn: { marginLeft: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#2B2F39', borderRadius: 18, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#343B49' },
  searchIcon: { marginRight: 8 },
  input: { flex: 1, color: colors.white },
  filterBtn: { marginLeft: 10, width: 44, height: 44, borderRadius: 12, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },
});
