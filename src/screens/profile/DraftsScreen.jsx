import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { getAllDrafts, deleteDraft } from '../../store/listingDraft/draftsStorage';
import Button from '../../components/ui/Button';
import { useSelector } from 'react-redux';
import { ChevronLeft } from 'lucide-react-native';

function timeAgo(ts) {
  const diff = Date.now() - (Number(ts) || 0);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} days ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} mo ago`;
  const y = Math.floor(mo / 12);
  return `${y}y ago`;
}

export default function DraftsScreen() {
  const navigation = useNavigation();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const userCountry = useSelector((s) => s.auth.user?.address?.country);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getAllDrafts();
      setDrafts(list);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const normalizedCountry = useMemo(() => String(userCountry || '').trim().toLowerCase(), [userCountry]);
  const { visibleDrafts, hiddenCount } = useMemo(() => {
    if (!normalizedCountry) {
      return { visibleDrafts: drafts, hiddenCount: 0 };
    }
    const visible = [];
    let hidden = 0;
    drafts.forEach((draft) => {
      const origin = String(draft?.originCountry || '').trim().toLowerCase();
      if (!origin || origin === normalizedCountry) {
        visible.push(draft);
      } else {
        hidden += 1;
      }
    });
    return { visibleDrafts: visible, hiddenCount: hidden };
  }, [drafts, normalizedCountry]);

  const LOCKED_MESSAGE = 'YOUR ITEMS ARE LOCKED AS PER THE COUNTRY. IF YOU CAN\'T SEE YOUR DRAFTS PLEASE CHOOSE THE COUNTRY YOU HAD SET EARLIER.';

  const onDelete = useCallback((id) => {
    Alert.alert('Delete draft?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteDraft(id); load(); } },
    ]);
  }, [load]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1, paddingRight: 12, minWidth: 0 }}>
        <Text style={styles.title} numberOfLines={1}>
          {item.name || 'Untitled Item'}
        </Text>
        <Text style={styles.subtitle}>{timeAgo(item.createdAt)} — draft created</Text>
      </View>
      <View style={styles.btnRow}>
        <Button
          title="Edit"
          onPress={() => navigation.navigate('Sell', { draftData: item.data })}
          fullWidth={false}
          style={styles.btn}
        />
        <View style={{ width: 8 }} />
        <Button
          title="Delete"
          variant="outline"
          onPress={() => onDelete(item.id)}
          fullWidth={false}
          style={styles.btn}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
              return;
            }
            const parent = navigation.getParent?.();
            if (parent?.navigate) parent.navigate('Profile');
          }}
          style={styles.iconBtn}
        >
          <ChevronLeft size={20} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Drafts</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={visibleDrafts}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={hiddenCount > 0 ? (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Drafts hidden for this country</Text>
            <Text style={styles.bannerBody}>{LOCKED_MESSAGE}</Text>
          </View>
        ) : null}
        ListHeaderComponentStyle={hiddenCount > 0 ? { marginBottom: 16 } : null}
        renderItem={renderItem}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}> 
            <Text style={styles.emptyText}>{hiddenCount > 0 ? 'Drafts hidden for this country' : 'No drafts yet'}</Text>
            <Text style={styles.emptySub}>
              {hiddenCount > 0 ? LOCKED_MESSAGE : 'Save a draft from Sell screen to see it here.'}
            </Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 14, padding: 14 },
  title: { color: colors.white, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, marginTop: 4 },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  btn: { paddingHorizontal: 14 },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 24 },
  emptyText: { color: colors.white, fontWeight: '800', fontSize: 18 },
  emptySub: { color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
  banner: { backgroundColor: '#2F2C54', borderRadius: 14, borderWidth: 1, borderColor: '#3B3F68', padding: 14 },
  bannerTitle: { color: colors.white, fontWeight: '800', fontSize: 16 },
  bannerBody: { color: colors.textSecondary, marginTop: 6 },
});
