import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useDispatch, useSelector } from 'react-redux';
import { login } from "../../store/auth/authSlice";
import { colors } from "../../theme/colors";
import { ChevronLeft, Eye, EyeOff, Chrome, Apple } from 'lucide-react-native';
import Button from "../../components/ui/Button";

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { status, error } = useSelector((s) => s.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);

  const onSubmit = () => {
    dispatch(login({ email, password }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAwareScrollView enableOnAndroid keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Header */}
      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={22} color={colors.white} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}
        <Text style={styles.headerTitle}>Welcome Back</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry={secure}
            style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
          />
          <TouchableOpacity onPress={() => setSecure((s) => !s)} style={styles.eyeBtn}>
            {secure ? <Eye size={20} color={colors.textSecondary} /> : <EyeOff size={20} color={colors.textSecondary} />}
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{String(error)}</Text> : null}
        <Button
          title={status === 'loading' ? 'Signing in...' : 'Sign In'}
          loading={status === 'loading'}
          onPress={onSubmit}
          style={{ marginTop: 16, marginBottom: 16 }}
        />

        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>Or continue with</Text>
          <View style={styles.line} />
        </View>

        <Button variant="outline" title="Continue with Google" left={<Chrome size={18} color={colors.white} />} />
        <Button variant="outline" title="Continue with Apple" left={<Apple size={18} color={colors.white} />} style={{ marginTop: 10 }} />

        <View style={{ alignItems: 'center', marginTop: 14 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Forgot')}>
            <Text style={styles.link}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 10, alignSelf: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>New user? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.link}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C',
  },
  backBtn: { padding: 4 },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '600' },
  form: { padding: 20 },
  label: { color: colors.white, marginBottom: 8, fontWeight: '600' },
  input: {
    width: '100%',
    backgroundColor: '#2B2F39',
    borderWidth: 1,
    borderColor: '#343B49',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.white,
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2B2F39', borderRadius: 12, borderWidth: 1, borderColor: '#343B49', paddingRight: 8,
  },
  eyeBtn: { paddingHorizontal: 6, paddingVertical: 6 },
  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 10,
  },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#343B49' },
  dividerText: { color: colors.textSecondary, marginHorizontal: 10, textTransform: 'uppercase', fontSize: 12 },
  oauthBtn: {
    borderWidth: 1, borderColor: '#3A4051', backgroundColor: '#2B2F39', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10,
  },
  oauthText: { color: colors.white, fontWeight: '600' },
  link: { color: colors.accent, fontWeight: '600' },
  error: { color: colors.error, marginTop: 8 },
});
