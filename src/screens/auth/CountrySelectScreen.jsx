import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Platform, PermissionsAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { colors } from '../../theme/colors';
import { Globe, Check } from 'lucide-react-native';
import { useDispatch } from 'react-redux';
import { setCountry } from '../../store/app/appSlice';
import { completeVerification } from '../../store/auth/authSlice';
import Button from '../../components/ui/Button';

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Singapore', 'Canada', 'Australia', 'Japan', 'South Korea', 'China', 'Philippines', 'United Arab Emirates'
];

export default function CountrySelectScreen({ navigation }) {
  const dispatch = useDispatch();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const hasSelection = !!selected;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COUNTRIES.filter(c => !q || c.toLowerCase().includes(q));
  }, [query]);

  const detect = async () => {
    try {
      if (Platform.OS === 'android') {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      }
      // Placeholder: you can integrate actual geo lookup later
      // For now we default to 'India' if none selected
      setSelected((s) => s || 'India');
    } catch {}
  };

  const onContinue = async () => {
    if (!selected) return;
    await dispatch(setCountry(selected));
    await dispatch(completeVerification());
    // RootNavigator will switch to AppTabs after this
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[styles.tile, selected === item && styles.rowActive]} onPress={() => setSelected(item)}>
      <View style={[styles.icon, { marginRight: 0 }]}><Globe size={16} color={colors.white} /></View>
      <Text style={styles.rowText} numberOfLines={2}>{item}</Text>
      {selected === item ? <View style={styles.checkWrap}><Check size={16} color={colors.white} /></View> : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      <KeyboardAwareScrollView enableOnAndroid keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.header}><Text style={styles.headerTitle}>Select Your Country</Text></View>
        <View style={{ padding: 20 }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search for a country..."
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
          <Text style={{ color: colors.textSecondary, marginVertical: 8 }}>Tap to choose your country of play.</Text>
          <TouchableOpacity onPress={detect} style={styles.detectBtn}><Text style={styles.detectText}>Use current location</Text></TouchableOpacity>
          <FlatList
            data={list}
            renderItem={renderItem}
            keyExtractor={(it) => it}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 10 }}
            contentContainerStyle={{ paddingVertical: 12, paddingBottom: 0 }}
          />
        </View>
      </KeyboardAwareScrollView>
      <View style={styles.bottomBar}>
        <Button title="Continue" onPress={onContinue} disabled={!hasSelection} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, alignItems: 'center', justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  input: {
    width: '100%', backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: colors.white,
  },
  row: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tile: { width: '48%', backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 18, padding: 14, alignItems: 'center', justifyContent: 'center', minHeight: 84 },
  rowActive: { borderColor: colors.accent, backgroundColor: '#3A2B52' },
  rowText: { color: colors.white, fontWeight: '600' },
  icon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#312B42', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkWrap: { position: 'absolute', right: 10, top: 10, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  detectBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49' },
  detectText: { color: colors.accent, fontWeight: '700' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: colors.black,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#22252C',
  },
});
