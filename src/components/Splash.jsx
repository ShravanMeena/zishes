import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { colors } from '../theme/colors'

export default function Splash() {
  const pulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [pulse])

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] })
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] })

  return (
    <LinearGradient
      colors={[colors.splashGradientStart, colors.splashGradientEnd]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.Image
          source={require('../assets/zishes_logo.png')}
          style={[styles.logoImg, { transform: [{ scale }], opacity }]}
          resizeMode="contain"
        />
        <Text style={styles.title}>Zishes</Text>
        <Text style={styles.subtitle}>Play • Win • Own</Text>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  logoImg: { width: 220, height: 220 },
  title: { color: colors.white, fontSize: 40, fontWeight: '800', letterSpacing: 4, marginTop: 16 },
  subtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 18, fontWeight: '600', letterSpacing: 1.2 },
  caption: { color: 'rgba(255,255,255,0.55)', fontSize: 13, letterSpacing: 0.6 },
})
