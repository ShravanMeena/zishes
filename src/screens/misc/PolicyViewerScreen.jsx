import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
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
  let WebViewComp = null;
  try {
    // Dynamically require to avoid crashing if not installed
    WebViewComp = require('react-native-webview').WebView;
  } catch (_) {
    WebViewComp = null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ChevronLeft size={20} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 32 }} />
      </View>

      {WebViewComp && (url || html) ? (
        <View style={{ flex: 1 }}>
          {url ? (
            <WebViewComp
              source={{ uri: url }}
              originWhitelist={["*"]}
              startInLoadingState
              style={{ flex: 1, backgroundColor: colors.black }}
            />
          ) : (
            <WebViewComp
              source={{ html }}
              originWhitelist={["*"]}
              startInLoadingState
              style={{ flex: 1, backgroundColor: colors.black }}
            />
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
          {url ? (
            <View>
              <Text style={styles.body}>Opening inline requires react-native-webview.</Text>
              <Text style={[styles.body, { marginTop: 8 }]} numberOfLines={2}>URL: {url}</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(url)}
                style={{ marginTop: 12, backgroundColor: '#3A2B52', paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
              >
                <Text style={{ color: 'white', fontWeight: '700' }}>Open in Browser</Text>
              </TouchableOpacity>
            </View>
          ) : html ? (
            <HtmlBlock html={html} />
          ) : (
            <Text style={styles.body}>No content provided.</Text>
          )}
        </ScrollView>
      )}
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
