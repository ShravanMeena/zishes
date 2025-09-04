import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, Clock } from 'lucide-react-native';
import ProgressBar from '../../components/common/ProgressBar';

export default function MyListingsScreen({ navigation }) {
  const data = useMemo(() => ([
    { id: 'l1', title: 'Limited Edition', price: '$50.00', status: 'Active', time: '2 days 14 hours', done: 75, total: 100, image: 'https://images.unsplash.com/photo-1580237072617-771c3ecc4f11?q=80&w=600&auto=format&fit=crop' },
    { id: 'l2', title: 'Immersive VR', price: '$25.00', status: 'Active', time: '1 day 08 hours', done: 40, total: 60, image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop' },
    { id: 'l3', title: 'Ultimate', price: '$15.00', status: 'Completed', time: 'Expired', done: 100, total: 100, image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=600&auto=format&fit=crop' },
    { id: 'l4', title: 'Precision', price: '$10.00', status: 'Active', time: '3 days 05 hours', done: 20, total: 50, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop' },
    { id: 'l5', title: 'Ergonomic', price: '$30.00', status: 'Active', time: '1 day 20 hours', done: 15, total: 20, image: 'https://images.unsplash.com/photo-1517059224940-d4af9eec41e5?q=80&w=600&auto=format&fit=crop' },
  ]), []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.thumb} />
      <View style={{ flex: 1 }}>
        {/* Chips row aligned to right to avoid overlap */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Chip label={item.status} type={item.status === 'Completed' ? 'danger' : 'info'} />
          <Chip label="Promote" type="accent" style={{ marginLeft: 8 }} />
        </View>

        {/* Title and price on their own lines with shrink to prevent overlap */}
        <Text style={[styles.title, { flexShrink: 1 }]} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.price}>{item.price}</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <Chip label="Extend Game Play" />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={styles.time}>{'  '}{item.time}</Text>
        </View>
        <Text style={styles.progressTxt}>{`${item.done}/${item.total} Gameplays`}</Text>
        <ProgressBar value={Math.min(1, item.done / item.total)} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft color={colors.white} size={20} /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Listings</Text>
        <View style={{ width: 32 }} />
      </View>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function Chip({ label, type = 'default', style }) {
  const map = {
    default: { bg: '#3A4051', color: colors.white },
    info: { bg: '#3B82F6', color: colors.white },
    accent: { bg: colors.primary, color: colors.white },
    danger: { bg: '#E57373', color: colors.white },
  };
  const s = map[type] || map.default;
  return (
    <View style={[styles.chip, { backgroundColor: s.bg }, style]}>
      <Text style={[styles.chipTxt, { color: s.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },

  card: { flexDirection: 'row', backgroundColor: '#2B2F39', borderRadius: 18, borderWidth: 1, borderColor: '#343B49', padding: 12 },
  thumb: { width: 70, height: 70, borderRadius: 10, marginRight: 12, backgroundColor: '#222' },
  title: { color: colors.white, fontWeight: '800', fontSize: 18, marginTop: 8 },
  price: { color: '#27c07d', fontWeight: '800', marginTop: 2 },
  time: { color: colors.textSecondary },
  progressTxt: { color: colors.textSecondary, marginTop: 6, marginBottom: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  chipTxt: { fontWeight: '700' },
});
