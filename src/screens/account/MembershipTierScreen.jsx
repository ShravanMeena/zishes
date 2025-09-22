import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, CheckCircle2, Sparkles } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import Button from '../../components/ui/Button';
import CongratsModal from '../../components/modals/CongratsModal';
import ProcessingPaymentModal from '../../components/modals/ProcessingPaymentModal';
import plansService from '../../services/plans';
import paymentsService from '../../services/payments';
import RazorpayCheckout from 'react-native-razorpay';
import PaymentsRegionModal from '../../components/modals/PaymentsRegionModal';
import { useDispatch, useSelector } from 'react-redux';
import AppModal from '../../components/common/AppModal';
import { fetchMyWallet } from '../../store/wallet/walletSlice';

export default function MembershipTierScreen({ navigation }) {
  const dispatch = useDispatch();
  const userCountry = useSelector((s) => s.auth.user?.address?.country);
  const [congratsOpen, setCongratsOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [regionModal, setRegionModal] = useState(false);
  const [payProcessing, setPayProcessing] = useState(false);
  const [payError, setPayError] = useState(null);
  const [lastPlan, setLastPlan] = useState(null);

  const fetchPlans = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await plansService.listPlans({});
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      console.log(JSON.stringify(list,null,2))
      setPlans(list.filter(p => p?.planType === 'SUBSCRIPTION'));
    } catch (e) {
      setPlans([]);
      setError(e?.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetchPlans(); } finally { setRefreshing(false); }
  }, [fetchPlans]);

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
      try { console.log('[RZP][SUB] Public key fetched:', keyRes && keyRes.keyId ? `${String(keyRes.keyId).slice(0,6)}…` : null); } catch {}
      if (!keyId) throw new Error('Missing Razorpay key');
      const subRes = await paymentsService.createRazorpaySubscription({ planId: plan._id });
      const { subscription } = subRes || {};
      try { console.log('[RZP][SUB] Subscription created:', JSON.stringify({ id: subscription?.id, status: subscription?.status, total_count: subscription?.total_count })); } catch {}
      if (!subscription?.id) throw new Error('Failed to create subscription');

      const options = {
        key: keyId,
        name: 'Zishes',
        description: 'Plan Subscription',
        subscription_id: subscription.id,
        prefill: {
          // Add if available from user profile/redux when you wire it
          // email: user?.email,
          // contact: user?.phone,
        },
        theme: { color: '#6C7BFF' },
        retry: { enabled: true, max_count: 2 },
        external: { wallets: ['paytm', 'phonepe'] },
        notes: { planId: plan._id },
      };

      try {
        // Hide preflight processing before opening the native checkout
        setPayProcessing(false);
        await RazorpayCheckout.open(options);
        try { dispatch(fetchMyWallet()); } catch {}
        setSelectedTier(`${Number(plan.coins || 0)} ZC`);
        setCongratsOpen(true);
      } catch (err) {
        const desc = String(err?.description || err?.message || '').toLowerCase();
        if (desc.includes('cancel')) return;
        console.warn('[RZP][SUBSCRIPTION] error:', JSON.stringify(err));
        if (err?.code === 'RAZORPAY_SDK_MISSING') {
          Alert.alert('Razorpay not installed', 'Please add react-native-razorpay to run checkout, or try again later.');
        } else {
          setPayError(err?.description || err?.message || 'Payment failed');
        }
      }
    } catch (e) {
      setPayError(e?.message || 'Could not start subscription');
    } finally {
      setPayProcessing(false);
      setProcessingPlanId(null);
    }
  }, [userCountry]);

  // Debug: log resolved user country
  // console.log(userCountry, "countrycountry")
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Membership Tier</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />}
      >
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard style={{ marginTop: 16 }} />
            <SkeletonCard style={{ marginTop: 16 }} />
          </>
        ) : plans.length === 0 ? (
          <View style={styles.cardDark}><Text style={{ color: colors.textSecondary }}>No membership plans available.</Text></View>
        ) : (
          plans.map((pl, idx) => (
            <View
              key={pl._id || idx}
              style={[
                styles.cardDark,
                idx > 0 && { marginTop: 16 },
                pl.highlight && styles.cardHighlight,
              ]}
            >
              {pl.highlight ? (
                <View style={styles.highlightBadge}>
                  <Sparkles size={14} color={colors.white} />
                  <Text style={styles.highlightTxt}>Recommended</Text>
                </View>
              ) : null}
              <Text style={[styles.tierTitle]}>{(pl.billingPeriod ? `${(pl.billingInterval || 1)} ${pl.billingPeriod}` : 'Membership')}</Text>
              <Text style={styles.price}>{(pl.currencySymbol || pl.currencyCode || pl.baseCurrency || '')} {pl.amount}</Text>
              <Text style={styles.credits}>{Number(pl.coins || 0).toLocaleString()} ZC credits</Text>
              {Array.isArray(pl.perks) && pl.perks.length ? (
                <View style={styles.perksWrap}>
                  {pl.perks.map((perk, perkIdx) => (
                    <View key={`${pl._id}-perk-${perkIdx}`} style={styles.featureRow}>
                      <CheckCircle2 size={16} color={colors.accent} />
                      <Text style={styles.featureTxt}>{perk}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <Button
                title={processingPlanId === (pl._id) ? 'Processing…' : 'Subscribe Now'}
                onPress={() => startSubscribe(pl)}
                disabled={processingPlanId === (pl._id)}
                style={{ marginTop: 14 }}
              />
            </View>
          ))
        )}
        <Text style={styles.note}>Membership automatically renews. Benefits and terms are subject to change.</Text>
      </ScrollView>
      <CongratsModal
        visible={congratsOpen}
        title="Membership Activated"
        message={selectedTier ? `Your ${selectedTier.toUpperCase()} membership is live. Enjoy the perks!` : 'Your membership is live. Enjoy the perks!'}
        primaryText="Awesome!"
        onPrimary={() => { setCongratsOpen(false); navigation.goBack(); }}
        onRequestClose={() => setCongratsOpen(false)}
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

function Feature({ text, icon, light }) {
  return (
    <View style={styles.featureRow}>
      {icon || <CheckCircle2 size={16} color={light ? '#EAEFFF' : colors.white} />}
      <Text style={[styles.featureTxt, light && { color: '#EAEFFF' }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },

  card: { borderRadius: 18, padding: 16, overflow: 'visible' },
  cardDark: { backgroundColor: '#2B2F39', borderRadius: 18, borderWidth: 1, borderColor: '#343B49', padding: 16 },
  tierTitle: { fontSize: 24, fontWeight: '900', color: colors.white, textAlign: 'center', marginBottom: 4 },
  price: { color: colors.white, fontWeight: '900', fontSize: 28, textAlign: 'center' },
  credits: { color: colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  featureTxt: { color: colors.white, fontWeight: '600' },
  perksWrap: { marginTop: 12 },
  cardHighlight: { borderColor: colors.accent, backgroundColor: '#32264A', shadowColor: colors.accent, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  highlightBadge: { position: 'absolute', top: -12, alignSelf: 'center', backgroundColor: colors.accent, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 },
  highlightTxt: { color: colors.white, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  badge: { position: 'absolute', top: -12, alignSelf: 'center', backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, overflow: 'hidden' },
  badgeTxt: { color: colors.white, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  note: { color: colors.textSecondary, textAlign: 'center', marginTop: 16 },

  // Skeleton styles
  skelLineLg: { height: 30, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)', width: '60%' },
  skelLineSm: { height: 14, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.25)', width: '40%', marginTop: 8 },
  skelLineXs: { height: 10, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.15)', width: '80%', marginTop: 10 },
});

function SkeletonCard({ style }) {
  return (
    <View style={[styles.cardDark, style]}> 
      <View style={[styles.skelLineLg, { alignSelf: 'center' }]} />
      <View style={[styles.skelLineLg, { width: '40%', marginTop: 10, alignSelf: 'center' }]} />
      <View style={[styles.skelLineSm, { alignSelf: 'center' }]} />
      <View style={[styles.skelLineXs]} />
    </View>
  );
}
