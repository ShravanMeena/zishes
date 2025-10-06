import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { Globe, Check, ChevronLeft } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { completeVerification, setUser } from '../../store/auth/authSlice';
import { setCountry as setAppCountry } from '../../store/app/appSlice';
import { clearDraftStorage, resetDraft } from '../../store/listingDraft/listingDraftSlice';
import { updateMe as updateCurrentUser } from '../../services/users';
import { getToken } from '../../services/tokenManager';
import Button from '../../components/ui/Button';


/// need to get from API
const COUNTRIES = [
  'India', 'United Arab Emirates'
];

export default function CountrySelectScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const email = useSelector((s) => s.auth?.user?.email);
  const token = useSelector((s) => s.auth?.token);
  const existingCountry = useSelector((s) => s.auth?.user?.address?.country);
  const canNavigateBack = navigation?.canGoBack?.() ?? false;
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(() => {
    const initial = route?.params?.initialCountry || existingCountry || null;
    return COUNTRIES.includes(initial) ? initial : null;
  });
  const [saving, setSaving] = useState(false);
  const hasSelection = !!selected;

  useEffect(() => {
    if (selected) return;
    if (!existingCountry) return;
    if (!COUNTRIES.includes(existingCountry)) return;
    setSelected(existingCountry);
  }, [existingCountry, selected]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COUNTRIES.filter(c => !q || c.toLowerCase().includes(q));
  }, [query]);

  const persistCountry = async (countryName) => {
    let bearer = token;
    if (!bearer) {
      try {
        bearer = await getToken();
      } catch {}
    }
    if (!bearer) throw new Error('Missing auth token');

    const payload = { address: { country: countryName } };
    console.log('[CountrySelect] update payload', payload);

    const pushUpdate = async () => {
      const updated = await updateCurrentUser(payload, { token: bearer });
      if (updated) {
        dispatch(setUser(updated?.data || updated));
        await dispatch(setAppCountry(countryName));
        try { await dispatch(clearDraftStorage(countryName)); } catch (_) {}
        dispatch(resetDraft({ originCountry: countryName }));
      }
    };

    try {
      await pushUpdate();
    } catch (err) {
      if (email && bearer) {
        try {
          await pushUpdate();
        } catch (inner) {
          throw inner;
        }
      } else {
        throw err;
      }
    }
  };

  const onContinue = async () => {
    if (!selected || saving) return;

    const isPickerMode = route?.params?.mode === 'pick';

    if (isPickerMode) {
      let updated = false;
      try {
        setSaving(true);
        await persistCountry(selected);
        updated = true;
      } catch (err) {
        console.warn('[CountrySelect] picker update failed:', err?.message || err);
      } finally {
        setSaving(false);
      }
      if (updated) {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate?.('Home');
        }
      }
      return;
    }

    try {
      setSaving(true);
      await persistCountry(selected);
    } catch (err) {
      console.warn('[CountrySelect] set country error:', err?.status, err?.message || err);
    } finally {
      await dispatch(completeVerification());
      setSaving(false);
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
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, !canNavigateBack && styles.backBtnDisabled]}
          onPress={() => { if (canNavigateBack) navigation.goBack(); }}
          disabled={!canNavigateBack}
        >
          <ChevronLeft size={18} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Your Country</Text>
        <View style={{ width: 32, height: 32 }} />
      </View>
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
          </View>
        )}
      />
      <View style={styles.bottomBar}>
        <Button title="Continue" onPress={onContinue} disabled={!hasSelection || saving} loading={saving} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#22252C',
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#343B49',
    backgroundColor: '#2B2F39',
  },
  backBtnDisabled: {
    opacity: 0.4,
  },
  input: {
    width: '100%', backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: colors.white,
  },
  row: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tile: { width: '48%', backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 18, padding: 14, alignItems: 'center', justifyContent: 'center', minHeight: 84 },
  rowActive: { borderColor: colors.accent, backgroundColor: '#3A2B52' },
  rowText: { color: colors.white, fontWeight: '600' },
  icon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#312B42', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkWrap: { position: 'absolute', right: 10, top: 10, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
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
