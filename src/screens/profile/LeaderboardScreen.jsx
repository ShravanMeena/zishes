import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { ChevronLeft, Crown } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import { getLeaderboard } from '../../services/leaderboard';

export default function LeaderboardScreen({ navigation, route }) {
  const { productId, item } = route?.params || {};
  const token = useSelector((s) => s.auth.token);
  const currentUserId = useSelector((s) => s?.auth?.user?._id || s?.auth?.user?.id || null);
  const title = useMemo(() => item?.product?.name || item?.game?.name || 'Leaderboard', [item]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [expandedScoreIndex, setExpandedScoreIndex] = useState(null);
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    hasFetchedRef.current = false;
    setLoading(true);
  }, [productId]);

  const fetchBoard = useCallback(async ({ silent = false } = {}) => {
    if (!productId) {
      setRows([]);
      if (!silent) setLoading(false);
      return;
    }
    setError(null);
    if (!silent) setLoading(true);
    try {
      const data = await getLeaderboard(productId, { token, limit: 100, page: 1, count: true });
      setRows(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setRows([]);
      setError(e?.message || 'Failed to load leaderboard');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [productId, token]);

  useFocusEffect(
    useCallback(() => {
      const silent = hasFetchedRef.current;
      fetchBoard({ silent });
      hasFetchedRef.current = true;
    }, [fetchBoard])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetchBoard({ silent: true }); } finally { setRefreshing(false); }
  }, [fetchBoard]);

  const getDisplayName = (rawUser) => {
    if (!rawUser) return '-';
    if (typeof rawUser === 'object') return rawUser.username || rawUser.name || rawUser.handle || (rawUser._id ? `Player ${String(rawUser._id).slice(-4)}` : '-');
    if (typeof rawUser === 'string') return /^[a-fA-F0-9]{24}$/.test(rawUser) ? `Player ${rawUser.slice(-4)}` : rawUser;
    return '-';
  };

  const renderItem = ({ item: r, index }) => {
    const isTop = index === 0;
    const isMe = currentUserId && (String(r?.user?._id || r?.user) === String(currentUserId));
    const textStyles = [styles.rank, isTop && styles.topText, isMe && styles.meText];
    const nameStyles = [styles.user, isTop && styles.topText, isMe && styles.meText];
    const scoreStyles = [styles.score, isTop && styles.topText, isMe && styles.meText];

    return (
      <View style={[styles.row, isMe && styles.meRow, isTop && styles.topRow]}>
        <View style={styles.rankWrap}>
          {isTop ? <Crown size={20} color="#F6C343" style={styles.crown} /> : null}
          <Text style={textStyles}>{index + 1}</Text>
        </View>
        <Text style={nameStyles}>{getDisplayName(r.user)}</Text>
        <TouchableOpacity onPress={() => setExpandedScoreIndex(expandedScoreIndex === index ? null : index)} activeOpacity={0.75}>
          <Text style={scoreStyles}>
            {expandedScoreIndex === index
              ? String(r.score ?? '-')
              : typeof r.score === 'number'
              ? r.score.toFixed(2)
              : String(r.score ?? '-')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r, i) => r?._id || `${r?.user?._id || r?.user}-${r?.score}-${i}`}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 120, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />}
        ListHeaderComponent={() => (
          <View style={styles.tableHeader}>
            <Text style={[styles.hRank]}>#</Text>
            <Text style={[styles.hUser]}>Player</Text>
            <Text style={[styles.hScore]}>Score</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.textSecondary }}>{loading ? 'Loading…' : (error || 'No scores yet. Be the first!')}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },

  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#343B49', marginBottom: 8 },
  hRank: { width: 64, color: colors.textSecondary, fontWeight: '700' },
  hUser: { flex: 1, color: colors.textSecondary, fontWeight: '700' },
  hScore: { width: 80, color: colors.textSecondary, fontWeight: '700', textAlign: 'right' },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderRadius: 12, paddingHorizontal: 8 },
  sep: { height: 1, backgroundColor: '#2E3440' },
  rankWrap: { width: 64, flexDirection: 'row', alignItems: 'center' },
  crown: { marginRight: 6 },
  rank: { color: colors.white, fontWeight: '900', textAlign: 'left' },
  user: { flex: 1, color: colors.white, fontWeight: '700' },
  score: { width: 80, color: colors.white, textAlign: 'right', fontWeight: '800' },

  meRow: { backgroundColor: '#282F45' },
  meText: { color: '#4C8DFF' },
  topRow: { backgroundColor: 'rgba(246,195,67,0.12)' },
  topText: { color: '#F6C343', fontWeight: '800' },
});
