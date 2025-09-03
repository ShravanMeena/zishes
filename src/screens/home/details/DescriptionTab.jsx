import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../../theme/colors';

export default function DescriptionTab({ item }) {
  return (
    <View>
      <Text style={{ color: colors.white, fontSize: 16, lineHeight: 22 }}>
        {`Experience ${item.title} with immersive gameplay and rewarding challenges. This item is featured in our game pool for a limited time. Engage, compete, and climb the leaderboard to win!`}
      </Text>
    </View>
  );
}

