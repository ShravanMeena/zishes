import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';

export default function AppModal({ visible, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, children, confirmLoading = false }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.contentWrap}>
            <ScrollView
              showsVerticalScrollIndicator
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              {children}
            </ScrollView>
          </View>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btn, styles.cancel, confirmLoading && { opacity: 0.6 }]} onPress={onCancel} disabled={confirmLoading}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.confirm, confirmLoading && { opacity: 0.85 }]} onPress={onConfirm} disabled={confirmLoading}>
              {confirmLoading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator color={colors.white} style={{ marginRight: 8 }} />
                  <Text style={styles.confirmText}>Joining…</Text>
                </View>
              ) : (
                <Text style={styles.confirmText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#1F232C', borderRadius: 14, padding: 16, width: '100%', borderWidth: 1, borderColor: '#2E3440', maxHeight: '80%' },
  title: { color: colors.white, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  message: { color: colors.textSecondary, marginBottom: 16 },
  contentWrap: { flexShrink: 1, marginBottom: 12, minHeight: 0 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  cancel: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#3A4051' },
  confirm: { backgroundColor: colors.primary },
  cancelText: { color: colors.white, fontWeight: '600' },
  confirmText: { color: colors.white, fontWeight: '700' },
});
