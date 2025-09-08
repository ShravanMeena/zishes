import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, ScrollView, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useDispatch } from 'react-redux';
import { setOnboardingSeen } from '../../store/app/appSlice';
import appConfigService from '../../services/appConfig';
import OnboardingSkeleton from '../../components/skeletons/OnboardingSkeleton';

const { width } = Dimensions.get('window');

// Default slides removed; show skeleton while loading.

export default function OnboardingScreen() {
  const dispatch = useDispatch();
  const [index, setIndex] = useState(0);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);

  const onContinue = () => {
    if (index < slides.length - 1) {
      ref.current?.scrollTo({ x: (index + 1) * width, animated: true });
      setIndex(index + 1);
    } else {
      dispatch(setOnboardingSeen());
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await appConfigService.getAppConfig();
        const arr = Array.isArray(data?.introSlides) ? data.introSlides : [];
        if (arr.length && alive) {
          const mapped = arr.map((s) => ({
            title: s?.title || '',
            subtitle: s?.description || s?.note || '',
            img: s?.image || '',
          }));
          setSlides(mapped);
        }
      } catch (e) {
        if (__DEV__) console.warn('[CONFIG] Failed to load intro slides:', e?.message || e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top','bottom']}>
      <View style={styles.header}><Text style={styles.brand}>Zishes</Text></View>
      {loading ? (
        <>
          <OnboardingSkeleton />
          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </>
      ) : (
        <>
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
                {!!s.img && <Image source={{ uri: s.img }} style={styles.image} />}
                {!!s.title && <Text style={styles.title}>{s.title}</Text>}
                {!!s.subtitle && <Text style={styles.subtitle}>{s.subtitle}</Text>}
              </View>
            ))}
          </ScrollView>
          <View style={styles.dots}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
        </>
      )}
      <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.6 }]} onPress={onContinue} disabled={loading}>
          <Text style={styles.primaryText}>{loading ? 'Loading…' : index < slides.length - 1 ? 'Continue' : 'Lets Zish'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
