import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../../theme/colors';

const SAMPLE = [
  { name: 'Alice', time: '12.5677s' },
  { name: 'Bob', time: '12.6123s' },
  { name: 'Charlie', time: '12.7890s' },
  { name: 'David', time: '12.8005s' },
  { name: 'Eve', time: '12.9100s' },
];

export default function LeaderboardTab() {
  return (
    <View>
      <Text style={{ color: colors.white, fontWeight: '800', fontSize: 18, marginBottom: 10 }}>Leaderboard</Text>
      {SAMPLE.map((r, idx) => (
        <View key={r.name} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: idx === SAMPLE.length - 1 ? 0 : 1, borderBottomColor: '#343B49' }}>
          <Text style={{ color: colors.white }}>{idx + 1}. {r.name}</Text>
          <Text style={{ color: colors.white }}>{r.time}</Text>
        </View>
      ))}
      <View style={{ marginTop: 12, backgroundColor: '#3A2B52', borderRadius: 8, padding: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.white }}>8. You</Text>
        <Text style={{ color: colors.white }}>13.0543s</Text>
      </View>
    </View>
  );
}

