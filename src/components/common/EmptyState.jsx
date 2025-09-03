import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export default function EmptyState({ title = 'Nothing here', description = 'Try adjusting your search or filters.' }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 40 },
  card: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 16, padding: 20 },
  title: { color: colors.white, fontWeight: '800', fontSize: 18, marginBottom: 8, textAlign: 'center' },
  desc: { color: colors.textSecondary, textAlign: 'center' },
});

