import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../theme/colors';
import { ChevronLeft, CreditCard, QrCode, Wallet, ShieldCheck } from 'lucide-react-native';
import CongratsModal from '../../components/modals/CongratsModal';
import PaymentsRegionModal from '../../components/modals/PaymentsRegionModal';
import paymentsService from '../../services/payments';
import RazorpayCheckout from 'react-native-razorpay';
import { useDispatch } from 'react-redux';
import { fetchMyWallet } from '../../store/wallet/walletSlice';
import plansService from '../../services/plans';
import { useSelector } from 'react-redux';
import ProcessingPaymentModal from '../../components/modals/ProcessingPaymentModal';
import AppModal from '../../components/common/AppModal';

export default function BuyCoinsScreen({ navigation }) {
  const dispatch = useDispatch();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [congratsOpen, setCongratsOpen] = useState(false);
  const balance = useSelector((s) => s.wallet.availableZishCoins);
  const country = useSelector((s) => s.auth.user?.address?.country);
  const [processing, setProcessing] = useState(false);
  const [regionModal, setRegionModal] = useState(false);
  const [payProcessing, setPayProcessing] = useState(false);
  const [payError, setPayError] = useState(null);
  const [lastPlan, setLastPlan] = useState(null);
  const isIndia = useMemo(() => String(country || '').trim().toLowerCase() === 'india', [country]);

  const openMembershipTier = useCallback(() => {
    const parentNav = navigation.getParent?.();
    const targetParams = { screen: 'MembershipTier' };
    if (parentNav?.navigate) {
      parentNav.navigate('Profile', targetParams);
    } else {
      navigation.navigate('Profile', targetParams);
    }
  }, [navigation]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await plansService.listPlans({});
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        if (alive) setPlans(list.filter(p => p?.planType === 'TOPUP'));
      } catch (e) {
        if (alive) setError(e?.message || 'Failed to load plans');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const renderPack = ({ item }) => (
    <TouchableOpacity onPress={() => setSelected(item._id)} style={[styles.pack, selected===item._id && styles.packActive]}>
      <View style={styles.coinBadge}><Text style={styles.badgeText}>Z</Text></View>
      <Text style={styles.packQty}>{Number(item.coins || 0)} Coins</Text>
      <Text style={styles.packPrice}>{(item.currencyCode || item.baseCurrency || '')} {item.amount}</Text>
    </TouchableOpacity>
  );

  const startTopup = useCallback(async () => {
    try {
      if (!selected) return;
      if (!isIndia) {
        setRegionModal(true);
        return;
      }
      const plan = plans.find(p => p._id === selected);
      if (!plan) throw new Error('Invalid plan');
      setProcessing(true);
      setPayProcessing(true);
      setLastPlan(plan);
      try { console.log('[RZP][BUY] Selected plan:', JSON.stringify({ id: plan._id, coins: plan.coins, amount: plan.amount, currency: plan.currencyCode })); } catch {}
      const keyRes = await paymentsService.getRazorpayKey();
      const { keyId } = keyRes || {};
      try { console.log('[RZP][BUY] Public key fetched:', keyRes && keyRes.keyId ? `${String(keyRes.keyId).slice(0,6)}…` : null); } catch {}
      if (!keyId) throw new Error('Missing Razorpay key');
      const orderRes = await paymentsService.createRazorpayTopup({ planId: plan._id });
      const { order } = orderRes || {};
      try { console.log('[RZP][BUY] Order created:', JSON.stringify({ id: order?.id, amount: order?.amount, currency: order?.currency })); } catch {}
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
        try { dispatch(fetchMyWallet()); } catch {}
        try { setCongratsOpen(true); } catch {}
      } catch (err) {
        const rawMessage = err?.description || err?.message || '';
        const desc = String(rawMessage).toLowerCase();
        console.warn('[RZP][TOPUP-BUY] error:', JSON.stringify(err));
        if (desc.includes('cancel')) return;
        if (err?.code === 'RAZORPAY_SDK_MISSING') {
          Alert.alert('Razorpay not installed', 'Please add react-native-razorpay to run checkout, or try again later.');
        } else {
          setPayError('We could not complete your payment. Please retry.');
        }
      }
    } catch (e) {
      console.warn('[RZP][TOPUP-BUY] start error:', e);
      setPayError('We could not start the payment. Please retry.');
    } finally {
      setProcessing(false);
      setPayProcessing(false);
    }
  }, [dispatch, isIndia, plans, selected]);

  if (!isIndia) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Buy Coins</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: colors.white, fontWeight: '700', fontSize: 18, textAlign: 'center' }}>Coin top-ups are not available in your region yet.</Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 12 }}>Check out membership subscriptions to unlock more benefits while we work on expanding support.</Text>
          <TouchableOpacity style={[styles.bottomBtn, styles.buyBtn, { marginTop: 20 }]} onPress={openMembershipTier}>
            <Text style={styles.buyTxt}>View Memberships</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bottomBtn, styles.cancelBtn, { marginTop: 12, width: '60%' }]} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelTxt}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Buy Coins</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={plans}
        keyExtractor={(it) => it._id}
        numColumns={2}
        renderItem={renderPack}
        ListHeaderComponent={
          <>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.balanceCard}>
              <View style={styles.coinBadgeLg}><Text style={styles.badgeText}>Z</Text></View>
              <Text style={styles.balanceLabel}>Your Current Balance</Text>
              <Text style={styles.balanceQty}>{Number(balance || 0).toLocaleString()} <Text style={{ fontSize: 16 }}>Coins</Text></Text>
              <Text style={styles.balanceCaption}>Coins power your gameplay — top up anytime.</Text>
            </LinearGradient>
            <Text style={styles.sectionTitle}>Choose Your Coin Pack</Text>
          </>
        }
        ListFooterComponent={
          <>
         </>
        }
        contentContainerStyle={{ padding: 12, paddingBottom: 140 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator color={colors.white} />
              <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Loading plans…</Text>
            </View>
          ) : error ? (
            <Text style={{ color: colors.textSecondary, paddingHorizontal: 12 }}>{error}</Text>
          ) : (
            <Text style={{ color: colors.textSecondary, paddingHorizontal: 12 }}>No packs available.</Text>
          )
        }
      />

      <View style={styles.fixedBottomBar}>
        <TouchableOpacity style={[styles.bottomBtn, styles.cancelBtn]} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelTxt}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomBtn, styles.buyBtn, !selected && styles.buyBtnDisabled]}
          disabled={!selected}
          onPress={startTopup}
        >
          <Text style={[styles.buyTxt, (!selected || processing) && styles.buyTxtDisabled]}>{processing ? 'Processing…' : 'Buy Now'}</Text>
        </TouchableOpacity>
      </View>

      <CongratsModal
        visible={congratsOpen}
        title="Purchase Successful"
        message={selected ? `Your ${Number(plans.find(p=>p._id===selected)?.coins || 0)} ZishCoins are on the way!` : 'Coins added successfully.'}
        primaryText="Great!"
        onPrimary={() => { setCongratsOpen(false); navigation.goBack(); }}
        onRequestClose={() => setCongratsOpen(false)}
      />
      <PaymentsRegionModal visible={regionModal} onClose={() => setRegionModal(false)} />
      <ProcessingPaymentModal visible={payProcessing} />
      <AppModal
        visible={!!payError}
        title="Payment Failed"
        message={payError || 'We could not process your payment. Please try again.'}
        cancelText="Close"
        confirmText="Retry"
        onCancel={() => setPayError(null)}
        onConfirm={() => { setPayError(null); if (lastPlan) { setSelected(lastPlan._id); startTopup(); } }}
      />
    </SafeAreaView>
  );
}

function MethodRow({ title, icon }) {
  return (
    <View style={styles.methodRow}>
      <View style={styles.methodLeft}>{icon}<Text style={styles.methodTitle}>{'  '}{title}</Text></View>
      <ShieldCheck size={16} color={colors.white} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },

  balanceCard: { borderRadius: 16, padding: 16, margin: 12 },
  coinBadgeLg: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  badgeText: { color: colors.white, fontWeight: '900' },
  balanceLabel: { color: colors.white, opacity: 0.9, fontWeight: '700' },
  balanceQty: { color: colors.white, fontWeight: '900', fontSize: 28, marginTop: 6 },
  balanceCaption: { color: '#E5E7EB', marginTop: 6 },
  sectionTitle: { color: colors.white, fontWeight: '800', fontSize: 16, marginTop: 8, marginBottom: 8 },

  pack: { width: '48%', backgroundColor: '#2B2F39', borderRadius: 16, borderWidth: 1, borderColor: '#343B49', padding: 14, marginBottom: 12 },
  packActive: { borderColor: colors.accent, backgroundColor: '#3A2B52' },
  coinBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#3A2B52', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  packQty: { color: colors.white, fontWeight: '700' },
  packPrice: { color: colors.textSecondary, marginTop: 2 },

  methodsWrap: { paddingHorizontal: 0, marginTop: 4, gap: 10 },
  methodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 12, padding: 12 },
  methodLeft: { flexDirection: 'row', alignItems: 'center' },
  methodTitle: { color: colors.white, fontWeight: '700' },

  bottomBar: { paddingTop: 12, flexDirection: 'row', gap: 12 },
  fixedBottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, flexDirection: 'row', gap: 12, backgroundColor: colors.black, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#22252C' },
  bottomBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },
  cancelBtn: { backgroundColor: 'transparent' },
  buyBtn: { backgroundColor: colors.primary, borderColor: colors.primary },
  buyBtnDisabled: { backgroundColor: '#3A2B52', borderColor: '#3A2B52' },
  cancelTxt: { color: colors.white, fontWeight: '700' },
  buyTxt: { color: colors.white, fontWeight: '800' },
  buyTxtDisabled: { color: '#bcbccd' },
  disclaimer: { marginTop: 16, padding: 10, backgroundColor: '#1F232C', flexDirection: 'row', alignItems: 'center', borderRadius: 10 },
  disclaimerTxt: { color: colors.textSecondary, marginLeft: 6 },
});
