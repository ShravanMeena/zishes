import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft } from 'lucide-react-native';
import paymentMethods from '../../services/paymentMethods';

export default function PaymentMethodsScreen({ navigation }) {
  // Modes: 'list' | 'choose' | 'add-upi' | 'add-bank'
  const [mode, setMode] = useState('list');

  // Fetched methods
  const [pm, setPm] = useState({ upis: [], bankAccounts: [], defaultMethod: null });

  // Form states
  const [bank, setBank] = useState({ accountNumber: '', ifsc: '', bankName: '', accountHolderName: '', branchName: '', branchDetails: '' });
  const [upi, setUpi] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const activeUpis = useMemo(() => (pm?.upis || []).filter(u => u?.active !== false), [pm]);
  const activeBanks = useMemo(() => (pm?.bankAccounts || []).filter(b => b?.active !== false), [pm]);
  const hasAny = useMemo(() => activeUpis.length > 0 || activeBanks.length > 0, [activeUpis, activeBanks]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentMethods.getMyPaymentMethods();
      const doc = data || null;
      setPm({
        upis: doc?.upis || [],
        bankAccounts: doc?.bankAccounts || [],
        defaultMethod: doc?.defaultMethod || null,
      });
    } catch (e) {
      // If nothing set yet, treat as empty
      if (e?.status && e.status !== 404) setError(e.message || 'Failed to load');
      setPm({ upis: [], bankAccounts: [], defaultMethod: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForms = () => {
    setBank({ accountNumber: '', ifsc: '', bankName: '', accountHolderName: '', branchName: '', branchDetails: '' });
    setUpi('');
    setMakeDefault(false);
  };

  const onAddUpi = async () => {
    try {
      setSaving(true);
      setError(null);
      await paymentMethods.addUpi({ upi: (upi || '').trim(), makeDefault });
      await load();
      resetForms();
      setMode('list');
    } catch (e) {
      setError(e?.message || 'Failed to add UPI');
    } finally {
      setSaving(false);
    }
  };

  const onAddBank = async () => {
    try {
      setSaving(true);
      setError(null);
      const body = {
        accountNumber: bank.accountNumber?.trim() || undefined,
        ifsc: bank.ifsc?.trim() || undefined,
        bankName: bank.bankName?.trim() || undefined,
        accountHolderName: bank.accountHolderName?.trim() || undefined,
        branchName: bank.branchName?.trim() || undefined,
        branchDetails: bank.branchDetails?.trim() || undefined,
        makeDefault,
      };
      await paymentMethods.addBank(body);
      await load();
      resetForms();
      setMode('list');
    } catch (e) {
      setError(e?.message || 'Failed to add bank');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (type, id) => {
    try {
      const confirmed = await new Promise((resolve) => {
        Alert.alert(
          type === 'UPI' ? 'Delete UPI' : 'Delete Bank',
          'Are you sure you want to remove this payment method?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
          ],
          { cancelable: true }
        );
      });
      if (!confirmed) return;
      setSaving(true);
      if (type === 'UPI') await paymentMethods.deleteUpi(id);
      else await paymentMethods.deleteBank(id);
      await load();
    } catch (e) {
      setError(e?.message || 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  const onMakeDefault = async (type, id) => {
    try {
      setSaving(true);
      setError(null);
      await paymentMethods.setDefault({ type, id });
      await load();
    } catch (e) {
      setError(e?.message || 'Failed to set default');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
          {/* Error */}
          {!!error && <Text style={styles.errorTxt}>{error}</Text>}

          {/* LIST MODE */}
          {mode === 'list' && (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Saved Methods</Text>
                {loading && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <ActivityIndicator color={colors.white} />
                    <Text style={{ color: colors.white }}>Loading…</Text>
                  </View>
                )}
                {!loading && !hasAny && (
                  <Text style={styles.summaryEmpty}>No payment methods yet.</Text>
                )}

                {/* Banks */}
                {activeBanks.map((b) => {
                  const isDefault = pm?.defaultMethod?.type === 'BANK' && pm?.defaultMethod?.refId === b?._id;
                  return (
                    <View key={`bank-${b._id}`} style={styles.methodRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.methodTitle}>Bank {isDefault ? '• Default' : ''}</Text>
                        <Text style={styles.methodLine}>{b?.bankName || '-'} • {b?.accountNumber ? `••${String(b.accountNumber).slice(-4)}` : '-'}</Text>
                        <Text style={styles.methodSub}>{b?.accountHolderName || '-'}</Text>
                      </View>
                      {!isDefault && (
                        <TouchableOpacity style={styles.rowBtn} onPress={() => onMakeDefault('BANK', b._id)}>
                          <Text style={styles.rowBtnTxt}>Set Default</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={[styles.rowBtn, styles.rowBtnDanger]} onPress={() => onDelete('BANK', b._id)}>
                        <Text style={styles.rowBtnTxt}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}

                {/* UPIs */}
                {activeUpis.map((u) => {
                  const isDefault = pm?.defaultMethod?.type === 'UPI' && pm?.defaultMethod?.refId === u?._id;
                  return (
                    <View key={`upi-${u._id}`} style={[styles.methodRow, styles.rowDivider]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.methodTitle}>UPI {isDefault ? '• Default' : ''}</Text>
                        <Text style={styles.methodLine}>{u?.upi}</Text>
                      </View>
                      {!isDefault && (
                        <TouchableOpacity style={styles.rowBtn} onPress={() => onMakeDefault('UPI', u._id)}>
                          <Text style={styles.rowBtnTxt}>Set Default</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={[styles.rowBtn, styles.rowBtnDanger]} onPress={() => onDelete('UPI', u._id)}>
                        <Text style={styles.rowBtnTxt}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity style={[styles.bottomBtn, styles.addBtnInline]} onPress={() => { resetForms(); setMode('choose'); }}>
                <Text style={styles.submitTxt}>+ Add Payment Method</Text>
              </TouchableOpacity>
            </>
          )}

          {/* CHOOSE MODE */}
          {mode === 'choose' && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Add Payment Method</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <TouchableOpacity style={[styles.bottomBtn, styles.choiceBtn]} onPress={() => setMode('add-upi')}>
                  <Text style={styles.submitTxt}>Add UPI</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.bottomBtn, styles.choiceBtn]} onPress={() => setMode('add-bank')}>
                  <Text style={styles.submitTxt}>Add Bank</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.bottomBtn, styles.cancelBtn, { marginTop: 12 }]} onPress={() => setMode('list')}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ADD UPI */}
          {mode === 'add-upi' && (
            <View style={styles.upiPanel}>
              <FormLabel>Enter UPI ID</FormLabel>
              <FormInput value={upi} onChangeText={setUpi} placeholder="yourname@upi" autoCapitalize="none" />
              <View style={styles.defaultRow}>
                <Text style={styles.label}>Make default</Text>
                <Switch value={makeDefault} onValueChange={setMakeDefault} />
              </View>
            </View>
          )}

          {/* ADD BANK */}
          {mode === 'add-bank' && (
            <View style={styles.upiPanel}>
              <FormLabel>Account Number / IBAN</FormLabel>
              <FormInput value={bank.accountNumber} onChangeText={(t)=>setBank({ ...bank, accountNumber:t })} placeholder="Enter account number or IBAN" />

              <FormLabel>IFSC or Equivalent Code</FormLabel>
              <FormInput value={bank.ifsc} onChangeText={(t)=>setBank({ ...bank, ifsc:t })} placeholder="Enter IFSC code (e.g., HDFC0000001)" />

              <FormLabel>Bank Name</FormLabel>
              <FormInput value={bank.bankName} onChangeText={(t)=>setBank({ ...bank, bankName:t })} placeholder="Enter bank name" />

              <FormLabel>Account Holder Name</FormLabel>
              <FormInput value={bank.accountHolderName} onChangeText={(t)=>setBank({ ...bank, accountHolderName:t })} placeholder="Name" />

              <FormLabel>Branch Name</FormLabel>
              <FormInput value={bank.branchName} onChangeText={(t)=>setBank({ ...bank, branchName:t })} placeholder="Branch name" />

              <FormLabel>Branch Details</FormLabel>
              <FormInput value={bank.branchDetails} onChangeText={(t)=>setBank({ ...bank, branchDetails:t })} placeholder="Address or details" />

              <View style={styles.defaultRow}>
                <Text style={styles.label}>Make default</Text>
                <Switch value={makeDefault} onValueChange={setMakeDefault} />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Actions - fixed */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.bottomBtn, styles.cancelBtn]} onPress={() => {
          if (mode === 'list') navigation.goBack();
          else setMode('list');
        }} disabled={saving}>
          <Text style={styles.cancelTxt}>{mode === 'list' ? 'Close' : 'Cancel'}</Text>
        </TouchableOpacity>

        {mode === 'add-upi' && (
          <TouchableOpacity style={[styles.bottomBtn, styles.submitBtn, saving && { opacity: 0.7 }]} onPress={onAddUpi} disabled={saving || !upi?.trim()}>
            <Text style={styles.submitTxt}>Save UPI</Text>
          </TouchableOpacity>
        )}

        {mode === 'add-bank' && (
          <TouchableOpacity style={[styles.bottomBtn, styles.submitBtn, saving && { opacity: 0.7 }]} onPress={onAddBank} disabled={saving}>
            <Text style={styles.submitTxt}>Save Bank</Text>
          </TouchableOpacity>
        )}

        {mode === 'list' && (
          <TouchableOpacity style={[styles.bottomBtn, styles.submitBtn]} onPress={() => { resetForms(); setMode('choose'); }}>
            <Text style={styles.submitTxt}>Add Method</Text>
          </TouchableOpacity>
        )}
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

  summaryCard: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 16, padding: 12, marginBottom: 12 },
  summaryTitle: { color: colors.white, fontWeight: '800', fontSize: 16 },
  summaryEmpty: { color: colors.textSecondary, marginTop: 6 },
  methodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#343B49' },
  methodTitle: { color: colors.white, fontWeight: '700' },
  methodLine: { color: colors.white, marginTop: 2 },
  methodSub: { color: colors.textSecondary, marginTop: 2 },
  rowBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#3C4457', marginLeft: 8, backgroundColor: '#2E3342' },
  rowBtnDanger: { backgroundColor: '#5A2C2C', borderColor: '#6E3A3A' },
  rowBtnTxt: { color: colors.white, fontWeight: '700' },
  errorTxt: { color: '#FF7A7A', marginTop: 8 },

  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', padding: 12, gap: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#22252C', backgroundColor: colors.black },
  bottomBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },
  cancelBtn: { backgroundColor: '#2B2F39' },
  submitBtn: { backgroundColor: '#16a085', borderColor: '#16a085' },
  addBtnInline: { marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 16 },
  choiceBtn: { backgroundColor: '#2B2F39', borderColor: '#343B49', flex: 1 },
  cancelTxt: { color: colors.white, fontWeight: '700' },
  submitTxt: { color: colors.white, fontWeight: '800' },
  defaultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
});
