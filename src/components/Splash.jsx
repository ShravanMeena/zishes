import { View, ActivityIndicator, Animated, Easing, Image, StyleSheet, Platform } from 'react-native'
import React, { useEffect, useRef } from 'react'
import { colors } from '../theme/colors'

export default function Splash() {
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.92)).current
  const spin = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Initial reveal: fade in + slight scale up
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Subtle breathing loop while app boots
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.06,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start()

      // Soft, continuous spin on a subtle background ring (if desired later)
      Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start()
    })
  }, [opacity, scale, spin])

  const spinInterpolate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <Animated.View
          style={[
            styles.glow,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
        />

        <Animated.Image
          source={require('../assets/zishes_logo.png')}
          resizeMode="contain"
          style={[
            styles.logo,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
          fadeDuration={0}
        />

        <Animated.View
          style={[
            styles.ring,
            {
              transform: [{ rotate: spinInterpolate }, { scale }],
              opacity: 0.35,
            },
          ]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 140,
  },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 90,
    backgroundColor: colors.primary,
    opacity: 0.12,
    // soft shadow glow
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    ...(Platform.OS === 'android' ? { elevation: 8 } : null),
  },
  ring: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  loaderRow: {
    marginTop: 28,
  },
})
