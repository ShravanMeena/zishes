import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, CreditCard, PenLine, Trash2, Smartphone, Landmark } from 'lucide-react-native';

export default function PaymentMethodsManageScreen({ navigation }) {
  const [methods, setMethods] = useState([
    { id: 'm1', type: 'card', label: 'Visa Debit', meta: '•••• 4242' },
    { id: 'm2', type: 'upi', label: 'Google Pay UPI', meta: 'john.doe@gpay' },
    { id: 'm3', type: 'bank', label: 'Bank Details', meta: 'Savings •••• 6789' },
    { id: 'm4', type: 'card', label: 'MasterCard Credit', meta: '•••• 8888' },
  ]);

  const addMethod = () => {
    setMethods((m) => [{ id: `m${m.length + 1}`, type: 'card', label: 'New Card', meta: '•••• 0000' }, ...m]);
  };

  const remove = (id) => setMethods((m) => m.filter((x) => x.id !== id));

  const iconFor = (type) => type === 'card' ? <CreditCard size={18} color={colors.white} /> : type === 'upi' ? <Smartphone size={18} color={colors.white} /> : <Landmark size={18} color={colors.white} />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAwareScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} enableOnAndroid extraScrollHeight={20}>
        {methods.map((m, idx) => (
          <View key={m.id} style={[styles.card, idx > 0 && { marginTop: 12 }]}>
            <View style={styles.icon}>{iconFor(m.type)}</View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{m.label}</Text>
              <Text style={styles.meta}>{m.meta}</Text>
            </View>
            <TouchableOpacity style={styles.iconBtnSm}>
              <PenLine size={16} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtnSm, { marginLeft: 6 }]} onPress={() => remove(m.id)}>
              <Trash2 size={16} color="#FF7A7A" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={[styles.btn, styles.addBtn]} onPress={addMethod}>
          <Text style={styles.btnTxt}>+ Add Payment Method</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.primary]}><Text style={styles.btnTxt}>Save</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={() => navigation.goBack()}><Text style={styles.btnTxt}>Cancel</Text></TouchableOpacity>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2B2F39', borderRadius: 14, borderWidth: 1, borderColor: '#343B49', padding: 12 },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3A2B52', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  title: { color: colors.white, fontWeight: '800' },
  meta: { color: colors.textSecondary, marginTop: 2 },
  iconBtnSm: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#262A33', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },

  btn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  addBtn: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#3A4051' },
  primary: { backgroundColor: colors.primary },
  cancel: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49' },
  btnTxt: { color: colors.white, fontWeight: '800' },
});
