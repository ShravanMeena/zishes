import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { X } from 'lucide-react-native';

export default function FAQSheet({ visible, onClose, loading, items }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>FAQs</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loaderText}>Loading FAQs…</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              {(items || []).map((faq) => (
                <View key={faq?._id || faq?.title} style={styles.item}>
                  <Text style={styles.itemTitle}>{faq?.title || 'FAQ'}</Text>
                  <Text style={styles.itemBody}>{faq?.message || '—'}</Text>
                </View>
              ))}
              {(items || []).length === 0 ? (
                <Text style={styles.emptyTxt}>No FAQs available right now.</Text>
              ) : null}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(4, 6, 12, 0.6)',
  },
  scrim: { flex: 1 },
  sheet: {
    backgroundColor: '#141925',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 16,
    maxHeight: '70%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1F2433',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { color: colors.white, fontWeight: '800', fontSize: 18 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1E2434', alignItems: 'center', justifyContent: 'center' },
  loaderWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  loaderText: { color: colors.textSecondary, marginTop: 12 },
  item: { marginBottom: 18, backgroundColor: '#1A1F2D', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#20283A' },
  itemTitle: { color: colors.white, fontWeight: '700', marginBottom: 8, fontSize: 16 },
  itemBody: { color: colors.textSecondary, lineHeight: 20 },
  emptyTxt: { color: colors.textSecondary, textAlign: 'center', paddingVertical: 24 },
});

