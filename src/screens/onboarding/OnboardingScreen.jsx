import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, ScrollView, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useDispatch } from 'react-redux';
import { setOnboardingSeen } from '../../store/app/appSlice';
import appConfigService from '../../services/appConfig';
import OnboardingSkeleton from '../../components/skeletons/OnboardingSkeleton';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const FALLBACK_SLIDES = [
  {
    title: 'Shop, Play, and Own.',
    subtitle:
      'Zishes is a global marketplace where products are offered through structured gameplays. Every listing is a prize competition with transparent, fair entries.',
    note: 'Not gambling. A regulated digital prize competition model.',
    img: '',
  },
  {
    title: 'Everyone wins with Zishes',
    subtitle:
      'Winners take home the products they love. Sellers get paid securely and instantly. A fair, transparent, and fun marketplace experience.',
    note: 'Wallet and payout systems meet global digital commerce standards.',
    img: '',
  },
];

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
            title: s?.title?.trim() || '',
            subtitle: s?.description?.trim() || '',
            note: s?.note?.trim() || '',
            img: s?.image || '',
          }));
          setSlides(mapped.length ? mapped : FALLBACK_SLIDES);
        }
      } catch (e) {
        if (__DEV__) console.warn('[CONFIG] Failed to load intro slides:', e?.message || e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    if (!slides.length) {
      setSlides(FALLBACK_SLIDES);
    }
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
            contentContainerStyle={styles.carouselContent}
            onScroll={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / width);
              if (i !== index) setIndex(i);
            }}
            scrollEventThrottle={16}
          >
            {slides.map((s, i) => (
              <View key={i} style={[styles.slide, { width }]}>
                <View style={styles.illustrationWrap}>
                  {!!s.img && (
                    <Image
                      source={{ uri: s.img }}
                      resizeMode="contain"
                      style={styles.image}
                    />
                  )}
                </View>
                {!!s.title && <Text style={styles.title}>{s.title}</Text>}
                {!!s.subtitle && <Text style={styles.subtitle}>{s.subtitle}</Text>}
                {!!s.note && <Text style={styles.note}>{s.note}</Text>}
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
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.ctaTouchable, loading && { opacity: 0.7 }]} onPress={onContinue} disabled={loading} activeOpacity={0.85}>
          <LinearGradient
            colors={[colors.ctaGradientStart, colors.ctaGradientEnd]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryText}>{loading ? 'Loading…' : index < slides.length - 1 ? 'Continue' : 'Lets Zish'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, alignItems: 'center', justifyContent: 'center' },
  brand: { color: colors.white, fontWeight: '800', fontSize: 22, letterSpacing: 0.8 },
  carouselContent: { alignItems: 'center' },
  slide: {
    paddingHorizontal: 32,
    paddingTop: 12,
    alignItems: 'center',
  },
  illustrationWrap: {
    width: '100%',
    height: width * 0.85,
    maxHeight: 360,
    marginBottom: 24,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'transparent',
    shadowColor: '#140033',
    shadowOffset: { width: 0, height: 28 },
    shadowOpacity: 0.45,
    shadowRadius: 48,
    elevation: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  note: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 18,
    opacity: 0.8,
  },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#323545' },
  dotActive: { backgroundColor: colors.accent, transform: [{ scale: 1.25 }] },
  footer: { paddingHorizontal: 24, paddingBottom: 28 },
  ctaTouchable: { borderRadius: 16, overflow: 'hidden' },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
