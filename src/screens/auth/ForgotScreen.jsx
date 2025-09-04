import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { colors } from "../../theme/colors";
import { ChevronLeft } from 'lucide-react-native';

export default function ForgotScreen({ navigation }) {
  const [email, setEmail] = useState('');

  const onSubmit = () => {
    // Hook up to your forgot/OTP API later
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAwareScrollView enableOnAndroid keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forgot Password</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.form}>
        <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>
          Enter your registered email to receive a password reset link or OTP.
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email id used during registration"
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit}>
          <Text style={styles.primaryBtnText}>Send Reset Link</Text>
        </TouchableOpacity>
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
  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 10,
  },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
