import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, Landmark, Smartphone } from 'lucide-react-native';

export default function DefaultWithdrawalScreen({ navigation }) {
  const [selected, setSelected] = useState('bank');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Default Withdrawal Method</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={{ padding: 16 }}>
        <MethodCard
          icon={<Landmark size={18} color={colors.white} />}
          title="Bank Account"
          meta="Savings •••• 9012"
          selected={selected === 'bank'}
          onPress={() => setSelected('bank')}
        />
        <MethodCard
          icon={<Smartphone size={18} color={colors.white} />}
          title="UPI"
          meta="zishesapp@upi"
          selected={selected === 'upi'}
          onPress={() => setSelected('upi')}
          style={{ marginTop: 12 }}
        />

        <TouchableOpacity style={[styles.btn, styles.primary]}><Text style={styles.btnTxt}>Set Default Method</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.save]}><Text style={styles.btnTxt}>Save</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={() => navigation.goBack()}><Text style={styles.btnTxt}>Cancel</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function MethodCard({ icon, title, meta, selected, onPress, style }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.card, style, selected && styles.cardActive]}>
      <View style={styles.cardLeft}>
        <View style={styles.circle}>{icon}</View>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.meta}>{meta}</Text>
        </View>
      </View>
      <View style={[styles.radio, selected && styles.radioOn]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },

  card: { backgroundColor: '#2B2F39', borderRadius: 16, borderWidth: 1, borderColor: '#343B49', padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardActive: { borderColor: colors.accent },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  circle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3A2B52', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  title: { color: colors.white, fontWeight: '800', fontSize: 16 },
  meta: { color: colors.textSecondary, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#667085' },
  radioOn: { borderColor: colors.primary, backgroundColor: 'rgba(105,13,171,0.35)' },

  btn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  primary: { backgroundColor: colors.primary },
  save: { backgroundColor: colors.primary, opacity: 0.8 },
  cancel: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49' },
  btnTxt: { color: colors.white, fontWeight: '800' },
});

