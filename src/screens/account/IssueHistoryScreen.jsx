import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, RefreshCcw, Link as LinkIcon } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import issues from '../../services/issues';

export default function IssueHistoryScreen({ navigation }) {
  const token = useSelector((s) => s.auth.token);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);

  const loadIssues = useCallback(async (opts = { silent: false }) => {
    if (!token) {
      setItems([]);
      setError('Login required');
      return;
    }
    if (!opts.silent) setLoading(true);
    try {
      setError(null);
      const list = await issues.listIssues({ mine: true, token });
      const normalized = Array.isArray(list) ? list : [];
      setItems(normalized);
    } catch (e) {
      setError(e?.message || 'Failed to load issues');
    } finally {
      if (!opts.silent) setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadIssues({ silent: false });
    }, [loadIssues])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadIssues({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadIssues]);

  const renderItem = useCallback(({ item }) => {
    const createdAt = formatDate(item?.createdAt);
    const status = String(item?.status || 'open');
    const badgeStyle = getStatusStyle(status);
    const attachments = Array.isArray(item?.attachments) ? item.attachments : [];

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item?.category || 'General'}</Text>
          <View style={[styles.statusPill, badgeStyle?.container]}>
            <Text style={[styles.statusTxt, badgeStyle?.label]}>{statusLabel(status)}</Text>
          </View>
        </View>
        <Text style={styles.metaTxt}>Created {createdAt}</Text>
        <Text style={styles.desc}>{item?.description || 'No description provided.'}</Text>
        {attachments.length ? (
          <View style={styles.attachSection}>
            <Text style={styles.attachTitle}>Attachments</Text>
            {attachments.map((url, idx) => (
              <TouchableOpacity key={`${url}-${idx}`} style={styles.attachRow} onPress={() => openUrl(url)}>
                <LinkIcon size={16} color={colors.accent} />
                <Text numberOfLines={1} style={styles.attachUrl}>{url}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        {item?.statusHistory && item.statusHistory.length ? (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Status History</Text>
            {item.statusHistory.map((entry, index) => (
              <View key={`${entry.status}-${entry.updatedAt}-${index}`} style={styles.historyRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.historyStatus}>{statusLabel(entry.status)}</Text>
                  <Text style={styles.historyDate}>{formatDate(entry.updatedAt)}</Text>
                </View>
                {entry.comment ? <Text style={styles.historyComment}>{entry.comment}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}
      </View>
    );
  }, []);

  const keyExtractor = useCallback((item, index) => item?._id || item?.id || `issue-${index}`, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Issue Reports</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <RefreshCcw size={18} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading your reports…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={items.length ? { padding: 16, paddingBottom: 32 } : styles.emptyWrap}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No reports yet</Text>
              <Text style={styles.emptySubtitle}>Once you submit an issue, it will appear here with its status and history.</Text>
            </View>
          }
        />
      )}

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function statusLabel(status) {
  switch (String(status || '').toLowerCase()) {
    case 'in_progress':
      return 'In Progress';
    case 'closed':
      return 'Closed';
    default:
      return 'Open';
  }
}

function getStatusStyle(status) {
  const base = { container: { backgroundColor: '#2F3140', borderColor: '#3F435C' }, label: { color: colors.white } };
  const value = String(status || '').toLowerCase();
  if (value === 'closed') {
    return { container: { backgroundColor: 'rgba(39,192,125,0.12)', borderColor: '#27c07d' }, label: { color: '#27c07d' } };
  }
  if (value === 'in_progress') {
    return { container: { backgroundColor: 'rgba(255,200,87,0.12)', borderColor: '#FFC857' }, label: { color: '#FFC857' } };
  }
  return base;
}

function formatDate(value) {
  if (!value) return 'Unknown date';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return d.toLocaleDateString(undefined, options);
  } catch {
    return value;
  }
}

async function openUrl(url) {
  if (!url) return;
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to open attachment url', e?.message || e);
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },
  refreshBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49' },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.textSecondary },

  card: { backgroundColor: '#2B2F39', borderRadius: 18, borderWidth: 1, borderColor: '#343B49', padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  metaTxt: { color: colors.textSecondary, marginTop: 6 },
  desc: { color: colors.white, marginTop: 12, lineHeight: 20 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  statusTxt: { fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },

  attachSection: { marginTop: 14 },
  attachTitle: { color: colors.white, fontWeight: '700', marginBottom: 6 },
  attachRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  attachUrl: { color: colors.accent, flex: 1 },

  historySection: { marginTop: 16, backgroundColor: '#1E2128', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#2F3342' },
  historyTitle: { color: colors.white, fontWeight: '700', marginBottom: 8 },
  historyRow: { paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2B2F39' },
  historyStatus: { color: colors.white, fontWeight: '700' },
  historyDate: { color: colors.textSecondary, fontSize: 12 },
  historyComment: { color: colors.textSecondary, marginTop: 4, lineHeight: 18 },

  emptyWrap: { flexGrow: 1, padding: 16, justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingHorizontal: 24 },
  emptyTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  emptySubtitle: { color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },

  errorBanner: { position: 'absolute', bottom: 24, left: 16, right: 16, backgroundColor: '#451919', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#9E2F2F' },
  errorText: { color: '#FF7A7A', textAlign: 'center', fontWeight: '700' },
});
