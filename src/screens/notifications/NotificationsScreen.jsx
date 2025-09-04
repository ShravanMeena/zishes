import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, Settings, Bell, MoreVertical } from 'lucide-react-native';
import BottomSheet from '../../components/common/BottomSheet';

export default function NotificationsScreen({ navigation }) {
  const [menuItem, setMenuItem] = useState(null);
  const data = useMemo(() => ([
    { id: 'n1', title: 'Receipt Ready', time: 'Just now', body: 'Your receipt for the purchase of "Premium Subscription" is now' },
    { id: 'n2', title: 'Item Delivered', time: '5 min ago', body: 'Your order #78901 for "Wireless Headphones" has' },
    { id: 'n3', title: 'Gameplay Achievement!', time: '1 hour ago', body: 'Congratulations! You successfully completed "Level' },
    { id: 'n4', title: 'New Promotion Available!', time: 'Yesterday', body: 'Unlock exclusive discounts on your next purchase! Check out' },
    { id: 'n5', title: 'Wallet Top-up Successful', time: '2 days ago', body: 'Your wallet has been successfully topped up with' },
    { id: 'n6', title: 'Withdrawal Processed', time: '3 days ago', body: 'Your withdrawal request of $200 has been successfully' },
    { id: 'n7', title: 'Listing Approved & Live!', time: '4 days ago', body: 'Good news! Your item "Vintage Leather Jacket" has' },
  ]), []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <Text style={styles.time}>{item.time}</Text>
        <TouchableOpacity onPress={() => setMenuItem(item)}>
          <MoreVertical size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft color={colors.white} size={20} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={[styles.iconBtn, { marginRight: 6 }]}><Settings color={colors.white} size={18} /></TouchableOpacity>
          <View>
            <TouchableOpacity style={styles.iconBtn}><Bell color={colors.white} size={18} /></TouchableOpacity>
            <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
          </View>
        </View>
      </View>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        showsVerticalScrollIndicator={false}
      />

      <BottomSheet visible={!!menuItem} onClose={() => setMenuItem(null)} full={false}>
        <Text style={styles.sheetTitle}>Notification Options</Text>
        <TouchableOpacity style={styles.sheetRow} onPress={() => setMenuItem(null)}>
          <Text style={styles.sheetRowTxt}>Mark as Read</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sheetRow} onPress={() => setMenuItem(null)}>
          <Text style={[styles.sheetRowTxt, { color: '#FF7A7A' }]}>Remove</Text>
        </TouchableOpacity>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },
  badge: { position: 'absolute', right: -2, top: -2, backgroundColor: '#5E6AD2', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  card: { backgroundColor: '#2B2F39', borderRadius: 16, borderWidth: 1, borderColor: '#343B49', padding: 14, flexDirection: 'row' },
  title: { color: colors.white, fontWeight: '800', fontSize: 16 },
  body: { color: colors.textSecondary, marginTop: 6, maxWidth: 260 },
  time: { color: colors.textSecondary, fontSize: 12 },
  sheetTitle: { color: colors.white, fontWeight: '800', fontSize: 16, marginBottom: 10 },
  sheetRow: { paddingVertical: 12 },
  sheetRowTxt: { color: colors.white, fontWeight: '600' },
});
