import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../../theme/colors';

export default function SellerReviewTab() {
  return (
    <View>
      <Text style={{ color: colors.white, fontWeight: '700', marginBottom: 8 }}>Seller Reviews</Text>
      <Text style={{ color: colors.white }}>
        Rated 4.8/5 by players for reliability and prompt rewards.
      </Text>
    </View>
  );
}

