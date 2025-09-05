import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet from './BottomSheet';
import { colors } from '../../theme/colors';
import { Image as ImageIcon, Camera } from 'lucide-react-native';

export default function ImagePickerSheet({ visible, onClose, onPickCamera, onPickGallery, title = 'Add Photo' }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} full={false} showClose>
      <Text style={styles.title}>{title}</Text>
      <View style={{ height: 8 }} />
      <TouchableOpacity style={styles.row} onPress={onPickCamera}>
        <View style={styles.iconWrap}><Camera size={18} color={colors.white} /></View>
        <Text style={styles.rowText}>Take Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={onPickGallery}>
        <View style={styles.iconWrap}><ImageIcon size={18} color={colors.white} /></View>
        <Text style={styles.rowText}>Choose from Gallery</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.white, fontWeight: '800', fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  iconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', marginRight: 10, borderWidth: 1, borderColor: '#343B49' },
  rowText: { color: colors.white, fontWeight: '700' },
});

