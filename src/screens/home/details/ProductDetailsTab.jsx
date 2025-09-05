import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../../theme/colors';

export default function ProductDetailsTab({ item }) {
  const name = item?.name || item?.title || '{text}';
  const category = item?.category || '{text}';
  const owner = item?.ownerUsername || item?.user || '{text}';
  const game = item?.game?.name || '{text}';
  const t = item?.tournament;
  const status = t?.status || '{text}';
  const seats = t?.totalSeats ?? '{text}';

  return (
    <View>
      <Text style={{ color: colors.white, fontWeight: '700', marginBottom: 8 }}>Product</Text>
      <Text style={{ color: colors.white }}>{`Name: ${name}`}</Text>
      <Text style={{ color: colors.white }}>{`Category: ${category}`}</Text>
      <Text style={{ color: colors.white }}>{`Owner: ${owner}`}</Text>
      <Text style={{ color: colors.white }}>{`Game: ${game}`}</Text>
      <Text style={{ color: colors.white, marginTop: 12, fontWeight: '700' }}>Tournament</Text>
      <Text style={{ color: colors.white }}>{`Status: ${status}`}</Text>
      <Text style={{ color: colors.white }}>{`Seats: ${seats}`}</Text>

      <Text style={{ color: colors.white, fontWeight: '700', marginTop: 12, marginBottom: 8 }}>Specifications</Text>
      <Text style={{ color: colors.white }}>
        {'- Premium build quality\n'}
        {'- Lightweight and comfortable\n'}
        {'- Compatible with multiple platforms\n'}
        {'- 1-year limited warranty'}
      </Text>
    </View>
  );
}
