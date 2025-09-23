import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, KeyRound, CreditCard, Wallet2, FileText, Shield, Scale, Flag, MessageSquare, Users, LogOut } from 'lucide-react-native';
import { POLICY_MAP } from '../../content/policies';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/auth/authSlice';
import AppModal from '../../components/common/AppModal';
import appConfigService from '../../services/appConfig';

export default function SettingsScreen({ navigation }) {
  const dispatch = useDispatch();
  const country = useSelector((s) => s.auth.user?.address?.country);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [legalPolicies, setLegalPolicies] = useState(null);
  const goPayments = () => navigation.navigate('PaymentMethodsManage');
  const goDefaultWithdrawal = () => navigation.navigate('DefaultWithdrawal');
  const isIndia = useMemo(() => String(country || '').trim().toLowerCase() === 'india', [country]);

  const openPolicy = (key) => {
    const { title, html } = POLICY_MAP[key] || {};
    navigation.navigate('PolicyViewer', { title: title || 'Policy', html: html || '' });
  };

  const openPolicyUrl = (item) => {
    if (!item) return;
    const { title, url } = item;
    navigation.navigate('PolicyViewer', { title: title || 'Policy', url });
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingConfig(true);
        const data = await appConfigService.getAppConfig();
        const list = Array.isArray(data?.legalPolicies) ? data.legalPolicies : [];
        if (alive) setLegalPolicies(list);
      } catch (e) {
        // Keep fallback static policies section if API fails
        if (__DEV__) console.warn('[CONFIG] Failed to load app-config:', e?.message || e);
      } finally {
        if (alive) setLoadingConfig(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Section title="Account Settings">
          <Row icon={<KeyRound size={18} color={colors.accent} />} title="Change Password" onPress={() => navigation.navigate('ChangePassword')} />
          <Row icon={<CreditCard size={18} color={colors.accent} />} title="Manage Saved Payment Methods" onPress={goPayments} border />
          <Row icon={<Wallet2 size={18} color={colors.accent} />} title="Set Default Withdrawal Method" onPress={goDefaultWithdrawal} />
        </Section>

        <Section title="Legal & Policies">
          {legalPolicies == null && loadingConfig && (
            <View style={{ padding: 14, alignItems: 'center' }}>
              <ActivityIndicator color={colors.white} />
              <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Loading policies…</Text>
            </View>
          )}
          {Array.isArray(legalPolicies) && legalPolicies.length > 0 ? (
            legalPolicies.map((p, idx) => (
              <Row
                key={`${p.title}-${idx}`}
                icon={<FileText size={18} color={colors.accent} />}
                title={p.title}
                onPress={() => openPolicyUrl(p)}
                border={idx !== legalPolicies.length - 1}
              />
            ))
          ) : (
            <>
              <Row icon={<FileText size={18} color={colors.accent} />} title="Terms & Conditions" onPress={() => openPolicy('terms')} border />
              <Row icon={<Shield size={18} color={colors.accent} />} title="Privacy Policy" onPress={() => openPolicy('privacy')} border />
              <Row icon={<Scale size={18} color={colors.accent} />} title="Prize Competition Guidelines" onPress={() => openPolicy('guidelines')} border />
              <Row icon={<Scale size={18} color={colors.accent} />} title="Fair Play Policy" onPress={() => openPolicy('fairplay')} border />
              <Row icon={<Scale size={18} color={colors.accent} />} title="Tax and Compliance Guide" onPress={() => openPolicy('tax')} border />
              <Row icon={<Scale size={18} color={colors.accent} />} title="International Shipping & Customs Policy" onPress={() => openPolicy('shipping')} border />
              <Row icon={<Scale size={18} color={colors.accent} />} title="Prohibited & Restricted Items Policy" onPress={() => openPolicy('prohibited')} border />
              <Row icon={<Scale size={18} color={colors.accent} />} title="Refunds and Cancellation Policy" onPress={() => openPolicy('refunds')} border />
              <Row icon={<Scale size={18} color={colors.accent} />} title="Seller Agreement" onPress={() => openPolicy('seller')} />
            </>
          )}
        </Section>

        <Section title="Support & Community">
          <Row icon={<Flag size={18} color={colors.accent} />} title="FAQs" onPress={() => Linking.openURL('https://example.com/faq')} border />
          <Row icon={<MessageSquare size={18} color={colors.accent} />} title="Report an Issue" onPress={() => navigation.navigate('ReportIssue')} border />
          <Row icon={<Users size={18} color={colors.accent} />} title="Community/Feedback" onPress={() => navigation.navigate('CommunityFeedback')} />
        </Section>

        <Section title="Account Management">
          {isIndia ? (
            <Row icon={<Wallet2 size={18} color="#FF7A7A" />} title="Manage  Membership" danger onPress={() => navigation.navigate('MembershipTier')} border />
          ) : null}
          <Row icon={<Users size={18} color="#FF7A7A" />} title="Delete/Deactivate Account" danger onPress={() => navigation.navigate('ManageAccount')} border />
          <Row icon={<LogOut size={18} color="#FF7A7A" />} title="Log Out" danger onPress={() => setLogoutOpen(true)} />
        </Section>
      </ScrollView>

      <AppModal
        visible={logoutOpen}
        title="Confirm Logout"
        message="Are you sure you want to logout? You'll need to sign in again to continue."
        confirmText="Logout"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => { setLogoutOpen(false); dispatch(logout()); }}
      />
    </SafeAreaView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}> 
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({ icon, title, onPress, border, danger }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.row, border && styles.rowBorder]}> 
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>{icon}</View>
        <Text style={[styles.rowTitle, danger && { color: '#FF7A7A' }]}>{title}</Text>
      </View>
      <ChevronLeft size={18} color={colors.white} style={{ transform: [{ rotate: '180deg' }] }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },

  section: { marginBottom: 18, paddingHorizontal: 4 },
  sectionTitle: { color: colors.white, fontWeight: '800', fontSize: 18, marginBottom: 10 },
  card: { backgroundColor: '#2B2F39', borderRadius: 16, borderWidth: 1, borderColor: '#343B49' },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 14 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#343B49' },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#312B42', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  rowTitle: { color: colors.white, fontWeight: '700' },
});
