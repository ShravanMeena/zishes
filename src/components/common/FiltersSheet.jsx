import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import Button from '../ui/Button';
import { X } from 'lucide-react-native';
import Slider from '../ui/Slider';

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest' },
  { id: 'popular', label: 'Popular' },
  { id: 'ending', label: 'Ending Soon' },
  { id: 'oldest', label: 'Oldest' },
];

const DEFAULTS = {
  entryFeeMax: 500,
  progressMax: 35,
  category: null,
  categorySlug: 'all',
  sort: 'newest',
};

export default function FiltersSheet({ onClose, onApply, onReset, categories = [], initialFilters }) {
  const initialEntry = Number(initialFilters?.entryFeeMax ?? initialFilters?.price ?? DEFAULTS.entryFeeMax);
  const initialProgress = Number(initialFilters?.progressMax ?? initialFilters?.progress ?? DEFAULTS.progressMax);
  const initialSort = initialFilters?.sort ?? DEFAULTS.sort;

  const [entryFeeMax, setEntryFeeMax] = useState(initialEntry);
  const [progressMax, setProgressMax] = useState(initialProgress);
  const [activeCategorySlug, setActiveCategorySlug] = useState(initialFilters?.categorySlug ?? DEFAULTS.categorySlug);
  const [sort, setSort] = useState(initialSort);
  const insets = useSafeAreaInsets();

  const chipList = useMemo(() => {
    if (Array.isArray(categories) && categories.length) return categories;
    return [{ id: 'all', label: 'All', rawId: null }];
  }, [categories]);

  const categoryMap = useMemo(() => {
    const map = new Map();
    chipList.forEach((cat) => {
      map.set(cat.id, cat);
      if (cat?.rawId) map.set(String(cat.rawId), cat);
    });
    return map;
  }, [chipList]);

  useEffect(() => {
    setEntryFeeMax(Number(initialFilters?.entryFeeMax ?? initialFilters?.price ?? DEFAULTS.entryFeeMax));
    setProgressMax(Number(initialFilters?.progressMax ?? initialFilters?.progress ?? DEFAULTS.progressMax));
    const slugFromInitial = (() => {
      if (initialFilters?.categorySlug) return initialFilters.categorySlug;
      if (initialFilters?.category) {
        const matched = categoryMap.get(String(initialFilters.category));
        if (matched?.id) return matched.id;
      }
      return DEFAULTS.categorySlug;
    })();
    setActiveCategorySlug(slugFromInitial);
    setSort(initialFilters?.sort ?? DEFAULTS.sort);
  }, [initialFilters, categoryMap]);

  const scrollPaddingBottom = useMemo(() => 140 + insets.bottom, [insets.bottom]);

  const apply = () => {
    const selectedCategory = categoryMap.get(activeCategorySlug) || null;
    const payload = {
      entryFeeMax,
      progressMax,
      category: selectedCategory?.rawId || (activeCategorySlug !== 'all' ? activeCategorySlug : null),
      categorySlug: activeCategorySlug,
      sort,
    };
    try { console.log('[FiltersSheet] apply pressed with', payload); } catch {}
    onApply?.(payload);
  };

  const reset = () => {
    setEntryFeeMax(DEFAULTS.entryFeeMax);
    setProgressMax(DEFAULTS.progressMax);
    setActiveCategorySlug(DEFAULTS.categorySlug);
    setSort(DEFAULTS.sort);
    try { console.log('[FiltersSheet] reset pressed'); } catch {}
    onReset?.({ ...DEFAULTS });
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Filters</Text>
        <Pressable onPress={onClose} style={{ padding: 6 }}>
          <X size={20} color={colors.white} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        directionalLockEnabled
        nestedScrollEnabled
      >
        <View style={styles.section}>
          <Text style={styles.title}>Per Game Play</Text>
          <Text style={styles.caption}>Adjust the entry fee per play in ZishCoin.</Text>
          <View style={styles.valueRow}>
            <View style={styles.coinBadge}><Text style={styles.coinTxt}>Z</Text></View>
            <Text style={styles.valueTxt}>{entryFeeMax}</Text>
          </View>
          <Slider
            minimumValue={0}
            maximumValue={1000}
            step={10}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={'#7d7d87'}
            thumbTintColor={'#ddd'}
            value={entryFeeMax}
            onValueChange={setEntryFeeMax}
            tapToSeek
            style={styles.slider}
          />
          <View style={styles.rowBetween}>
            {[0, 100, 250, 500, 1000].map((tick) => (
              <View key={`entry-tick-${tick}`} style={styles.tickRow}>
                <View style={[styles.coinBadge, styles.tickBadge]}><Text style={styles.coinTxt}>Z</Text></View>
                <Text style={styles.tickTxt}>{tick}{tick === 1000 ? '+' : ''}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.caption}>Show items based on how full their entry pools are.</Text>
          <Text style={styles.progressValue}>{progressMax}%</Text>
          <Slider
            minimumValue={0}
            maximumValue={100}
            step={1}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={'#7d7d87'}
            thumbTintColor={'#ddd'}
            value={progressMax}
            onValueChange={setProgressMax}
            tapToSeek
            style={styles.slider}
          />
          <View style={styles.rowBetween}>
            {[0, 50, 100].map((tick) => (
              <Text key={`progress-tick-${tick}`} style={styles.tickTxt}>{tick}%</Text>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Categories</Text>
          <Text style={styles.caption}>Browse listings that match a specific category.</Text>
          <View style={styles.chipRow}>
            {(chipList || []).map((cat) => (
              <Pressable
                key={`cat-${cat.id}`}
                onPress={() => setActiveCategorySlug(cat.id)}
                style={[styles.chip, activeCategorySlug === cat.id && styles.chipActive]}
              >
                <Text style={[styles.chipTxt, activeCategorySlug === cat.id && styles.chipTxtActive]}>{cat.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Sort Results</Text>
          <Text style={styles.caption}>Choose how tournaments appear in your feed.</Text>
          <View style={styles.sortRow}>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() => setSort(opt.id)}
                style={[styles.sortChip, sort === opt.id && styles.sortChipActive]}
              >
                <Text style={[styles.sortTxt, sort === opt.id && styles.sortTxtActive]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footerBar}>
        <Button
          variant="outline"
          title="Reset Filters"
          onPress={reset}
          fullWidth={false}
          style={{ width: '48%' }}
        />
        <Button
          title="Apply Filters"
          onPress={apply}
          fullWidth={false}
          style={{ width: '48%' }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: colors.primary, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 22 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },

  section: { paddingVertical: 12 },
  title: { color: colors.white, fontWeight: '700', fontSize: 16 },
  caption: { color: colors.textSecondary, marginTop: 4 },
  valueRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  coinBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  coinTxt: { color: colors.white, fontWeight: '800' },
  valueTxt: { color: colors.accent, fontWeight: '800', fontSize: 28 },
  progressValue: { color: colors.accent, fontWeight: '800', fontSize: 24, marginTop: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  tickRow: { flexDirection: 'row', alignItems: 'center' },
  tickBadge: { width: 20, height: 20, borderRadius: 10, marginRight: 4 },
  tickTxt: { color: colors.textSecondary, fontWeight: '600' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, marginHorizontal: -4 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: '#353B4A', backgroundColor: '#1E2129', marginHorizontal: 4, marginBottom: 10 },
  chipActive: { backgroundColor: '#342D4B', borderColor: colors.accent },
  chipTxt: { color: colors.textSecondary, fontWeight: '600' },
  chipTxtActive: { color: colors.white, fontWeight: '700' },

  sortRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, marginHorizontal: -4 },
  sortChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#2C3140', backgroundColor: '#1A1D26', marginHorizontal: 4, marginBottom: 10 },
  sortChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sortTxt: { color: colors.textSecondary, fontWeight: '600' },
  sortTxtActive: { color: colors.white, fontWeight: '700' },

  footerBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1F232C', borderTopWidth: 1, borderTopColor: '#2E3440', zIndex: 10, elevation: 10 },
  slider: { height: 44, marginTop: 12 },
});
