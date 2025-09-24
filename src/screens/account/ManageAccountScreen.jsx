import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, AlertTriangle, PauseCircle } from 'lucide-react-native';
import AppModal from '../../components/common/AppModal';
import CongratsModal from '../../components/modals/CongratsModal';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/auth/authSlice';

export default function ManageAccountScreen({ navigation }) {
  const dispatch = useDispatch();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [action, setAction] = useState(null); // 'delete' | 'deactivate'

  const startDelete = () => { setAction('delete'); setConfirmOpen(true); };
  const startDeactivate = () => { setAction('deactivate'); setConfirmOpen(true); };
  const confirmAction = () => {
    setConfirmOpen(false);
    setSuccessOpen(true);
  };
  const finish = () => {
    setSuccessOpen(false);
    dispatch(logout());
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Account Management</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={styles.title}>Manage Your Account</Text>

        <View style={[styles.card, styles.dangerCard]}>
          <View style={styles.rowTop}>
            <AlertTriangle size={20} color="#FF7A7A" />
            <Text style={styles.cardTitle}>Permanent Account Deletion</Text>
          </View>
          <Text style={styles.desc}>Deleting your account is permanent. All your data, including profile, messages, and any associated content, will be irreversibly lost. This action cannot be undone.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.rowTop}>
            <PauseCircle size={20} color={colors.accent} />
            <Text style={styles.cardTitle}>Temporary Account Deactivation</Text>
          </View>
          <Text style={styles.desc}>If you wish to take a break, you can temporarily deactivate your account. Your profile will be hidden from others, and you can reactivate it anytime.</Text>
        </View>

        <TouchableOpacity style={[styles.btn, styles.delete]} onPress={startDelete}><Text style={styles.btnTxt}>Delete My Account</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.primary]} onPress={startDeactivate}><Text style={styles.btnTxt}>Deactivate Account</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={() => navigation.goBack()}><Text style={styles.btnTxt}>Cancel</Text></TouchableOpacity>
      </ScrollView>

      <AppModal
        visible={confirmOpen}
        title={action === 'delete' ? 'Confirm Permanent Deletion' : 'Confirm Deactivation'}
        message={action === 'delete'
          ? 'This action will permanently delete your account and data. Are you absolutely sure?'
          : 'Your profile will be hidden and you can come back anytime. Proceed to deactivate?'}
        confirmText={action === 'delete' ? 'Delete Account' : 'Deactivate'}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmAction}
      />

      <CongratsModal
        visible={successOpen}
        title={action === 'delete' ? 'Account Deleted' : 'Account Deactivated'}
        message={action === 'delete' ? 'Your account has been permanently removed. You can still create a new one anytime.' : 'Your account is now deactivated. We hope to see you again soon.'}
        primaryText="OK, Log me out"
        onPrimary={finish}
        onRequestClose={finish}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },
  title: { color: colors.white, fontWeight: '900', fontSize: 22, marginBottom: 12 },
  card: { backgroundColor: '#2B2F39', borderRadius: 16, borderWidth: 1, borderColor: '#343B49', padding: 16, marginBottom: 12 },
  dangerCard: { borderColor: '#FF7A7A' },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cardTitle: { color: colors.white, fontWeight: '800', fontSize: 16 },
  desc: { color: colors.textSecondary },
  btn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  primary: { backgroundColor: colors.primary },
  delete: { backgroundColor: '#B54747' },
  cancel: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49' },
  btnTxt: { color: colors.white, fontWeight: '800' },
});
