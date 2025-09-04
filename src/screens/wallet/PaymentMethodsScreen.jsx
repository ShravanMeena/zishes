import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft } from 'lucide-react-native';

export default function PaymentMethodsScreen({ navigation }) {
  const [tab, setTab] = useState('bank');
  const [bank, setBank] = useState({
    account: '', ifsc: '', name: '', holder: '', branch: '',
  });
  const [upi, setUpi] = useState({ upi: '' });

  const onSubmit = () => {
    // You can integrate API here later
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity onPress={() => setTab('bank')} style={[styles.tabBtn, tab==='bank' && styles.tabActive]}>
          <Text style={[styles.tabTxt, tab==='bank' && styles.tabTxtActive]}>Bank Details</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('upi')} style={[styles.tabBtn, tab==='upi' && styles.tabActive]}>
          <Text style={[styles.tabTxt, tab==='upi' && styles.tabTxtActive]}>UPI Details</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          {tab === 'bank' ? (
            <>
              <FormLabel>Account Number / IBAN</FormLabel>
              <FormInput value={bank.account} onChangeText={(t)=>setBank({ ...bank, account:t })} placeholder="Enter account number or IBAN" />

              <FormLabel>IFSC or Equivalent Code</FormLabel>
              <FormInput value={bank.ifsc} onChangeText={(t)=>setBank({ ...bank, ifsc:t })} placeholder="Enter IFSC code (e.g., HDFC0000001)" />

              <FormLabel>Bank Name</FormLabel>
              <FormInput value={bank.name} onChangeText={(t)=>setBank({ ...bank, name:t })} placeholder="Enter bank name" />

              <FormLabel>Account Holder Name</FormLabel>
              <FormInput value={bank.holder} onChangeText={(t)=>setBank({ ...bank, holder:t })} placeholder="Name" />

              <FormLabel>Branch Details</FormLabel>
              <FormInput value={bank.branch} onChangeText={(t)=>setBank({ ...bank, branch:t })} placeholder="Branch" />
            </>
          ) : (
            <View style={styles.upiPanel}>
              <View style={styles.tabsRowInset}>
                <View style={[styles.tabBtn, styles.tabActive]}><Text style={[styles.tabTxt, styles.tabTxtActive]}>UPI Details</Text></View>
              </View>
              <FormLabel>Enter UPI ID</FormLabel>
              <FormInput value={upi.upi} onChangeText={(t)=>setUpi({ upi:t })} placeholder="yourname@bankupi" />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.bottomBtn, styles.cancelBtn]} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelTxt}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.bottomBtn, styles.submitBtn]} onPress={onSubmit}>
          <Text style={styles.submitTxt}>Submit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function FormLabel({ children }) {
  return <Text style={styles.label}>{children}</Text>;
}
function FormInput(props) {
  return <TextInput {...props} placeholderTextColor={colors.textSecondary} style={styles.input} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },

  tabsRow: { flexDirection: 'row', padding: 12, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  tabBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#343B49', backgroundColor: '#2B2F39' },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabTxt: { color: colors.white, fontWeight: '700' },
  tabTxtActive: { color: colors.white },
  tabsRowInset: { alignItems: 'flex-start', marginBottom: 10 },

  label: { color: colors.white, marginTop: 12, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, color: colors.white },

  upiPanel: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 16, padding: 12 },

  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', padding: 12, gap: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#22252C', backgroundColor: colors.black },
  bottomBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },
  cancelBtn: { backgroundColor: '#2B2F39' },
  submitBtn: { backgroundColor: '#16a085', borderColor: '#16a085' },
  cancelTxt: { color: colors.white, fontWeight: '700' },
  submitTxt: { color: colors.white, fontWeight: '800' },
});

