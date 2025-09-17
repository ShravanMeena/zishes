import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Platform, PermissionsAndroid, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { colors } from '../../theme/colors';
import { Globe, Check } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { completeVerification, setUser } from '../../store/auth/authSlice';
import { createUser as createZishesUser, updateMe as updateCurrentUser } from '../../services/users';
import { getAccessToken } from '../../services/tokenManager';
import Button from '../../components/ui/Button';
import useLocationPermission from '../../hooks/useLocationPermission';
import { detectCityCountry } from '../../services/location';

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Singapore', 'Canada', 'Australia', 'Japan', 'South Korea', 'China', 'Philippines', 'United Arab Emirates'
];

export default function CountrySelectScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const email = useSelector((s) => s.auth?.user?.email);
  const token = useSelector((s) => s.auth?.token);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [detectedLabel, setDetectedLabel] = useState('');
  const hasSelection = !!selected;
  const ensureLocationPermission = useLocationPermission();

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COUNTRIES.filter(c => !q || c.toLowerCase().includes(q));
  }, [query]);

  const detect = async () => {
    if (detecting) return;
    setDetecting(true);
    setDetectedLabel('');
    try {
      const ok = await ensureLocationPermission();
      // Proceed even if permission denied; we'll fallback to IP geo
      const place = await detectCityCountry();
      const { city, country, countryCode, method } = place || {};
      const label = [city, country].filter(Boolean).join(', ');
      if (label) setDetectedLabel(label);
      // Try to match to our allowed list
      const listCountry = (country || '').toLowerCase();
      const found = COUNTRIES.find(c => c.toLowerCase() === listCountry) ||
                    COUNTRIES.find(c => listCountry.includes(c.toLowerCase()));
      if (found) setSelected(found);
      else if (!found && countryCode) {
        // Limited aliasing for common variants
        const aliasMap = {
          'US': 'United States', 'GB': 'United Kingdom', 'AE': 'United Arab Emirates',
          'KR': 'South Korea'
        };
        const aliased = aliasMap[countryCode];
        if (aliased && COUNTRIES.includes(aliased)) setSelected(aliased);
      }
      // As a last resort, keep previous selection or default to India if none
      setSelected((s) => s || 'India');
    } catch (e) {
      setSelected((s) => s || 'India');
    } finally {
      setDetecting(false);
    }
  };

  const onContinue = async () => {
    if (!selected) return;
    // If opened in picker mode, update EditProfile params and go back
    if (route?.params?.mode === 'pick') {
      // Merge params into existing EditProfile if present in stack
      navigation.navigate({ name: 'EditProfile', params: { selectedCountry: selected }, merge: true });
      navigation.goBack();
      return;
    }
    // Default onboarding flow: ensure user exists, then update country on backend and store
    try {
      let bearer = token;
      if (!bearer) { try { bearer = await getAccessToken(); } catch {} }
      if (!bearer) throw new Error('Missing auth token');
      // First, try patching country (works if user already exists)
      try {
   
        const updated = await updateCurrentUser({ address: { country: selected } }, { token: bearer });
        if (updated) dispatch(setUser(updated?.data || updated));
      } catch (err) {
        // If user doesn't exist yet, create then patch
        if (email && bearer) {
          // await createZishesUser({ email, token: bearer });
          const updated = await updateCurrentUser({ address: { country: selected } }, { token: bearer });
          if (updated) dispatch(setUser(updated?.data || updated));
        }
      }
    } catch (err) {
      console.warn('[CountrySelect] set country error:', err?.status, err?.message);
    } finally {
      await dispatch(completeVerification());
    }
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
      <View style={styles.header}><Text style={styles.headerTitle}>Select Your Country</Text></View>
      <FlatList
        data={list}
        renderItem={renderItem}
        keyExtractor={(it) => it}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 10 }}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 120, paddingHorizontal: 20 }}
        ListHeaderComponent={(
          <View style={{ marginBottom: 16 }}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search for a country..."
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />
            <Text style={{ color: colors.textSecondary, marginVertical: 8 }}>Tap to choose your country of play.</Text>
            <TouchableOpacity onPress={detect} style={[styles.detectBtn, detecting && { opacity: 0.7 }]}> 
              {detecting ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={[styles.detectText, { marginLeft: 8 }]}>Detecting…</Text>
                </View>
              ) : (
                <Text style={styles.detectText}>Use current location</Text>
              )}
            </TouchableOpacity>
            {!!detectedLabel && (
              <Text style={{ color: colors.textSecondary, marginTop: 6 }}>Detected: {detectedLabel}</Text>
            )}
          </View>
        )}
      />
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
