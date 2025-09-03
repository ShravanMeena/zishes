import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors } from '../../theme/colors';

export default function Button({ title, onPress, disabled, loading, variant = 'primary', fullWidth = true, left, right, style, textStyle }) {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled || loading}
      style={[
        styles.base,
        fullWidth && styles.full,
        isPrimary && styles.primary,
        isOutline && styles.outline,
        isGhost && styles.ghost,
        (disabled || loading) && { opacity: 0.7 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <View style={styles.row}>
          {left ? <View style={{ marginRight: 8 }}>{left}</View> : null}
          <Text style={[styles.text, isOutline && styles.textOutline, isGhost && styles.textGhost, textStyle]}>{title}</Text>
          {right ? <View style={{ marginLeft: 8 }}>{right}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: { width: '100%' },
  primary: { backgroundColor: colors.primary },
  outline: { borderWidth: 1, borderColor: '#3A4051', backgroundColor: '#2B2F39' },
  ghost: { backgroundColor: 'transparent' },
  text: { color: colors.white, fontWeight: '700', fontSize: 16 },
  textOutline: { color: colors.white },
  textGhost: { color: colors.accent },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
