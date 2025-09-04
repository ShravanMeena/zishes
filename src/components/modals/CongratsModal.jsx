import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Animated, Easing, Dimensions, Platform } from 'react-native';

export default function CongratsModal({ visible, title = 'Success!', message, primaryText = 'Great!', onPrimary, onRequestClose }) {
  const [isVisible, setIsVisible] = useState(visible);
  const overlayOpacity = useMemo(() => new Animated.Value(0), []);
  const cardScale = useMemo(() => new Animated.Value(0.9), []);
  const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

  const confettiCount = 14;
  const confetti = useMemo(() => (
    Array.from({ length: confettiCount }).map((_, i) => ({
      id: i,
      x: Math.random() * (SCREEN_WIDTH - 30),
      delay: Math.random() * 600,
      spin: new Animated.Value(0),
      base: Math.random() * 360,
      translateY: new Animated.Value(-80 - Math.random() * 120),
      color: ['#FF5A5F', '#2ECC71', '#FFD166', '#4DA3FF', '#B39DDB'][i % 5],
    }))
  ), [SCREEN_WIDTH]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
    ]).start();
    confetti.forEach(c => {
      c.translateY.setValue(-80 - Math.random() * 120);
      c.spin.setValue(0);
      Animated.sequence([
        Animated.delay(c.delay),
        Animated.parallel([
          Animated.timing(c.translateY, { toValue: SCREEN_HEIGHT + 80, duration: 1600 + Math.random() * 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(c.spin, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: true }),
        ]),
      ]).start();
    });
  };

  const animateOut = (done) => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 0, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 0.96, friction: 7, tension: 70, useNativeDriver: true }),
    ]).start(() => done && done());
  };

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      const t = setTimeout(animateIn, 10);
      return () => clearTimeout(t);
    } else if (isVisible) {
      animateOut(() => setIsVisible(false));
    }
  }, [visible]);

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} transparent animationType="none" onRequestClose={onRequestClose}>
      <Animated.View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', opacity: overlayOpacity, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
          {confetti.map(c => (
            <Animated.View key={c.id} style={{ position: 'absolute', width: 10, height: 16, borderRadius: 2, backgroundColor: c.color, left: c.x, transform: [ { translateY: c.translateY }, { rotate: `${c.base}deg` }, { rotate: c.spin.interpolate({ inputRange: [0,1], outputRange: ['0deg', Math.random() > 0.5 ? '360deg' : '-360deg'] }) } ], opacity: 0.9 }} />
          ))}
        </View>

        <Animated.View style={{ width: '100%', maxWidth: 420, borderRadius: 20, paddingVertical: 22, paddingHorizontal: 18, transform: [{ scale: cardScale }], backgroundColor: '#0B1220', borderWidth: 1, borderColor: '#24324A', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 8 }}>
          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 56, textAlign: 'center' }}>🎉</Text>
            <Text style={{ fontSize: 22, color: '#E6F0FF', fontWeight: Platform.OS === 'ios' ? '700' : 'bold', marginTop: 6 }}>{title}</Text>
            {message ? <Text style={{ fontSize: 14, color: '#AFC1DC', marginTop: 6, textAlign: 'center' }}>{message}</Text> : null}
          </View>
          <TouchableOpacity onPress={onPrimary} activeOpacity={0.9} style={{ backgroundColor: '#2ECC71', paddingVertical: 12, borderRadius: 12 }}>
            <Text style={{ color: '#0B1220', textAlign: 'center', fontWeight: '800' }}>{primaryText}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

