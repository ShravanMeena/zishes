import { View, ActivityIndicator } from 'react-native'
import React from 'react'
import { colors } from '../theme/colors'

export default function Splash() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  )
}
