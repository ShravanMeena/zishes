import React from 'react';
import { Modal, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { ShieldCheck } from 'lucide-react-native';

export default function ProcessingPaymentModal({ visible, title, message }) {
  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="fade"
      // Block back button dismissal on Android by not toggling visible here
      onRequestClose={() => { /* intentionally noop to prevent closing */ }}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}><ShieldCheck size={28} color={colors.white} /></View>
          <Text style={styles.title}>{title || 'Preparing Secure Checkout'}</Text>
          <Text style={styles.subtitle}>
            {message || 'We’re setting things up with our payment partner. This only takes a moment. Please keep the app open.'}
          </Text>
          <ActivityIndicator color={colors.white} style={{ marginTop: 14 }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  card: { width: '84%', backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 18, padding: 16, alignItems: 'center' },
  iconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.white, fontWeight: '800', fontSize: 18, marginTop: 12, textAlign: 'center' },
  subtitle: { color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
});

