import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Modal, Pressable } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, Bell, Camera, Calendar, ChevronDown, X } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import useGalleryPermission from '../../hooks/useGalleryPermission';
import DatePickerModal, { formatDateYYYYMMDD } from '../../components/ui/DatePickerModal';

export default function UploadProofScreen({ route, navigation }) {
  const { item } = route.params || {};
  const ensurePerm = useGalleryPermission();
  const [awb, setAwb] = useState('');
  const [courier, setCourier] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [handover, setHandover] = useState(null);
  const [date, setDate] = useState('');
  const [comment, setComment] = useState('');
  const [showDate, setShowDate] = useState(false);
  const [showCourier, setShowCourier] = useState(false);
  const [preview, setPreview] = useState(null); // 'receipt' | 'handover' | null
  const couriers = useMemo(() => ['DTDC', 'Delhivery', 'BlueDart', 'India Post', 'Other'], []);

  const pick = async (setter) => {
    const ok = await ensurePerm();
    if (!ok) return;
    const res = await launchImageLibrary({ mediaType: 'photo' });
    if (res?.assets?.length) setter({ uri: res.assets[0].uri });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Proof of Delivery</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home', { screen: 'Notifications' })}>
          <Bell size={18} color={colors.white} />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }} keyboardShouldPersistTaps="handled" enableOnAndroid extraScrollHeight={20}>
        {/* Item banner */}
        <View style={styles.banner}>
          <Image source={{ uri: item?.image }} style={styles.bannerImg} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.bannerTitle}>{item?.title || 'Item'}</Text>
            <View style={styles.pending}><Text style={styles.pendingTxt}>Pending</Text></View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>For Domestic Couriers</Text>
        <View style={styles.card}>
          <Text style={styles.label}>AWB / Tracking Number</Text>
          <TextInput value={awb} onChangeText={setAwb} placeholder="Enter AWB or tracking number" placeholderTextColor={colors.textSecondary} style={styles.input} />
          <Text style={styles.label}>Courier</Text>
          <TouchableOpacity style={[styles.input, styles.select]} onPress={() => setShowCourier(true)}>
            <Text style={[styles.selTxt, { color: courier ? colors.white : colors.textSecondary }]}>{courier || 'Select courier'}</Text>
            <ChevronDown size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadRow} onPress={() => pick(setReceipt)}>
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
        </View>

        <Text style={styles.sectionTitle}>For Local Pick Up</Text>
        <TouchableOpacity style={styles.uploadRow} onPress={() => pick(setHandover)}>
          <Camera size={16} color={colors.white} />
          <Text style={styles.uploadTxt}>{handover ? 'Change Handover Photo' : 'Package Handover Photo'}</Text>
        </TouchableOpacity>
        {handover ? (
          <View style={styles.thumbWrap}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.9} onPress={() => setPreview('handover')}>
              <Image source={{ uri: handover.uri }} style={styles.thumb} />
            </TouchableOpacity>
            <Pressable style={styles.removeBtn} onPress={() => setHandover(null)}>
              <X size={14} color={colors.white} />
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.card, { marginTop: 16 }]}> 
          <Text style={styles.label}>Delivery Date</Text>
          <TouchableOpacity style={[styles.input, styles.select]} onPress={() => setShowDate(true)}>
            <Text style={styles.selTxt}>{date || 'Select a date'}</Text>
            <Calendar size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Comments</Text>
        <TextInput value={comment} onChangeText={setComment} placeholder="Add any additional delivery notes here..." placeholderTextColor={colors.textSecondary} style={[styles.input, { height: 100, textAlignVertical: 'top' }]} multiline />

        <TouchableOpacity style={[styles.btn, styles.primary]}><Text style={styles.btnTxt}>Submit Proof</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.cancel]}><Text style={styles.btnTxt}>Save Draft</Text></TouchableOpacity>
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
            <Pressable style={styles.previewClose} onPress={() => setPreview(null)}>
              <X size={18} color={colors.white} />
            </Pressable>
          </View>
        </View>
      </Modal>
      <DatePickerModal visible={showDate} value={date ? new Date(date) : new Date()} onClose={() => setShowDate(false)} onConfirm={(d) => { setDate(formatDateYYYYMMDD(d)); setShowDate(false); }} />
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
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },

  banner: { backgroundColor: '#2B2F39', borderRadius: 12, borderWidth: 1, borderColor: '#343B49', padding: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  bannerImg: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#333' },
  bannerTitle: { color: colors.white, fontWeight: '800' },
  pending: { backgroundColor: '#FFD166', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  pendingTxt: { color: '#5C4100', fontWeight: '800' },

  sectionTitle: { color: colors.white, fontWeight: '800', fontSize: 16, marginVertical: 8 },
  card: { backgroundColor: '#2B2F39', borderRadius: 12, borderWidth: 1, borderColor: '#343B49', padding: 12, marginBottom: 12 },
  label: { color: colors.white, marginTop: 6, marginBottom: 8, fontWeight: '700' },
  input: { backgroundColor: '#1E2128', borderWidth: 1, borderColor: '#3A4051', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: colors.white },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selTxt: { color: colors.white },
  uploadRow: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#3A4051', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 10 },
  uploadTxt: { color: colors.white, fontWeight: '800' },
  thumbWrap: { width: 120, height: 120, borderRadius: 12, overflow: 'hidden', marginTop: 10, backgroundColor: '#1E2128', position: 'relative' },
  thumb: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },

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
});
