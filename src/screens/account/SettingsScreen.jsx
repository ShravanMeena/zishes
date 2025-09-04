import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, KeyRound, CreditCard, Wallet2, FileText, Shield, Scale, Flag, MessageSquare, Users, LogOut } from 'lucide-react-native';
import { POLICY_MAP } from '../../content/policies';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/auth/authSlice';
import AppModal from '../../components/common/AppModal';

export default function SettingsScreen({ navigation }) {
  const dispatch = useDispatch();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const goPayments = () => navigation.navigate('PaymentMethodsManage');
  const goDefaultWithdrawal = () => navigation.navigate('DefaultWithdrawal');

  const openPolicy = (key) => {
    const { title, html } = POLICY_MAP[key] || {};
    navigation.navigate('PolicyViewer', { title: title || 'Policy', html: html || '' });
  };

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
          <Row icon={<FileText size={18} color={colors.accent} />} title="Terms & Conditions" onPress={() => openPolicy('terms')} border />
          <Row icon={<Shield size={18} color={colors.accent} />} title="Privacy Policy" onPress={() => openPolicy('privacy')} border />
          <Row icon={<Scale size={18} color={colors.accent} />} title="Prize Competition Guidelines" onPress={() => openPolicy('guidelines')} border />
          <Row icon={<Scale size={18} color={colors.accent} />} title="Fair Play Policy" onPress={() => openPolicy('fairplay')} border />
          <Row icon={<Scale size={18} color={colors.accent} />} title="Tax and Compliance Guide" onPress={() => openPolicy('tax')} border />
          <Row icon={<Scale size={18} color={colors.accent} />} title="International Shipping & Customs Policy" onPress={() => openPolicy('shipping')} border />
          <Row icon={<Scale size={18} color={colors.accent} />} title="Prohibited & Restricted Items Policy" onPress={() => openPolicy('prohibited')} border />
          <Row icon={<Scale size={18} color={colors.accent} />} title="Refunds and Cancellation Policy" onPress={() => openPolicy('refunds')} border />
          <Row icon={<Scale size={18} color={colors.accent} />} title="Seller Agreement" onPress={() => openPolicy('seller')} />
        </Section>

        <Section title="Support & Community">
          <Row icon={<Flag size={18} color={colors.accent} />} title="FAQs" onPress={() => Linking.openURL('https://example.com/faq')} border />
          <Row icon={<MessageSquare size={18} color={colors.accent} />} title="Report an Issue" onPress={() => navigation.navigate('ReportIssue')} border />
          <Row icon={<Users size={18} color={colors.accent} />} title="Community/Feedback" onPress={() => navigation.navigate('CommunityFeedback')} />
        </Section>

        <Section title="Account Management">
          <Row icon={<Wallet2 size={18} color="#FF7A7A" />} title="Manage  Membership" danger onPress={() => navigation.navigate('MembershipTier')} border />
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
