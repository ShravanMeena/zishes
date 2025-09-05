import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { colors } from '../../theme/colors';
import { Bell } from 'lucide-react-native';
import GameCard from '../../components/cards/GameCard';
import ShareSheet from '../../components/common/ShareSheet';
import CategoryFilter from '../../components/common/CategoryFilter';
import { clearFavorites, removeFavorite } from '../../store/favorites/favoritesSlice';
import AppModal from '../../components/common/AppModal';
import tournaments from '../../services/tournaments';
import { fetchMyWallet } from '../../store/wallet/walletSlice';
import RulesModal from '../../components/modals/RulesModal';
import InsufficientCoinsModal from '../../components/modals/InsufficientCoinsModal';
import { getProductById } from '../../services/products';

export default function FavoritesScreen({ navigation }) {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.favorites.items);
  const token = useSelector((s) => s.auth.token);
  const coins = useSelector((s) => s.wallet.availableZishCoins);
  const [shareItem, setShareItem] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [rulesItem, setRulesItem] = useState(null);
  const [insufficientOpen, setInsufficientOpen] = useState(false);
  const [requiredCoins, setRequiredCoins] = useState(0);
  const [soldOutOpen, setSoldOutOpen] = useState(false);
  const [soldOutMsg, setSoldOutMsg] = useState('');
  const [alreadyOpen, setAlreadyOpen] = useState(false);
  const [alreadyMsg, setAlreadyMsg] = useState('');
  const [joining, setJoining] = useState(false);
  const [selectedCat, setSelectedCat] = useState('all');

  const filteredItems = useMemo(() => {
    if (selectedCat === 'all') return items;
    return items.filter((it) => (it?.category || 'all') === selectedCat);
  }, [items, selectedCat]);

  const requestPlay = useCallback((it) => {
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
      onCardPress={() => navigation.navigate('Home', { screen: 'Details', params: { item } })}
      onPlay={() => requestPlay(item)}
      onShare={() => setShareItem(item)}
    />
  ), [navigation, requestPlay]);
  const keyExtractor = useCallback((it) => it.id, []);

  const onClear = () => setConfirmClear(true);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorites</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {items.length ? (
            <TouchableOpacity onPress={onClear} style={[styles.clearBtn, { marginRight: 8 }]}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={() => navigation.navigate('Home', { screen: 'Notifications' })} style={styles.bellBtn}>
            <Bell size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <CategoryFilter selected={selectedCat} onChange={setSelectedCat} />

      <FlatList
        data={filteredItems}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 12, flexGrow: 1, paddingHorizontal: 12 }}
        ListEmptyComponent={<Text style={styles.empty}>No favorites yet. Tap the star on any item.</Text>}
        showsVerticalScrollIndicator={false}
      />

      <ShareSheet visible={!!shareItem} onClose={() => setShareItem(null)} url={shareItem ? `https://example.com/item/${shareItem.id}` : ''} />
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
            try { dispatch(fetchMyWallet()); } catch {}
            try { DeviceEventEmitter.emit('home:refresh'); } catch {}
            setRulesItem(null);
            navigation.navigate('Home', { screen: 'UnityGame', params: { scene: it.scene || 'Game1', tournamentId: tId, productId: it?.id || it?._id } });
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
        onBuy={() => { setInsufficientOpen(false); navigation.navigate('Wallet', { screen: 'BuyCoins' }); }}
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
      <AppModal
        visible={confirmClear}
        title="Clear Favorites"
        message="Remove all favorites? This cannot be undone."
        confirmText="Clear All"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => { setConfirmClear(false); dispatch(clearFavorites()); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#3A4051' },
  clearText: { color: colors.accent, fontWeight: '700' },
  bellBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },
  empty: { color: colors.textSecondary, alignSelf: 'center', marginTop: 40 },
});
