import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Image } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, ChevronDown, Paperclip } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import useGalleryPermission from '../../hooks/useGalleryPermission';

export default function ReportIssueScreen({ navigation }) {
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [showCat, setShowCat] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const ensurePerm = useGalleryPermission();
  const categories = useMemo(() => ['Bug', 'Payment', 'Account', 'Listing', 'Other'], []);

  const addAttachments = async () => {
    const ok = await ensurePerm();
    if (!ok) return;
    const res = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 0 });
    if (res?.assets?.length) {
      setAttachments((p) => [...p, ...res.assets.map((a) => ({ uri: a.uri }))]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Report an Issue</Text>
        <View style={{ width: 32 }} />
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
          <TouchableOpacity style={[styles.input, styles.select]} onPress={() => setShowCat(true)}>
            <Text style={[styles.selectTxt, { color: category ? colors.white : colors.textSecondary }]}>{category || 'Select a category...'}</Text>
            <ChevronDown size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Attachments (Optional)</Text>
          <TouchableOpacity style={styles.attachBtn} onPress={addAttachments}>
            <Paperclip size={18} color={colors.white} />
            <Text style={styles.attachTxt}>Attach Screenshots or Files</Text>
          </TouchableOpacity>
          {attachments.length ? (
            <View style={styles.attachGrid}>
              {attachments.map((a, i) => (
                <Image key={`${a.uri}-${i}`} source={{ uri: a.uri }} style={styles.thumb} />
              ))}
            </View>
          ) : null}
          <Text style={styles.hint}>Supported formats: Images (PNG, JPG). Max size: 5MB.</Text>
        </View>

        <TouchableOpacity style={[styles.btn, styles.primary]}><Text style={styles.btnTxt}>Submit Report</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={() => navigation.goBack()}><Text style={styles.btnTxt}>Cancel</Text></TouchableOpacity>
      </KeyboardAwareScrollView>

      <PickerModal
        visible={showCat}
        title="Select Category"
        options={categories}
        onClose={() => setShowCat(false)}
        onSelect={(v) => { setCategory(v); setShowCat(false); }}
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

  card: { backgroundColor: '#2B2F39', borderRadius: 16, borderWidth: 1, borderColor: '#343B49', padding: 16, marginBottom: 14 },
  cardTitle: { color: colors.white, fontWeight: '900', fontSize: 20, marginBottom: 8 },
  label: { color: colors.white, marginBottom: 8, fontWeight: '700' },
  input: { backgroundColor: '#1E2128', borderWidth: 1, borderColor: '#3A4051', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: colors.white },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectTxt: { fontWeight: '600' },
  attachBtn: { borderWidth: 1, borderColor: '#6A55D9', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: '#2B2F39' },
  attachTxt: { color: colors.white, fontWeight: '800' },
  attachGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  thumb: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#333' },
  hint: { color: colors.textSecondary, marginTop: 10 },

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
