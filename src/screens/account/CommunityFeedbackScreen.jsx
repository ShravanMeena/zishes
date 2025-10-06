import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, MessageSquare, Share2, MessageCircleQuestion } from 'lucide-react-native';
import feedbackApi from '../../services/communityFeedback';
import CongratsModal from '../../components/modals/CongratsModal';
import FAQSheet from '../../components/panels/FAQSheet.js';
import { getFAQs } from '../../services/faq';

export default function CommunityFeedbackScreen({ navigation }) {
  const [msg, setMsg] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [faqVisible, setFaqVisible] = useState(false);
  const [faqLoading, setFaqLoading] = useState(false);
  const [faqs, setFaqs] = useState([]);

  const isValidEmail = (v) => /.+@.+\..+/.test(String(v || '').trim());
  const canSubmit = msg.trim().length > 0 && isValidEmail(email) && !submitting;

  const submit = async () => {
    setError(null);
    if (!msg.trim()) { setError('Please enter a message.'); return; }
    if (!isValidEmail(email)) { setError('Please enter a valid email.'); return; }
    try {
      setSubmitting(true);
      await feedbackApi.createFeedback({ message: msg.trim(), email: email.trim() });
      setSuccessOpen(true);
      setMsg('');
      setEmail('');
    } catch (e) {
      setError(e?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Community & Feedback</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAwareScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} keyboardShouldPersistTaps="handled" enableOnAndroid extraScrollHeight={20}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Share Your Feedback</Text>
          <Text style={styles.label}>Your Message</Text>
          <TextInput value={msg} onChangeText={setMsg} placeholder="Tell us what you think or suggest improvements..." placeholderTextColor={colors.textSecondary} multiline numberOfLines={4} style={[styles.input, { height: 120, textAlignVertical: 'top' }]} />
          <Text style={styles.label}>Your Email</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="email@example.com" placeholderTextColor={colors.textSecondary} style={styles.input} autoCapitalize="none" keyboardType="email-address" />
          {error ? <Text style={styles.errorTxt}>{error}</Text> : null}
          {submitting ? (
            <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={{ color: colors.textSecondary }}>Submitting...</Text>
            </View>
          ) : null}
          <TouchableOpacity style={[styles.btn, styles.primary, !canSubmit && { opacity: 0.6 }]} disabled={!canSubmit} onPress={submit}>
            <Text style={styles.btnTxt}>{submitting ? 'Submitting...' : 'Submit Feedback'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Connect with Our Community</Text>

        <ActionRow icon={<MessageSquare size={18} color={colors.white} />} title="Join Our Forum" onPress={() => Linking.openURL('https://example.com/forum')} />
        <ActionRow icon={<Share2 size={18} color={colors.white} />} title="Follow on Social Media" onPress={() => Linking.openURL('https://example.com/social')} />
        <ActionRow icon={<MessageCircleQuestion size={18} color={colors.white} />} title="Read FAQs" onPress={openFaqs} />
      </KeyboardAwareScrollView>
      <CongratsModal
        visible={successOpen}
        title="Feedback Sent"
        message="Thank you for helping improve the experience. We appreciate your input!"
        primaryText="Done"
        onPrimary={() => { setSuccessOpen(false); navigation.goBack(); }}
        onRequestClose={() => setSuccessOpen(false)}
      />
      <FAQSheet visible={faqVisible} onClose={() => setFaqVisible(false)} loading={faqLoading} items={faqs} />

    </SafeAreaView>
  );
}

function ActionRow({ icon, title, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.row}> 
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>{icon}</View>
        <Text style={styles.rowTitle}>{title}</Text>
      </View>
      <Text style={{ color: colors.accent, fontWeight: '800' }}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },
  card: { backgroundColor: '#2B2F39', borderRadius: 16, borderWidth: 1, borderColor: '#343B49', padding: 16, marginBottom: 14 },
  cardTitle: { color: colors.white, fontWeight: '900', fontSize: 20, marginBottom: 8 },
  label: { color: colors.white, marginTop: 10, marginBottom: 8, fontWeight: '700' },
  input: { backgroundColor: '#1E2128', borderWidth: 1, borderColor: '#3A4051', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: colors.white },
  btn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  primary: { backgroundColor: colors.primary },
  btnTxt: { color: colors.white, fontWeight: '800' },
  sectionTitle: { color: colors.white, fontWeight: '900', fontSize: 18, marginBottom: 10 },
  row: { backgroundColor: '#2B2F39', borderRadius: 14, borderWidth: 1, borderColor: '#343B49', padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#312B42', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  rowTitle: { color: colors.white, fontWeight: '700' },
  errorTxt: { color: '#FF7A7A', marginTop: 8 },
});
  const openFaqs = async () => {
    try {
      setFaqVisible(true);
      setFaqLoading(true);
      const data = await getFAQs();
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setFaqs(list);
    } catch (err) {
      setFaqs([{ _id: 'err', title: 'Unable to load FAQs', message: err?.message || 'Please try again later.' }]);
    } finally {
      setFaqLoading(false);
    }
  };
