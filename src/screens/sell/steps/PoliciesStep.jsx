import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { colors } from '../../../theme/colors';
import { CheckCircle2, Clock } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { updatePolicies, saveDraftFromStore } from '../../../store/listingDraft/listingDraftSlice';
import BottomSheet from '../../../components/common/BottomSheet';

const POLICY_DOCS = {
  listing: {
    title: 'Accept Listing Standards',
    url: 'https://zishes.com/policies/listing-standards',
  },
  dispute: {
    title: 'Dispute Resolution Policy',
    url: 'https://zishes.com/policies/dispute-resolution',
  },
  antifraud: {
    title: 'Anti-Fraud Policy',
    url: 'https://zishes.com/policies/anti-fraud',
  },
};

export default function PoliciesStep() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { policies, agreeAll } = useSelector((s) => ({ policies: s.listingDraft.policies, agreeAll: s.listingDraft.policies.agreeAll }));
  const user = useSelector((s) => s.auth.user);
  const needsVerification = useSelector((s) => s.auth.needsVerification);
  const toggle = (key) => dispatch(updatePolicies({ [key]: !policies[key] }));
  const [policySheet, setPolicySheet] = useState(null);
  const WebViewComp = useMemo(() => {
    try {
      const { WebView } = require('react-native-webview');
      return WebView;
    } catch (_) {
      return null;
    }
  }, []);
  const openPolicy = useCallback((key) => {
    const doc = POLICY_DOCS[key];
    if (!doc) return;
    setPolicySheet(doc);
  }, []);
  const closePolicy = useCallback(() => setPolicySheet(null), []);
  const ReadMore = ({ policyKey }) => (
    <TouchableOpacity onPress={() => openPolicy(policyKey)}>
      <Text style={styles.readMore}>Read More</Text>
    </TouchableOpacity>
  );

  const isVerified = useMemo(() => {
    const status = (user?.kycStatus || user?.verificationStatus || user?.kyc?.status || '').toLowerCase();
    const statusApproved = status === 'approved' || status === 'completed' || status === 'verified';
    return statusApproved || !!user?.kycCompletedAt || !!user?.kycCompleted || user?.verified === true;
  }, [user]);

  const requiresKyc = !isVerified || needsVerification;

  const handleKycPress = useCallback(async () => {
    try {
      await dispatch(saveDraftFromStore()).unwrap();
    } catch (_) {
      // ignore draft save failure, still attempt navigation
    }
    navigation.navigate('Home', { screen: 'HyperKyc' });
  }, [dispatch, navigation]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
      {/* Marketplace Policies */}
      <View style={[styles.card, { backgroundColor: '#252545' }]}> 
        <Text style={styles.cardTitle}>Marketplace Policies</Text>

      <PolicyItem
        title="Accept Listing Standards"
        checked={policies.listing}
        onToggle={() => toggle('listing')}
      >
          <ReadMore policyKey="listing" />
        </PolicyItem>

        <PolicyItem
          title="Agree to Dispute Resolution Policy"
          checked={policies.dispute}
          onToggle={() => toggle('dispute')}
        >
          <ReadMore policyKey="dispute" />
        </PolicyItem>

        <PolicyItem
          title="Confirm Anti-Fraud Policy"
          checked={policies.antifraud}
          onToggle={() => toggle('antifraud')}
        >
          <ReadMore policyKey="antifraud" />
        </PolicyItem>
      </View>

      {/* KYC Block */}
      <View style={styles.card}> 
        <Text style={styles.cardTitle}>Complete your KYC</Text>
        <Text style={styles.cardDesc}>
          For a secure marketplace, please upload a valid government ID (Passport, Driver's License, or National ID).
        </Text>
        <View style={styles.kycPanel}>
          {requiresKyc ? (
            <Clock size={28} color={colors.white} />
          ) : (
            <CheckCircle2 size={28} color={colors.successGreen} />
          )}
          <Text style={[styles.kycStatus, requiresKyc ? styles.kycPending : styles.kycVerified]}>
            {requiresKyc ? 'Pending' : 'Verified'}
          </Text>
        </View>
      {requiresKyc &&  <TouchableOpacity
          style={[styles.kycButton, !requiresKyc && styles.kycButtonSecondary]}
          onPress={handleKycPress}
          activeOpacity={0.85}
        >
          <Text style={styles.kycButtonText}>{requiresKyc ? 'Start KYC Verification' : 'Manage Verification'}</Text>
        </TouchableOpacity>}
      </View>

      {/* Terms & Privacy */}
      <View style={styles.consentCard}>
        <TouchableOpacity style={styles.row} onPress={() => dispatch(updatePolicies({ agreeAll: !agreeAll }))}>
          <View style={[styles.checkbox, agreeAll && styles.checkboxOn]}>
            {agreeAll ? <CheckCircle2 size={18} color={colors.white} /> : null}
          </View>
          <Text style={styles.consentTxt}>
            I agree to Zishes
            <Text> </Text>
            <Text style={styles.link} onPress={() => Linking.openURL('https://example.com/terms')}>Terms of Service</Text>
            <Text> and </Text>
            <Text style={styles.link} onPress={() => Linking.openURL('https://example.com/privacy')}>Privacy Policy</Text>.
          </Text>
        </TouchableOpacity>
      </View>

      <BottomSheet visible={!!policySheet} onClose={closePolicy} full={false} maxRatio={0.9} showClose>
        <View style={styles.sheetWrap}>
          <Text style={styles.sheetTitle}>{policySheet?.title || 'Policy'}</Text>
          <View style={styles.sheetDivider} />
          {WebViewComp && policySheet?.url ? (
            <WebViewComp source={{ uri: policySheet.url }} startInLoadingState style={{ flex: 1 }} />
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 12 }}>
              <Text style={{ color: colors.textSecondary }}>
                {`We couldn't load the policy viewer on this device. Tap below to open in your browser.`}
              </Text>
              {policySheet?.url ? (
                <TouchableOpacity style={styles.sheetLink} onPress={() => Linking.openURL(policySheet.url).catch(() => {})}>
                  <Text style={styles.sheetLinkTxt}>Open in Browser</Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          )}
        </View>
      </BottomSheet>
    </ScrollView>
  );
}

function PolicyItem({ title, checked, onToggle, children }) {
  return (
    <View style={{ marginTop: 16 }}>
      <TouchableOpacity style={styles.row} onPress={onToggle}>
        <View style={[styles.checkbox, checked && styles.checkboxOn]}>
          {checked ? <CheckCircle2 size={18} color={colors.white} /> : null}
        </View>
        <Text style={styles.policyTitle}>{title}</Text>
      </TouchableOpacity>
      {children ? <View style={{ marginLeft: 36, marginTop: 6 }}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#2B2F39', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#343B49', marginBottom: 14 },
  cardTitle: { color: colors.white, fontWeight: '900', fontSize: 22 },
  cardDesc: { color: colors.textSecondary, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.accent,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  policyTitle: { color: colors.white, fontWeight: '700', fontSize: 18 },
  readMore: { color: colors.accent, fontWeight: '700' },
  kycPanel: { backgroundColor: '#1E2128', borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 24, marginTop: 16, paddingHorizontal: 12 },
  kycStatus: { fontWeight: '800', marginTop: 8, fontSize: 16 },
  kycPending: { color: colors.white },
  kycVerified: { color: colors.successGreen },
  kycButton: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  kycButtonSecondary: {
    backgroundColor: '#2F3140',
    borderWidth: 1,
    borderColor: '#3A4051',
  },
  kycButtonText: { color: colors.white, fontWeight: '800' },
  consentCard: { backgroundColor: '#2B2F39', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#343B49' },
  consentTxt: { color: colors.white, flex: 1, flexWrap: 'wrap' },
  link: { color: '#7B79FF', fontWeight: '700' },
  sheetWrap: { flex: 1 },
  sheetTitle: { color: colors.white, fontWeight: '900', fontSize: 18, textAlign: 'center' },
  sheetDivider: { height: 1, backgroundColor: '#2F3645', marginVertical: 12 },
  sheetLink: { marginTop: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
  sheetLinkTxt: { color: colors.white, fontWeight: '800' },
});
