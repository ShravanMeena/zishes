import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../../theme/colors';

export default function DescriptionTab({ item }) {
  const desc = item?.description || '';
  return (
    <View>
      {desc ? (
        <Text style={{ color: colors.white, fontSize: 16, lineHeight: 22 }}>{desc}</Text>
      ) : (
        <Text style={{ color: colors.textSecondary }}>
          No description provided.
        </Text>
      )}
    </View>
  );
}
