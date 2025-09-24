import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { colors } from '../../theme/colors';

export default function ResetLinkModal({ visible, onClose, onGoToLogin, email }) {
  const openMail = () => {
    Linking.openURL('mailto:').catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Reset Link Sent</Text>
          <Text style={styles.body}>
            We just emailed password reset instructions to
            {'\n'}
            <Text style={styles.bold}>{email || 'your email address'}.</Text>
            {'\n'}
            Follow the link on the web to set a new password. If you don't see it in a few minutes, check your spam folder.
          </Text>
          <TouchableOpacity style={styles.mailBtn} onPress={openMail}>
            <Text style={styles.mailBtnText}>Open Mail App</Text>
          </TouchableOpacity>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={onClose}>
              <Text style={styles.secondaryText}>Stay Here</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.primary]} onPress={onGoToLogin}>
              <Text style={styles.primaryText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', backgroundColor: '#1F232C', borderRadius: 18, borderWidth: 1, borderColor: '#343B49', padding: 20 },
  title: { color: colors.white, fontWeight: '800', fontSize: 20, marginBottom: 12 },
  body: { color: colors.textSecondary, lineHeight: 20, marginBottom: 18 },
  bold: { color: colors.white, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 12 },
  btn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  secondary: { borderWidth: 1, borderColor: '#3A4051', backgroundColor: '#2B2F39' },
  secondaryText: { color: colors.textSecondary, fontWeight: '700' },
  primary: { backgroundColor: colors.primary },
  primaryText: { color: colors.white, fontWeight: '800' },
  mailBtn: { alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#3A4051' },
  mailBtnText: { color: colors.accent, fontWeight: '700' },
});
