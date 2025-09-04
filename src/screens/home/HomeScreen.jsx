// src/screens/HomeScreen.jsx
import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from "../../theme/colors";
import CategoryChips from "../../components/common/CategoryChips";
import GameCard from "../../components/cards/GameCard";
import useHome from "../../hooks/useHome";
import { Bell, Search, SlidersHorizontal } from 'lucide-react-native';
import ShareSheet from "../../components/common/ShareSheet";
import RulesModal from "../../components/modals/RulesModal";
import BottomSheet from "../../components/common/BottomSheet";
import EmptyState from "../../components/common/EmptyState";
import FiltersSheet from "../../components/common/FiltersSheet";

export default function HomeScreen({ navigation }) {
  const { query, setQuery, selected, setSelected, categories, items } = useHome();
  const [shareItem, setShareItem] = useState(null);
  const [rulesItem, setRulesItem] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const renderItem = useCallback(({ item }) => (
    <GameCard
      item={item}
      onCardPress={() => navigation.navigate('Details', { item })}
      onPlay={() => setRulesItem(item)}
      onShare={() => setShareItem(item)}
    />
  ), [navigation]);
  const keyExtractor = useCallback((it) => it.id, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandWrap}>
          <View style={styles.brandIcon}><Text style={{color: colors.white, fontWeight: '900'}}>Z</Text></View>
          <Text style={styles.brandText}>Lets Zish it</Text>
        </View>
        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.pill} onPress={() => navigation.getParent()?.navigate('Wallet')}>
            <View style={styles.coinCircle}><Text style={{color: colors.white, fontWeight:'700'}}>Z</Text></View>
            <Text style={styles.pillText}>2,500</Text>
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

      {/* List */}
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
      />
      <ShareSheet visible={!!shareItem} onClose={() => setShareItem(null)} url={shareItem ? `https://example.com/item/${shareItem.id}` : ''} />
      <RulesModal
        visible={!!rulesItem}
        onCancel={() => setRulesItem(null)}
        onConfirm={() => { const it = rulesItem; setRulesItem(null); if (it) navigation.navigate('UnityGame', { scene: it.scene || 'Game1' }); }}
      />

      <BottomSheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} full maxRatio={0.9} noPadding>
        <FiltersSheet
          categories={categories}
          initialCategory={selected}
          onClose={() => setFiltersOpen(false)}
          onApply={({ category }) => { setFiltersOpen(false); if (category) setSelected(category); }}
          onReset={() => { setSelected('all'); setFiltersOpen(false); }}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: 12 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12,
  },
  brandWrap: { flexDirection: 'row', alignItems: 'center' },
  brandIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 1, borderColor: '#3A4051' },
  brandText: { color: colors.white, fontWeight: '700', fontSize: 18 },
  rightActions: { flexDirection: 'row', alignItems: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2B2F39', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#3A4051' },
  coinCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  pillText: { color: colors.white, fontWeight: '700' },
  bellBtn: { marginLeft: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#2B2F39', borderRadius: 18, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#343B49' },
  searchIcon: { marginRight: 8 },
  input: { flex: 1, color: colors.white },
  filterBtn: { marginLeft: 10, width: 44, height: 44, borderRadius: 12, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },
});
