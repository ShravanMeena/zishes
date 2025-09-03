import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppModal from '../common/AppModal';
import { colors } from '../../theme/colors';

export default function RulesModal({ visible, onCancel, onConfirm, title = 'Tournament Rules' }) {
  return (
    <AppModal
      visible={visible}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={title}
      confirmText="Play Now"
      cancelText="Back"
    >
      <View style={styles.box}>
        <Text style={styles.p}>Limited Entries → Each tournament has a fixed number of slots.</Text>
        <Text style={styles.p}>Entry Fee → Coins are deducted from your Zish Wallet when you join.</Text>
        <Text style={styles.p}>Refunds → If cancelled or not filled, coins return to your wallet (no cash refunds).</Text>
        <Text style={styles.p}>Fair Play → All players and sellers must follow Zishes rules.</Text>
        <Text style={[styles.p, { fontWeight: '700' }]}>Prize → The listed item is the prize.</Text>
      </View>
      <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
        By entering, you confirm you understand the tournament rules and game instructions.
      </Text>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#2B2F39', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#343B49', marginBottom: 12 },
  p: { color: colors.white, marginBottom: 6 },
});
