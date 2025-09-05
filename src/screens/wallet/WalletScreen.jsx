import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../theme/colors';
import Button from '../../components/ui/Button';
import { Bell } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import walletService from '../../services/wallet';
import CongratsModal from '../../components/modals/CongratsModal';
import plansService from '../../services/plans';
import ledgerService from '../../services/ledger';

export default function WalletScreen({ navigation }) {
  const token = useSelector((s) => s.auth.token);
  const [wallet, setWallet] = useState({ availableZishCoins: 0, withdrawalBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [congratsOpen, setCongratsOpen] = useState(false);
  const [congratsTitle, setCongratsTitle] = useState('Success');
  const [congratsMsg, setCongratsMsg] = useState('');
  const [selectedPack, setSelectedPack] = useState(null);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [ledger, setLedger] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState(null);

  const fetchWallet = useCallback(async () => {
    if (!token) {
      setError('Login required');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await walletService.getMyWallet(token);
      setWallet({
        availableZishCoins: Number(data?.availableZishCoins ?? 0),
        withdrawalBalance: Number(data?.withdrawalBalance ?? 0),
      });
    } catch (e) {
      setError(e?.message || 'Failed to fetch wallet');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const fetchPlans = useCallback(async () => {
    try {
      setPlansLoading(true);
      const res = await plansService.listPlans({});
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setPlans(list);
    } catch (e) {
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const fetchLedger = useCallback(async () => {
    if (!token) return;
    try {
      setLedgerLoading(true);
      setLedgerError(null);
      const data = await ledgerService.getMyLedger({ token });
      // Ensure newest first per spec (assuming createdAt exists)
      const sorted = (Array.isArray(data) ? data : []).sort((a, b) => {
        const at = new Date(a?.createdAt || 0).getTime();
        const bt = new Date(b?.createdAt || 0).getTime();
        return bt - at;
      });
      setLedger(sorted);
    } catch (e) {
      setLedgerError(e?.message || 'Failed to fetch ledger');
      setLedger([]);
    } finally {
      setLedgerLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([fetchWallet(), fetchPlans(), fetchLedger()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchWallet, fetchPlans, fetchLedger]);

  const topupPlans = useMemo(() => (plans || []).filter(p => p?.planType === 'TOPUP'), [plans]);

  const withdrawals = useMemo(() => ([
    { id: 'w1', title: 'Vintage Leather Jacket', amount: 'INR 45,000', status: 'pending', image: 'https://images.unsplash.com/photo-1520975922221-23a9d23708c5?w=300&q=80' },
    { id: 'w2', title: 'Gaming PC Setup', amount: 'INR 30,000', status: 'approved', image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300&q=80' },
    { id: 'w3', title: 'Collectible Action Figure', amount: 'INR 2,000', status: 'rejected', image: 'https://images.unsplash.com/photo-1614286091228-c481b92a8eb0?w=300&q=80' },
    { id: 'w4', title: 'Hermes Togo Birkin', amount: 'INR 20,00,000', status: 'approved', image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=300&q=80' },
  ]), []);

  const history = useMemo(() => {
    const mapTitle = (entry) => {
      const t = entry?.type;
      const gameName = entry?.tournament?.game?.name;
      const productName = entry?.tournament?.product?.name;
      if (t === 'TOPUP') return 'Top-up';
      if (t === 'REFUND') return 'Refund';
      if (t === 'SUBSCRIPTION') return 'Subscription';
      // SPEND or default
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
    return (ledger || []).slice(0, 10).map((e) => ({
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Bell size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl tintColor={colors.white} refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Balances Row */}
        <View style={styles.row2}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('BuyCoins')} style={{ flex: 1 }}>
          <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{x:0,y:0}} end={{x:1,y:1}} style={[styles.balanceCard, { marginRight: 8 }] }>
            <View style={styles.coinBadge}><Text style={styles.coinBadgeText}>Z</Text></View>
            <Text style={styles.balanceTitle}>ZishCoin Balance</Text>
            {loading ? (
              <>
                <View style={[styles.skelLineLg, { marginTop: 10 }]} />
                <View style={[styles.skelLineSm, { marginTop: 8, width: 70 }]} />
                <View style={[styles.skelLineXs, { marginTop: 10, width: '90%' }]} />
              </>
            ) : (
              <>
                <Text style={styles.balanceQty}>{wallet.availableZishCoins.toLocaleString()}</Text>
                <Text style={styles.balanceUnit}>Coins</Text>
                <Text style={styles.balanceCaption}>Use for gameplay and entries only. Non-withdrawable.</Text>
              </>
            )}
          </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('PaymentMethods')} style={{ flex: 1 }}>
            <View style={[styles.balanceCard, { backgroundColor: '#16a085', marginLeft: 8 }] }>
              <Text style={[styles.balanceTitle, { marginTop: 8 }]}>Withdrawable Coins</Text>
              {loading ? (
                <>
                  <View style={[styles.skelLineLg, { marginTop: 10 }]} />
                  <View style={[styles.skelLineSm, { marginTop: 8, width: 70 }]} />
                  <View style={[styles.skelLineXs, { marginTop: 10, width: '95%' }]} />
                </>
              ) : (
                <>
                  <Text style={styles.balanceQty}>{wallet.withdrawalBalance.toLocaleString()}</Text>
                  <Text style={styles.balanceUnit}>Coins</Text>
                  <Text style={styles.balanceCaption}>Available to withdraw subject to rules</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {!!error && (
          <Text style={{ color: '#FF7A7A', paddingHorizontal: 12, marginTop: 8 }}>{error}</Text>
        )}

        {/* Buy ZishCoin (TOPUP plans) */}
        <Text style={styles.sectionTitle}>Buy ZishCoin</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
          {(plansLoading && (!topupPlans || topupPlans.length === 0)) ? (
            [1,2,3].map((i) => (
              <View key={`sk-${i}`} style={[styles.packCard, i>1 && { marginLeft: 12 }]}> 
                <View style={[styles.skelLineSm, { width: 36, height: 36, borderRadius: 18, alignSelf: 'center' }]} />
                <View style={[styles.skelLineSm, { marginTop: 8, width: '70%', alignSelf: 'center' }]} />
                <View style={[styles.skelLineXs, { marginTop: 6, width: '50%', alignSelf: 'center' }]} />
                <View style={[styles.skelLineXs, { marginTop: 10, width: '80%', alignSelf: 'center' }]} />
              </View>
            ))
          ) : (topupPlans && topupPlans.length ? topupPlans : []).map((p, i) => (
            <View key={p._id || i} style={[styles.packCard, i>0 && { marginLeft: 12 }]}>
              <View style={styles.packBadge}><Text style={styles.coinBadgeText}>Z</Text></View>
              <Text style={styles.packQty}>{Number(p.coins || 0).toLocaleString()} Coins</Text>
              <Text style={styles.packPrice}>{(p.currencyCode || p.baseCurrency || '')} {p.amount}</Text>
              <Button
                title="Buy Now"
                onPress={() => {
                  setSelectedPack(p);
                  setCongratsTitle('Purchase Successful');
                  setCongratsMsg(`${Number(p.coins || 0).toLocaleString()} ZishCoins added successfully!`);
                  setCongratsOpen(true);
                }}
                style={{ marginTop: 10 }}
              />
            </View>
          ))}
          {(!plansLoading && (!topupPlans || topupPlans.length === 0)) && (
            <View style={[styles.packCard]}>
              <View style={styles.packBadge}><Text style={styles.coinBadgeText}>Z</Text></View>
              <Text style={styles.packQty}>No packs</Text>
              <Text style={styles.packPrice}>Try again later</Text>
            </View>
          )}
        </ScrollView>

        {/* Withdrawals (Seller only) */}
        <Text style={styles.sectionTitle}>Withdrawals (Seller only)</Text>
        <View style={styles.panel}>
          {withdrawals.map((w, idx) => (
            <View key={w.id} style={[styles.withdrawRow, idx>0 && styles.rowDivider]}>
              <Image source={{ uri: w.image }} style={styles.thumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.withdrawTitle} numberOfLines={2}>{w.title}</Text>
                <Text style={styles.withdrawAmount}>{w.amount}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <StatusChip status={w.status} />
                <ActionButton
                  status={w.status}
                  onPress={() => {
                    if (w.status === 'approved') {
                      navigation.navigate('PaymentMethods');
                    } else if (w.status === 'pending') {
                      navigation.navigate('UploadProof', { item: w });
                    }
                  }}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Transaction History */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.panel}>
          {(ledgerLoading && history.length === 0) ? (
            [1,2,3].map((i) => (
              <View key={`txn-sk-${i}`} style={[styles.txnRow, i>1 && styles.rowDivider]}>
                <View style={{ flex: 1 }}>
                  <View style={[styles.skelLineSm, { width: '60%' }]} />
                  <View style={[styles.skelLineXs, { width: '40%', marginTop: 6 }]} />
                </View>
                <View style={[styles.skelLineSm, { width: 70 }]} />
              </View>
            ))
          ) : (
            history.length > 0 ? history.map((h, idx) => (
              <View key={h.id} style={[styles.txnRow, idx>0 && styles.rowDivider]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txnTitle} numberOfLines={1}>{h.title}</Text>
                  <Text style={styles.txnDate}>{h.date}</Text>
                </View>
                <Text style={[styles.txnDelta, { color: h.color }]}>{h.delta} <Text style={styles.txnUnit}>{h.unit}</Text></Text>
              </View>
            )) : (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: 8 }}>
                {ledgerError ? ledgerError : 'No transactions yet'}
              </Text>
            )
          )}
        </View>

      </ScrollView>
      <CongratsModal
        visible={congratsOpen}
        title={congratsTitle}
        message={congratsMsg}
        primaryText="Great!"
        onPrimary={() => { setCongratsOpen(false); setSelectedPack(null); }}
        onRequestClose={() => setCongratsOpen(false)}
      />
    </SafeAreaView>
  );
}

function StatusChip({ status }) {
  const map = {
    pending: { text: 'Pending', bg: '#E2B93B' },
    approved: { text: 'Approved', bg: '#2E7D32' },
    rejected: { text: 'Rejected', bg: '#C65B5B' },
  };
  const s = map[status] || map.pending;
  return (
    <View style={[styles.chip, { backgroundColor: s.bg }]}>
      <Text style={styles.chipText}>{s.text}</Text>
    </View>
  );
}

function ActionButton({ status, onPress }) {
  const title = status === 'pending' ? 'Upload Proof' : status === 'approved' ? 'Withdraw' : status === 'rejected' ? 'View Details' : 'Paid';
  const bg = status === 'approved' ? '#16a085' : status === 'pending' ? '#5E6AD2' : status === 'rejected' ? '#4E4E56' : '#2E7D32';
  return (
    <TouchableOpacity style={[styles.smallBtn, { backgroundColor: bg }]} onPress={onPress}>
      <Text style={styles.smallBtnText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },

  row2: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 12 },
  balanceCard: { flex: 1, borderRadius: 16, padding: 14, backgroundColor: '#3A8B8B' },
  coinBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  coinBadgeText: { color: colors.white, fontWeight: '900' },
  balanceTitle: { color: colors.white, opacity: 0.9, fontWeight: '700' },
  balanceQty: { color: colors.white, fontWeight: '900', fontSize: 28, marginTop: 6 },
  balanceUnit: { color: colors.white, fontWeight: '700' },
  balanceCaption: { color: '#E5E7EB', marginTop: 8 },
  skelLineLg: { height: 30, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)', width: 120 },
  skelLineSm: { height: 14, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.25)', width: 90 },
  skelLineXs: { height: 10, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.15)', width: '80%' },

  sectionTitle: { color: colors.white, fontWeight: '800', fontSize: 18, paddingHorizontal: 12, marginTop: 14 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginTop: 14 },
  viewAll: { color: colors.accent, fontWeight: '700' },

  packCard: { width: 160, backgroundColor: '#2B2F39', borderRadius: 16, borderWidth: 1, borderColor: '#343B49', padding: 14, marginVertical: 12 },
  packBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3A2B52', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 6 },
  packQty: { color: colors.white, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  packPrice: { color: colors.textSecondary, textAlign: 'center', marginTop: 2 },

  panel: { backgroundColor: '#2B2F39', borderRadius: 16, borderWidth: 1, borderColor: '#343B49', padding: 12, marginHorizontal: 12, marginTop: 10 },
  withdrawRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  thumb: { width: 48, height: 48, borderRadius: 10, marginRight: 12, backgroundColor: '#222' },
  withdrawTitle: { color: colors.white, fontWeight: '700', maxWidth: 180 },
  withdrawAmount: { color: colors.textSecondary, marginTop: 2 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  chipText: { color: colors.white, fontWeight: '700' },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  smallBtnText: { color: colors.white, fontWeight: '700' },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#3A4051' },

  txnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  txnTitle: { color: colors.white, fontWeight: '600', maxWidth: 210 },
  txnDate: { color: colors.textSecondary, marginTop: 2 },
  txnDelta: { fontWeight: '800' },
  txnUnit: { color: colors.textSecondary, fontWeight: '700' },
});
