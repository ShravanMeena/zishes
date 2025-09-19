import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../../theme/colors';
import reviewsApi from '../../../services/reviews';

export default function SellerReviewTab({ item }) {
  const sellerId = useMemo(() => (
    item?.user || item?.raw?.user || (typeof item?.product?.user === 'string' ? item.product.user : item?.product?.user?._id)
  ), [item]);
  const productId = useMemo(() => (item?.id || item?._id || item?.product?._id), [item]);

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState([]);

  const load = async () => {
    try {
      setError(null);
      setLoading(true);
      const [opts, data] = await Promise.all([
        reviewsApi.getOptions(),
        reviewsApi.listReviews({ seller: sellerId }),
      ]);
      setOptions(Array.isArray(opts) ? opts : []);
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || 'Failed to load reviews');
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [sellerId]);

  const avg = useMemo(() => {
    if (!list.length) return 0;
    const s = list.reduce((a, r) => a + Number(r.rating || 0), 0);
    return Math.round((s / list.length) * 10) / 10;
  }, [list]);

  const renderReview = (r) => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Stars rating={Number(r.rating || 0)} />
        <Text style={styles.dateTxt}>{fmtDate(r.createdAt)}</Text>
      </View>
      {Array.isArray(r.quickFeedback) && r.quickFeedback.length ? (
        <View style={styles.tagsWrap}>
          {r.quickFeedback.map((t, i) => (
            <View key={`${t}-${i}`} style={styles.tag}><Text style={styles.tagTxt}>{t}</Text></View>
          ))}
        </View>
      ) : null}
      {r.comment ? <Text style={styles.comment}>{r.comment}</Text> : null}
    </View>
  );

  return (
    <View>
      <Text style={{ color: colors.white, fontWeight: '800', fontSize: 16, marginBottom: 8 }}>Seller Reviews</Text>
      {loading ? (
        <View style={styles.loadingWrap}><ActivityIndicator color={colors.primary} /></View>
      ) : error ? (
        <Text style={{ color: '#ffb3b3' }}>{error}</Text>
      ) : (
        <>
          <View style={styles.summary}>
            <Text style={styles.avgTxt}>{avg.toFixed(1)}</Text>
            <Stars rating={avg} />
            <Text style={styles.countTxt}>{list.length} review{list.length === 1 ? '' : 's'}</Text>
          </View>
          <View style={styles.listWrap}>
            {list.length ? (
              list.map((review, idx) => (
                <View key={review._id || idx} style={{ marginBottom: idx === list.length - 1 ? 0 : 10 }}>
                  {renderReview(review)}
                </View>
              ))
            ) : (
              <Text style={{ color: colors.textSecondary }}>No reviews yet.</Text>
            )}
          </View>
        </>
      )}
    </View>
  );
}

function Stars({ rating }) {
  const full = Math.round(Number(rating) || 0);
  return (
    <Text style={{ color: '#FFD166', fontSize: 16 }}>{'★'.repeat(Math.max(0, Math.min(5, full)))}{'☆'.repeat(Math.max(0, 5 - Math.max(0, Math.min(5, full))))}</Text>
  );
}

function fmtDate(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString(); } catch { return ''; }
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#2B2F39', borderRadius: 14, borderWidth: 1, borderColor: '#343B49', padding: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateTxt: { color: colors.textSecondary, fontSize: 12 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { backgroundColor: '#1E2128', borderWidth: 1, borderColor: '#3A4051', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  tagTxt: { color: colors.white, fontSize: 12 },
  comment: { color: colors.white, marginTop: 8 },
  loadingWrap: { paddingVertical: 10 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  avgTxt: { color: colors.white, fontWeight: '900', fontSize: 18 },
  countTxt: { color: colors.textSecondary },
  listWrap: { paddingBottom: 12 },
});
