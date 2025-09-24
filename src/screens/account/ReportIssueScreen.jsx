import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Image, ActivityIndicator, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, ChevronDown, Paperclip } from 'lucide-react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import useGalleryPermission from '../../hooks/useGalleryPermission';
import useCameraPermission from '../../hooks/useCameraPermission';
import ImagePickerSheet from '../../components/common/ImagePickerSheet';
import { uploadImage } from '../../services/uploads';
import issues from '../../services/issues';
import CongratsModal from '../../components/modals/CongratsModal';

export default function ReportIssueScreen({ navigation, route }) {
  const headerTitle = route?.params?.headerTitle || 'Support';
  const presetCategory = route?.params?.presetCategory;
  const fallbackTab = route?.params?.fallbackTab;
  const fallbackScreen = route?.params?.fallbackScreen;
  const fallbackParams = route?.params?.fallbackParams;
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState(presetCategory || '');
  const [showCat, setShowCat] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const ensureGallery = useGalleryPermission();
  const ensureCamera = useCameraPermission();
  const [pickerOpen, setPickerOpen] = useState(false);
  const categories = useMemo(() => ['Bug', 'Payment', 'Account', 'Listing', 'Other'], []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0); // 0..1
  const [successOpen, setSuccessOpen] = useState(false);

  const MAX_ATTACHMENTS = 5;

  const goBackSafe = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    const parent = navigation.getParent?.();
    if (fallbackTab && fallbackScreen && parent?.navigate) {
      parent.navigate(fallbackTab, { screen: fallbackScreen, params: fallbackParams || {} });
      return;
    }
    if (parent?.navigate) {
      parent.navigate('Home', { screen: 'HomeIndex' });
    }
  }, [navigation, fallbackTab, fallbackScreen, fallbackParams]);

  useEffect(() => {
    if (presetCategory) setCategory(presetCategory);
  }, [presetCategory]);

  const handlePickerResult = (assets = []) => {
    const usable = assets.filter((a) => a?.uri);
    if (!usable.length) return;
    setAttachments((prev) => {
      const remaining = MAX_ATTACHMENTS - prev.length;
      if (remaining <= 0) {
        Alert.alert('Attachment limit reached', `You can attach up to ${MAX_ATTACHMENTS} images per report.`);
        return prev;
      }
      const next = usable.slice(0, remaining).map((a) => ({ uri: a.uri }));
      return [...prev, ...next];
    });
  };

  const addAttachments = async () => { setPickerOpen(true); };
  const pickFromGallery = async () => {
    const ok = await ensureGallery();
    if (!ok) return;
    const remaining = MAX_ATTACHMENTS - attachments.length;
    if (remaining <= 0) {
      Alert.alert('Attachment limit reached', `You can attach up to ${MAX_ATTACHMENTS} images per report.`);
      return;
    }
    try {
      const res = await launchImageLibrary({ mediaType: 'photo', selectionLimit: remaining, quality: 0.85 });
      if (res?.errorCode) {
        if (res.errorCode === 'permission') {
          Alert.alert('Permission needed', 'Photos access is required to attach screenshots.');
        }
        return;
      }
      if (res?.assets?.length) handlePickerResult(res.assets);
    } catch (e) {
      Alert.alert('Unable to open gallery', e?.message || 'Please try again.');
    }
  };
  const pickFromCamera = async () => {
    const ok = await ensureCamera();
    if (!ok) return;
    const remaining = MAX_ATTACHMENTS - attachments.length;
    if (remaining <= 0) {
      Alert.alert('Attachment limit reached', `You can attach up to ${MAX_ATTACHMENTS} images per report.`);
      return;
    }
    try {
      const res = await launchCamera({ mediaType: 'photo', quality: 0.85, cameraType: 'back', saveToPhotos: true });
      if (res?.errorCode) {
        if (res.errorCode === 'permission') {
          Alert.alert('Permission needed', 'Camera access is required to capture photos.');
        }
        return;
      }
      if (res?.assets?.length) handlePickerResult(res.assets);
    } catch (e) {
      Alert.alert('Unable to open camera', e?.message || 'Please try again.');
    }
  };

  const removeAttachmentAt = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    setError(null);
    if (!desc.trim() || !category.trim()) {
      setError('Please provide a description and select a category.');
      return;
    }
    try {
      setSubmitting(true);
      setProgress(0);
      // Upload attachments first, if any
      let urls = [];
      if (attachments.length) {
        const total = attachments.length;
        for (let i = 0; i < total; i++) {
          const a = attachments[i];
          try {
            const res = await uploadImage({ uri: a.uri });
            if (res?.url) urls.push(res.url);
          } catch (e) {
            // If any upload fails, stop and show error
            throw new Error(e?.message || 'Failed to upload attachment');
          }
          setProgress((i + 1) / total);
        }
      }
      // Create the issue
      await issues.createIssue({ description: desc.trim(), category: category.trim(), attachments: urls });
      setSuccessOpen(true);
      // Reset form
      setDesc('');
      setCategory('');
      setAttachments([]);
    } catch (e) {
      setError(e?.message || 'Failed to submit issue');
    } finally {
      setSubmitting(false);
      setProgress(0);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBackSafe} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('IssueHistory')}>
          <Text style={styles.historyTxt}>My Reports</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }} keyboardShouldPersistTaps="handled" enableOnAndroid extraScrollHeight={20}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Issue Details</Text>

          <Text style={styles.label}>Issue Description</Text>
          <TextInput
            value={desc}
            onChangeText={setDesc}
            placeholder="Describe the problem you are experiencing, including steps to reproduce, what you expected to happen, and what actually happened."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={5}
            style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
          />

          <Text style={styles.label}>Category</Text>
          <TouchableOpacity style={[styles.input, styles.select]} onPress={() => setShowCat(true)} disabled={submitting}>
            <Text style={[styles.selectTxt, { color: category ? colors.white : colors.textSecondary }]}>{category || 'Select a category...'}</Text>
            <ChevronDown size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          {error ? <Text style={styles.errorTxt}>{error}</Text> : null}
          {submitting ? (
            <View style={{ marginTop: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color={colors.primary} />
                <Text style={{ color: colors.textSecondary }}>Submitting...</Text>
              </View>
              {attachments.length ? (
                <View style={{ height: 8, backgroundColor: '#3A4051', borderRadius: 6, marginTop: 8 }}>
                  <View style={{ height: 8, backgroundColor: colors.primary, width: `${Math.round(progress * 100)}%`, borderRadius: 6 }} />
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Attachments (Optional)</Text>
          <TouchableOpacity style={styles.attachBtn} onPress={addAttachments} disabled={submitting}>
            <Paperclip size={18} color={colors.white} />
            <Text style={styles.attachTxt}>Attach Screenshots or Files</Text>
          </TouchableOpacity>
          {attachments.length ? (
            <View style={styles.attachGrid}>
              {attachments.map((a, i) => (
                <TouchableOpacity key={`${a.uri}-${i}`} onPress={() => removeAttachmentAt(i)} activeOpacity={0.85} style={styles.attachmentWrap}>
                  <Image source={{ uri: a.uri }} style={styles.thumb} />
                  <Text style={styles.removeHint}>Remove</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          <Text style={styles.hint}>Supported formats: Images (PNG, JPG). Max size: 5MB.</Text>
        </View>

        <TouchableOpacity
          style={[styles.btn, styles.primary, (!desc.trim() || !category.trim() || submitting) && { opacity: 0.6 }]}
          disabled={!desc.trim() || !category.trim() || submitting}
          onPress={submit}
        >
          <Text style={styles.btnTxt}>{submitting ? 'Submitting...' : 'Submit Report'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={goBackSafe}><Text style={styles.btnTxt}>Cancel</Text></TouchableOpacity>
      </KeyboardAwareScrollView>

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
        title="Add Attachment"
      />

      <PickerModal
        visible={showCat}
        title="Select Category"
        options={categories}
        onClose={() => setShowCat(false)}
        onSelect={(v) => { setCategory(v); setShowCat(false); }}
      />

      <CongratsModal
        visible={successOpen}
        title="Issue Reported"
        message="Thanks! Your report has been submitted. Our team will review it shortly."
        primaryText="Done"
        onPrimary={() => { setSuccessOpen(false); goBackSafe(); }}
        onRequestClose={() => setSuccessOpen(false)}
      />
    </SafeAreaView>
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
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },
  historyBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49' },
  historyTxt: { color: colors.accent, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 },

  card: { backgroundColor: '#2B2F39', borderRadius: 16, borderWidth: 1, borderColor: '#343B49', padding: 16, marginBottom: 14 },
  cardTitle: { color: colors.white, fontWeight: '900', fontSize: 20, marginBottom: 8 },
  label: { color: colors.white, marginBottom: 8, fontWeight: '700' },
  input: { backgroundColor: '#1E2128', borderWidth: 1, borderColor: '#3A4051', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: colors.white },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectTxt: { fontWeight: '600' },
  attachBtn: { borderWidth: 1, borderColor: '#6A55D9', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: '#2B2F39' },
  attachTxt: { color: colors.white, fontWeight: '800' },
  attachGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  attachmentWrap: { alignItems: 'center' },
  thumb: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#333' },
  removeHint: { color: colors.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 4 },
  hint: { color: colors.textSecondary, marginTop: 10 },
  errorTxt: { color: '#FF7A7A', marginTop: 8 },

  btn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  primary: { backgroundColor: colors.primary },
  cancel: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49' },
  btnTxt: { color: colors.white, fontWeight: '800' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#1E2128', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#343B49' },
  modalTitle: { color: colors.white, fontWeight: '800', fontSize: 16, marginBottom: 8 },
  optionRow: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2B2F39' },
  optionTxt: { color: colors.white, fontWeight: '600' },
});
