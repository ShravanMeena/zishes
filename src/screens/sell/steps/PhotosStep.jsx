import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal, Pressable, Alert, Platform } from 'react-native';
import { colors } from '../../../theme/colors';
import { launchCamera } from 'react-native-image-picker';
import useCameraPermission from '../../../hooks/useCameraPermission';
import { X, Trash2 } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addPhotos as addPhotosAction, removePhotoAt, setCoverIndex } from '../../../store/listingDraft/listingDraftSlice';

export default function PhotosStep() {
  const dispatch = useDispatch();
  const images = useSelector((s) => s.listingDraft.photos);

  const ensurePermission = useCameraPermission();
  const [previewIdx, setPreviewIdx] = useState(null);

  const addPhotos = async () => {
    const ok = await ensurePermission();
    if (!ok) return;
    try {
      const res = await launchCamera({
        mediaType: 'photo',
        quality: 0.9,
        cameraType: 'back',
        saveToPhotos: Platform.OS === 'android' ? Platform.Version <= 32 : true,
      });
      if (res?.didCancel) return;
      if (res?.errorCode) {
        Alert.alert('Unable to open camera', res.errorMessage || res.errorCode);
        return;
      }
      const next = (res?.assets || [])
        .filter((asset) => asset?.uri)
        .map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || asset.uri.split('/').pop() || `photo-${Date.now()}.jpg`,
          type: asset.type || (asset.fileName?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'),
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
        }));
      if (next.length) {
        dispatch(addPhotosAction(next));
      }
    } catch (err) {
      Alert.alert('Unable to add photo', err?.message || 'Please try again.');
    }
  };

  const removeAt = (idx) => dispatch(removePhotoAt(idx));
  const setCover = (idx) => dispatch(setCoverIndex(idx));
  const openPreview = (idx) => setPreviewIdx(idx);
  const closePreview = () => setPreviewIdx(null);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Image grid */}
      <View style={[styles.grid, images.length === 0 && styles.gridEmpty]}>
        {images.length > 0 ? (
          <>
            {images.map((img, idx) => (
              <View key={`${img.uri}-${idx}`} style={styles.imgWrap}>
                {idx === 0 ? (
                  <View style={styles.coverBadge}><Text style={styles.coverTxt}>Cover</Text></View>
                ) : null}
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.9} onPress={() => openPreview(idx)}>
                  <Image source={{ uri: img.uri }} style={styles.image} />
                </TouchableOpacity>
                <Pressable onPress={() => removeAt(idx)} style={styles.removeBtn} hitSlop={10}>
                  <X size={14} color={colors.white} />
                </Pressable>
              </View>
            ))}
            <TouchableOpacity style={[styles.imgWrap, styles.addWrap]} onPress={addPhotos}>
              <Text style={styles.addPlus}>+</Text>
              <Text style={styles.addTxt}>Add Image</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={[styles.addWrapLarge]} onPress={addPhotos}>
            <Text style={styles.addPlus}>+</Text>
            <Text style={styles.addTxt}>Add Image</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.hint}>Add clear photos; include front, back, and accessories. Good lighting helps!</Text>

      {/* Fullscreen Preview */}
      <Modal visible={previewIdx !== null} transparent onRequestClose={closePreview} animationType="fade">
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalBackdrop} onPress={closePreview} />
          <View style={styles.modalContent}>
            {previewIdx !== null && images[previewIdx] ? (
              <Image source={{ uri: images[previewIdx].uri }} style={styles.previewImage} resizeMode="contain" />
            ) : null}
            <View style={styles.modalActions}>
              {previewIdx !== null && previewIdx > 0 ? (
                <TouchableOpacity style={[styles.modalBtn, styles.primaryBtn]} onPress={() => { setCover(previewIdx); setPreviewIdx(0); }}>
                  <Text style={styles.modalBtnTxt}>Make Cover</Text>
                </TouchableOpacity>
              ) : <View style={{ flex: 1 }} />}
              {previewIdx !== null ? (
                <TouchableOpacity style={[styles.modalBtn, styles.deleteBtn]} onPress={() => { removeAt(previewIdx); closePreview(); }}>
                  <Trash2 size={16} color={colors.white} />
                  <Text style={[styles.modalBtnTxt, { marginLeft: 6 }]}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <Pressable onPress={closePreview} style={styles.closeBtn}>
              <X size={18} color={colors.white} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 120 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridEmpty: { justifyContent: 'center' },
  imgWrap: { width: '48%', aspectRatio: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: '#2B2F39', position: 'relative', marginBottom: 14 },
  image: { width: '100%', height: '100%' },
  coverBadge: { position: 'absolute', zIndex: 1, top: 10, left: 10, backgroundColor: '#8B5CF6', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  coverTxt: { color: colors.white, fontWeight: '800', fontSize: 12 },
  addWrap: { borderWidth: 2, borderColor: '#636B7A', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addWrapLarge: { width: 220, height: 220, borderRadius: 18, borderWidth: 2, borderColor: '#636B7A', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2B2F39' },
  addPlus: { color: colors.white, fontSize: 32, fontWeight: '700', marginBottom: 6 },
  addTxt: { color: colors.textSecondary, fontWeight: '600' },
  hint: { color: colors.textSecondary, textAlign: 'center', marginTop: 16 },
  removeBtn: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '92%', height: '78%', borderRadius: 16, backgroundColor: '#11141a', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', height: '100%' },
  closeBtn: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  modalActions: { position: 'absolute', bottom: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },
  primaryBtn: { backgroundColor: colors.primary, borderColor: colors.primary },
  deleteBtn: { backgroundColor: '#4E4E56', borderColor: '#4E4E56' },
  modalBtnTxt: { color: colors.white, fontWeight: '800' },
});
