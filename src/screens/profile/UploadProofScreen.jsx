import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Modal, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, Bell, Camera, Calendar, ChevronDown, X, AlertTriangle } from 'lucide-react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import useGalleryPermission from '../../hooks/useGalleryPermission';
import useCameraPermission from '../../hooks/useCameraPermission';
import ImagePickerSheet from '../../components/common/ImagePickerSheet';
import DatePickerModal, { formatDateYYYYMMDD } from '../../components/ui/DatePickerModal';
import { uploadImage } from '../../services/uploads';
import fulfillments from '../../services/fulfillments';
import CongratsModal from '../../components/modals/CongratsModal';
import {
  createEmptyPickupAddresses as buildEmptyPickupAddresses,
  normalizePickupAddressesForState,
  normalizePickupAddressesForSubmit,
  hasAddress,
  resolveProductCountry,
} from '../../utils/pickupAddresses';

export default function UploadProofScreen({ route, navigation }) {
  const { item, focus } = route.params || {};
  const ensureGallery = useGalleryPermission();
  const ensureCamera = useCameraPermission();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [whichSetter, setWhichSetter] = useState(null); // setter to update receipt/handover
  const [awb, setAwb] = useState('');
  const [courier, setCourier] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [handover, setHandover] = useState(null);
  const [date, setDate] = useState('');
  const [comment, setComment] = useState('');
  const [showDate, setShowDate] = useState(false);
  const [showCourier, setShowCourier] = useState(false);
  const [preview, setPreview] = useState(null); // 'receipt' | 'handover' | { uri }
  const couriers = useMemo(() => ['DTDC', 'Delhivery', 'BlueDart', 'India Post', 'Other'], []);
  const [stage, setStage] = useState('idle'); // 'idle' | 'uploading' | 'submitting'
  const [uploadPct, setUploadPct] = useState(0);
  const [error, setError] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const redirectToMyListings = useCallback(() => {
    const forceRefreshKey = `ml-${Date.now()}`;
    const parentNav = navigation.getParent?.();
    if (parentNav?.navigate) {
      parentNav.navigate('Profile', { screen: 'MyListings', params: { forceRefreshKey } });
    } else {
      navigation.navigate('MyListings', { forceRefreshKey });
    }
  }, [navigation]);
  const [fulfillment, setFulfillment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState(''); // 'courier' | 'digital'
  const [pickupAddresses, setPickupAddresses] = useState(() => buildEmptyPickupAddresses());
  const [productCountry, setProductCountry] = useState('');
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressExpanded, setAddressExpanded] = useState(() => focus !== 'proof');

  const draftSellerAddressFilled = hasAddress(pickupAddresses.seller);
  const canSaveAddresses = draftSellerAddressFilled;
  const sellerEvents = useMemo(
    () => extractSellerEvents(fulfillment, item?.raw?.fulfillment, item?.raw, item),
    [fulfillment, item]
  );
  const sellerEventSet = useMemo(() => new Set(sellerEvents), [sellerEvents]);
  const sellerAddressEvent = sellerEventSet.has('ADDRESS_FILLED');
  const sellerProofEvent = sellerEventSet.has('PROOF_GIVEN');
  const sellerAddressPersisted = hasAddress(fulfillment?.pickupAddresses?.seller) || sellerAddressEvent;
  const addressPersisted = sellerAddressPersisted;
  const showAddressForm = !sellerProofEvent && !sellerAddressPersisted;
  const showProofForm = !sellerProofEvent && sellerAddressPersisted;
  const showProofSubmittedBanner = sellerProofEvent;
  const showSubmittedCard = (!loading && stage === 'idle' && fulfillment && sellerProofEvent);
  const canEdit = !loading && stage === 'idle' && !sellerProofEvent;
  const openPicker = (setter) => { setWhichSetter(() => setter); setPickerOpen(true); };
  const pickFromGallery = async () => {
    const ok = await ensureGallery();
    if (!ok) return;
    const res = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
    const asset = res?.assets?.[0];
    if (asset?.uri && whichSetter) {
      whichSetter({ uri: asset.uri });
    }
  };
  const pickFromCamera = async () => {
    const ok = await ensureCamera();
    if (!ok) return;
    const res = await launchCamera({ mediaType: 'photo', cameraType: 'back', quality: 0.9, saveToPhotos: true });
    const asset = res?.assets?.[0];
    if (asset?.uri && whichSetter) {
      whichSetter({ uri: asset.uri });
    }
  };

  const getProductId = () => item?.id || item?.raw?._id || item?._id || route?.params?.productId;

  // Load existing fulfillment to show details and prefill fields
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const f = await reloadFulfillment(
          setFulfillment,
          setDeliveryMethod,
          setCourier,
          setAwb,
          setComment,
          setDate,
          setPickupAddresses,
          setProductCountry,
          getProductId,
          item
        );
        if (!f) return;
      } catch (e) {
        // ignore silently for view
      } finally { setLoading(false); }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!focus) return;
    if (focus === 'address') setAddressExpanded(true);
    if (focus === 'proof') setAddressExpanded(false);
  }, [focus]);

  const submit = async () => {
    setError(null);
    const productId = getProductId();
    if (!productId) { setError('Missing product id'); return; }
    const isCourier = String(deliveryMethod).toUpperCase() === 'COURIER';
    if (isCourier && !courier?.trim()) { setError('Courier service is required for courier deliveries.'); return; }
    if (isCourier && !awb?.trim()) { setError('Tracking number is required for courier deliveries.'); return; }
    if (isCourier && !receipt?.uri) { setError('Courier deliveries require an upload of the proof receipt.'); return; }
    if (!addressPersisted) {
      setError('Please complete the seller pickup address before submitting proof.');
      return;
    }
    if (!isCourier && !handover?.uri) {
      setError('Please upload a proof photo.');
      return;
    }
    try {
      // Upload available images with progress (only new ones)
      const photos = [];
      const toUpload = [receipt, handover].filter((img) => img && img.uri);
      if (toUpload.length) {
        setStage('uploading');
        setUploadPct(0);
        for (let i = 0; i < toUpload.length; i++) {
          const file = toUpload[i];
          try {
            const res = await uploadImage({ uri: file.uri, onUploadProgress: (evt) => {
              const { loaded, total } = evt || {};
              const frac = total ? loaded / total : 0.5;
              const overall = ((i + frac) / Math.max(1, toUpload.length)) * 100;
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
      // Build payload
      const payload = {};
      if (photos.length) payload.photos = photos;
      if (comment?.trim()) payload.sellerNotes = comment.trim();
      if (date) {
        const d = new Date(date);
        if (!isNaN(d.getTime())) payload.dateOfDelivery = d.toISOString();
      }
      // Only include courier fields when method is COURIER
      if (isCourier) {
        if (courier) payload.courierService = courier;
        if (awb?.trim()) payload.trackingNumber = awb.trim();
      }
      const normalizedPickup = normalizePickupAddressesForSubmit(pickupAddresses, productCountry);
      if (normalizedPickup) payload.pickupAddresses = normalizedPickup;

      await fulfillments.submitSellerProof(productId, payload);
      redirectToMyListings();
      return;
    } catch (e) {
      setError(e?.message || 'Failed to submit proof');
    } finally {
      setStage('idle');
      setUploadPct(0);
    }
  };

  const saveAddressOnly = async () => {
    setError(null);
    const productId = getProductId();
    if (!productId) { setError('Missing product id'); return; }
    if (!canSaveAddresses) {
      setError('Please enter the seller pickup address.');
      return;
    }
    try {
      setAddressSaving(true);
      const normalized = normalizePickupAddressesForSubmit(pickupAddresses, productCountry);
      if (!normalized || !normalized.seller) {
        throw new Error('Seller pickup address is required.');
      }
      await fulfillments.submitSellerProof(productId, { pickupAddresses: normalized });
      redirectToMyListings();
      return;
    } catch (e) {
      setError(e?.message || 'Failed to save address.');
    } finally {
      setAddressSaving(false);
    }
  };

  const headerTitle = useMemo(() => {
    if (focus === 'address') return 'Update Delivery Address';
    if (focus === 'proof') return 'Upload Proof of Delivery';
    return showAddressForm && !showProofForm ? 'Update Delivery Address' : 'Upload Proof of Delivery';
  }, [focus, showAddressForm, showProofForm]);

  return (
    <>
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home', { screen: 'Notifications' })}>
          <Bell size={18} color={colors.white} />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); try { await reloadFulfillment(setFulfillment, setDeliveryMethod, setCourier, setAwb, setComment, setDate, setPickupAddresses, setProductCountry, getProductId, item); } finally { setRefreshing(false); } }} tintColor={colors.white} />}
      >
        {/* Content renders below; full-screen loader overlays while loading */}

  
        {/* Existing proof details (if any). */}
        {showSubmittedCard && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Submitted Proof</Text>
            <DeliveryMessage method={fulfillment?.deliveryMethod} courier={fulfillment?.courierService} />
            {/* Winner info */}
            {fulfillment?.winner ? (
              <DetailRow label="Winner" value={`${fulfillment.winner.username || fulfillment.winner._id}${fulfillment.winner.verified ? ' ✓' : ''}`} />
            ) : null}
            <DetailRow label="Delivery Method" value={fulfillment?.deliveryMethod || '—'} />
            {String(fulfillment?.deliveryMethod || '').toUpperCase() === 'COURIER' ? (
              <>
                <DetailRow label="Courier" value={fulfillment?.courierService || '—'} />
                <DetailRow label="Tracking #" value={fulfillment?.trackingNumber || '—'} />
              </>
            ) : null}
            <DetailRow label="Date of Delivery" value={formatHumanDate(fulfillment?.dateOfDelivery || fulfillment?.deliveredAt)} />
            {fulfillment?.sellerNotes ? <DetailRow label="Notes" value={fulfillment.sellerNotes} multiline /> : null}
            {/* Photos from sellerMedia (new) or fallback */}
            {(fulfillment?.sellerMedia?.photos && fulfillment.sellerMedia.photos.length) || (Array.isArray(fulfillment?.pickupMedia?.photos) && fulfillment.pickupMedia.photos.length) ? (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.label}>Photos</Text>
                <View style={styles.attachGrid}>
                  {(fulfillment?.sellerMedia?.photos || fulfillment?.pickupMedia?.photos || []).map((url, i) => (
                    <TouchableOpacity key={`${url}-${i}`} activeOpacity={0.9} onPress={() => setPreview({ uri: url })}>
                      <Image source={{ uri: url }} style={styles.gridThumb} resizeMode="contain" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}
            {hasAddress(fulfillment?.pickupAddresses?.seller) ? (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.sectionTitle}>Pickup Address</Text>
                <AddressSummary
                  label="Seller pickup address"
                  value={fulfillment?.pickupAddresses?.seller}
                  productCountry={productCountry || fulfillment?.product?.country}
                />
              </View>
            ) : null}
          </View>
        )}

        {canEdit && showAddressForm ? (
          <View style={[styles.card, styles.addressCard]}>
            <TouchableOpacity
              onPress={() => setAddressExpanded((prev) => !prev)}
              style={styles.addressHeader}
              activeOpacity={0.8}
            >
              <Text style={styles.sectionTitle}>Pickup Address</Text>
              <ChevronDown
                size={18}
                color={colors.textSecondary}
                style={{ transform: [{ rotate: addressExpanded ? '180deg' : '0deg' }] }}
              />
            </TouchableOpacity>
            {addressExpanded ? (
              <>
                <AddressForm
                  label="Seller pickup address"
                  value={pickupAddresses.seller}
                  onChange={(field, value) => setPickupAddresses((prev) => ({ ...prev, seller: { ...prev.seller, [field]: value } }))}
                  productCountry={productCountry}
                  phoneLabel="Seller contact number"
                />
              </>
            ) : null}
          </View>
        ) : null}

        {showAddressForm ? (
          <>
            <TouchableOpacity
              style={[styles.btn, styles.primary, (addressSaving || !canSaveAddresses) && { opacity: 0.5 }]}
              onPress={saveAddressOnly}
              disabled={addressSaving || !canSaveAddresses}
            >
              {addressSaving ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color={colors.white} />
                  <Text style={styles.btnTxt}>Saving address…</Text>
                </View>
              ) : (
                <Text style={styles.btnTxt}>Save Pickup Address</Text>
              )}
            </TouchableOpacity>
            {/* <View style={styles.addressNotice}>
              <AlertTriangle size={16} color="#FFD053" />
              <Text style={styles.addressNoticeTxt}>
                Add the seller pickup address before uploading delivery proof.
              </Text>
            </View> */}
          </>
        ) : null}

        {showProofForm && String(deliveryMethod).toUpperCase() === 'COURIER' ? (<Text style={styles.sectionTitle}>Courier Details</Text>) : null}
        {showProofForm && String(deliveryMethod).toUpperCase() === 'COURIER' ? (<View style={styles.card}>
          <Text style={styles.label}>AWB / Tracking Number</Text>
          <TextInput value={awb} onChangeText={setAwb} placeholder="Enter AWB or tracking number" placeholderTextColor={colors.textSecondary} style={styles.input} />
          <Text style={styles.label}>Courier</Text>
          <TouchableOpacity style={[styles.input, styles.select]} onPress={() => setShowCourier(true)}>
            <Text style={[styles.selTxt, { color: courier ? colors.white : colors.textSecondary }]}>{courier || 'Select courier'}</Text>
            <ChevronDown size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadRow} onPress={() => openPicker(setReceipt)}>
            <Camera size={16} color={colors.white} />
            <Text style={styles.uploadTxt}>{receipt ? 'Change Receipt' : 'Upload Receipt'}</Text>
          </TouchableOpacity>
          {receipt ? (
            <View style={styles.thumbWrap}>
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.9} onPress={() => setPreview('receipt')}>
                <Image source={{ uri: receipt.uri }} style={styles.thumb} />
              </TouchableOpacity>
              <Pressable style={styles.removeBtn} onPress={() => setReceipt(null)}>
                <X size={14} color={colors.white} />
              </Pressable>
            </View>
          ) : null}
        </View>) : null}

        {showProofForm && String(deliveryMethod).toUpperCase() !== 'COURIER' ? (<Text style={styles.sectionTitle}>Proof of Delivery</Text>) : null}
        {showProofForm && String(deliveryMethod).toUpperCase() !== 'COURIER' ? (<TouchableOpacity style={styles.uploadRow} onPress={() => openPicker(setHandover)}>
          <Camera size={16} color={colors.white} />
          <Text style={styles.uploadTxt}>{handover ? 'Change Proof Photo' : 'Upload Proof Photo'}</Text>
        </TouchableOpacity>) : null}
        {showProofForm && handover ? (
          <View style={styles.thumbWrap}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.9} onPress={() => setPreview('handover')}>
              <Image source={{ uri: handover.uri }} style={styles.thumb} />
            </TouchableOpacity>
            <Pressable style={styles.removeBtn} onPress={() => setHandover(null)}>
              <X size={14} color={colors.white} />
            </Pressable>
          </View>
        ) : null}

        {showProofForm ? (<View style={[styles.card, { marginTop: 16 }]}> 
          <Text style={styles.label}>Delivery Date</Text>
          <TouchableOpacity style={[styles.input, styles.select]} onPress={() => setShowDate(true)}>
            <Text style={styles.selTxt}>{date || 'Select a date'}</Text>
            <Calendar size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>) : null}

        {showProofForm ? (<>
        <Text style={styles.label}>Comments</Text>
        <TextInput value={comment} onChangeText={setComment} placeholder="Add any additional delivery notes here..." placeholderTextColor={colors.textSecondary} style={[styles.input, { height: 100, textAlignVertical: 'top' }]} multiline />

        {error ? (
          <View style={styles.errorBox}>
            <AlertTriangle size={16} color="#FFB3B3" />
            <Text style={styles.errorTxt}>{error}</Text>
          </View>
        ) : null}
        <TouchableOpacity style={[styles.btn, styles.primary, stage !== 'idle' && { opacity: 0.5 }]} disabled={stage !== 'idle'} onPress={submit}>
          {stage === 'uploading' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color={colors.white} />
              <Text style={styles.btnTxt}>Uploading {uploadPct}%</Text>
            </View>
          ) : stage === 'submitting' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color={colors.white} />
              <Text style={styles.btnTxt}>Submitting details…</Text>
            </View>
          ) : (
            <Text style={styles.btnTxt}>Submit Proof</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.cancel]} disabled={stage !== 'idle'}><Text style={styles.btnTxt}>Save Draft</Text></TouchableOpacity>
        </>) : null}
      </KeyboardAwareScrollView>

      <PickerModal visible={showCourier} title="Select Courier" options={couriers} onClose={() => setShowCourier(false)} onSelect={(v) => { setCourier(v); setShowCourier(false); }} />
      {/* Fullscreen preview modal */}
      <Modal visible={!!preview} transparent onRequestClose={() => setPreview(null)} animationType="fade">
        <View style={styles.previewBackdrop}>
          <Pressable style={styles.previewBackdrop} onPress={() => setPreview(null)} />
          <View style={styles.previewBox}>
            {preview === 'receipt' && receipt ? (
              <Image source={{ uri: receipt.uri }} style={styles.previewImg} resizeMode="contain" />
            ) : null}
            {preview === 'handover' && handover ? (
              <Image source={{ uri: handover.uri }} style={styles.previewImg} resizeMode="contain" />
            ) : null}
            {preview && typeof preview === 'object' && preview.uri ? (
              <Image source={{ uri: preview.uri }} style={styles.previewImg} resizeMode="contain" />
            ) : null}
            <Pressable style={styles.previewClose} onPress={() => setPreview(null)}>
              <X size={18} color={colors.white} />
            </Pressable>
          </View>
        </View>
      </Modal>
      <DatePickerModal visible={showDate} value={date ? new Date(date) : new Date()} onClose={() => setShowDate(false)} onConfirm={(d) => { setDate(formatDateYYYYMMDD(d)); setShowDate(false); }} />
    </SafeAreaView>
    {(loading || stage !== 'idle') ? (
      <View style={styles.fullscreenLoader} pointerEvents="auto">
        <ActivityIndicator color={colors.primary} size="large" />
        <View style={{ width: '86%', marginTop: 16 }}>
          <View style={styles.skelLineWide} />
          <View style={styles.skelLine} />
          <View style={[styles.skelLine, { width: '40%' }]} />
        </View>
      </View>
    ) : null}
    <CongratsModal
      visible={successOpen}
      title="Proof Uploaded"
      message="Thanks! Your delivery proof has been submitted for review."
      primaryText="Done"
      onPrimary={() => { setSuccessOpen(false); redirectToMyListings(); }}
      onRequestClose={() => { setSuccessOpen(false); redirectToMyListings(); }}
    />
    {showProofForm ? (
      <ImagePickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPickCamera={() => {
          setPickerOpen(false);
          setTimeout(() => { pickFromCamera(); }, 300);
        }}
        onPickGallery={() => {
          setPickerOpen(false);
          setTimeout(() => { pickFromGallery(); }, 300);
        }}
        title="Upload Photo"
      />
    ) : null}
  </>
  );
}

function PickerModal({ visible, title, options, onClose, onSelect }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.modalBackdrop}>
        <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{title}</Text>
          {options.map((opt) => (
            <TouchableOpacity key={opt} style={styles.optionRow} onPress={() => onSelect(opt)}>
              <Text style={styles.optionTxt}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },


  sectionTitle: { color: colors.white, fontWeight: '800', fontSize: 16, marginVertical: 8 },
  card: { backgroundColor: '#2B2F39', borderRadius: 12, borderWidth: 1, borderColor: '#343B49', padding: 12, marginBottom: 12, overflow: 'hidden' },
  label: { color: colors.white, marginTop: 6, marginBottom: 8, fontWeight: '700' },
  input: { backgroundColor: '#1E2128', borderWidth: 1, borderColor: '#3A4051', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: colors.white },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selTxt: { color: colors.white },
  addressHint: { color: colors.textSecondary, fontSize: 12 },
  addressLabel: { color: colors.white, fontWeight: '700', marginBottom: 4 },
  addressField: { marginTop: 10 },
  addressRow: { flexDirection: 'row', marginTop: 10 },
  addressHalf: { flex: 1 },
  addressHalfLeft: { marginRight: 10 },
  addressCountry: { color: colors.textSecondary, fontSize: 12, marginTop: 8 },
  addressSummary: { marginTop: 8, backgroundColor: '#232630', borderRadius: 10, borderWidth: 1, borderColor: '#343B49', padding: 10 },
  addressSummaryLabel: { color: colors.white, fontWeight: '800' },
  addressSummaryText: { color: colors.textSecondary, marginTop: 4 },
  uploadRow: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#3A4051', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 10 },
  uploadTxt: { color: colors.white, fontWeight: '800' },
  thumbWrap: { width: 120, height: 120, borderRadius: 12, overflow: 'hidden', marginTop: 10, backgroundColor: '#1E2128', position: 'relative' },
  thumb: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  addressCard: { marginTop: 4 },
  addressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addressNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3A2F1B', borderWidth: 1, borderColor: '#B5892E', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginBottom: 12 },
  addressNoticeTxt: { color: '#FFDFAA', fontWeight: '700', flex: 1 },
  submittedNotice: { backgroundColor: '#1E2B3A', borderWidth: 1, borderColor: '#34506D', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 12 },
  submittedNoticeTxt: { color: '#CDE0FF', fontWeight: '700' },

  btn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  primary: { backgroundColor: colors.primary },
  cancel: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49' },
  btnTxt: { color: colors.white, fontWeight: '800' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#1E2128', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#343B49' },
  modalTitle: { color: colors.white, fontWeight: '800', fontSize: 16, marginBottom: 8 },
  optionRow: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2B2F39' },
  optionTxt: { color: colors.white, fontWeight: '600' },
  previewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  previewBox: { width: '92%', height: '78%', borderRadius: 16, backgroundColor: '#11141a', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  previewImg: { width: '100%', height: '100%' },
  previewClose: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3A2B2B', borderWidth: 1, borderColor: '#B54747', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginTop: 10 },
  errorTxt: { color: '#FFB3B3', fontWeight: '700', flexShrink: 1 },
  attachGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  cardTitle: { color: colors.white, fontWeight: '900', fontSize: 18 },
  gridThumb: { width: 86, height: 86, borderRadius: 10, backgroundColor: '#1E2128' },
  gridItem: { position: 'relative' },
  gridRemove: { position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  skeletonCard: { backgroundColor: '#1E2128', borderRadius: 12, borderWidth: 1, borderColor: '#24324A', padding: 14, marginBottom: 12 },
  skelLine: { height: 12, borderRadius: 6, backgroundColor: '#2B3548', marginTop: 10, width: '60%' },
  skelLineWide: { height: 16, borderRadius: 6, backgroundColor: '#2B3548', width: '80%' },
  fullscreenLoader: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 999 },
});

function DetailRow({ label, value, multiline }) {
  return (
    <View style={{ marginTop: 8 }}>
      <Text style={[styles.label, { marginTop: 0 }]}>{label}</Text>
      <Text style={{ color: multiline ? colors.white : colors.textSecondary }}>{String(value ?? '—')}</Text>
    </View>
  );
}

function formatHumanDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString(); } catch { return '—'; }
}

// Helper components
function DeliveryMessage({ method, courier }) {
  const m = String(method || '').toUpperCase();
  let text = '';
  if (m === 'COURIER') text = courier ? `Item to be shipped via ${courier}. Track with AWB once provided.` : 'Item will be shipped via a trusted courier. Add AWB/Tracking once shipped.';
  else text = 'Share a clear proof of delivery to confirm completion.';
  return <Text style={{ color: colors.textSecondary, marginTop: 8 }}>{text}</Text>;
}

function AddressForm({ label, value, onChange, productCountry, phoneLabel = 'Phone number' }) {
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
      <TextInput
        style={[styles.input, styles.addressField]}
        placeholder={phoneLabel || 'Phone number'}
        placeholderTextColor={colors.textSecondary}
        value={v.phone || ''}
        keyboardType="phone-pad"
        onChangeText={(text) => onChange('phone', text)}
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
  if (v.phone) lines.push(`Phone: ${v.phone}`);

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

function extractSellerEvents(...sources) {
  const collected = [];
  const collect = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry != null && entry !== '') collected.push(entry);
      });
    }
  };
  sources.forEach((source) => {
    if (!source) return;
    const root = source?.events;
    if (root) {
      collect(root);
      collect(root?.seller);
      collect(root?.seller?.events);
    }
    collect(source?.seller?.events);
    collect(source?.seller);
    collect(source?.sellerEvents);
  });
  return collected.map((ev) => String(ev).toUpperCase());
}

async function reloadFulfillment(
  setFulfillment,
  setDeliveryMethod,
  setCourier,
  setAwb,
  setComment,
  setDate,
  setPickupAddresses,
  setProductCountry,
  getProductId,
  item
) {
  const productId = getProductId();
  if (!productId) return null;
  const f = await fulfillments.getByProduct(productId);
  setFulfillment(f);
  if (setDeliveryMethod) setDeliveryMethod(f?.deliveryMethod ? String(f.deliveryMethod).toLowerCase() : '');
  if (setCourier) setCourier(f?.courierService || '');
  if (setAwb) setAwb(f?.trackingNumber || '');
  if (setComment) setComment(f?.sellerNotes || '');
  const delivered = f?.dateOfDelivery || f?.deliveredAt;
  if (setDate) {
    if (delivered) {
      try { setDate(formatDateYYYYMMDD(new Date(delivered))); } catch { setDate(''); }
    } else {
      setDate('');
    }
  }
  const productCountry = resolveProductCountry(f, item);
  if (setProductCountry) setProductCountry(productCountry || '');
  if (setPickupAddresses) {
    const normalized = normalizePickupAddressesForState(f?.pickupAddresses, productCountry);
    setPickupAddresses(normalized);
  }

  return f;
}
