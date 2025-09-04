import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';

export default function ChangePasswordScreen({ navigation }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAwareScrollView contentContainerStyle={{ padding: 16 }} enableOnAndroid extraScrollHeight={20}>
        <Field label="Current Password">
          <TextInput
            value={form.current}
            secureTextEntry={!show.current}
            onChangeText={(t)=>set('current', t)}
            placeholder="Enter your current password"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <TouchableOpacity style={styles.eye} onPress={() => setShow((s)=>({ ...s, current: !s.current }))}>
            {show.current ? <Eye size={18} color={colors.white} /> : <EyeOff size={18} color={colors.white} />}
          </TouchableOpacity>
        </Field>

        <Field label="New Password">
          <TextInput
            value={form.next}
            secureTextEntry={!show.next}
            onChangeText={(t)=>set('next', t)}
            placeholder="Enter your new password"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <TouchableOpacity style={styles.eye} onPress={() => setShow((s)=>({ ...s, next: !s.next }))}>
            {show.next ? <Eye size={18} color={colors.white} /> : <EyeOff size={18} color={colors.white} />}
          </TouchableOpacity>
        </Field>

        <Field label="Confirm New Password">
          <TextInput
            value={form.confirm}
            secureTextEntry={!show.confirm}
            onChangeText={(t)=>set('confirm', t)}
            placeholder="Confirm your new password"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <TouchableOpacity style={styles.eye} onPress={() => setShow((s)=>({ ...s, confirm: !s.confirm }))}>
            {show.confirm ? <Eye size={18} color={colors.white} /> : <EyeOff size={18} color={colors.white} />}
          </TouchableOpacity>
        </Field>

        <TouchableOpacity style={[styles.btn, styles.primary]}><Text style={styles.btnTxt}>Save</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={() => navigation.goBack()}><Text style={styles.btnTxt}>Cancel</Text></TouchableOpacity>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={{ position: 'relative' }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },
  label: { color: colors.white, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: colors.white },
  eye: { position: 'absolute', right: 12, top: 12 },
  btn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  primary: { backgroundColor: colors.primary },
  cancel: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49' },
  btnTxt: { color: colors.white, fontWeight: '800' },
});
