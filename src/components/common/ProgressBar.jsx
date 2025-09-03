import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../theme/colors';

function ProgressBar({ value = 0, height = 8 }) {
  const pct = Math.max(0, Math.min(1, value));
  const widthPct = `${pct * 100}%`;
  return (
    <View style={[styles.track, { height }]}> 
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.fill, { width: widthPct, height }]}
      />
    </View>
  );
}

export default memo(ProgressBar);

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: '#1F2228',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2E3340',
  },
  fill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
});
