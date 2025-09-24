import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {Platform, KeyboardAvoidingView} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {useDispatch, useSelector} from 'react-redux';
import {CommonActions} from '@react-navigation/native';
import {authenticateWithGoogle, signup} from '../../store/auth/authSlice';
import {colors} from '../../theme/colors';
import {ChevronLeft, Eye, EyeOff, Chrome, Apple} from 'lucide-react-native';
import Button from '../../components/ui/Button';

export default function SignupScreen({navigation}) {
  const dispatch = useDispatch();
  const {status, error, currentAuthMethod, token} = useSelector(s => s.auth);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referral, setReferral] = useState('');
  const [secure, setSecure] = useState(true);
  const insets = useSafeAreaInsets();

  const onSubmit = () => {
    dispatch(signup({email, password}));
  };

  const onGoogleSignIn = () => {
    if (
      status === 'loading' &&
      currentAuthMethod &&
      currentAuthMethod !== 'google'
    ) {
      return;
    }
    dispatch(authenticateWithGoogle());
  };

  const isPasswordLoading =
    status === 'loading' && currentAuthMethod === 'password';
  const isGoogleLoading =
    status === 'loading' && currentAuthMethod === 'google';

  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (status === 'succeeded' && token && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      const parentNav = navigation.getParent?.();
      const resetAction = CommonActions.reset({
        index: 0,
        routes: [{name: 'CountrySelect'}],
      });
      if (parentNav?.dispatch) {
        parentNav.dispatch(resetAction);
      } else {
        navigation.dispatch(resetAction);
      }
    }
  }, [status, token, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAwareScrollView
        style={{flex: 1}}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: (insets?.bottom || 0) + 16,
        }}
        extraScrollHeight={24}
        extraHeight={24}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}>
            <ChevronLeft size={22} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={{width: 22}} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Create a strong password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={secure}
              style={[styles.input, {flex: 1, marginBottom: 0, borderWidth: 0}]}
            />
            <TouchableOpacity
              onPress={() => setSecure(s => !s)}
              style={styles.eyeBtn}>
              {secure ? (
                <Eye size={20} color={colors.textSecondary} />
              ) : (
                <EyeOff size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, {marginTop: 10}]}>
            Referral Code (Optional)
          </Text>
          <TextInput
            value={referral}
            onChangeText={setReferral}
            placeholder="Enter referral code"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />

          {error ? <Text style={styles.error}>{String(error)}</Text> : null}
          <Button
            title={isPasswordLoading ? 'Creating...' : 'Create Account'}
            loading={isPasswordLoading}
            disabled={isGoogleLoading}
            onPress={onSubmit}
            style={{marginTop: 16, marginBottom: 16}}
          />

          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>Or sign up with</Text>
            <View style={styles.line} />
          </View>

          <Button
            variant="outline"
            title="Sign up with Google"
            left={<Chrome size={18} color={colors.white} />}
            onPress={onGoogleSignIn}
            loading={isGoogleLoading}
            disabled={isPasswordLoading}
          />

          {Platform.OS === 'ios' ? (
            <Button
              variant="outline"
              title="Sign up with Apple"
              left={<Apple size={18} color={colors.white} />}
              style={{marginTop: 10}}
            />
          ) : null}
          
        </View>
      </KeyboardAwareScrollView>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        enabled>
        <View
          style={[
            styles.bottomBar,
            {paddingBottom: (insets?.bottom || 0) + 12},
          ]}>
          <View style={{flexDirection: 'row', alignSelf: 'center'}}>
            <Text style={{color: colors.textSecondary}}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.black},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#22252C',
  },
  backBtn: {padding: 4},
  headerTitle: {color: colors.white, fontSize: 18, fontWeight: '600'},
  form: {padding: 20},
  label: {color: colors.white, marginBottom: 8, fontWeight: '600'},
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2B2F39',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#343B49',
    paddingRight: 8,
  },
  eyeBtn: {paddingHorizontal: 6, paddingVertical: 6},
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryBtnText: {color: colors.white, fontWeight: '700', fontSize: 16},
  dividerRow: {flexDirection: 'row', alignItems: 'center', marginVertical: 20},
  line: {flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#343B49'},
  dividerText: {
    color: colors.textSecondary,
    marginHorizontal: 10,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  oauthBtn: {
    borderWidth: 1,
    borderColor: '#3A4051',
    backgroundColor: '#2B2F39',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  oauthText: {color: colors.white, fontWeight: '600'},
  link: {color: colors.accent, fontWeight: '600'},
  error: {color: colors.error, marginTop: 8},
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: colors.black,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#22252C',
  },
});
