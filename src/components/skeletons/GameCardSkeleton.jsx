import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export default function GameCardSkeleton() {
  return (
    <View style={styles.card}>
      {/* Image header */}
      <View style={styles.imageWrap}>
        <View style={styles.image} />
        <View style={[styles.roundIcon, styles.leftIcon]} />
        <View style={[styles.roundIcon, styles.rightIcon]} />
        <View style={[styles.title, styles.lineSm]} />
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.rowBetween}>
          <View style={[styles.lineXs, { width: 100 }]} />
          <View style={[styles.lineXs, { width: 80 }]} />
        </View>
        <View style={[styles.lineSm, { marginTop: 10, width: '80%' }]} />
        <View style={styles.progress} />
        <View style={[styles.lineXs, { marginTop: 10, width: 160 }]} />
        <View style={[styles.rowBetween, { marginTop: 12, alignItems: 'center' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.dot, { marginRight: 6 }]} />
            <View style={[styles.lineXs, { width: 70 }]} />
            <View style={[styles.lineXs, { width: 90, marginLeft: 6 }]} />
          </View>
          <View style={styles.gameTypeWrap} />
        </View>
      </View>

      <View style={[styles.rowBetween, { marginTop: 16, alignItems: 'center', paddingHorizontal: 14, paddingBottom: 14 }]}>
        <View style={[styles.playBtn]}>
          <View style={styles.playGrad} />
        </View>
        <View style={[styles.lineXs, { width: 120 }]} />
      </View>
    </View>
  );
}

const bg = '#2B303B';
const tint = '#3A4051';

const styles = StyleSheet.create({
  card: { backgroundColor: bg, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#2E3440', marginBottom: 16 },
  imageWrap: { position: 'relative', height: 160, backgroundColor: '#1F232C', justifyContent: 'flex-end' },
  image: { ...StyleSheet.absoluteFillObject, backgroundColor: '#22252C' },
  title: { height: 18, backgroundColor: tint, borderRadius: 6, margin: 12, width: 180 },
  roundIcon: { position: 'absolute', top: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)' },
  leftIcon: { left: 12 },
  rightIcon: { right: 12 },
  body: { padding: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  lineXs: { height: 12, backgroundColor: tint, borderRadius: 6 },
  lineSm: { height: 14, backgroundColor: tint, borderRadius: 6 },
  progress: { height: 10, backgroundColor: '#2E3440', borderRadius: 6, marginTop: 10 },
  dot: { width: 18, height: 18, borderRadius: 9, backgroundColor: tint },
  gameTypeWrap: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#1F232C' },
  playBtn: { borderRadius: 12, overflow: 'hidden', backgroundColor: 'transparent' },
  playGrad: { paddingHorizontal: 22, paddingVertical: 16, borderRadius: 12, backgroundColor: colors.primary, width: 140 },
});

