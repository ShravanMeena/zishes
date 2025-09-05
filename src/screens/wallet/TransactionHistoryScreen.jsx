import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import { colors } from '../../theme/colors';
import ledgerService from '../../services/ledger';

export default function TransactionHistoryScreen({ navigation, route }) {
  const token = useSelector((s) => s.auth.token);
  const { tournament } = route?.params || {};
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const data = await ledgerService.getMyLedger({ tournament, token });
      const sorted = (Array.isArray(data) ? data : []).sort((a, b) => {
        const at = new Date(a?.createdAt || 0).getTime();
        const bt = new Date(b?.createdAt || 0).getTime();
        return bt - at;
      });
      setLedger(sorted);
    } catch (e) {
      setError(e?.message || 'Failed to fetch ledger');
      setLedger([]);
    } finally {
      setLoading(false);
    }
  }, [tournament, token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetchAll(); } finally { setRefreshing(false); }
  }, [fetchAll]);

  const items = useMemo(() => {
    const mapTitle = (entry) => {
      const t = entry?.type;
      const gameName = entry?.tournament?.game?.name;
      const productName = entry?.tournament?.product?.name;
      if (t === 'TOPUP') return 'Top-up';
      if (t === 'REFUND') return 'Refund';
      if (t === 'SUBSCRIPTION') return 'Subscription';
      if (gameName) return `Game Play - ${gameName}`;
      if (productName) return `Game Play - ${productName}`;
      return 'Game Play';
    };
    const mapDelta = (entry) => {
      const amt = Number(entry?.amount || 0);
      const positive = entry?.type === 'TOPUP' || entry?.type === 'REFUND';
      const sign = positive ? '+' : '-';
      return `${sign} ${amt}`;
    };
    const mapColor = (entry) => (entry?.type === 'TOPUP' || entry?.type === 'REFUND') ? '#27c07d' : '#FF7A7A';
    const fmtDate = (iso) => {
      try {
        const d = new Date(iso);
        if (!iso) return '';
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
      } catch { return ''; }
    };
    return (ledger || []).map((e) => ({
      id: e?._id || `${e?.createdAt}-${e?.amount}`,
      title: mapTitle(e),
      date: fmtDate(e?.createdAt),
      delta: mapDelta(e),
      unit: 'Coins',
      color: mapColor(e),
    }));
  }, [ledger]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={20} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl tintColor={colors.white} refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.panel}>
          {(loading && items.length === 0) ? (
            [1,2,3,4,5].map((i) => (
              <View key={`sk-${i}`} style={[styles.txnRow, i>1 && styles.rowDivider]}>
                <View style={{ flex: 1 }}>
                  <View style={[styles.skelLineSm, { width: '60%' }]} />
                  <View style={[styles.skelLineXs, { width: '40%', marginTop: 6 }]} />
                </View>
                <View style={[styles.skelLineSm, { width: 80 }]} />
              </View>
            ))
          ) : (
            items.length > 0 ? items.map((h, idx) => (
              <View key={h.id} style={[styles.txnRow, idx>0 && styles.rowDivider]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txnTitle} numberOfLines={1}>{h.title}</Text>
                  <Text style={styles.txnDate}>{h.date}</Text>
                </View>
                <Text style={[styles.txnDelta, { color: h.color }]}>{h.delta} <Text style={styles.txnUnit}>{h.unit}</Text></Text>
              </View>
            )) : (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: 12 }}>
                {error ? error : 'No transactions yet'}
              </Text>
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },

  panel: { backgroundColor: '#2B2F39', borderRadius: 16, borderWidth: 1, borderColor: '#343B49', padding: 12, marginHorizontal: 12, marginTop: 14 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#3A4051' },
  txnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  txnTitle: { color: colors.white, fontWeight: '600', maxWidth: 210 },
  txnDate: { color: colors.textSecondary, marginTop: 2 },
  txnDelta: { fontWeight: '800' },
  txnUnit: { color: colors.textSecondary, fontWeight: '700' },

  skelLineSm: { height: 14, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.25)', width: 90 },
  skelLineXs: { height: 10, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.15)', width: '80%' },
});

