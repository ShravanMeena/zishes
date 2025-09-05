import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, FlatList } from 'react-native';
import { colors } from '../../../theme/colors';
import { useSelector } from 'react-redux';
import { getLeaderboard } from '../../../services/leaderboard';

export default function LeaderboardTab({ item }) {
  const token = useSelector((s) => s.auth.token);
  const productId = item?.id || item?._id || item?.raw?._id;
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 100, totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const renderItem = ({ item: r, index }) => (
    <View style={styles.row}>
      <Text style={styles.cellLeft}>{index + 1}.</Text>
      <Text style={styles.cellUser}>{String(r.user || '-')}</Text>
      <Text style={styles.cellScore}>{String(r.score ?? '-')}</Text>
    </View>
  );

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
});

