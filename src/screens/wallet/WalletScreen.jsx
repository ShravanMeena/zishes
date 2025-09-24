import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../theme/colors';
import Button from '../../components/ui/Button';
import { Bell, Sparkles } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import walletService from '../../services/wallet';
import CongratsModal from '../../components/modals/CongratsModal';
import plansService from '../../services/plans';
import ledgerService from '../../services/ledger';
import productsService from '../../services/products';
import paymentsService from '../../services/payments';
import RazorpayCheckout from 'react-native-razorpay';
import PaymentsRegionModal from '../../components/modals/PaymentsRegionModal';
import AppModal from '../../components/common/AppModal';
import ProcessingPaymentModal from '../../components/modals/ProcessingPaymentModal';
import { fetchMyWallet } from '../../store/wallet/walletSlice';

export default function WalletScreen({ navigation }) {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  const country = useSelector((s) => s.auth.user?.address?.country);
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
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [regionModal, setRegionModal] = useState(false);
  const [payProcessing, setPayProcessing] = useState(false);
  const [payError, setPayError] = useState(null);
  const [lastPlan, setLastPlan] = useState(null);
  // Seller withdrawals: my listings
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [withdrawalsError, setWithdrawalsError] = useState(null);

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

  useFocusEffect(
    useCallback(() => {
      fetchWallet();
      fetchPlans();
      fetchLedger();
      fetchWithdrawals();
    }, [fetchWallet, fetchPlans, fetchLedger, fetchWithdrawals])
  );

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
      const latestTen = sorted.slice(0, 6);
      setLedger(latestTen);
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

  // Fetch seller listings for withdrawals panel
  const fetchWithdrawals = useCallback(async () => {
    if (!token) return;
    try {
      setWithdrawalsLoading(true);
      setWithdrawalsError(null);
      const list = await productsService.getMyProducts(token);
      const mapped = (Array.isArray(list) ? list : []).map((p) => {
        const id = p?._id || p?.id || String(p?.slug || Math.random());
        const title = p?.title || p?.name || 'My Listing';
        const image = (p?.images && p.images[0]) || p?.coverImage || p?.image || 'https://via.placeholder.com/96x96.png?text=Z';
        const amountNum = Number(p?.expectedPrice ?? p?.price ?? p?.amount ?? 0);
        const currency = p?.currencyCode || p?.currency || 'INR';
        const amount = amountNum > 0 ? `${currency} ${amountNum.toLocaleString()}` : `${currency} —`;
        const rawStatus = String(p?.withdrawalStatus || p?.payoutStatus || p?.status || p?.tournamentStatus || 'pending').toUpperCase();
        const verificationStatus = String(p?.fulfillment?.verificationStatus || '').toUpperCase();
        let status = 'pending';
        if (verificationStatus === 'VERIFIED') status = 'verified';
        else if (['APPROVED','PAID','SUCCESS','COMPLETED'].includes(rawStatus)) status = 'approved';
        else if (['REJECTED','FAILED','DECLINED','CANCELLED'].includes(rawStatus)) status = 'rejected';
        const withdrawAmount = Number(p?.fulfillment?.walletCredit?.amount ?? 0);
        const updatedAt = p?.updatedAt || p?.modifiedAt || p?.createdAt || null;
        return { id, title, amount, status, image, raw: p, withdrawAmount, updatedAt };
      }).sort((a, b) => {
        const at = new Date(a.updatedAt || 0).getTime();
        const bt = new Date(b.updatedAt || 0).getTime();
        return bt - at;
      });
      setWithdrawals(mapped);
    } catch (e) {
      setWithdrawals([]);
      setWithdrawalsError(e?.message || 'Failed to fetch listings');
    } finally {
      setWithdrawalsLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchWithdrawals(); }, [fetchWithdrawals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([fetchWallet(), fetchPlans(), fetchLedger(), fetchWithdrawals()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchWallet, fetchPlans, fetchLedger, fetchWithdrawals]);

  const isIndia = useMemo(() => String(country || '').trim().toLowerCase() === 'india', [country]);

  const openMembershipTier = useCallback(() => {
    navigation.navigate('MembershipTier', { origin: 'Wallet' });
  }, [navigation]);
  const topupPlans = useMemo(() => (plans || []).filter(p => p?.planType === 'TOPUP'), [plans]);
  const VISIBLE_WITHDRAW_COUNT = 6;
  const limitedWithdrawals = useMemo(() => (withdrawals || []).slice(0, VISIBLE_WITHDRAW_COUNT), [withdrawals]);
  const hasMoreWithdrawals = useMemo(() => (withdrawals || []).length > VISIBLE_WITHDRAW_COUNT, [withdrawals]);

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

  const startTopup = useCallback(async (plan) => {
    try {
      setLastPlan(plan);
      if (!country || String(country).toLowerCase() !== 'india') {
        setRegionModal(true);
        return;
      }
      if (!plan?._id) throw new Error('Invalid plan');
      setProcessingPlanId(plan._id);
      setPayProcessing(true);
      try { console.log('[RZP][TOPUP] Selected plan:', JSON.stringify({ id: plan._id, coins: plan.coins, amount: plan.amount, currency: plan.currencyCode })); } catch {}
      // Fetch public key and create an order
      const keyRes = await paymentsService.getRazorpayKey();
      const { keyId } = keyRes || {};
      try { console.log('[RZP][TOPUP] Public key fetched:', keyRes && keyRes.keyId ? `${String(keyRes.keyId).slice(0,6)}…` : null); } catch {}
      if (!keyId) throw new Error('Missing Razorpay key');
      const orderRes = await paymentsService.createRazorpayTopup({ planId: plan._id });
      const { order } = orderRes || {};
      try { console.log('[RZP][TOPUP] Order created:', JSON.stringify({ id: order?.id, amount: order?.amount, currency: order?.currency })); } catch {}
      if (!order?.id) throw new Error('Failed to create order');

      const options = {
        key: keyId,
        name: 'Zishes',
        description: 'Coins Topup',
        order_id: order.id,
        amount: order.amount,
        currency: order.currency || plan.currencyCode || 'INR',
        prefill: {
          // email: user?.email,
          // contact: user?.phone,
        },
        theme: { color: '#6C7BFF' },
        retry: { enabled: true, max_count: 2 },
        external: { wallets: ['paytm', 'phonepe'] },
        notes: { planId: plan._id },
      };

      try {
        setPayProcessing(false);
        await RazorpayCheckout.open(options);
        // Backend credits on webhook; refresh wallet optimistically
        try { dispatch(fetchMyWallet()); } catch {}
        try { await fetchWallet(); } catch {}
        try {
          const coins = Number(plan?.coins || 0).toLocaleString();
          setCongratsTitle('Purchase Successful');
          setCongratsMsg(coins !== '0' ? `Your ${coins} ZishCoins are on the way!` : 'Coins added successfully.');
          setCongratsOpen(true);
        } catch {}
      } catch (err) {
        const rawMessage = err?.description || err?.message || '';
        const desc = String(rawMessage).toLowerCase();
        console.warn('[RZP][TOPUP] error:', JSON.stringify(err));
        if (desc.includes('cancel')) return;
        if (err?.code === 'RAZORPAY_SDK_MISSING') {
          Alert.alert('Razorpay not installed', 'Please add react-native-razorpay to run checkout, or try again later.');
        } else {
          setPayError('We could not complete your payment. Please retry.');
        }
      }
    } catch (e) {
      console.warn('[RZP][TOPUP] start error:', e);
      setPayError('We could not start the payment. Please retry.');
    } finally {
      setPayProcessing(false);
      setProcessingPlanId(null);
    }
  }, [dispatch, fetchWallet, isIndia]);

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
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              if (!isIndia) navigation.navigate('BuyCoins');
              else openMembershipTier();
            }}
            style={{ flex: 1 }}
          >
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
                {!isIndia ? (
                  <Text style={[styles.balanceCaption, { marginTop: 6 }]}>Coin top-ups are rolling out region-wise. Explore memberships for additional perks.</Text>
                ) : null}
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

        {!isIndia ? (
          <>
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
                    title={processingPlanId === (p._id) ? 'Processing…' : 'Buy Now'}
                    onPress={() => startTopup(p)}
                    disabled={processingPlanId === (p._id)}
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
          </>
        ) : (
          <View style={styles.membershipCard}> 
            <View style={styles.membershipHeader}>
              <Sparkles size={20} color={colors.accent} />
              <Text style={styles.membershipTitle}>Unlock Membership Perks</Text>
            </View>
            <Text style={styles.membershipBody}>Access exclusive benefits and faster support with our membership tiers. Top-ups will be available in your region soon.</Text>
            <Button title="View Memberships" onPress={openMembershipTier} style={styles.membershipButton} />
          </View>
        )}

        {/* Withdrawals (Seller only) */}
        <Text style={styles.sectionTitle}>Withdrawals (Seller only)</Text>
        <View style={styles.panel}>
          {withdrawalsLoading ? (
            [1,2,3].map((i) => (
              <View key={`wd-sk-${i}`} style={[styles.withdrawRow, i>1 && styles.rowDivider]}>
                <View style={[styles.thumb, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
                <View style={{ flex: 1 }}>
                  <View style={[styles.skelLineSm, { width: '80%' }]} />
                  <View style={[styles.skelLineXs, { width: '50%', marginTop: 6 }]} />
                </View>
                <View style={{ alignItems: 'flex-end', width: 90 }}>
                  <View style={[styles.skelLineSm, { width: 70 }]} />
                </View>
              </View>
            ))
          ) : (limitedWithdrawals && limitedWithdrawals.length > 0) ? (
          limitedWithdrawals.map((w, idx) => {
            const over = String(w?.raw?.tournament?.status || w?.raw?.tournamentStatus || '').toUpperCase() === 'OVER';
            const rc = w?.raw?.fulfillment?.receiverConfirmation || {};
            const receiverApproved = !!(rc?.confirmedAt || rc?.confirmed || (rc?.status && String(rc.status).toUpperCase() === 'CONFIRMED'));
            const verificationStatus = String(w?.raw?.fulfillment?.verificationStatus || '').toUpperCase();
            const isVerified = verificationStatus === 'VERIFIED';
            const approvalStatus = String(w?.raw?.approvalStatus || '').toUpperCase();
            const rejectionReason = w?.raw?.rejectionReason;
            return (
              <View key={w.id} style={[styles.withdrawRow, idx>0 && styles.rowDivider]}>
                <Image source={{ uri: w.image }} style={styles.thumb} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.withdrawTitle} numberOfLines={2}>{w.title}</Text>
                  <Text style={styles.withdrawAmount}>{w.amount}</Text>
                  {approvalStatus && approvalStatus !== 'APPROVED' ? (
                    <Text style={{ color: approvalStatus === 'REJECTED' ? '#FF7A7A' : colors.textSecondary, marginTop: 4 }}>
                      {approvalStatus === 'REJECTED'
                        ? `Listing rejected${rejectionReason ? `: ${rejectionReason}` : '. Please contact support.'}`
                        : 'Listing pending approval. Withdrawals unlock once it is approved.'}
                    </Text>
                  ) : null}
                  {over && !receiverApproved ? (
                    <Text style={{ color: colors.textSecondary, marginTop: 4 }}>Waiting for winner to approve receipt.</Text>
                  ) : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <StatusChip status={isVerified ? 'verified' : w.status} />
                  {isVerified ? (
                    <TouchableOpacity
                      style={[styles.smallBtn, { backgroundColor: '#16a085', marginTop: 6 }]}
                      onPress={() => navigation.navigate('Withdraw', { maxAmount: wallet.withdrawalBalance, productId: w.id })}
                    >
                      <Text style={styles.smallBtnText}>Withdraw</Text>
                    </TouchableOpacity>
                  ) : over ? (
                      <TouchableOpacity style={[styles.smallBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('UploadProof', { item: { id: w.id, _id: w.id, raw: w.raw, title: w.title, image: w.image } })}>
                        <Text style={styles.smallBtnText}>Upload Proof</Text>
                      </TouchableOpacity>
                    ) : null}
                </View>
                </View>
              );
            })
          ) : (
            <Text style={{ color: withdrawalsError ? '#FF7A7A' : colors.textSecondary, textAlign: 'center', paddingVertical: 8 }}>
              {withdrawalsError ? withdrawalsError : 'No items found'}
            </Text>
          )}
        </View>
        {hasMoreWithdrawals ? (
          <TouchableOpacity style={styles.viewMoreBtn} onPress={() => navigation.navigate('MyListings')}>
            <Text style={styles.viewMoreText}>View more listings</Text>
          </TouchableOpacity>
        ) : null}

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
      <PaymentsRegionModal visible={regionModal} onClose={() => setRegionModal(false)} />
      <AppModal
        visible={!!payError}
        title="Payment Failed"
        message={payError || 'We could not process your payment. Please try again.'}
        cancelText="Close"
        confirmText="Retry"
        onCancel={() => setPayError(null)}
        onConfirm={() => { setPayError(null); if (lastPlan) startTopup(lastPlan); }}
      />
      <ProcessingPaymentModal visible={payProcessing} />
    </SafeAreaView>
  );
}

function StatusChip({ status }) {
  const map = {
    pending: { text: 'Pending', bg: '#E2B93B' },
    approved: { text: 'Approved', bg: '#2E7D32' },
    rejected: { text: 'Rejected', bg: '#C65B5B' },
    verified: { text: 'Verified', bg: '#2E7D32' },
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

  membershipCard: { backgroundColor: '#262A3C', borderRadius: 18, borderWidth: 1, borderColor: '#3C4360', marginHorizontal: 12, marginTop: 16, padding: 18 },
  membershipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  membershipTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  membershipBody: { color: colors.textSecondary, marginTop: 10, lineHeight: 20 },
  membershipButton: { marginTop: 16 },

  panel: { backgroundColor: '#2B2F39', borderRadius: 16, borderWidth: 1, borderColor: '#343B49', padding: 12, marginHorizontal: 12, marginTop: 10 },
  withdrawRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  thumb: { width: 48, height: 48, borderRadius: 10, marginRight: 12, backgroundColor: '#222' },
  withdrawTitle: { color: colors.white, fontWeight: '700', maxWidth: 180 },
  withdrawAmount: { color: colors.textSecondary, marginTop: 2 },
  viewMoreBtn: { marginHorizontal: 12, marginTop: 10, paddingVertical: 10, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#343B49', backgroundColor: '#2B2F39' },
  viewMoreText: { color: colors.accent, fontWeight: '700' },
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
