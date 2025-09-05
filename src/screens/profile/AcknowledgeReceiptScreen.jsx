import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, Bell, Camera, Calendar } from 'lucide-react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import useGalleryPermission from '../../hooks/useGalleryPermission';
import useCameraPermission from '../../hooks/useCameraPermission';
import ImagePickerSheet from '../../components/common/ImagePickerSheet';
import DatePickerModal, { formatDateYYYYMMDD } from '../../components/ui/DatePickerModal';

export default function AcknowledgeReceiptScreen({ route, navigation }) {
  const { item } = route?.params || {};
  const ensureGallery = useGalleryPermission();
  const ensureCamera = useCameraPermission();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [images, setImages] = useState([]); // array of { uri }
  const [date, setDate] = useState('');
  const [comment, setComment] = useState('');
  const [showDate, setShowDate] = useState(false);

  const banner = useMemo(() => {
    const title = item?.product?.name || item?.game?.name || item?.tournament?.game?.name || 'Item';
    const image = (Array.isArray(item?.product?.images) && item.product.images[0]) || item?.game?.thumbnail || item?.tournament?.game?.thumbnail;
    return { title, image };
  }, [item]);

  const pickFromGallery = async () => {
    const ok = await ensureGallery();
    if (!ok) return;
    const res = await launchImageLibrary({ mediaType: 'photo' });
    if (res?.assets?.length) setImages((p) => [...p, ...res.assets.map(a => ({ uri: a.uri }))]);
  };
  const pickFromCamera = async () => {
    const ok = await ensureCamera();
    if (!ok) return;
    const res = await launchCamera({ mediaType: 'photo', cameraType: 'back', quality: 0.9, saveToPhotos: true });
    if (res?.assets?.length) setImages((p) => [...p, ...res.assets.map(a => ({ uri: a.uri }))]);
  };

  const submit = () => {
    // TODO: Hook up to backend endpoint when available
    // For now, just pop and maybe show toast in future
    navigation.goBack();
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

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 160 }} keyboardShouldPersistTaps="handled">
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

        {/* Date */}
        <Text style={styles.sectionTitle}>Delivery Date</Text>
        <TouchableOpacity style={[styles.input, styles.select]} onPress={() => setShowDate(true)}>
          <Text style={[styles.selTxt, { color: date ? colors.white : colors.textSecondary }]}>{date || 'Select date'}</Text>
          <Calendar size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Proof Images */}
        <Text style={styles.sectionTitle}>Proof of Acknowledgement</Text>
        <TouchableOpacity style={styles.uploadRow} onPress={() => setPickerOpen(true)}>
          <Camera size={16} color={colors.white} />
          <Text style={styles.uploadTxt}>{images.length ? 'Add More Photos' : 'Upload Photos'}</Text>
        </TouchableOpacity>
        {images.length ? (
          <View style={styles.grid}>
            {images.map((img, i) => (
              <Image key={`${img.uri}-${i}`} source={{ uri: img.uri }} style={styles.thumb} />
            ))}
          </View>
        ) : null}

        {/* Comment */}
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

        {/* Actions */}
        <TouchableOpacity style={[styles.btn, styles.primary]} onPress={submit}><Text style={styles.btnTxt}>Submit Acknowledgement</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={() => navigation.goBack()}><Text style={styles.btnTxt}>Cancel</Text></TouchableOpacity>
      </ScrollView>

      <DatePickerModal
        visible={showDate}
        value={date ? new Date(date) : new Date()}
        onClose={() => setShowDate(false)}
        onConfirm={(d) => { setDate(formatDateYYYYMMDD(d)); setShowDate(false); }}
      />
      <ImagePickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPickCamera={() => { setPickerOpen(false); setTimeout(() => { pickFromCamera(); }, 300); }}
        onPickGallery={() => { setPickerOpen(false); setTimeout(() => { pickFromGallery(); }, 300); }}
        title="Upload Proof"
      />
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  thumb: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#333' },

  btn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  primary: { backgroundColor: colors.primary },
  cancel: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49' },
  btnTxt: { color: colors.white, fontWeight: '800' },
});

