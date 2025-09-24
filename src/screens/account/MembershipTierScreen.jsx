import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft, Sparkles, CheckCircle2 } from 'lucide-react-native';
import RazorpayCheckout from 'react-native-razorpay';

import { colors } from '../../theme/colors';
import Button from '../../components/ui/Button';
import CongratsModal from '../../components/modals/CongratsModal';
import ProcessingPaymentModal from '../../components/modals/ProcessingPaymentModal';
import PaymentsRegionModal from '../../components/modals/PaymentsRegionModal';
import AppModal from '../../components/common/AppModal';
import plansService from '../../services/plans';
import paymentsService from '../../services/payments';
import { fetchMyWallet } from '../../store/wallet/walletSlice';

const GRADIENT_BORDER = ['#7C5DFF', '#5BC0FF'];
const CARD_BG = '#22252E';

function formatPlanTitle(plan) {
  if (!plan) return 'Membership';
  const { name, billingPeriod, billingInterval } = plan;
  if (name) return name;
  if (billingPeriod) {
    const label = String(billingPeriod).replace(/_/g, ' ');
    return `${billingInterval || 1} ${label}`.trim();
  }
  return 'Membership';
}

function formatCurrency(plan) {
  const prefix = plan?.currencySymbol || plan?.currencyCode || plan?.baseCurrency || '';
  const amount = Number(plan?.amount || 0).toLocaleString('en-IN');
  return `${prefix ? `${prefix} ` : ''}${amount}`;
}

function formatCredits(plan) {
  return `${Number(plan?.coins || 0).toLocaleString('en-IN')} ZC credits`;
}

export default function MembershipTierScreen({ navigation }) {
  const dispatch = useDispatch();
  const userCountry = useSelector((s) => s.auth.user?.address?.country);

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [payProcessing, setPayProcessing] = useState(false);
  const [payError, setPayError] = useState(null);
  const [regionModal, setRegionModal] = useState(false);
  const [congratsOpen, setCongratsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [lastPlan, setLastPlan] = useState(null);

  const fetchPlans = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await plansService.listPlans({});
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setPlans(list.filter((p) => p?.planType === 'SUBSCRIPTION'));
    } catch (e) {
      setPlans([]);
      setError(e?.message || 'Failed to load membership plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPlans();
    } finally {
      setRefreshing(false);
    }
  }, [fetchPlans]);

  const sortedPlans = useMemo(() => {
    const list = Array.isArray(plans) ? [...plans] : [];
    return list.sort((a, b) => Number(Boolean(b?.highlight)) - Number(Boolean(a?.highlight)));
  }, [plans]);

  const startSubscribe = useCallback(async (plan) => {
    try {
      setLastPlan(plan);
      if (!userCountry || String(userCountry).toLowerCase() !== 'india') {
        setRegionModal(true);
        return;
      }
      if (!plan?._id) throw new Error('Invalid plan');

      setProcessingPlanId(plan._id);
      setPayProcessing(true);

      const keyRes = await paymentsService.getRazorpayKey();
      const { keyId } = keyRes || {};
      if (!keyId) throw new Error('Missing Razorpay key');

      const subRes = await paymentsService.createRazorpaySubscription({ planId: plan._id });
      const { subscription } = subRes || {};
      if (!subscription?.id) throw new Error('Failed to create subscription');

      const options = {
        key: keyId,
        name: 'Zishes',
        description: 'Plan Subscription',
        subscription_id: subscription.id,
        theme: { color: '#6C7BFF' },
        retry: { enabled: true, max_count: 2 },
        external: { wallets: ['paytm', 'phonepe'] },
        notes: { planId: plan._id },
      };

      try {
        setPayProcessing(false);
        await RazorpayCheckout.open(options);
        try { dispatch(fetchMyWallet()); } catch {}
        setSelectedPlan(plan);
        setCongratsOpen(true);
      } catch (err) {
        const desc = String(err?.description || err?.message || '').toLowerCase();
        if (desc.includes('cancel')) return;
        if (err?.code === 'RAZORPAY_SDK_MISSING') {
          Alert.alert('Razorpay not installed', 'Please add react-native-razorpay to run checkout, or try again later.');
        } else {
          setPayError(err?.description || err?.message || 'Payment failed');
        }
      }
    } catch (e) {
      setPayError(e?.message || 'Could not start subscription. Please try again.');
    } finally {
      setPayProcessing(false);
      setProcessingPlanId(null);
    }
  }, [dispatch, userCountry]);

  const successMessage = useMemo(() => {
    if (!selectedPlan) return 'Your membership is live. Enjoy the perks!';
    const title = formatPlanTitle(selectedPlan);
    const credits = formatCredits(selectedPlan);
    return `Your ${title} membership is active. ${credits}`;
  }, [selectedPlan]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ChevronLeft size={20} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Membership Tiers</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl tintColor={colors.white} refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={['#1F1A3A', '#141821']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroBadge}>
            <Sparkles size={16} color={colors.white} />
            <Text style={styles.heroBadgeTxt}>Level up your experience</Text>
          </View>
          <Text style={styles.heroTitle}>Unlock premium support, exclusive drops & faster help.</Text>
          <Text style={styles.heroSubtitle}>Pick a plan that matches your pace—every tier includes ZishCoin credits to kickstart your next gameplay.</Text>
        </LinearGradient>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.loaderTxt}>Loading memberships…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTxt}>{error}</Text>
            <Button title="Retry" onPress={fetchPlans} style={{ marginTop: 12 }} />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            {sortedPlans.map((plan) => (
              <PlanCard
                key={plan._id}
                plan={plan}
                recommended={Boolean(plan?.highlight)}
                processing={processingPlanId === plan._id}
                onSubscribe={() => startSubscribe(plan)}
              />
            ))}
            {sortedPlans.length === 0 && (
              <Text style={styles.emptyTxt}>Membership plans will appear here soon.</Text>
            )}
          </View>
        )}

        <Text style={styles.note}>Memberships auto-renew. Benefits and pricing may change based on region & availability.</Text>
      </ScrollView>

      <CongratsModal
        visible={congratsOpen}
        title="Membership Activated"
        message={successMessage}
        primaryText="Awesome!"
        onPrimary={() => { setCongratsOpen(false); setSelectedPlan(null); navigation.goBack(); }}
        onRequestClose={() => { setCongratsOpen(false); setSelectedPlan(null); }}
      />
      <PaymentsRegionModal visible={regionModal} onClose={() => setRegionModal(false)} />
      <ProcessingPaymentModal visible={payProcessing} />
      <AppModal
        visible={!!payError}
        title="Payment Failed"
        message={payError || 'Something went wrong while starting payment.'}
        cancelText="Close"
        confirmText="Retry"
        onCancel={() => setPayError(null)}
        onConfirm={() => { setPayError(null); if (lastPlan) startSubscribe(lastPlan); }}
      />
    </SafeAreaView>
  );
}

function PlanCard({ plan, recommended, processing, onSubscribe }) {
  const title = formatPlanTitle(plan);
  const price = formatCurrency(plan);
  const credits = formatCredits(plan);
  const perks = Array.isArray(plan?.perks) ? plan.perks : [];

  const CardContent = (
    <View style={styles.planCard}>
      {recommended ? (
        <View style={styles.recommendBadge}>
          <Sparkles size={14} color={colors.white} />
          <Text style={styles.recommendTxt}>Recommended</Text>
        </View>
      ) : null}
      <Text style={styles.planTitle}>{title}</Text>
      <Text style={styles.planPrice}>{price}</Text>
      <Text style={styles.planCredits}>{credits}</Text>

      {perks.length ? (
        <View style={styles.perksGrid}>
          {perks.map((perk, idx) => (
            <View key={`${plan._id}-perk-${idx}`} style={styles.perkPill}>
              <CheckCircle2 size={14} color={colors.accent} />
              <Text style={styles.perkTxt}>{perk}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Button
        title={processing ? 'Processing…' : 'Subscribe Now'}
        onPress={onSubscribe}
        disabled={processing}
        style={styles.subscribeBtn}
      />
    </View>
  );

  if (recommended) {
    return (
      <LinearGradient colors={GRADIENT_BORDER} style={styles.planGradientWrap}>
        {CardContent}
      </LinearGradient>
    );
  }

  return (
    <View style={styles.planWrap}>
      {CardContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },

  hero: { margin: 16, padding: 20, borderRadius: 18, borderWidth: 1, borderColor: '#33364A' },
  heroBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  heroBadgeTxt: { color: colors.white, fontWeight: '700', fontSize: 12, letterSpacing: 0.3, marginLeft: 6 },
  heroTitle: { color: colors.white, fontWeight: '900', fontSize: 22, marginTop: 14, lineHeight: 30 },
  heroSubtitle: { color: 'rgba(234,239,255,0.82)', marginTop: 10, lineHeight: 20 },

  loaderWrap: { alignItems: 'center', paddingVertical: 32 },
  loaderTxt: { marginTop: 10, color: colors.textSecondary, fontWeight: '600' },
  errorBox: { marginHorizontal: 16, marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#FF7A7A33' },
  errorTxt: { color: '#FF9C9C', fontWeight: '600' },
  emptyTxt: { color: colors.textSecondary, textAlign: 'center', marginTop: 12 },

  planGradientWrap: { marginBottom: 16, borderRadius: 22, padding: 1 },
  planWrap: { marginBottom: 16, borderRadius: 22, borderWidth: 1, borderColor: '#2E3340', backgroundColor: '#1A1D26' },
  planCard: { backgroundColor: CARD_BG, borderRadius: 21, padding: 20, overflow: 'hidden' },
  recommendBadge: { position: 'absolute', top: -12, alignSelf: 'center', backgroundColor: '#7C5DFF', paddingHorizontal: 18, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center' },
  recommendTxt: { color: colors.white, fontWeight: '800', fontSize: 12, letterSpacing: 0.4, marginLeft: 6 },
  planTitle: { color: colors.white, fontWeight: '800', fontSize: 20, textAlign: 'center', marginTop: 12 },
  planPrice: { color: colors.white, fontWeight: '900', fontSize: 28, textAlign: 'center', marginTop: 8 },
  planCredits: { color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
  perksGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 18, marginHorizontal: -4 },
  perkPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#313648', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginHorizontal: 4, marginBottom: 8, flexGrow: 1, flexBasis: '48%' },
  perkTxt: { color: colors.white, fontWeight: '600', flexShrink: 1, marginLeft: 8 },
  subscribeBtn: { marginTop: 20 },

  note: { color: colors.textSecondary, textAlign: 'center', marginTop: 24, paddingHorizontal: 24, fontSize: 12 },
});
