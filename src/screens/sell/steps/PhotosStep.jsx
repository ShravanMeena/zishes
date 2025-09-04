import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal, Pressable, Dimensions } from 'react-native';
import { colors } from '../../../theme/colors';
import { launchImageLibrary } from 'react-native-image-picker';
import useGalleryPermission from '../../../hooks/useGalleryPermission';
import { X, Trash2 } from 'lucide-react-native';

export default function PhotosStep() {
  const [images, setImages] = useState([
    // Previews so the layout matches the screenshot; users can replace
    { uri: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400' },
    { uri: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400' },
    { uri: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400' },
  ]);

  const ensurePermission = useGalleryPermission();
  const [previewIdx, setPreviewIdx] = useState(null);

  const addPhotos = async () => {
    const ok = await ensurePermission();
    if (!ok) return;
    const res = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 0, quality: 0.9 });
    if (res?.assets?.length) {
      const next = res.assets.map((a) => ({ uri: a.uri }));
      setImages((prev) => [...prev, ...next]);
    }
  };

  const removeAt = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx));
  const setCover = (idx) => setImages((prev) => [prev[idx], ...prev.filter((_, i) => i !== idx)]);
  const openPreview = (idx) => setPreviewIdx(idx);
  const closePreview = () => setPreviewIdx(null);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Image grid */}
      <View style={styles.grid}>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  imgWrap: { width: '47%', aspectRatio: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: '#2B2F39', position: 'relative' },
  image: { width: '100%', height: '100%' },
  coverBadge: { position: 'absolute', zIndex: 1, top: 10, left: 10, backgroundColor: '#8B5CF6', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  coverTxt: { color: colors.white, fontWeight: '800', fontSize: 12 },
  addWrap: { borderWidth: 2, borderColor: '#636B7A', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
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
