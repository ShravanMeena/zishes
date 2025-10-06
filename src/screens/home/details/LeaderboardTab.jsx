import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { colors } from '../../../theme/colors';
import { useSelector } from 'react-redux';
import { getLeaderboard } from '../../../services/leaderboard';
import AppModal from '../../../components/common/AppModal';

export default function LeaderboardTab({ item }) {
  const token = useSelector((s) => s.auth.token);
  const productId = item?.id || item?._id || item?.raw?._id;
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 100, totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scoreModal, setScoreModal] = useState({ open: false, value: '—' });

  useEffect(() => {
    let alive = true;
    if (!productId || !token) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getLeaderboard(productId, { token, limit: 100, page: 1, count: true });
        if (!alive) return;
        setRows(Array.isArray(data?.data) ? data.data : []);
        setMeta(data?.meta || { page: 1, limit: 100 });
      } catch (e) {
        if (!alive) return;
        setError(e?.message || 'Failed to load leaderboard');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [productId, token]);

  const isObjectId = (v) => typeof v === 'string' && /^[a-fA-F0-9]{24}$/.test(v);
  const formatScore = (value) => {
    if (value === null || value === undefined) return '-';
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return String(value);
    const truncated = Math.trunc(numeric * 100) / 100;
    return truncated.toFixed(2);
  };
  const fullScore = (value) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number') return String(value);
    return String(value || '—');
  };
  const handleScorePress = (score) => {
    setScoreModal({ open: true, value: fullScore(score) });
  };
  const closeScoreModal = () => setScoreModal((prev) => ({ ...prev, open: false }));
  const renderItem = ({ item: r, index }) => {
    const rawUser = r?.user;
    let display = '-';
    if (rawUser && typeof rawUser === 'object') {
      display = rawUser.username || rawUser.name || rawUser.handle || (rawUser._id ? `Player ${String(rawUser._id).slice(-4)}` : '-');
    } else if (typeof rawUser === 'string') {
      display = isObjectId(rawUser) ? `Player ${rawUser.slice(-4)}` : rawUser;
    }
    return (
      <View style={styles.row}>
        <Text style={styles.cellLeft}>{index + 1}.</Text>
        <Text style={styles.cellUser}>{display}</Text>
        <TouchableOpacity onPress={() => handleScorePress(r.score)} activeOpacity={0.7}>
          <Text style={styles.cellScore}>{formatScore(r.score)}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View>
      <Text style={styles.title}>Leaderboard</Text>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Loading leaderboard…</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : rows.length === 0 ? (
        <Text style={styles.emptyText}>No scores yet. Be the first to play!</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r._id || `${r.user}-${r.score}`}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          scrollEnabled={false}
        />
      )}
      {rows.length > 0 && meta?.totalCount ? (
        <Text style={styles.metaText}>{`${rows.length} of ${meta.totalCount} shown`}</Text>
      ) : null}
      <AppModal
        visible={scoreModal.open}
        title="Your Best Time"
        onCancel={closeScoreModal}
        footer={(
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalBtn} onPress={closeScoreModal}>
              <Text style={styles.modalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalScore}>{scoreModal.value}</Text>
        </View>
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.white, fontWeight: '800', fontSize: 18, marginBottom: 10 },
  loadingWrap: { flexDirection: 'row', alignItems: 'center' },
  loadingText: { marginLeft: 8, color: colors.white },
  errorText: { color: colors.error },
  emptyText: { color: colors.textSecondary },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  sep: { height: 1, backgroundColor: '#343B49' },
  cellLeft: { color: colors.white, width: 28 },
  cellUser: { color: colors.white, flex: 1 },
  cellScore: { color: colors.white, width: 80, textAlign: 'right' },
  metaText: { color: colors.textSecondary, marginTop: 10 },
  modalContent: { paddingVertical: 12, alignItems: 'center' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  modalScore: { color: colors.white, fontSize: 32, fontWeight: '800', letterSpacing: 0.6 },
  modalBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  modalBtnText: { color: colors.white, fontWeight: '700' },
});
