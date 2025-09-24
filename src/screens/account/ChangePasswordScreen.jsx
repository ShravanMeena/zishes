import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import authService from '../../services/auth';
import ResetLinkModal from '../../components/modals/ResetLinkModal';
import { logout } from '../../store/auth/authSlice';

export default function ChangePasswordScreen({ navigation }) {
  const dispatch = useDispatch();
  const userEmail = useSelector((state) => state.auth?.user?.email || '');
  const [email, setEmail] = useState(userEmail || '');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setEmail(userEmail || '');
  }, [userEmail]);

  const trimmedEmail = useMemo(() => email.trim(), [email]);

  const onSubmit = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      setMessage('');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    authService.forgotPassword(trimmedEmail)
      .then(() => {
        setMessage('Password reset instructions have been sent to your email.');
        setModalOpen(true);
      })
      .catch((err) => {
        const msg = err?.message || 'We could not send the reset email. Please try again.';
        setError(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAwareScrollView contentContainerStyle={{ padding: 16 }} enableOnAndroid extraScrollHeight={20}>
        <Text style={styles.description}>
          Send yourself a password reset link. We will email the reset instructions to your registered address.
        </Text>

        <Field label="Registered Email">
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
        </Field>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.success}>{message}</Text> : null}

        <TouchableOpacity
          style={[styles.actionBtn, loading && { opacity: 0.7 }]}
          onPress={onSubmit}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.white} />
              <Text style={styles.actionText}>Sending…</Text>
            </View>
          ) : (
            <Text style={styles.actionText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.cancel]} onPress={() => navigation.goBack()}>
          <Text style={styles.actionText}>Cancel</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      <ResetLinkModal
        visible={modalOpen}
        email={trimmedEmail}
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
  description: { color: colors.textSecondary, marginBottom: 20 },
  label: { color: colors.white, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: colors.white },
  error: { color: '#FF7A7A', marginBottom: 8, fontWeight: '600' },
  success: { color: '#6EE7B7', marginBottom: 8, fontWeight: '600' },
  actionBtn: { backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginTop: 12 },
  cancel: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49' },
  actionText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
