import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

export default function OnboardingSkeleton() {
  return (
    <View style={{ width }}>
      <View style={styles.container}>
        <View style={styles.hero} />
        <View style={[styles.lineTitle, { width: '70%' }]} />
        <View style={[styles.lineText, { width: '95%' }]} />
        <View style={[styles.lineText, { width: '85%' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  hero: { width: '100%', height: 220, borderRadius: 16, backgroundColor: '#22252C' },
  lineTitle: { height: 24, backgroundColor: '#3A4051', borderRadius: 8, marginTop: 16 },
  lineText: { height: 14, backgroundColor: '#3A4051', borderRadius: 8, marginTop: 8 },
});
