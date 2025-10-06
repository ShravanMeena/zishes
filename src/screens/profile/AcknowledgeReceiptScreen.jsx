import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, ActivityIndicator, RefreshControl, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, Bell, Camera, Calendar, AlertTriangle, X } from 'lucide-react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import useGalleryPermission from '../../hooks/useGalleryPermission';
import useCameraPermission from '../../hooks/useCameraPermission';
import ImagePickerSheet from '../../components/common/ImagePickerSheet';
import DatePickerModal, { formatDateYYYYMMDD } from '../../components/ui/DatePickerModal';
import fulfillments from '../../services/fulfillments';
import reviews from '../../services/reviews';
import { uploadImage } from '../../services/uploads';
import CongratsModal from '../../components/modals/CongratsModal';
import {
  createEmptyPickupAddresses as buildEmptyPickupAddresses,
  normalizePickupAddressesForState,
  normalizePickupAddressesForSubmit,
  hasAddress,
  hasPickupAddresses,
  resolveProductCountry,
} from '../../utils/pickupAddresses';

export default function AcknowledgeReceiptScreen({ route, navigation }) {
  const { item } = route?.params || {};
  const ensureGallery = useGalleryPermission();
  const ensureCamera = useCameraPermission();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [images, setImages] = useState([]); // array of { uri }
  const [preview, setPreview] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [date, setDate] = useState('');
  const [comment, setComment] = useState('');
  const [showDate, setShowDate] = useState(false);
  const [stage, setStage] = useState('idle'); // 'idle' | 'uploading' | 'submitting'
  const [uploadPct, setUploadPct] = useState(0);
  const [error, setError] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [fulfillment, setFulfillment] = useState(null);
  const [mode, setMode] = useState('edit'); // 'view' | 'edit'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rating, setRating] = useState(0);
  const [pickupAddresses, setPickupAddresses] = useState(() => buildEmptyPickupAddresses());
  const [productCountry, setProductCountry] = useState('');

  const banner = useMemo(() => {
    const title = item?.product?.name || item?.game?.name || item?.tournament?.game?.name || 'Item';
    const image = (Array.isArray(item?.product?.images) && item.product.images[0]) || item?.game?.thumbnail || item?.tournament?.game?.thumbnail;
    return { title, image };
  }, [item]);

  const pickFromGallery = async () => {
    const ok = await ensureGallery();
    if (!ok) return;
    const res = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 0 });
    if (res?.assets?.length) setImages((p) => [...p, ...res.assets.map(a => ({ uri: a.uri }))]);
  };
  const pickFromCamera = async () => {
    const ok = await ensureCamera();
    if (!ok) return;
    const res = await launchCamera({ mediaType: 'photo', cameraType: 'back', quality: 0.9, saveToPhotos: true });
    if (res?.assets?.length) setImages((p) => [...p, ...res.assets.map(a => ({ uri: a.uri }))]);
  };

  const getProductId = () => item?.product?._id || item?.productId || item?.raw?._id || route?.params?.productId;
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const f = await reloadAck(
          setFulfillment,
          setComment,
          setDate,
          setPickupAddresses,
          setProductCountry,
          setVideoUrl,
          getProductId,
          item
        );
        if (!f) return;
        const rc = f?.receiverConfirmation || f?.receiver || {};
        const hasAck = !!(f?.received || rc?.confirmedAt || rc?.notes || rc?.videoUrl || hasPickupAddresses(f?.pickupAddresses));
        if (hasAck) setMode('view');
      } catch (e) {
        // ignore for view
      } finally { setLoading(false); }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    setError(null);
    const productId = getProductId();
    if (!productId) { setError('Missing product id'); return; }
    try {
      // Upload any images user selected to receiver media
      const photos = [];
      if (images.length) {
        setStage('uploading');
        setUploadPct(0);
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          try {
            const res = await uploadImage({ uri: img.uri, onUploadProgress: (evt) => {
              const { loaded, total } = evt || {};
              const frac = total ? loaded / total : 0.5;
              const overall = ((i + frac) / Math.max(1, images.length)) * 100;
              setUploadPct(Math.max(0, Math.min(100, Math.round(overall))));
            }});
            if (res?.url) photos.push(res.url);
          } catch (e) {
            throw new Error(e?.message || 'Failed to upload image');
          }
        }
        setUploadPct(100);
      }
      setStage('submitting');
      const payload = {};
      if (photos.length) payload.photos = photos; // receiverMedia
      if (comment?.trim()) payload.notes = comment.trim();
      if (date) {
        const d = new Date(date);
        if (!isNaN(d.getTime())) payload.dateOfReceive = d.toISOString();
      }
      if (videoUrl?.trim()) payload.videoUrl = videoUrl.trim();
      const normalizedPickup = normalizePickupAddressesForSubmit(pickupAddresses, productCountry);
      if (normalizedPickup) payload.pickupAddresses = normalizedPickup;
      // videoUrl is optional and our UI collects photos; skip unless you later add video capture
      await fulfillments.submitReceiverProof(productId, payload);
      // Attempt to create a review if rating provided
      try {
        const f = fulfillment || (await fulfillments.getByProduct(productId));
        const sellerId = f?.seller || f?.product?.user || (typeof f?.product?.user === 'object' ? f.product.user?._id : null);
        const prodId = f?.product?._id || productId;
        if (sellerId && prodId && rating && rating > 0) {
          await reviews.createReview({ seller: sellerId, product: prodId, rating: Math.round(rating), comment: comment || undefined });
        }
      } catch (e) {
        // non-blocking
      }
      setSuccessOpen(true);
      try {
        const f = await reloadAck(
          setFulfillment,
          setComment,
          setDate,
          setPickupAddresses,
          setProductCountry,
          setVideoUrl,
          getProductId,
          item
        );
        if (f) setMode('view');
      } catch {}
    } catch (e) {
      setError(e?.message || 'Failed to submit acknowledgement');
    } finally {
      setStage('idle');
      setUploadPct(0);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Acknowledge Receipt</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home', { screen: 'Notifications' })}>
          <Bell size={18} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            try {
              const f = await reloadAck(
                setFulfillment,
                setComment,
                setDate,
                setPickupAddresses,
                setProductCountry,
                setVideoUrl,
                getProductId,
                item
              );
              if (f) {
                const rc = f?.receiverConfirmation || f?.receiver || {};
                const hasAck = !!(f?.received || rc?.confirmedAt || rc?.notes || rc?.videoUrl || hasPickupAddresses(f?.pickupAddresses));
                if (hasAck) setMode('view');
              }
            } finally { setRefreshing(false); }
          }}
          tintColor={colors.white}
        />}
      >
        {/* Content renders below; full-screen loader overlays while loading */}
        {/* Banner */}
        <View style={styles.banner}>
          <Image source={{ uri: banner.image }} style={styles.bannerImg} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.bannerTitle}>{banner.title}</Text>
            <View style={styles.infoRow}>
              <Calendar size={14} color={colors.textSecondary} />
              <Text style={styles.infoTxt}>Attach delivery date and proof below</Text>
            </View>
          </View>
        </View>

        {/* Existing acknowledgement details (if any). View-only with Edit button */}
        {(!loading && stage === 'idle') && mode === 'view' && fulfillment ? (
          <View style={{ backgroundColor: '#2B2F39', borderRadius: 12, borderWidth: 1, borderColor: '#343B49', padding: 12, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.sectionTitle}>Acknowledgement Details</Text>
              <TouchableOpacity onPress={() => setMode('edit')} style={[styles.btn, { height: 36, paddingHorizontal: 12 }, styles.primary]}>
                <Text style={styles.btnTxt}>Edit</Text>
              </TouchableOpacity>
            </View>
            {fulfillment?.winner ? (
              <DetailRow label="Winner" value={`${fulfillment.winner.username || fulfillment.winner._id}${fulfillment.winner.verified ? ' ✓' : ''}`} />
            ) : null}
            {fulfillment?.received ? (
              <View style={styles.badgeApproved}><Text style={styles.badgeApprovedTxt}>Seller Approved</Text></View>
            ) : (
              <Text style={{ color: colors.textSecondary, marginTop: 6 }}>Waiting for seller approval.</Text>
            )}
            <DetailRow label="Date of Receive" value={formatHumanDate(fulfillment?.dateOfReceive || fulfillment?.receiverConfirmation?.confirmedAt || fulfillment?.deliveredAt)} />
            {fulfillment?.receiverConfirmation?.notes ? (
              <DetailRow label="Notes" value={fulfillment.receiverConfirmation.notes} multiline />
            ) : null}
            {fulfillment?.receiverConfirmation?.videoUrl ? (
              <DetailRow label="Video" value={fulfillment.receiverConfirmation.videoUrl} />
            ) : null}
            {(fulfillment?.receiverMedia?.photos && fulfillment.receiverMedia.photos.length) ? (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.sectionTitle}>Photos</Text>
                <View style={styles.grid}>
                  {fulfillment.receiverMedia.photos.map((url, i) => (
                    <TouchableOpacity key={`${url}-${i}`} activeOpacity={0.9} onPress={() => setPreview({ uri: url })}>
                      <Image source={{ uri: url }} style={styles.gridThumb} resizeMode="contain" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}
            {hasPickupAddresses(fulfillment?.pickupAddresses) ? (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.sectionTitle}>Pickup Addresses</Text>
                {hasAddress(fulfillment?.pickupAddresses?.seller) ? (
                  <AddressSummary
                    label="Seller"
                    value={fulfillment?.pickupAddresses?.seller}
                    productCountry={productCountry || fulfillment?.product?.country}
                  />
                ) : null}
                {hasAddress(fulfillment?.pickupAddresses?.receiver) ? (
                  <AddressSummary
                    label="Receiver"
                    value={fulfillment?.pickupAddresses?.receiver}
                    productCountry={productCountry || fulfillment?.product?.country}
                  />
                ) : null}
              </View>
            ) : null}
            {fulfillment?.received ? (
              <TouchableOpacity
                style={[styles.btn, styles.primary, { marginTop: 10 }]}
                onPress={() => {
                  const sellerId = fulfillment?.seller || fulfillment?.product?.user || (typeof fulfillment?.product?.user === 'object' ? fulfillment.product.user?._id : null);
                  const prodId = fulfillment?.product?._id || getProductId();
                  if (sellerId && prodId) {
                    navigation.navigate('SellerReview', { sellerId, productId: prodId });
                  }
                }}
              >
                <Text style={styles.btnTxt}>Leave Seller Review</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Date */}
        {(mode === 'edit' && stage === 'idle' && !loading) ? (
          <>
            <Text style={styles.sectionTitle}>Delivery Date</Text>
            <TouchableOpacity style={[styles.input, styles.select]} onPress={() => setShowDate(true)}>
              <Text style={[styles.selTxt, { color: date ? colors.white : colors.textSecondary }]}>{date || 'Select date'}</Text>
              <Calendar size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </>
        ) : null}

        {/* Proof Images (keep optional; only in edit mode) */}
        {(mode === 'edit' && stage === 'idle' && !loading) ? (
          <>
            <Text style={styles.sectionTitle}>Proof of Acknowledgement</Text>
            <TouchableOpacity style={styles.uploadRow} onPress={() => setPickerOpen(true)}>
              <Camera size={16} color={colors.white} />
              <Text style={styles.uploadTxt}>{images.length ? 'Add More Photos' : 'Upload Photos'}</Text>
            </TouchableOpacity>
        {images.length ? (
          <View style={styles.grid}>
            {images.map((img, i) => (
              <View key={`${img.uri}-${i}`} style={{ position: 'relative' }}>
                <Image source={{ uri: img.uri }} style={styles.thumb} />
                <TouchableOpacity onPress={() => setImages(prev => prev.filter((_, idx) => idx !== i))} style={styles.removeBtnSmall}>
                  <Text style={{ color: colors.white, fontSize: 12 }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}
          </>
        ) : null}

        {(mode === 'edit' && stage === 'idle' && !loading) ? (
          <View style={styles.addressCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>Pickup Addresses (optional)</Text>
              {productCountry ? <Text style={styles.addressHint}>Country locked to {productCountry}</Text> : null}
            </View>
            <AddressForm
              label="Seller pickup address"
              value={pickupAddresses.seller}
              onChange={(field, value) => setPickupAddresses((prev) => ({ ...prev, seller: { ...prev.seller, [field]: value } }))}
              productCountry={productCountry}
            />
            <View style={styles.addressDivider} />
            <AddressForm
              label="Receiver delivery address"
              value={pickupAddresses.receiver}
              onChange={(field, value) => setPickupAddresses((prev) => ({ ...prev, receiver: { ...prev.receiver, [field]: value } }))}
              productCountry={productCountry}
            />
          </View>
        ) : null}

        {(mode === 'edit' && stage === 'idle' && !loading) ? (
          <>
            <Text style={styles.sectionTitle}>Video Proof (Optional)</Text>
            <TextInput
              value={videoUrl}
              onChangeText={setVideoUrl}
              placeholder="https://example.com/proof.mp4"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={styles.input}
            />
          </>
        ) : null}

        {/* Comment + Review */}
        {(mode === 'edit' && stage === 'idle' && !loading) ? (
          <>
            <Text style={styles.sectionTitle}>Comment (Optional)</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Any additional notes for the seller"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              style={[styles.input, { height: 110, textAlignVertical: 'top' }]}
            />
            <Text style={styles.sectionTitle}>Leave a Review</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              {[1,2,3,4,5].map((i) => (
                <TouchableOpacity key={i} onPress={() => setRating(i)} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 20 }}>{i <= rating ? '⭐️' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

        {/* Actions */}
        {error ? (
          <View style={styles.errorBox}>
            <AlertTriangle size={16} color="#FFB3B3" />
            <Text style={styles.errorTxt}>{error}</Text>
          </View>
        ) : null}
        {(mode === 'edit' && stage === 'idle' && !loading) ? (
          <TouchableOpacity style={[styles.btn, styles.primary, (stage !== 'idle') && { opacity: 0.8 }]} onPress={submit} disabled={stage !== 'idle'}>
            {stage === 'uploading' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color={colors.white} />
                <Text style={styles.btnTxt}>Uploading {uploadPct}%</Text>
              </View>
            ) : stage === 'submitting' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color={colors.white} />
                <Text style={styles.btnTxt}>Submitting…</Text>
              </View>
            ) : (
              <Text style={styles.btnTxt}>Submit Acknowledgement</Text>
            )}
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={() => navigation.goBack()}><Text style={styles.btnTxt}>Cancel</Text></TouchableOpacity>
      </ScrollView>

      <Modal visible={!!preview} transparent onRequestClose={() => setPreview(null)} animationType="fade">
        <View style={styles.previewBackdrop}>
          <Pressable style={styles.previewBackdrop} onPress={() => setPreview(null)} />
          <View style={styles.previewBox}>
            {preview?.uri ? (
              <Image source={{ uri: preview.uri }} style={styles.previewImg} resizeMode="contain" />
            ) : null}
            <Pressable style={styles.previewClose} onPress={() => setPreview(null)}>
              <X size={18} color={colors.white} />
            </Pressable>
          </View>
        </View>
      </Modal>

      <DatePickerModal
        visible={showDate}
        value={date ? new Date(date) : new Date()}
        onClose={() => setShowDate(false)}
        onConfirm={(d) => { setDate(formatDateYYYYMMDD(d)); setShowDate(false); }}
      />
      {(mode === 'edit' && stage === 'idle' && !loading) ? (
        <ImagePickerSheet
          visible={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onPickCamera={() => { setPickerOpen(false); setTimeout(() => { pickFromCamera(); }, 300); }}
          onPickGallery={() => { setPickerOpen(false); setTimeout(() => { pickFromGallery(); }, 300); }}
          title="Upload Proof"
        />
      ) : null}
      <CongratsModal
        visible={successOpen}
        title="Acknowledged"
        message="Thanks! Your receipt confirmation has been recorded."
        primaryText="Done"
        onPrimary={() => { setSuccessOpen(false); navigation.goBack(); }}
        onRequestClose={() => setSuccessOpen(false)}
      />
      {(loading || stage !== 'idle') ? (
        <View style={styles.fullscreenLoader} pointerEvents="none">
          <ActivityIndicator color={colors.primary} size="large" />
          <View style={{ width: '86%', marginTop: 16 }}>
            <View style={styles.skelLineWide} />
            <View style={styles.skelLine} />
            <View style={[styles.skelLine, { width: '50%' }]} />
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },

  banner: { backgroundColor: '#2B2F39', borderRadius: 12, borderWidth: 1, borderColor: '#343B49', padding: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  bannerImg: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#333' },
  bannerTitle: { color: colors.white, fontWeight: '800' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  infoTxt: { color: colors.textSecondary },

  sectionTitle: { color: colors.white, fontWeight: '800', fontSize: 16, marginVertical: 8 },
  input: { backgroundColor: '#1E2128', borderWidth: 1, borderColor: '#3A4051', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: colors.white },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selTxt: { color: colors.white },
  uploadRow: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 10 },
  uploadTxt: { color: colors.white, fontWeight: '800' },
  addressCard: { backgroundColor: '#2B2F39', borderRadius: 12, borderWidth: 1, borderColor: '#343B49', padding: 12, marginTop: 16 },
  addressHint: { color: colors.textSecondary, fontSize: 12 },
  addressLabel: { color: colors.white, fontWeight: '700', marginBottom: 4 },
  addressField: { marginTop: 10 },
  addressRow: { flexDirection: 'row', marginTop: 10 },
  addressHalf: { flex: 1 },
  addressHalfLeft: { marginRight: 10 },
  addressDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#343B49', marginVertical: 14 },
  addressCountry: { color: colors.textSecondary, fontSize: 12, marginTop: 8 },
  addressSummary: { marginTop: 8, backgroundColor: '#232630', borderRadius: 10, borderWidth: 1, borderColor: '#343B49', padding: 10 },
  addressSummaryLabel: { color: colors.white, fontWeight: '800' },
  addressSummaryText: { color: colors.textSecondary, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  thumb: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#333' },
  gridThumb: { width: 72, height: 72, borderRadius: 8, backgroundColor: '#1E2128' },
  removeBtnSmall: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  previewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  previewBox: { width: '92%', height: '78%', borderRadius: 16, backgroundColor: '#11141a', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  previewImg: { width: '100%', height: '100%' },
  previewClose: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  badgeApproved: { alignSelf: 'flex-start', backgroundColor: '#2ECC71', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginTop: 6 },
  badgeApprovedTxt: { color: '#0B1220', fontWeight: '900' },
  skeletonCard: { backgroundColor: '#1E2128', borderRadius: 12, borderWidth: 1, borderColor: '#24324A', padding: 14, marginBottom: 12 },
  skelLine: { height: 12, borderRadius: 6, backgroundColor: '#2B3548', marginTop: 10, width: '60%' },
  skelLineWide: { height: 16, borderRadius: 6, backgroundColor: '#2B3548', width: '80%' },
  fullscreenLoader: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0B1220', alignItems: 'center', justifyContent: 'center' },

  btn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  primary: { backgroundColor: colors.primary },
  cancel: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49' },
  btnTxt: { color: colors.white, fontWeight: '800' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3A2B2B', borderWidth: 1, borderColor: '#B54747', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginTop: 10 },
  errorTxt: { color: '#FFB3B3', fontWeight: '700', flexShrink: 1 },
});

function DetailRow({ label, value, multiline }) {
  return (
    <View style={{ marginTop: 8 }}>
      <Text style={[styles.sectionTitle, { fontSize: 12, marginVertical: 0 }]}>{label}</Text>
      <Text style={{ color: multiline ? colors.white : colors.textSecondary }}>{String(value ?? '—')}</Text>
    </View>
  );
}

function formatHumanDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString(); } catch { return '—'; }
}

function AddressForm({ label, value, onChange, productCountry }) {
  const v = value || {};
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={styles.addressLabel}>{label}</Text>
      <TextInput
        style={[styles.input, styles.addressField]}
        placeholder="Address line 1"
        placeholderTextColor={colors.textSecondary}
        value={v.line1 || ''}
        onChangeText={(text) => onChange('line1', text)}
      />
      <TextInput
        style={[styles.input, styles.addressField]}
        placeholder="Address line 2 (optional)"
        placeholderTextColor={colors.textSecondary}
        value={v.line2 || ''}
        onChangeText={(text) => onChange('line2', text)}
      />
      <TextInput
        style={[styles.input, styles.addressField]}
        placeholder="Landmark (optional)"
        placeholderTextColor={colors.textSecondary}
        value={v.landmark || ''}
        onChangeText={(text) => onChange('landmark', text)}
      />
      <View style={styles.addressRow}>
        <TextInput
          style={[styles.input, styles.addressField, styles.addressHalf, styles.addressHalfLeft]}
          placeholder="City"
          placeholderTextColor={colors.textSecondary}
          value={v.city || ''}
          onChangeText={(text) => onChange('city', text)}
        />
        <TextInput
          style={[styles.input, styles.addressField, styles.addressHalf]}
          placeholder="State"
          placeholderTextColor={colors.textSecondary}
          value={v.state || ''}
          onChangeText={(text) => onChange('state', text)}
        />
      </View>
      <TextInput
        style={[styles.input, styles.addressField]}
        placeholder="Pincode / ZIP"
        placeholderTextColor={colors.textSecondary}
        value={v.pincode || ''}
        keyboardType="default"
        onChangeText={(text) => onChange('pincode', text)}
      />
      <Text style={styles.addressCountry}>Country: {productCountry || v.country || '—'} (locked to listing)</Text>
    </View>
  );
}

function AddressSummary({ label, value, productCountry }) {
  const v = value || {};
  const lines = [];
  if (v.line1) lines.push(v.line1);
  if (v.line2) lines.push(v.line2);
  if (v.landmark) lines.push(v.landmark);
  const cityState = [v.city, v.state].filter(Boolean).join(', ');
  if (cityState) lines.push(cityState);
  if (v.pincode) lines.push(`Pincode: ${v.pincode}`);
  const country = v.country || productCountry;
  if (country) lines.push(`Country: ${country}`);

  return (
    <View style={styles.addressSummary}>
      <Text style={styles.addressSummaryLabel}>{label}</Text>
      {lines.length ? lines.map((line, idx) => (
        <Text key={`${label}-${idx}`} style={styles.addressSummaryText}>{line}</Text>
      )) : (
        <Text style={styles.addressSummaryText}>—</Text>
      )}
    </View>
  );
}

async function reloadAck(
  setFulfillment,
  setComment,
  setDate,
  setPickupAddresses,
  setProductCountry,
  setVideoUrl,
  getProductId,
  item
) {
  const productId = getProductId();
  if (!productId) return null;
  const f = await fulfillments.getByProduct(productId);
  setFulfillment(f);
  const rc = f?.receiverConfirmation || f?.receiver || {};
  if (setComment) setComment(rc?.notes || '');
  const confirmedAt = rc?.confirmedAt || f?.dateOfReceive || f?.deliveredAt;
  if (setDate) {
    if (confirmedAt) {
      try { setDate(formatDateYYYYMMDD(new Date(confirmedAt))); } catch { setDate(''); }
    } else {
      setDate('');
    }
  }
  if (setVideoUrl) setVideoUrl(rc?.videoUrl || '');
  const country = resolveProductCountry(f, item);
  if (setProductCountry) setProductCountry(country || '');
  if (setPickupAddresses) {
    const normalized = normalizePickupAddressesForState(f?.pickupAddresses, country);
    setPickupAddresses(normalized);
  }
  return f;
}
