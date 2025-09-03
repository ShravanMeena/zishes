import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../../theme/colors';

export default function ProductDetailsTab() {
  return (
    <View>
      <Text style={{ color: colors.white, fontWeight: '700', marginBottom: 8 }}>Specifications</Text>
      <Text style={{ color: colors.white }}>
        {'- Premium build quality\n'}
        {'- Lightweight and comfortable\n'}
        {'- Compatible with multiple platforms\n'}
        {'- 1-year limited warranty'}
      </Text>
    </View>
  );
}

