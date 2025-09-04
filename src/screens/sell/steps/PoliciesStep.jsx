import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { colors } from '../../../theme/colors';
import { Clock } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { updatePolicies } from '../../../store/listingDraft/listingDraftSlice';

export default function PoliciesStep() {
  const dispatch = useDispatch();
  const { policies, agreeAll } = useSelector((s) => ({ policies: s.listingDraft.policies, agreeAll: s.listingDraft.policies.agreeAll }));
  const toggle = (key) => dispatch(updatePolicies({ [key]: !policies[key] }));
  const ReadMore = ({ onPress }) => (
    <TouchableOpacity onPress={onPress}>
      <Text style={styles.readMore}>Read More</Text>
    </TouchableOpacity>
  );

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
          <ReadMore onPress={() => {}} />
        </PolicyItem>

        <PolicyItem
          title="Agree to Dispute Resolution Policy"
          checked={policies.dispute}
          onToggle={() => toggle('dispute')}
        >
          <ReadMore onPress={() => {}} />
        </PolicyItem>

        <PolicyItem
          title="Confirm Anti-Fraud Policy"
          checked={policies.antifraud}
          onToggle={() => toggle('antifraud')}
        >
          <ReadMore onPress={() => {}} />
        </PolicyItem>
      </View>

      {/* KYC Block */}
      <View style={styles.card}> 
        <Text style={styles.cardTitle}>Complete your KYC</Text>
        <Text style={styles.cardDesc}>
          For a secure marketplace, please upload a valid government ID (Passport, Driver's License, or National ID).
        </Text>
        <View style={styles.kycPanel}>
          <Clock size={28} color={colors.white} />
          <Text style={styles.kycStatus}>Pending</Text>
        </View>
      </View>

      {/* Terms & Privacy */}
      <View style={styles.consentCard}>
        <TouchableOpacity style={styles.row} onPress={() => dispatch(updatePolicies({ agreeAll: !agreeAll }))}>
          <View style={[styles.checkbox, agreeAll && styles.checkboxOn]} />
          <Text style={styles.consentTxt}>
            I agree to Zishes
            <Text> </Text>
            <Text style={styles.link} onPress={() => Linking.openURL('https://example.com/terms')}>Terms of Service</Text>
            <Text> and </Text>
            <Text style={styles.link} onPress={() => Linking.openURL('https://example.com/privacy')}>Privacy Policy</Text>.
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function PolicyItem({ title, checked, onToggle, children }) {
  return (
    <View style={{ marginTop: 16 }}>
      <TouchableOpacity style={styles.row} onPress={onToggle}>
        <View style={[styles.checkbox, checked && styles.checkboxOn]} />
        <Text style={styles.policyTitle}>{title}</Text>
      </TouchableOpacity>
      <View style={{ marginLeft: 36, marginTop: 6 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#2B2F39', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#343B49', marginBottom: 14 },
  cardTitle: { color: colors.white, fontWeight: '900', fontSize: 22 },
  cardDesc: { color: colors.textSecondary, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: colors.accent, marginRight: 12 },
  checkboxOn: { backgroundColor: colors.primary },
  policyTitle: { color: colors.white, fontWeight: '700', fontSize: 18 },
  readMore: { color: colors.accent, fontWeight: '700' },
  kycPanel: { backgroundColor: '#1E2128', borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 24, marginTop: 16 },
  kycStatus: { color: colors.white, fontWeight: '800', marginTop: 8 },
  consentCard: { backgroundColor: '#2B2F39', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#343B49' },
  consentTxt: { color: colors.white, flex: 1, flexWrap: 'wrap' },
  link: { color: '#7B79FF', fontWeight: '700' },
});
