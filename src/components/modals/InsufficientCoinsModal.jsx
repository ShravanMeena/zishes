import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../theme/colors';

export default function InsufficientCoinsModal({ visible, onClose, onBuy, required = 0, available = 0 }) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.spring(scale, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
      ]).start();
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      scale.setValue(0.85);
      opacity.setValue(0);
      pulse.setValue(0);
    }
  }, [visible, opacity, scale, pulse]);

  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.6] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity }]}> 
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}> 
          <View style={styles.headerWrap}>
            <Animated.View style={[styles.coinGlow, { transform: [{ scale: glowScale }], opacity: glowOpacity }]} />
            <View style={styles.coinBadge}><Text style={styles.coinText}>Z</Text></View>
          </View>
          <Text style={styles.title}>Not Enough Coins</Text>
          <Text style={styles.subtitle}>
            You need {Number(required).toLocaleString()} coins to play. You have {Number(available).toLocaleString()}.
          </Text>

          <LinearGradient colors={[colors.primary, colors.gradientEnd]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.buyBtn}>
            <TouchableOpacity style={styles.buyBtnHit} onPress={onBuy} activeOpacity={0.9}>
              <Text style={styles.buyText}>Buy Coins</Text>
            </TouchableOpacity>
          </LinearGradient>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Maybe Later</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', backgroundColor: '#1F232C', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#2E3440' },
  headerWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  coinGlow: { position: 'absolute', width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary },
  coinBadge: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#2B2F39' },
  coinText: { color: colors.white, fontWeight: '900', fontSize: 22 },
  title: { color: colors.white, fontWeight: '800', fontSize: 20, textAlign: 'center', marginTop: 6 },
  subtitle: { color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
  buyBtn: { borderRadius: 12, marginTop: 16, overflow: 'hidden' },
  buyBtnHit: { paddingVertical: 12, alignItems: 'center' },
  buyText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  cancelBtn: { alignItems: 'center', paddingVertical: 10, marginTop: 6 },
  cancelText: { color: colors.textSecondary, fontWeight: '600' },
});
