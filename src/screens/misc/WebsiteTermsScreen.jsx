import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet from '../../components/common/BottomSheet';
import TermsContent from '../../components/common/TermsContent';
import { colors } from '../../theme/colors';

export default function WebsiteTermsScreen({ navigation }) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Website / Terms</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Terms & Conditions (Full)</Text>
        <View style={styles.panel}>
          <TermsContent />
        </View>

        <TouchableOpacity style={styles.previewBtn} onPress={() => setSheetOpen(true)}>
          <Text style={styles.previewBtnText}>Preview in Bottom Sheet</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} full={false}>
        <Text style={styles.sheetTitle}>Quick Preview</Text>
        <TermsContent compact />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  link: { color: colors.accent, fontWeight: '700' },
  title: { color: colors.white, fontWeight: '800', fontSize: 18, marginBottom: 10 },
  panel: { backgroundColor: '#2B2F39', borderRadius: 16, borderWidth: 1, borderColor: '#343B49', padding: 12 },
  previewBtn: { marginTop: 16, backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  previewBtnText: { color: '#0B1220', fontWeight: '800' },
  sheetTitle: { color: colors.white, fontWeight: '800', fontSize: 16, marginBottom: 8 },
});

