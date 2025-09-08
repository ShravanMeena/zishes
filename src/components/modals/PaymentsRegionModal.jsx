import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../theme/colors';

export default function PaymentsRegionModal({ visible, onClose, title = 'Payments Coming Soon', message = 'Payments in your region will be available soon. Stripe support is on the way. For now, purchases are available only in India (via Razorpay).', primaryText = 'Got it' }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity onPress={onClose} style={styles.btn}><Text style={styles.btnTxt}>{primaryText}</Text></TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', borderRadius: 18, padding: 18 },
  title: { color: colors.white, fontSize: 18, fontWeight: '800' },
  message: { color: '#E6F0FF', marginTop: 8, lineHeight: 20 },
  btn: { marginTop: 16, backgroundColor: colors.black, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#343B49' },
  btnTxt: { color: colors.white, fontWeight: '800' },
});

