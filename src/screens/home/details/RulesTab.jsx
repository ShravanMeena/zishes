import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../../theme/colors';
import Markdown from '../../../components/common/Markdown';

export default function RulesTab({ item }) {
  const rules = item?.tournament?.rules || item?.raw?.tournament?.rules || '';
  return (
    <View>
      <Text style={{ color: colors.white, fontWeight: '700', marginBottom: 8 }}>Rules</Text>
      {rules ? (
        <Markdown content={rules} />
      ) : (
        <Text style={{ color: colors.white }}>
          No rules provided.
        </Text>
      )}
    </View>
  );
}
