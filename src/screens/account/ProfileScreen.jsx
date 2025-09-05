import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { logout } from "../../store/auth/authSlice";
import { colors } from "../../theme/colors";
import AppModal from "../../components/common/AppModal";
import { Bell, ChevronRight, Gift, Settings, ClipboardList } from 'lucide-react-native';

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const onLogout = () => setConfirmOpen(true);
  const confirmLogout = () => { setConfirmOpen(false); dispatch(logout()); };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home', { screen: 'Notifications' })}>
          <Bell size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 140 }} showsVerticalScrollIndicator={false}>
        {/* Card */}
        <View style={styles.card}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?img=3' }} style={styles.avatar} />
          <Text style={styles.name}>Alex Johnson</Text>
          <Text style={styles.handle}>@alexzishes</Text>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Menu List */}
        <View style={styles.list}>
          <MenuRow icon={<ClipboardList size={18} color={colors.accent} />} title="My Listings" onPress={() => navigation.navigate('MyListings')} />
          <MenuRow icon={<Gift size={18} color={colors.accent} />} title="Tournaments Won" onPress={() => navigation.navigate('TournamentsWon')} />
          <MenuRow icon={<ClipboardList size={18} color={colors.accent} />} title="Receipts" />
          <MenuRow icon={<Bell size={18} color={colors.accent} />} title="Notifications" badge="5" onPress={() => navigation.navigate('Home', { screen: 'Notifications' })} />
          <MenuRow icon={<Settings size={18} color={colors.accent} />} title="Settings" onPress={() => navigation.navigate('Settings')} />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logout} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>

      <AppModal
        visible={confirmOpen}
        title="Confirm Logout"
        message="Are you sure you want to logout? You'll need to sign in again to continue."
        confirmText="Logout"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmLogout}
      />
      
    </SafeAreaView>
  );
}

function MenuRow({ icon, title, badge, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={styles.rowIcon}>{icon}</View>
        <Text style={styles.rowText}>{title}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {badge ? (
          <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>
        ) : null}
        <ChevronRight size={18} color={colors.white} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black, paddingHorizontal: 14 },
  header: {
    height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C', marginBottom: 12,
  },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  card: {
    backgroundColor: '#2B2F39', borderRadius: 16, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#343B49', marginTop: 10, marginBottom: 16,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  name: { color: colors.white, fontWeight: '700', fontSize: 20 },
  handle: { color: colors.textSecondary, marginBottom: 12 },
  editBtn: { borderWidth: 1, borderColor: colors.accent, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  editText: { color: colors.accent, fontWeight: '700' },
  list: { gap: 12 },
  row: {
    backgroundColor: '#2B2F39', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: '#343B49', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  rowIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#312B42', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  rowText: { color: colors.white, fontWeight: '600' },
  badge: { backgroundColor: '#2E7D32', paddingHorizontal: 8, borderRadius: 12, marginRight: 8 },
  badgeText: { color: colors.white, fontWeight: '700' },
  logout: { borderWidth: 1, borderColor: '#C65B5B', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  logoutText: { color: '#FF7A7A', fontWeight: '700' },
});
