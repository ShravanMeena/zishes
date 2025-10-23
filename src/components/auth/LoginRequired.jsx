import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import Button from '../ui/Button';
import { colors } from '../../theme/colors';
import { exitGuestMode } from '../../store/auth/authSlice';

export default function LoginRequired({
  title = 'Login to continue',
  message = 'Sign in to access this feature.',
  actionLabel = 'Login to continue',
  onLogin,
}) {
  const dispatch = useDispatch();

  const handlePress = useCallback(() => {
    if (typeof onLogin === 'function') {
      onLogin();
    } else {
      dispatch(exitGuestMode());
    }
  }, [dispatch, onLogin]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Button title={actionLabel} onPress={handlePress} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    minWidth: 180,
  },
});
