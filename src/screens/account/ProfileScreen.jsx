import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from "../../store/auth/authSlice";
import { colors } from "../../theme/colors";
import AppModal from "../../components/common/AppModal";
import { Bell, ChevronRight, Gift, Settings, ClipboardList } from 'lucide-react-native';
import users from '../../services/users';
import { setUser } from '../../store/auth/authSlice';
import paymentsService from '../../services/payments';
import plansService from '../../services/plans';
import { isIndiaCountry } from '../../utils/payments';
import { buildPlanLookup, findPlanForSubscription } from '../../utils/plans';
import { categorizeSubscriptionStatus } from '../../utils/subscriptionStatus';

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const [meLoading, setMeLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionError, setSubscriptionError] = useState('');
  const [plans, setPlans] = useState([]);
  const [plansFetched, setPlansFetched] = useState(false);

  const userCountry = user?.address?.country || user?.country || null;
  const isIndia = useMemo(() => isIndiaCountry(userCountry), [userCountry]);
  const planLookup = useMemo(() => buildPlanLookup(plans), [plans]);
  const subscriptionStatusInfo = useMemo(() => {
    if (!subscription) return null;
    return categorizeSubscriptionStatus(subscription?.status, subscription);
  }, [subscription]);

  const onLogout = () => setConfirmOpen(true);
  const confirmLogout = () => { setConfirmOpen(false); dispatch(logout()); };

  const fetchMe = useCallback(async () => {
    try {
      setMeLoading(true);
      const me = await users.getMe();
      const doc = me?.data || me;
      if (doc) dispatch(setUser(doc));
    } catch (_) {
      // silently ignore for now
    } finally {
      setMeLoading(false);
    }
  }, [dispatch]);

  const fetchSubscription = useCallback(async () => {
    if (!isIndia) {
      setSubscription(null);
      setSubscriptionError('');
      setPlans(prev => (Array.isArray(prev) && prev.length ? [] : prev));
      setPlansFetched(prev => (prev ? false : prev));
      return;
    }
    try {
      setSubscriptionLoading(true);
      setSubscriptionError('');
      const data = await paymentsService.getRazorpayActiveSubscription();
      const next = data?.subscription
        ? {
            ...data.subscription,
            cancelledAt: data?.cancelledAt,
            endsAt: data?.endsAt,
          }
        : null;
      setSubscription(next);
    } catch (err) {
      if (err?.status === 404) {
        setSubscription(null);
        setSubscriptionError('');
      } else {
        setSubscription(null);
        setSubscriptionError(
          err?.message || 'Unable to load membership info.',
        );
      }
    } finally {
      setSubscriptionLoading(false);
    }
  }, [isIndia]);

  const fetchPlans = useCallback(async () => {
    if (!isIndia) {
      setPlans(prev => (Array.isArray(prev) && prev.length ? [] : prev));
      setPlansFetched(true);
      return;
    }
    try {
      const res = await plansService.listPlans({});
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setPlans(list);
    } catch (_err) {
      setPlans([]);
    } finally {
      setPlansFetched(true);
    }
  }, [isIndia]);

  // Fetch once if user not present. Otherwise, rely on pull-to-refresh.
  useEffect(() => {
    if (!user) {
      fetchMe();
    }
  }, [user, fetchMe]);

  // Refresh every time the screen gains focus (e.g., switching to Profile tab)
  useFocusEffect(
    React.useCallback(() => {
      fetchMe();
      fetchSubscription();
      if (isIndia && !plansFetched) {
        fetchPlans();
      }
      return undefined;
    }, [fetchMe, fetchSubscription, fetchPlans, isIndia, plansFetched])
  );

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    if (!subscription || subscription?.plan?.name) return;
    if (!planLookup || planLookup.size === 0) return;
    const resolved = findPlanForSubscription(subscription, planLookup);
    if (!resolved) return;
    setSubscription(prev => {
      if (!prev) return prev;
      if (prev.plan && prev.plan.name) return prev;
      const mergedPlan = prev.plan ? { ...prev.plan, ...resolved } : resolved;
      return { ...prev, plan: mergedPlan };
    });
  }, [subscription, planLookup]);

  useEffect(() => {
    if (!isIndia) return;
    if (!subscription) return;
    if (subscription?.plan?.name) return;
    if (plansFetched) return;
    fetchPlans();
  }, [isIndia, subscription, plansFetched, fetchPlans]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const tasks = [fetchMe(), fetchSubscription()];
      if (isIndia) tasks.push(fetchPlans());
      await Promise.all(tasks);
    } finally {
      setRefreshing(false);
    }
  }, [fetchMe, fetchSubscription, fetchPlans, isIndia]);

  const avatarSource = useMemo(() => {
    const remote = user?.avatar || user?.avatarUrl || user?.image;
    if (!avatarError && remote && typeof remote === 'string') {
      return { uri: remote };
    }
    try {
      // Fallback to zishes logo asset
      return require('../../assets/zishes_logo.png');
    } catch (_) {
      return { uri: 'https://i.pravatar.cc/150?img=3' };
    }
  }, [user, avatarError]);

  const planName = useMemo(
    () => subscription?.plan?.name || subscription?.plan_id || '',
    [subscription],
  );
  const membershipValueStyle = [styles.membershipValue];
  let membershipValueText = 'No active membership';
  if (!isIndia) {
    membershipValueText = 'Membership available only in India';
    membershipValueStyle.push(styles.membershipMuted);
  } else if (subscriptionLoading) {
    membershipValueText = 'Checking membership…';
    membershipValueStyle.push(styles.membershipMuted);
  } else if (subscriptionError) {
    membershipValueText = subscriptionError;
    membershipValueStyle.push(styles.membershipErrorText);
  } else if (planName) {
    membershipValueText = planName;
  } else {
    membershipValueStyle.push(styles.membershipMuted);
  }

  const membershipStatusText =
    isIndia &&
    !subscriptionLoading &&
    !subscriptionError &&
    subscriptionStatusInfo &&
    subscriptionStatusInfo.label &&
    subscriptionStatusInfo.label !== 'Unknown'
      ? subscriptionStatusInfo.label
      : null;

  const membershipBadge = useMemo(() => {
    if (!planName) return null;
    const normal = planName.toLowerCase();
    if (normal.includes('gold')) {
      return {
        label: 'Gold',
        color: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.12)',
        borderColor: 'rgba(255, 215, 0, 0.45)',
      };
    }
    if (normal.includes('premium')) {
      return {
        label: 'Premium',
        color: '#9C6CFF',
        backgroundColor: 'rgba(156, 108, 255, 0.16)',
        borderColor: 'rgba(156, 108, 255, 0.45)',
      };
    }
    if (normal.includes('silver')) {
      return {
        label: 'Silver',
        color: '#C0C0C0',
        backgroundColor: 'rgba(192, 192, 192, 0.16)',
        borderColor: 'rgba(192, 192, 192, 0.45)',
      };
    }
    return null;
  }, [planName]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home', { screen: 'Notifications' })}>
          <Bell size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />}
      >
        {/* Card */}
        {meLoading ? (
          <View style={styles.card}>
            <View style={[styles.avatar, styles.skelCircle]} />
            <View style={[styles.skelLineLg, { marginTop: 6 }]} />
            <View style={[styles.skelLineSm, { marginTop: 8 }]} />
            <View style={[styles.skelLineSm, { marginTop: 10, width: 180 }]} />
            <View style={[styles.skelLineXs, { marginTop: 6, width: 120 }]} />
            <View style={[styles.skelBtn, { marginTop: 12 }]} />
          </View>
        ) : (
          <View style={styles.card}>
            <Image source={avatarSource} onError={() => setAvatarError(true)} style={styles.avatar} />
            <Text style={styles.name}>{user?.username || '—'}</Text>
            <Text style={styles.handle}>{user?.email || ''}</Text>
            <View style={styles.membershipSection}>
              {/* <Text style={styles.membershipLabel}>Membership</Text>
              <Text style={membershipValueStyle} numberOfLines={1} ellipsizeMode="tail">
                {membershipValueText}
              </Text> */}
              {membershipBadge ? (
                <View
                  style={[
                    styles.membershipBadge,
                    {
                      backgroundColor: membershipBadge.backgroundColor,
                      borderColor: membershipBadge.borderColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.membershipBadgeText,
                      { color: membershipBadge.color },
                    ]}
                  >
                    {membershipBadge.label}
                  </Text>
                </View>
              ) : null}
              {/* {membershipStatusText ? (
                <Text style={styles.membershipStatus}>{membershipStatusText}</Text>
              ) : null} */}
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
              <Text style={styles.editText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Menu List */}
        <View style={styles.list}>
          <MenuRow icon={<ClipboardList size={18} color={colors.accent} />} title="My Listings" onPress={() => navigation.navigate('MyListings')} />
          <MenuRow icon={<ClipboardList size={18} color={colors.accent} />} title="Drafts" onPress={() => navigation.navigate('Drafts')} />
          <MenuRow icon={<Gift size={18} color={colors.accent} />} title="Tournaments Played" onPress={() => navigation.navigate('TournamentsWon')} />
          <MenuRow
            icon={<ClipboardList size={18} color={colors.accent} />}
            title="Receipts"
            onPress={() => navigation.navigate('Receipts')}
          />
          <MenuRow icon={<Bell size={18} color={colors.accent} />} title="Notifications" onPress={() => navigation.navigate('Home', { screen: 'Notifications' })} />
          <MenuRow icon={<Settings size={18} color={colors.accent} />} title="Settings" onPress={() => navigation.navigate('Settings')} />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logout} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>

      <AppModal
        visible={confirmOpen}
        title="Confirm Logout"
        message="Are you sure you want to logout? You'll need to sign in again to continue."
        confirmText="Logout"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmLogout}
      />
      
    </SafeAreaView>
  );
}

function MenuRow({ icon, title, badge, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>{icon}</View>
        <Text style={styles.rowText} numberOfLines={2} ellipsizeMode="tail">{title}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {badge ? (
          <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>
        ) : null}
        <ChevronRight size={18} color={colors.white} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: 14 },
  header: {
    height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C', marginBottom: 12,
  },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  card: {
    backgroundColor: '#2B2F39', borderRadius: 16, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#343B49', marginTop: 10, marginBottom: 16,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  name: { color: colors.white, fontWeight: '700', fontSize: 20 },
  handle: { color: colors.textSecondary, marginBottom: 12 },
  editBtn: { borderWidth: 1, borderColor: colors.accent, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  editText: { color: colors.accent, fontWeight: '700' },
  list: { gap: 12 },
  skelCircle: { backgroundColor: 'rgba(255,255,255,0.15)' },
  skelLineLg: { width: 140, height: 18, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)' },
  skelLineSm: { width: 200, height: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)' },
  skelLineXs: { width: 120, height: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)' },
  skelBtn: { width: 120, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)' },
  membershipSection: { alignItems: 'center', marginTop: 10 },
  membershipLabel: { color: colors.textSecondary, fontSize: 12 },
  membershipValue: { color: colors.white, fontWeight: '700', marginTop: 4 },
  membershipMuted: { color: colors.textSecondary },
  membershipErrorText: { color: '#FF7A7A' },
  membershipStatus: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  membershipBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    
  },
  membershipBadgeText: {
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  row: {
    backgroundColor: '#2B2F39', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: '#343B49', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, columnGap: 12, paddingRight: 12 },
  rowIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#312B42', alignItems: 'center', justifyContent: 'center' },
  rowText: { color: colors.white, fontWeight: '600', flex: 1, flexShrink: 1 },
  badge: { backgroundColor: '#2E7D32', paddingHorizontal: 8, borderRadius: 12, marginRight: 8 },
  badgeText: { color: colors.white, fontWeight: '700' },
  logout: { borderWidth: 1, borderColor: '#C65B5B', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  logoutText: { color: '#FF7A7A', fontWeight: '700' },
});
