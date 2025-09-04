import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, AlertTriangle, PauseCircle } from 'lucide-react-native';

export default function ManageAccountScreen({ navigation }) {
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

        <TouchableOpacity style={[styles.btn, styles.delete]}><Text style={styles.btnTxt}>Delete My Account</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.primary]}><Text style={styles.btnTxt}>Deactivate Account</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={() => navigation.goBack()}><Text style={styles.btnTxt}>Cancel</Text></TouchableOpacity>
      </ScrollView>
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

