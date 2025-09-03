import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../../theme/colors';

export default function RulesTab() {
  return (
    <View>
      <Text style={{ color: colors.white, fontWeight: '700', marginBottom: 8 }}>Rules</Text>
      <Text style={{ color: colors.white }}>
        - Limited entries per user{"\n"}
        - Coins are deducted on joining{"\n"}
        - Maintain fair play; violations may lead to disqualification
      </Text>
    </View>
  );
}

