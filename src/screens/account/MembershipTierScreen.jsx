import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useDispatch, useSelector} from 'react-redux';
import {useFocusEffect} from '@react-navigation/native';
import {
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  CalendarClock,
  AlertCircle,
} from 'lucide-react-native';
import RazorpayCheckout from 'react-native-razorpay';

import {colors} from '../../theme/colors';
import Button from '../../components/ui/Button';
import CongratsModal from '../../components/modals/CongratsModal';
import ProcessingPaymentModal from '../../components/modals/ProcessingPaymentModal';
import AppModal from '../../components/common/AppModal';
import plansService from '../../services/plans';
import paymentsService from '../../services/payments';
import {fetchMyWallet} from '../../store/wallet/walletSlice';
import {isIndiaCountry} from '../../utils/payments';
import {
  buildPlanLookup,
  collectPlanKeys,
  findPlanForSubscription,
} from '../../utils/plans';
import {
  categorizeSubscriptionStatus,
  ACTIVE_SUBSCRIPTION_STATUSES,
  formatStatusLabel,
  isSubscriptionCancellationScheduled,
} from '../../utils/subscriptionStatus';

const GRADIENT_BORDER = ['#7C5DFF', '#5BC0FF'];
const CARD_BG = '#22252E';

function toDate(value) {
  if (!value) return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    const ms = numeric < 1e12 ? numeric * 1000 : numeric;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const date = toDate(value);
  if (!date) return '—';
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isPlanActive(plan, activeKeySet) {
  if (!activeKeySet || activeKeySet.size === 0) return false;
  const keys = collectPlanKeys(plan);
  return keys.some(k => activeKeySet.has(k));
}

function formatPlanTitle(plan) {
  if (!plan) return 'Membership';
  const {name, billingPeriod, billingInterval} = plan;
  if (name) return name;
  if (billingPeriod) {
    const label = String(billingPeriod).replace(/_/g, ' ');
    return `${billingInterval || 1} ${label}`.trim();
  }
  return 'Membership';
}

function formatPlanPrice(plan) {
  const prefix =
    plan?.currencySymbol || plan?.currencyCode || plan?.baseCurrency || '';
  const amount = Number(plan?.amount || 0).toLocaleString('en-IN');
  return `${prefix ? `${prefix} ` : ''}${amount}`;
}

function formatCredits(plan) {
  return `${Number(plan?.coins || 0).toLocaleString('en-IN')} ZC credits`;
}

function getSubscriptionStatusUi(statusInfo) {
  const base = {
    state: statusInfo.state,
    label: statusInfo.label,
    Icon: AlertCircle,
    color: colors.textSecondary,
    backgroundColor: 'rgba(255,255,255,0.12)',
    title: 'Subscription Status',
  };

  if (statusInfo.state === 'active') {
    return {
      ...base,
      Icon: CheckCircle2,
      color: '#5EE787',
      backgroundColor: 'rgba(94, 231, 135, 0.12)',
      title: 'Active Subscription',
    };
  }
  if (statusInfo.state === 'cancelled') {
    return {
      ...base,
      Icon: AlertCircle,
      color: '#FF9C9C',
      backgroundColor: 'rgba(255,156,156,0.18)',
      title: 'Subscription Cancelled',
    };
  }
  if (statusInfo.state === 'scheduled_cancel') {
    return {
      ...base,
      Icon: AlertCircle,
      color: '#E2B93B',
      backgroundColor: 'rgba(226,185,59,0.18)',
      title: 'Subscription Ending Soon',
    };
  }
  if (statusInfo.state === 'other') {
    return {
      ...base,
      Icon: AlertCircle,
      color: '#E2B93B',
      backgroundColor: 'rgba(226,185,59,0.18)',
    };
  }
  return base;
}

export default function MembershipTierScreen({navigation}) {
  const dispatch = useDispatch();
  const userCountry = useSelector(s => s.auth.user?.address?.country);
  const userId = useSelector(s => s.auth.user?._id || s.auth.user?.id);
  const isIndia = useMemo(() => isIndiaCountry(userCountry), [userCountry]);

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [plansError, setPlansError] = useState(null);
  const planLookup = useMemo(() => buildPlanLookup(plans), [plans]);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [payProcessing, setPayProcessing] = useState(false);
  const [payError, setPayError] = useState(null);
  const [congratsOpen, setCongratsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [lastPlan, setLastPlan] = useState(null);

  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionRefreshing, setSubscriptionRefreshing] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState('');
  const [subscriptionNotFound, setSubscriptionNotFound] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState({
    visible: false,
    title: '',
    message: '',
  });
  const [cancelling, setCancelling] = useState(false);
  const [alreadySubscribedModal, setAlreadySubscribedModal] = useState({
    visible: false,
    title: '',
    message: '',
    canManage: false,
  });

  const fetchPlans = useCallback(async () => {
    try {
      setPlansError(null);
      setPlansLoading(true);
      if (!isIndiaCountry(userCountry)) {
        setPlans([]);
        setPlansError(
          'Membership subscriptions are currently available only in India.',
        );
        return;
      }
      const res = await plansService.listPlans({});
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      const accessible = list.filter(p => p?.planType === 'SUBSCRIPTION');
      setPlans(accessible);
    } catch (e) {
      setPlans([]);
      setPlansError(e?.message || 'Failed to load membership plans');
    } finally {
      setPlansLoading(false);
    }
  }, [userCountry]);

  const loadSubscription = useCallback(
    async (opts = {}) => {
      const {refreshing = false, silent = false} = opts;
      if (!isIndia) {
        setSubscription(null);
        setActivePlan(null);
        setSubscriptionNotFound(false);
        setSubscriptionError('');
        return;
      }
      if (refreshing) setSubscriptionRefreshing(true);
      else if (!silent) setSubscriptionLoading(true);
      setSubscriptionError('');
      try {
        const data = await paymentsService.getRazorpayActiveSubscription();
        setSubscription(
          data?.subscription
            ? {...data?.subscription, cancelledAt: data?.cancelledAt, endsAt: data?.endsAt}
            : null,
        );
        setActivePlan(data?.plan || null);
        setSubscriptionNotFound(!data?.subscription);
      } catch (err) {
        if (err?.status === 404) {
          setSubscription(null);
          setActivePlan(null);
          setSubscriptionNotFound(true);
        } else {
          setSubscriptionError(
            err?.message || 'Unable to fetch subscription details.',
          );
        }
      } finally {
        if (refreshing) setSubscriptionRefreshing(false);
        else if (!silent) setSubscriptionLoading(false);
      }
    },
    [isIndia],
  );

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useFocusEffect(
    useCallback(() => {
      loadSubscription();
      return undefined;
    }, [loadSubscription]),
  );

  useEffect(() => {
    if (!subscription) return;
    const planHasName = Boolean(subscription?.plan?.name);
    const activeHasName = Boolean(activePlan?.name);
    if (planHasName && activeHasName) return;
    if (!planLookup || planLookup.size === 0) return;
    const resolved = findPlanForSubscription(subscription, planLookup);
    if (!resolved) return;
    setSubscription(prev => {
      if (!prev) return prev;
      if (prev.plan && prev.plan.name) return prev;
      const mergedPlan = prev.plan ? {...prev.plan, ...resolved} : resolved;
      return {...prev, plan: mergedPlan};
    });
    if (!activeHasName && resolved) {
      setActivePlan(resolved);
    }
  }, [subscription, planLookup, activePlan]);

  const onRefresh = useCallback(async () => {
    setPullRefreshing(true);
    try {
      await Promise.all([
        fetchPlans(),
        loadSubscription({refreshing: true, silent: true}),
      ]);
    } finally {
      setPullRefreshing(false);
    }
  }, [fetchPlans, loadSubscription]);

  const sortedPlans = useMemo(() => {
    const list = Array.isArray(plans) ? [...plans] : [];
    return list.sort(
      (a, b) => Number(Boolean(b?.highlight)) - Number(Boolean(a?.highlight)),
    );
  }, [plans]);

  const subscriptionStatusInfo = useMemo(() => {
    if (!subscription) return { state: 'none', label: 'None' };
    return categorizeSubscriptionStatus(subscription?.status, subscription);
  }, [subscription]);

  const hasActiveSubscription = useMemo(() => {
    const state = subscriptionStatusInfo?.state;
    return state === 'active' || state === 'scheduled_cancel';
  }, [subscriptionStatusInfo]);

  const startSubscribe = useCallback(
    async plan => {
      if (hasActiveSubscription) {
        showAlreadySubscribedModal();
        return;
      }
      try {
        if (!plan?._id) throw new Error('Invalid plan');
        setLastPlan(plan);

        if (!isIndia) {
          Alert.alert(
            'Not available',
            'Membership subscriptions are currently available only in India.',
          );
          return;
        }

        setProcessingPlanId(plan._id);
        setPayProcessing(true);

        const keyRes = await paymentsService.getRazorpayKey();
        const {keyId} = keyRes || {};
        if (!keyId) throw new Error('Missing Razorpay key');

        const subRes = await paymentsService.createRazorpaySubscription({
          planId: plan._id,
        });
        const {subscription} = subRes || {};
        if (!subscription?.id) throw new Error('Failed to create subscription');

        const options = {
          key: keyId,
          name: 'Zishes',
          description: 'Plan Subscription',
          subscription_id: subscription.id,
          theme: {color: '#6C7BFF'},
          retry: {enabled: true, max_count: 2},
          external: {wallets: ['paytm', 'phonepe']},
          notes: {
            planId: plan._id,
            userId: userId || 'unknown',
            app: 'zishes',
          },
        };

        try {
          setPayProcessing(false);
          await RazorpayCheckout.open(options);
          try {
            dispatch(fetchMyWallet());
          } catch {}
          setSelectedPlan(plan);
          setCongratsOpen(true);
          await loadSubscription({silent: true});
        } catch (err) {
          const desc = String(
            err?.description || err?.message || '',
          ).toLowerCase();
          if (desc.includes('cancel')) return;
          if (err?.code === 'RAZORPAY_SDK_MISSING') {
            Alert.alert(
              'Razorpay not installed',
              'Please add react-native-razorpay to run checkout, or try again later.',
            );
          } else {
            setPayError(err?.description || err?.message || 'Payment failed');
          }
        }
      } catch (e) {
        setPayError(
          e?.message || 'Could not start subscription. Please try again.',
        );
      } finally {
        setPayProcessing(false);
        setProcessingPlanId(null);
      }
    },
    [dispatch, userCountry, loadSubscription, hasActiveSubscription, showAlreadySubscribedModal, isIndia, userId],
  );

  const successMessage = useMemo(() => {
    if (!selectedPlan) return 'Your membership is live. Enjoy the perks!';
    const title = formatPlanTitle(selectedPlan);
    const credits = formatCredits(selectedPlan);
    return `Your ${title} membership is active. ${credits}`;
  }, [selectedPlan]);

  const canCancel = useMemo(() => {
    if (!subscription) return false;
    const status = String(subscription?.status || '').toLowerCase();
    if (!ACTIVE_SUBSCRIPTION_STATUSES.has(status)) return false;
    return !isSubscriptionCancellationScheduled(subscription);
  }, [subscription]);

  const activePlanKeys = useMemo(() => {
    const keys = new Set();
    collectPlanKeys(activePlan).forEach(k => keys.add(k));
    if (subscription?.plan_id) keys.add(String(subscription.plan_id));
    if (subscription?.plan?.id) keys.add(String(subscription.plan.id));
    if (subscription?.plan)
      collectPlanKeys(subscription.plan).forEach(k => keys.add(k));
    return keys;
  }, [activePlan, subscription]);

  const handleCancel = useCallback(async () => {
    setCancelling(true);
    try {
      const data = await paymentsService.cancelRazorpaySubscription();
      const cancelled = data?.subscription || data;
      if (__DEV__) {
        try {
          console.log('[MembershipTier] Cancel subscription response', {
            status: cancelled?.status,
            cancelledAt: cancelled?.razorpaySubscriptionCancelledAt,
            endsAt: cancelled?.razorpaySubscriptionEndsAt,
            subscriptionId: cancelled?.id || cancelled?._id,
            legacyCancelledAt: cancelled?.cancelledAt,
            legacyEndsAt: cancelled?.endsAt,
          });
        } catch (logErr) {
          console.log(
            '[MembershipTier] Cancel subscription response (stringified)',
            JSON.stringify(cancelled || {}),
          );
        }
      }
      setFeedbackModal({
        visible: true,
        title: 'Cancellation Requested',
        message:
          'Your subscription will not renew after the current billing cycle. You can resubscribe anytime.',
      });
      if (cancelled) {
        setSubscription(cancelled);
      }
      await loadSubscription({silent: true});
    } catch (err) {
      setFeedbackModal({
        visible: true,
        title: 'Could not cancel',
        message:
          err?.message ||
          'We were unable to cancel the subscription. Please try again later.',
      });
    } finally {
      setCancelling(false);
      setConfirmCancelOpen(false);
    }
  }, [loadSubscription]);

  const showAlreadySubscribedModal = useCallback(() => {
    if (!subscription) return;
    const planName = activePlan
      ? formatPlanTitle(activePlan)
      : subscription?.plan?.name || subscription?.plan_id || 'your membership';
    const accessUntilRaw = subscription?.razorpaySubscriptionEndsAt
      || subscription?.endsAt
      || subscription?.current_end
      || subscription?.ended_at
      || subscription?.cancel_at;
    const accessUntil = accessUntilRaw ? formatDate(accessUntilRaw) : null;
    const message = accessUntil
      ? `You already have an active subscription for ${planName}. Benefits remain until ${accessUntil}. Cancel your current plan before choosing another.`
      : `You already have an active subscription for ${planName}. Cancel your current plan before choosing another.`;
    setAlreadySubscribedModal({
      visible: true,
      title: 'Subscription Active',
      message,
      canManage: canCancel,
    });
  }, [subscription, activePlan, canCancel]);

  const renderSubscriptionCard = () => {
    if (!isIndia) return null;

    if (subscriptionLoading) {
      return (
        <View style={[styles.subscriptionCard, {alignItems: 'center'}]}>
          <ActivityIndicator color={colors.accent} />
          <Text style={[styles.cardDesc, {marginTop: 12}]}>
            Fetching subscription details…
          </Text>
        </View>
      );
    }

    if (subscriptionError) {
      return (
        <View style={[styles.subscriptionCard, {paddingVertical: 20}]}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <AlertCircle size={20} color="#FF9C9C" />
            <Text style={[styles.cardTitle, {marginLeft: 8}]}>
              Unable to load subscription
            </Text>
          </View>
          <Text style={[styles.cardDesc, {marginTop: 8}]}>
            {subscriptionError}
          </Text>
          <Button
            title="Try Again"
            onPress={() => loadSubscription()}
            style={{marginTop: 16}}
          />
        </View>
      );
    }

    if (subscriptionNotFound || !subscription) {
      return (
        <View style={styles.subscriptionCard}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <AlertCircle size={20} color={colors.accent} />
            <Text style={[styles.cardTitle, {marginLeft: 8}]}>
              No active subscription
            </Text>
          </View>
          <Text style={[styles.cardDesc, {marginTop: 8}]}>
            Pick a membership below to unlock recurring ZishCoin credits.
          </Text>
        </View>
      );
    }

    const statusInfo = subscriptionStatusInfo;
    const statusMeta = getSubscriptionStatusUi(statusInfo);
    const StatusIcon = statusMeta.Icon;
    const isActiveStatus = statusInfo.state === 'active';
    const isCancelledStatus = statusInfo.state === 'cancelled';
    const isCancellationScheduled = statusInfo.state === 'scheduled_cancel';
    const subscriptionStatus = statusMeta.label;
    const planCoins = activePlan?.coins;
    const planName =
      activePlan?.name || subscription?.plan_id || 'Membership Plan';
    const planInterval = activePlan?.interval || activePlan?.frequency;
    const nextBilling = subscription?.current_end || subscription?.charge_at;
    const currentStart = subscription?.current_start || subscription?.start_at;
    const accessUntil =
      subscription?.razorpaySubscriptionEndsAt ||
      subscription?.endsAt ||
      subscription?.current_end ||
      subscription?.ended_at ||
      subscription?.cancel_at;
    const cancellationRequestedAt =
      subscription?.razorpaySubscriptionCancelledAt ||
      subscription?.cancelledAt ||
      subscription?.cancel_at;
    const planAmountDisplay = (() => {
      if (!activePlan) return null;
      return formatPlanPrice(activePlan);
    })();

    return (
      <View style={styles.subscriptionCard}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusPill,
              {backgroundColor: statusMeta.backgroundColor},
            ]}>
            <StatusIcon size={14} color={statusMeta.color} />
            <Text style={[styles.statusText, {color: statusMeta.color}]}>
              {subscriptionStatus}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => loadSubscription({refreshing: true})}
            disabled={subscriptionRefreshing}>
            <RefreshCw
              size={18}
              color={colors.textSecondary}
              style={{opacity: subscriptionRefreshing ? 0.4 : 1}}
            />
          </TouchableOpacity>
        </View>

        <Text style={[styles.cardTitle, {marginTop: 12}]}>
          {statusMeta.title}
        </Text>
        <View style={styles.subscriptionDivider} />

        <InfoRow label="Subscription ID" value={subscription?.id || '—'} />
        <InfoRow label="Plan" value={planName} />
        {planCoins != null ? (
          <InfoRow
            label="Coins per cycle"
            value={`${Number(planCoins).toLocaleString('en-IN')} ZC`}
          />
        ) : null}
        {planAmountDisplay ? (
          <InfoRow label="Plan price" value={planAmountDisplay} />
        ) : null}
        {planInterval ? (
          <InfoRow
            label="Billing cycle"
            value={formatStatusLabel(planInterval)}
          />
        ) : null}
        <InfoRow
          label="Started"
          value={formatDate(currentStart)}
          icon={<CalendarClock size={16} color={colors.textSecondary} />}
        />
        <InfoRow
          label={
            isCancelledStatus || isCancellationScheduled
              ? 'Access until'
              : 'Next renewal'
          }
          value={formatDate(
            isCancelledStatus || isCancellationScheduled
              ? accessUntil
              : nextBilling,
          )}
          icon={<CalendarClock size={16} color={colors.textSecondary} />}
        />

        {subscription?.remaining_count != null ? (
          <InfoRow
            label="Cycles remaining"
            value={String(subscription.remaining_count)}
          />
        ) : null}

        {(isCancelledStatus || isCancellationScheduled) &&
        cancellationRequestedAt ? (
          <InfoRow
            label="Cancellation requested"
            value={formatDate(cancellationRequestedAt)}
          />
        ) : null}

        {subscription?.short_url ? (
          <InfoRow
            label="Manage on Razorpay"
            value={subscription.short_url}
            isLink
            onPress={() => {
              if (subscription?.short_url) {
                Linking.openURL(subscription.short_url).catch(() => {});
              }
            }}
          />
        ) : null}

        {isActiveStatus ? (
          canCancel ? (
            <Button
              title="Cancel Auto-Renew"
              variant="outline"
              onPress={() => setConfirmCancelOpen(true)}
              style={{marginTop: 20}}
            />
          ) : (
            <Text
              style={[
                styles.cardDesc,
                {marginTop: 16, color: colors.textSecondary},
              ]}>
              This subscription is already scheduled to end after the current
              cycle.
            </Text>
          )
        ) : isCancelledStatus ? (
          <Button
            title="Resubscribe"
            onPress={() =>
              navigation.navigate?.('BuyCoins', {mode: 'membership'})
            }
            style={{marginTop: 20}}
          />
        ) : isCancellationScheduled ? (
          <Text
            style={[
              styles.cardDesc,
              {marginTop: 16, color: colors.textSecondary},
            ]}>
            Auto-renew will stop after the current billing cycle. Manage on
            Razorpay if you change your mind.
          </Text>
        ) : (
          <Text
            style={[
              styles.cardDesc,
              {marginTop: 16, color: colors.textSecondary},
            ]}>
            Auto-renew has been updated. Manage your membership from Razorpay if
            needed.
          </Text>
        )}

        {isCancelledStatus || isCancellationScheduled ? (
          <View style={{marginTop: 12}}>
            <Text style={[styles.cardDesc, {color: colors.textSecondary}]}>
              {accessUntil
                ? `Auto-renew is off. Benefits remain until ${formatDate(
                    accessUntil,
                  )}.`
                : 'Auto-renew is off. You can re-subscribe anytime.'}
            </Text>
            {isCancellationScheduled && cancellationRequestedAt ? (
              <Text
                style={[
                  styles.cardDesc,
                  {color: colors.textSecondary, marginTop: 4},
                ]}>
                Cancellation requested on {formatDate(cancellationRequestedAt)}.
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  };
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}>
          <ChevronLeft size={20} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Membership Tiers</Text>
        <View style={{width: 32}} />
      </View>

      <ScrollView
        contentContainerStyle={{paddingBottom: 32}}
        refreshControl={
          <RefreshControl
            tintColor={colors.white}
            refreshing={pullRefreshing}
            onRefresh={onRefresh}
          />
        }
        showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#1F1A3A', '#141821']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.hero}>
          <View style={styles.heroBadge}>
            <Sparkles size={16} color={colors.white} />
            <Text style={styles.heroBadgeTxt}>Level up your experience</Text>
          </View>
          <Text style={styles.heroTitle}>
            Unlock premium support, exclusive drops & faster help.
          </Text>
          <Text style={styles.heroSubtitle}>
            Pick a plan that matches your pace—every tier includes ZishCoin
            credits to kickstart your next gameplay.
          </Text>
        </LinearGradient>

        {(() => {
          const card = renderSubscriptionCard();
          if (!card) return null;
          return (
            <View style={{paddingHorizontal: 16, paddingTop: 16}}>{card}</View>
          );
        })()}

        {plansLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.loaderTxt}>Loading memberships…</Text>
          </View>
        ) : plansError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTxt}>{plansError}</Text>
            <Button
              title="Retry"
              onPress={fetchPlans}
              style={{marginTop: 12}}
            />
          </View>
        ) : (
          <View style={{paddingHorizontal: 16, paddingTop: 16}}>
            {sortedPlans.map(plan => {
              const activeForPlan = isPlanActive(plan, activePlanKeys);
              const processing =
                processingPlanId === plan._id || (activeForPlan && cancelling);
              const handlePlanSubscribe = hasActiveSubscription
                ? showAlreadySubscribedModal
                : () => startSubscribe(plan);
              return (
                <PlanCard
                  key={plan._id}
                  plan={plan}
                  recommended={Boolean(plan?.highlight)}
                  processing={processing}
                  onSubscribe={handlePlanSubscribe}
                  isActive={activeForPlan}
                  canCancel={canCancel}
                  onCancel={() => setConfirmCancelOpen(true)}
                />
              );
            })}
            {sortedPlans.length === 0 && (
              <Text style={styles.emptyTxt}>
                Membership plans will appear here soon.
              </Text>
            )}
          </View>
        )}

        <Text style={styles.note}>
          Memberships auto-renew. Benefits and pricing may change based on
          region & availability.
        </Text>
      </ScrollView>

      <CongratsModal
        visible={congratsOpen}
        title="Membership Activated"
        message={successMessage}
        primaryText="Awesome!"
        onPrimary={() => {
          setCongratsOpen(false);
          setSelectedPlan(null);
          navigation.goBack();
        }}
        onRequestClose={() => {
          setCongratsOpen(false);
          setSelectedPlan(null);
        }}
      />
      <ProcessingPaymentModal visible={payProcessing} />
      <AppModal
        visible={!!payError}
        title="Payment Failed"
        message={payError || 'Something went wrong while starting payment.'}
        cancelText="Close"
        confirmText="Retry"
        onCancel={() => setPayError(null)}
        onConfirm={() => {
          setPayError(null);
          if (lastPlan) startSubscribe(lastPlan);
        }}
      />
      <AppModal
        visible={alreadySubscribedModal.visible}
        title={alreadySubscribedModal.title || 'Subscription Active'}
        message={alreadySubscribedModal.message || 'You already have an active membership.'}
        cancelText="Close"
        confirmText={alreadySubscribedModal.canManage ? 'Cancel Auto-Renew' : 'Got it'}
        onCancel={() =>
          setAlreadySubscribedModal({
            visible: false,
            title: '',
            message: '',
            canManage: false,
          })
        }
        onConfirm={() => {
          const canManage = alreadySubscribedModal.canManage;
          setAlreadySubscribedModal({
            visible: false,
            title: '',
            message: '',
            canManage: false,
          });
          if (canManage) {
            setConfirmCancelOpen(true);
          }
        }}
      />
      <AppModal
        visible={confirmCancelOpen}
        title="Cancel auto-renew?"
        message="We will stop future charges after this billing cycle. You will keep your benefits until the current period ends."
        confirmText="Confirm Cancel"
        confirmLoading={cancelling}
        confirmLoadingText="Cancelling…"
        onCancel={() => setConfirmCancelOpen(false)}
        onConfirm={handleCancel}
      />
      <AppModal
        visible={feedbackModal.visible}
        title={feedbackModal.title || 'Subscription update'}
        message={feedbackModal.message || ''}
        confirmText="Got it"
        cancelText="Close"
        onConfirm={() =>
          setFeedbackModal({visible: false, title: '', message: ''})
        }
        onCancel={() =>
          setFeedbackModal({visible: false, title: '', message: ''})
        }
      />
    </SafeAreaView>
  );
}

function PlanCard({
  plan,
  recommended,
  processing,
  onSubscribe,
  isActive,
  canCancel,
  onCancel,
}) {
  const title = formatPlanTitle(plan);
  const price = formatPlanPrice(plan);
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
      {isActive ? (
        <View
          style={[
            styles.currentBadge,
            recommended && styles.currentBadgeShifted,
          ]}>
          <CheckCircle2 size={14} color={colors.white} />
          <Text style={styles.currentBadgeTxt}>Current Plan</Text>
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

      <View style={styles.ctaRow}>
        {isActive ? (
          canCancel ? (
            <Button
              title={processing ? 'Processing…' : 'Cancel Auto-Renew'}
              variant="outline"
              onPress={onCancel}
              disabled={processing}
              style={styles.ctaButton}
            />
          ) : (
            <Text style={styles.cannotCancelTxt}>
              Renewal already cancelled for this cycle.
            </Text>
          )
        ) : (
          <Button
            title={processing ? 'Processing…' : 'Subscribe Now'}
            onPress={onSubscribe}
            disabled={processing}
            style={styles.ctaButton}
          />
        )}
      </View>
    </View>
  );

  if (recommended) {
    return (
      <LinearGradient colors={GRADIENT_BORDER} style={styles.planGradientWrap}>
        {CardContent}
      </LinearGradient>
    );
  }

  return <View style={styles.planWrap}>{CardContent}</View>;
}

function InfoRow({label, value, icon, isLink, onPress}) {
  const content = (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        {icon ? <View style={{marginRight: 8}}>{icon}</View> : null}
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text
        style={[styles.infoValue, isLink && {color: colors.accent}]}
        numberOfLines={2}>
        {value || '—'}
      </Text>
    </View>
  );

  if (isLink && typeof onPress === 'function') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.black},
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#22252C',
  },
  headerTitle: {color: colors.white, fontWeight: '800', fontSize: 18},
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2B2F39',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#343B49',
  },

  hero: {
    margin: 16,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#33364A',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroBadgeTxt: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
    marginLeft: 6,
  },
  heroTitle: {
    color: colors.white,
    fontWeight: '900',
    fontSize: 22,
    marginTop: 14,
    lineHeight: 30,
  },
  heroSubtitle: {
    color: 'rgba(234,239,255,0.82)',
    marginTop: 10,
    lineHeight: 20,
  },

  loaderWrap: {alignItems: 'center', paddingVertical: 32},
  loaderTxt: {marginTop: 10, color: colors.textSecondary, fontWeight: '600'},
  errorBox: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#2B2F39',
    borderWidth: 1,
    borderColor: '#FF7A7A33',
  },
  errorTxt: {color: '#FF9C9C', fontWeight: '600'},
  emptyTxt: {color: colors.textSecondary, textAlign: 'center', marginTop: 12},

  subscriptionCard: {
    backgroundColor: '#2B2F39',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#343B49',
    padding: 18,
    marginBottom: 16,
  },
  subscriptionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#343B49',
    marginVertical: 14,
  },
  cardTitle: {color: colors.white, fontWeight: '800', fontSize: 18},
  cardDesc: {color: colors.textSecondary, marginTop: 6, lineHeight: 20},
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(94, 231, 135, 0.12)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  statusText: {color: '#5EE787', fontWeight: '700', fontSize: 12},
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  infoLeft: {flexDirection: 'row', alignItems: 'center'},
  infoLabel: {color: colors.textSecondary, fontWeight: '600'},
  infoValue: {
    color: colors.white,
    fontWeight: '700',
    marginLeft: 12,
    flex: 1,
    textAlign: 'right',
  },

  planGradientWrap: {marginBottom: 16, borderRadius: 22, padding: 1},
  planWrap: {
    marginBottom: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2E3340',
    backgroundColor: '#1A1D26',
  },
  planCard: {
    backgroundColor: CARD_BG,
    borderRadius: 21,
    padding: 20,
    overflow: 'hidden',
  },
  recommendBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#7C5DFF',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendTxt: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.4,
    marginLeft: 6,
  },
  currentBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124,93,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
    marginTop: 12,
  },
  currentBadgeShifted: {marginTop: 32},
  currentBadgeTxt: {color: colors.white, fontWeight: '700', fontSize: 12},
  planTitle: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 12,
  },
  planPrice: {
    color: colors.white,
    fontWeight: '900',
    fontSize: 28,
    textAlign: 'center',
    marginTop: 8,
  },
  planCredits: {color: colors.textSecondary, textAlign: 'center', marginTop: 4},
  perksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
    marginHorizontal: -4,
  },
  perkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#313648',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 4,
    marginBottom: 8,
    flexGrow: 1,
    flexBasis: '48%',
  },
  perkTxt: {
    color: colors.white,
    fontWeight: '600',
    flexShrink: 1,
    marginLeft: 8,
  },
  ctaRow: {marginTop: 20},
  ctaButton: {},
  cannotCancelTxt: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },

  note: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 24,
    fontSize: 12,
  },
});
