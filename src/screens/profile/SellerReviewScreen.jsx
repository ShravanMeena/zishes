import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft } from 'lucide-react-native';
import reviews from '../../services/reviews';
import CongratsModal from '../../components/modals/CongratsModal';

export default function SellerReviewScreen({ route, navigation }) {
  const { sellerId: sellerParam, productId: productParam } = route?.params || {};
  const [sellerId, setSellerId] = useState(sellerParam || '');
  const [productId, setProductId] = useState(productParam || '');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState([]);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const opts = await reviews.getOptions();
        if (alive) setOptions(Array.isArray(opts) ? opts : []);
      } catch (e) {
        // ignore
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const toggleTag = (t) => {
    setTags((prev) => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));
  };

  const canSubmit = useMemo(() => !!(sellerId && productId && rating && !submitting), [sellerId, productId, rating, submitting]);

  const submit = async () => {
    setError(null);
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      await reviews.createReview({ seller: sellerId, product: productId, rating, quickFeedback: tags, comment });
      setSuccessOpen(true);
    } catch (e) {
      setError(e?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Review</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={styles.sectionTitle}>Rate your experience</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          {[1,2,3,4,5].map((i) => (
            <TouchableOpacity key={i} onPress={() => setRating(i)} style={{ padding: 4 }}>
              <Text style={{ fontSize: 28 }}>{i <= rating ? '⭐️' : '☆'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Quick Feedback</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View style={styles.tagsWrap}>
            {options.map((opt) => (
              <TouchableOpacity key={opt} onPress={() => toggleTag(opt)} style={[styles.tag, tags.includes(opt) && styles.tagActive]}>
                <Text style={[styles.tagTxt, tags.includes(opt) && styles.tagTxtActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Comment (Optional)</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Share any additional thoughts"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          multiline
          numberOfLines={4}
        />

        {error ? <Text style={{ color: '#FFB3B3', marginTop: 8 }}>{error}</Text> : null}
        <TouchableOpacity style={[styles.btn, styles.primary, !canSubmit && { opacity: 0.6 }]} onPress={submit} disabled={!canSubmit}>
          {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnTxt}>Submit Review</Text>}
        </TouchableOpacity>
      </ScrollView>

      <CongratsModal
        visible={successOpen}
        title="Review Submitted"
        message="Thanks for sharing your experience!"
        primaryText="Done"
        onPrimary={() => { setSuccessOpen(false); navigation.goBack(); }}
        onRequestClose={() => setSuccessOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },

  sectionTitle: { color: colors.white, fontWeight: '800', fontSize: 16, marginTop: 12, marginBottom: 8 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  tagActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tagTxt: { color: colors.white, fontWeight: '700', fontSize: 12 },
  tagTxtActive: { color: colors.white },
  input: { backgroundColor: '#1E2128', borderWidth: 1, borderColor: '#3A4051', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: colors.white, minHeight: 100, textAlignVertical: 'top' },
  btn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  primary: { backgroundColor: colors.primary },
  btnTxt: { color: colors.white, fontWeight: '800' },
});

