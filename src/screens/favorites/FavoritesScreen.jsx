import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { colors } from '../../theme/colors';
import { Bell } from 'lucide-react-native';
import GameCard from '../../components/cards/GameCard';
import ShareSheet from '../../components/common/ShareSheet';
import { clearFavorites, removeFavorite } from '../../store/favorites/favoritesSlice';
import AppModal from '../../components/common/AppModal';

export default function FavoritesScreen({ navigation }) {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.favorites.items);
  const [shareItem, setShareItem] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const renderItem = useCallback(({ item }) => (
    <GameCard
      item={item}
      onCardPress={() => navigation.navigate('Home', { screen: 'Details', params: { item } })}
      onPlay={() => navigation.navigate('Home', { screen: 'UnityGame', params: { scene: item.scene || 'Game1' } })}
      onShare={() => setShareItem(item)}
    />
  ), [navigation]);
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

      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 12, flexGrow: 1, paddingHorizontal: 12 }}
        ListEmptyComponent={<Text style={styles.empty}>No favorites yet. Tap the star on any item.</Text>}
        showsVerticalScrollIndicator={false}
      />

      <ShareSheet visible={!!shareItem} onClose={() => setShareItem(null)} url={shareItem ? `https://example.com/item/${shareItem.id}` : ''} />
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
