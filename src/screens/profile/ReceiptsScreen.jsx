import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import EmptyState from '../../components/common/EmptyState';

export default function ReceiptsScreen({ navigation }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ChevronLeft color={colors.white} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipts</Text>
        <View style={styles.placeholder} />
      </View>

      <EmptyState
        title="No receipts yet"
        description="Receipts for your purchases will appear here once they are available."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#22252C',
  },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2B2F39',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#343B49',
  },
  placeholder: { width: 32, height: 32 },
});
