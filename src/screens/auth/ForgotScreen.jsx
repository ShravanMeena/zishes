import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { colors } from "../../theme/colors";
import { ChevronLeft } from 'lucide-react-native';
import authService from '../../services/auth';
import ResetLinkModal from '../../components/modals/ResetLinkModal';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/auth/authSlice';

export default function ForgotScreen({ navigation }) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const onSubmit = () => {
    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed || !emailRegex.test(trimmed)) {
      setError('Enter a valid email address.');
      setMessage('');
      return;
    }
    setError('');
    setSubmitting(true);
    setMessage('');
    authService.forgotPassword(trimmed)
      .then(() => {
        setMessage('Password reset instructions have been sent to your email.');
        setModalOpen(true);
      })
      .catch((err) => {
        const msg = err?.message || 'We could not send the reset email. Please try again.';
        setError(msg);
      })
      .finally(() => {
        setSubmitting(false);
      });
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
          onChangeText={(value) => {
            setEmail(value);
            if (error) setError('');
            if (message) setMessage('');
          }}
          placeholder="Email id used during registration"
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {message ? <Text style={styles.successText}>{message}</Text> : null}
        <TouchableOpacity style={[styles.primaryBtn, submitting && { opacity: 0.7 }]} onPress={onSubmit} disabled={submitting}>
          {submitting ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color={colors.white} />
              <Text style={styles.primaryBtnText}>Sending…</Text>
            </View>
          ) : (
            <Text style={styles.primaryBtnText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>
      </View>
      </KeyboardAwareScrollView>
      <ResetLinkModal
        visible={modalOpen}
        email={email.trim()}
        onClose={() => setModalOpen(false)}
        onGoToLogin={() => {
          setModalOpen(false);
          dispatch(logout());
          navigation.navigate('Login');
        }}
      />
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
  errorText: { color: '#FF7A7A', marginBottom: 8, fontWeight: '600' },
  successText: { color: '#6EE7B7', marginTop: 6, fontWeight: '600' },
});
