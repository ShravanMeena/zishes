import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft } from 'lucide-react-native';

// NOTE: For now, we render simple HTML-ish content as plain text with minimal formatting.
// When ready, add `react-native-webview` and replace the content area with <WebView source={{ html }} />.

function HtmlBlock({ html }) {
  // naive strip of tags for basic readability; keeps content visible without WebView
  const text = useMemo(() => html?.replace(/<[^>]+>/g, '').trim() || '', [html]);
  return <Text style={styles.body}>{text}</Text>;
}

export default function PolicyViewerScreen({ navigation, route }) {
  const { title = 'Policy', html = '', url } = route.params || {};

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ChevronLeft size={20} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        {html ? (
          <HtmlBlock html={html} />
        ) : (
          <View>
            <Text style={styles.body}>No inline content provided.</Text>
            {url ? <Text style={[styles.body, { marginTop: 8 }]}>URL: {url}</Text> : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18, maxWidth: '70%' },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },
  body: { color: '#E6F0FF', fontSize: 16, lineHeight: 22 },
});

