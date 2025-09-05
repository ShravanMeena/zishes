import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function MyListingsSkeleton({ count = 4 }) {
  return (
    <View style={{ padding: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.card, i > 0 && { marginTop: 12 }]}>
          <View style={styles.thumb} />
          <View style={{ flex: 1 }}>
            <View style={styles.chipsRow}>
              <View style={[styles.chip, { width: 70 }]} />
              <View style={[styles.chip, { width: 70 }]} />
            </View>
            <View style={[styles.bar, { width: '60%', marginTop: 10 }]} />
            <View style={[styles.bar, { width: '30%', marginTop: 8 }]} />
            <View style={[styles.bar, { width: '50%', marginTop: 12 }]} />
            <View style={[styles.progress, { marginTop: 8 }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: '#2B2F39', borderRadius: 18, borderWidth: 1, borderColor: '#343B49', padding: 12 },
  thumb: { width: 70, height: 70, borderRadius: 10, marginRight: 12, backgroundColor: '#1F232C' },
  chipsRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  chip: { height: 24, borderRadius: 12, backgroundColor: '#1F232C', marginLeft: 8 },
  bar: { height: 16, borderRadius: 8, backgroundColor: '#1F232C' },
  progress: { height: 8, borderRadius: 4, backgroundColor: '#1F232C' },
});

