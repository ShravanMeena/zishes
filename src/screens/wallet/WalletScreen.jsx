import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../theme/colors';
import Button from '../../components/ui/Button';
import { Bell } from 'lucide-react-native';

export default function WalletScreen({ navigation }) {
  const packs = useMemo(() => ([
    { id: 'p1', coins: 500, price: 'INR 100' },
    { id: 'p2', coins: 1000, price: 'INR 1,000' },
    { id: 'p3', coins: 2500, price: 'INR 2,500' },
  ]), []);

  const withdrawals = useMemo(() => ([
    { id: 'w1', title: 'Vintage Leather Jacket', amount: 'INR 45,000', status: 'pending', image: 'https://images.unsplash.com/photo-1520975922221-23a9d23708c5?w=300&q=80' },
    { id: 'w2', title: 'Gaming PC Setup', amount: 'INR 30,000', status: 'approved', image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300&q=80' },
    { id: 'w3', title: 'Collectible Action Figure', amount: 'INR 2,000', status: 'rejected', image: 'https://images.unsplash.com/photo-1614286091228-c481b92a8eb0?w=300&q=80' },
    { id: 'w4', title: 'Hermes Togo Birkin', amount: 'INR 20,00,000', status: 'approved', image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=300&q=80' },
  ]), []);

  const history = useMemo(() => ([
    { id: 'h1', title: 'Coin Pack', date: '2024-07-28', delta: '+ 500', unit: 'Coins', color: '#27c07d' },
    { id: 'h2', title: 'Game Play - Prod Id : 763976565', date: '2024-07-27', delta: '- 20', unit: 'Coins', color: '#FF7A7A' },
    { id: 'h3', title: 'Game Play - Prod Id : 763976565', date: '2024-07-27', delta: '- 10', unit: 'Coins', color: '#FF7A7A' },
    { id: 'h4', title: 'Payout - Prod Id : 763976786', date: '2024-08-29', delta: '+ 30,000', unit: 'INR', color: '#27c07d' },
  ]), []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Bell size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Balances Row */}
        <View style={styles.row2}>
          <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{x:0,y:0}} end={{x:1,y:1}} style={[styles.balanceCard, { marginRight: 8 }] }>
            <View style={styles.coinBadge}><Text style={styles.coinBadgeText}>Z</Text></View>
            <Text style={styles.balanceTitle}>ZishCoin Balance</Text>
            <Text style={styles.balanceQty}>12,450</Text>
            <Text style={styles.balanceUnit}>Zishcoin</Text>
            <Text style={styles.balanceCaption}>Use for gameplay and entries only. Non-withdrawable.</Text>
          </LinearGradient>

          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('PaymentMethods')} style={{ flex: 1 }}>
            <View style={[styles.balanceCard, { backgroundColor: '#16a085', marginLeft: 8 }] }>
            <Text style={[styles.balanceTitle, { marginTop: 8 }]}>Withdrawal Balance</Text>
            <Text style={styles.balanceQty}>5,700</Text>
            <Text style={styles.balanceUnit}>INR</Text>
            <Text style={styles.balanceCaption}>Available to withdraw once confirmed receipt by winner</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Buy ZishCoin */}
        <Text style={styles.sectionTitle}>Buy ZishCoin</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
          {packs.map((p, i) => (
            <View key={p.id} style={[styles.packCard, i>0 && { marginLeft: 12 }]}>
              <View style={styles.packBadge}><Text style={styles.coinBadgeText}>Z</Text></View>
              <Text style={styles.packQty}>{p.coins.toLocaleString()} Coins</Text>
              <Text style={styles.packPrice}>{p.price}</Text>
              <Button title="Buy Now" onPress={() => navigation.navigate('BuyCoins')} style={{ marginTop: 10 }} />
            </View>
          ))}
        </ScrollView>

        {/* Withdrawals (Seller only) */}
        <Text style={styles.sectionTitle}>Withdrawals (Seller only)</Text>
        <View style={styles.panel}>
          {withdrawals.map((w, idx) => (
            <View key={w.id} style={[styles.withdrawRow, idx>0 && styles.rowDivider]}>
              <Image source={{ uri: w.image }} style={styles.thumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.withdrawTitle} numberOfLines={2}>{w.title}</Text>
                <Text style={styles.withdrawAmount}>{w.amount}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <StatusChip status={w.status} />
                <ActionButton
                  status={w.status}
                  onPress={() => {
                    if (w.status === 'approved') {
                      navigation.navigate('PaymentMethods');
                    } else if (w.status === 'pending') {
                      navigation.navigate('UploadProof', { item: w });
                    }
                  }}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Transaction History */}
        <Text style={styles.sectionTitle}>Transaction History</Text>
        <View style={styles.panel}>
          {history.map((h, idx) => (
            <View key={h.id} style={[styles.txnRow, idx>0 && styles.rowDivider]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.txnTitle} numberOfLines={1}>{h.title}</Text>
                <Text style={styles.txnDate}>{h.date}</Text>
              </View>
              <Text style={[styles.txnDelta, { color: h.color }]}>{h.delta} <Text style={styles.txnUnit}>{h.unit}</Text></Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function StatusChip({ status }) {
  const map = {
    pending: { text: 'Pending', bg: '#E2B93B' },
    approved: { text: 'Approved', bg: '#2E7D32' },
    rejected: { text: 'Rejected', bg: '#C65B5B' },
  };
  const s = map[status] || map.pending;
  return (
    <View style={[styles.chip, { backgroundColor: s.bg }]}>
      <Text style={styles.chipText}>{s.text}</Text>
    </View>
  );
}

function ActionButton({ status, onPress }) {
  const title = status === 'pending' ? 'Upload Proof' : status === 'approved' ? 'Withdraw' : status === 'rejected' ? 'View Details' : 'Paid';
  const bg = status === 'approved' ? '#16a085' : status === 'pending' ? '#5E6AD2' : status === 'rejected' ? '#4E4E56' : '#2E7D32';
  return (
    <TouchableOpacity style={[styles.smallBtn, { backgroundColor: bg }]} onPress={onPress}>
      <Text style={styles.smallBtnText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },

  row2: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 12 },
  balanceCard: { flex: 1, borderRadius: 16, padding: 14, backgroundColor: '#3A8B8B' },
  coinBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  coinBadgeText: { color: colors.white, fontWeight: '900' },
  balanceTitle: { color: colors.white, opacity: 0.9, fontWeight: '700' },
  balanceQty: { color: colors.white, fontWeight: '900', fontSize: 28, marginTop: 6 },
  balanceUnit: { color: colors.white, fontWeight: '700' },
  balanceCaption: { color: '#E5E7EB', marginTop: 8 },

  sectionTitle: { color: colors.white, fontWeight: '800', fontSize: 18, paddingHorizontal: 12, marginTop: 14 },

  packCard: { width: 160, backgroundColor: '#2B2F39', borderRadius: 16, borderWidth: 1, borderColor: '#343B49', padding: 14, marginVertical: 12 },
  packBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3A2B52', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 6 },
  packQty: { color: colors.white, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  packPrice: { color: colors.textSecondary, textAlign: 'center', marginTop: 2 },

  panel: { backgroundColor: '#2B2F39', borderRadius: 16, borderWidth: 1, borderColor: '#343B49', padding: 12, marginHorizontal: 12, marginTop: 10 },
  withdrawRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  thumb: { width: 48, height: 48, borderRadius: 10, marginRight: 12, backgroundColor: '#222' },
  withdrawTitle: { color: colors.white, fontWeight: '700', maxWidth: 180 },
  withdrawAmount: { color: colors.textSecondary, marginTop: 2 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  chipText: { color: colors.white, fontWeight: '700' },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  smallBtnText: { color: colors.white, fontWeight: '700' },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#3A4051' },

  txnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  txnTitle: { color: colors.white, fontWeight: '600', maxWidth: 210 },
  txnDate: { color: colors.textSecondary, marginTop: 2 },
  txnDelta: { fontWeight: '800' },
  txnUnit: { color: colors.textSecondary, fontWeight: '700' },
});
