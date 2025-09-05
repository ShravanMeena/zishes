import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../theme/colors';

// Lightweight Markdown renderer supporting headings and bullet/numbered lists.
// Renders plain paragraphs otherwise. Inline emphasis is not parsed.
export default function Markdown({ content = '' }) {
  const lines = String(content || '').split(/\r?\n/);
  if (!lines.length) return null;

  return (
    <View>
      {lines.map((line, idx) => {
        const trimmed = line.trimEnd();
        if (!trimmed.length) return <View key={idx} style={{ height: 6 }} />;

        // Headings
        if (/^######\s+/.test(trimmed)) return <Text key={idx} style={[styles.h6]}>{trimmed.replace(/^######\s+/, '')}</Text>;
        if (/^#####\s+/.test(trimmed)) return <Text key={idx} style={[styles.h5]}>{trimmed.replace(/^#####\s+/, '')}</Text>;
        if (/^####\s+/.test(trimmed)) return <Text key={idx} style={[styles.h4]}>{trimmed.replace(/^####\s+/, '')}</Text>;
        if (/^###\s+/.test(trimmed)) return <Text key={idx} style={[styles.h3]}>{trimmed.replace(/^###\s+/, '')}</Text>;
        if (/^##\s+/.test(trimmed)) return <Text key={idx} style={[styles.h2]}>{trimmed.replace(/^##\s+/, '')}</Text>;
        if (/^#\s+/.test(trimmed)) return <Text key={idx} style={[styles.h1]}>{trimmed.replace(/^#\s+/, '')}</Text>;

        // Unordered list
        if (/^[-*]\s+/.test(trimmed)) {
          return (
            <View key={idx} style={styles.liRow}>
              <Text style={styles.bullet}>{'\u2022'}</Text>
              <Text style={styles.p}>{trimmed.replace(/^[-*]\s+/, '')}</Text>
            </View>
          );
        }

        // Numbered list
        if (/^\d+\.\s+/.test(trimmed)) {
          const [num, ...rest] = trimmed.split(/\s+/);
          return (
            <View key={idx} style={styles.liRow}>
              <Text style={styles.bullet}>{num}</Text>
              <Text style={styles.p}>{rest.join(' ')}</Text>
            </View>
          );
        }

        return <Text key={idx} style={styles.p}>{trimmed}</Text>;
      })}
    </View>
  );
}

const styles = {
  h1: { color: colors.white, fontWeight: '800', fontSize: 22, marginBottom: 6 },
  h2: { color: colors.white, fontWeight: '800', fontSize: 20, marginBottom: 6 },
  h3: { color: colors.white, fontWeight: '700', fontSize: 18, marginBottom: 6 },
  h4: { color: colors.white, fontWeight: '700', fontSize: 16, marginBottom: 6 },
  h5: { color: colors.white, fontWeight: '700', fontSize: 15, marginBottom: 6 },
  h6: { color: colors.white, fontWeight: '700', fontSize: 14, marginBottom: 6 },
  p: { color: colors.white, fontSize: 14, lineHeight: 20 },
  liRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 },
  bullet: { width: 16, color: colors.white, fontSize: 14, lineHeight: 20 },
};

