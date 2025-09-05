import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export default function DetailsSkeleton() {
  return (
    <View>
      {/* Slider */}
      <View style={styles.hero}>
        <View style={[styles.circle, styles.leftCircle]} />
        <View style={[styles.circle, styles.rightCircle]} />
      </View>
      <View style={styles.dotsWrap}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      {/* Info Card */}
      <View style={styles.card}>
        <View style={[styles.lineLg, { width: '60%' }]} />
        <View style={styles.priceRow}>
          <View style={[styles.lineSm, { width: 60 }]} />
          <View style={[styles.priceChip]} />
          <View style={{ flex: 1 }} />
          <View style={[styles.lineSm, { width: 90 }]} />
          <View style={[styles.lineSm, { width: 60, marginLeft: 6 }]} />
        </View>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.rowBetween}>
          <View style={[styles.lineSm, { width: 140 }]} />
          <View style={[styles.lineSm, { width: 100 }]} />
        </View>
        <View style={styles.progress} />
        <View style={[styles.lineSm, { width: 160, marginTop: 10 }]} />
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 12, marginBottom: 12 }}>
        <View style={styles.playBtn} />
      </View>

      {/* Tabs skeleton header */}
      <View style={styles.tabsRow}>
        <View style={styles.tab} />
        <View style={styles.tab} />
        <View style={styles.tab} />
      </View>

      {/* Panel skeleton */}
      <View style={styles.panel}>
        <View style={[styles.lineLg, { width: '40%' }]} />
        <View style={[styles.lineSm, { marginTop: 10, width: '90%' }]} />
        <View style={[styles.lineSm, { marginTop: 6, width: '85%' }]} />
        <View style={[styles.lineSm, { marginTop: 6, width: '80%' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 220, backgroundColor: '#22252C' },
  circle: { position: 'absolute', top: 14, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)' },
  leftCircle: { left: 12 },
  rightCircle: { right: 12 },
  dotsWrap: { flexDirection: 'row', alignSelf: 'center', marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4E4E56', marginHorizontal: 3 },
  card: { backgroundColor: '#2B2F39', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: '#343B49' },
  lineLg: { height: 20, backgroundColor: '#3A4051', borderRadius: 8 },
  lineSm: { height: 14, backgroundColor: '#3A4051', borderRadius: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  priceChip: { height: 22, width: 90, borderRadius: 8, backgroundColor: colors.accent, marginLeft: 6 },
  statusCard: { backgroundColor: '#2B2F39', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: '#343B49' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progress: { height: 10, backgroundColor: '#2E3440', borderRadius: 6, marginTop: 10 },
  tabsRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, flexDirection: 'row' },
  tab: { height: 36, backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#3A4051', borderRadius: 10, width: 120, marginRight: 10 },
  panel: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 10 },
  playBtn: { height: 50, borderRadius: 12, backgroundColor: colors.primary },
});

