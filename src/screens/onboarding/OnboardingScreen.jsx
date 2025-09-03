import React, { useRef, useState } from 'react';
import { View, Text, Image, ScrollView, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { useDispatch } from 'react-redux';
import { setOnboardingSeen } from '../../store/app/appSlice';

const { width } = Dimensions.get('window');

const slides = [
  {
    title: 'Shop, Play, and Own.',
    subtitle: 'Zishes is a global marketplace where products are offered through structured gameplays. Every listing is a prize competition with transparent, entries.',
    img: 'https://images.unsplash.com/photo-1612178537255-7c2b18029f1f?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'Capped, Transparent, and Fair.',
    subtitle: 'Each gameplay has a number of entries. Once the entry cap is reached, the competition closes and the prize is awarded.',
    img: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'Coins That Power Your Play',
    subtitle: 'Top up coins, join gameplays, and withdraw your earnings securely. All transactions are transparent and compliant.',
    img: 'https://images.unsplash.com/photo-1641932693087-9f278adef0b5?q=80&w=800&auto=format&fit=crop',
  },
];

export default function OnboardingScreen() {
  const dispatch = useDispatch();
  const [index, setIndex] = useState(0);
  const ref = useRef(null);

  const onContinue = () => {
    if (index < slides.length - 1) {
      ref.current?.scrollTo({ x: (index + 1) * width, animated: true });
      setIndex(index + 1);
    } else {
      dispatch(setOnboardingSeen());
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <View style={styles.header}><Text style={styles.brand}>Zishes</Text></View>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          if (i !== index) setIndex(i);
        }}
        scrollEventThrottle={16}
      >
        {slides.map((s, i) => (
          <View key={i} style={{ width, padding: 20 }}>
            <Image source={{ uri: s.img }} style={styles.image} />
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.subtitle}>{s.subtitle}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onContinue}>
          <Text style={styles.primaryText}>{index < slides.length - 1 ? 'Continue' : 'Lets Zish'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 50, alignItems: 'center', justifyContent: 'center' },
  brand: { color: colors.white, fontWeight: '700', fontSize: 18 },
  image: { width: '100%', height: 220, borderRadius: 16, backgroundColor: '#222' },
  title: { color: colors.white, fontWeight: '800', fontSize: 24, marginTop: 16 },
  subtitle: { color: colors.textSecondary, marginTop: 8 },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3A3F4E' },
  dotActive: { backgroundColor: colors.accent, width: 8 },
  primaryBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: colors.white, fontWeight: '700' },
});

