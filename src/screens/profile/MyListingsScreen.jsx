import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, Clock } from 'lucide-react-native';
import ProgressBar from '../../components/common/ProgressBar';
import { useSelector } from 'react-redux';
import products from '../../services/products';
import { mapProductToCard } from '../../utils/productMapper';
import MyListingsSkeleton from '../../components/skeletons/MyListingsSkeleton';

export default function MyListingsScreen({ navigation }) {
  const token = useSelector((s) => s.auth.token);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editQty, setEditQty] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!token) { setItems([]); return; }
    setLoading(true); setError(null);
    try {
      const list = await products.getMyProducts(token);
      const mapped = Array.isArray(list) ? list.map(mapProductToCard) : [];
      setItems(mapped);
    } catch (e) {
      setError(e?.message || 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  };

  const openEdit = openEditFactory({ setEditOpen, setEditItem, setEditName, setEditDesc, setEditQty });
  const saveEdits = async () => {
    if (!editItem) return;
    try {
      setSaving(true);
      const patch = { name: editName, description: editDesc };
      const qtyNum = parseInt(editQty, 10);
      if (!isNaN(qtyNum)) patch.quantity = qtyNum;
      await products.updateProduct(editItem.id, patch, token);
      setEditOpen(false);
      await load();
    } catch (e) {
      // Basic inline error display by keeping modal open and showing a hint could be added
      setEditOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Home', { screen: 'Details', params: { item } })} style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.thumb} />
      <View style={{ flex: 1 }}>
        {/* Chips row aligned to right to avoid overlap */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Chip label={statusLabel(item)} type={isCompleted(item) ? 'danger' : 'info'} />
          <TouchableOpacity onPress={() => openEdit(item)}>
            <Chip label="Edit" type="accent" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        {/* Title and price on their own lines with shrink to prevent overlap */}
        <Text style={[styles.title, { flexShrink: 1 }]} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.price}>{formatINR(item?.raw?.price)}</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <Chip label="Extend Game Play" />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={styles.time}>{'  '}{timeLeft(item)}</Text>
        </View>
        <Text style={styles.progressTxt}>{`${item.playsCompleted}/${item.playsTotal} Gameplays`}</Text>
        <ProgressBar value={safeProgress(item)} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft color={colors.white} size={20} /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Listings</Text>
        <View style={{ width: 32 }} />
      </View>
      {loading ? (
        <MyListingsSkeleton count={4} />
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <Text style={{ color: '#ffb3b3', fontWeight: '700', fontSize: 16, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity onPress={load} style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#3A4051' }}>
            <Text style={{ color: colors.white, fontWeight: '800' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={{ color: colors.textSecondary }}>You have not created any listings yet.</Text>
            </View>
          )}
        />
      )}

      {/* Edit modal */}
      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setEditOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Listing</Text>
            {editItem ? (
              <Text style={styles.modalHint}>{isActive(editItem) ? 'Game and pricing can’t be edited after activation.' : 'You can edit all details before activation.'}</Text>
            ) : null}

            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Item name" placeholderTextColor="#778" />

            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, { height: 92, textAlignVertical: 'top' }]} value={editDesc} onChangeText={setEditDesc} placeholder="Describe your item" placeholderTextColor="#778" multiline />

            <Text style={styles.label}>Quantity</Text>
            <TextInput style={styles.input} value={editQty} onChangeText={setEditQty} keyboardType="numeric" placeholder="0" placeholderTextColor="#778" />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity onPress={() => setEditOpen(false)} style={[styles.btn, styles.btnGhost]}><Text style={styles.btnGhostTxt}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveEdits} disabled={saving} style={[styles.btn, styles.btnPrimary, saving && { opacity: 0.7 }]}>
                <Text style={styles.btnPrimaryTxt}>{saving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '90%', backgroundColor: '#1E2128', borderRadius: 16, borderWidth: 1, borderColor: '#343B49', padding: 16 },
  modalTitle: { color: colors.white, fontWeight: '900', fontSize: 18 },
  modalHint: { color: colors.textSecondary, marginTop: 6 },
  label: { color: colors.white, marginTop: 12, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: colors.white },
  btn: { height: 44, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  btnGhost: { borderWidth: 1, borderColor: '#3A4051' },
  btnGhostTxt: { color: colors.white, fontWeight: '800' },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryTxt: { color: colors.white, fontWeight: '800' },
});

// Helpers
function isCompleted(item) {
  const s = (item?.tournamentStatus || '').toUpperCase();
  return s === 'OVER' || s === 'UNFILLED';
}
function isActive(item) {
  const s = (item?.tournamentStatus || '').toUpperCase();
  return s === 'OPEN' || s === 'IN_PROGRESS';
}
function statusLabel(item) { return isCompleted(item) ? 'Completed' : 'Active'; }

function safeProgress(item) {
  const total = Number(item?.playsTotal || 0);
  const done = Number(item?.playsCompleted || 0);
  if (!total) return 0;
  return Math.max(0, Math.min(1, done / total));
}

function formatINR(n) {
  const val = Number(n);
  if (!isFinite(val)) return '—';
  try { return val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }); } catch { return `₹${val}`; }
}

function timeLeft(item) {
  const iso = item?.endedAt;
  if (!iso) return '—';
  const end = new Date(iso);
  const now = new Date();
  if (isNaN(end.getTime())) return '—';
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return 'Expired';
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `${days} day${days>1?'s':''} ${hours} hour${hours!==1?'s':''}`;
  const minutes = Math.floor((diffMs - totalHours * 3600000) / 60000);
  return `${hours} hour${hours!==1?'s':''} ${minutes} min`;
}

function openEditFactory(setters) {
  return (item) => {
    const { setEditOpen, setEditItem, setEditName, setEditDesc, setEditQty } = setters;
    setEditItem(item);
    setEditName(item?.title || '');
    setEditDesc(item?.raw?.description || '');
    setEditQty(String(item?.raw?.quantity ?? ''));
    setEditOpen(true);
  };
}
