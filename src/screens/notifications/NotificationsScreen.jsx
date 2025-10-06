import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, Settings } from 'lucide-react-native';
import EmptyState from '../../components/common/EmptyState';
import { useSelector } from 'react-redux';
import notificationsService from '../../services/notifications';

export default function NotificationsScreen({ navigation }) {
  const token = useSelector((s) => s.auth.token);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await notificationsService.listNotifications({ token, limit: 20, status: statusFilter });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      await fetchNotifications();
    } finally {
      setRefreshing(false);
    }
  }, [fetchNotifications, token]);

  const hasUnread = useMemo(() => items.some((n) => !n?.readAt), [items]);

  const markOneRead = useCallback(async (notification) => {
    if (!notification || notification.readAt || !token) return;
    const id = notification._id || notification.id;
    if (!id) return;
    setMarkingId(id);
    try {
      const updated = await notificationsService.markNotificationRead(id, token);
      setItems((prev) => {
        const updatedItems = prev.map((item) => {
          const matchId = item._id || item.id;
          if (matchId === id) {
            return { ...item, ...updated, readAt: updated?.readAt || new Date().toISOString() };
          }
          return item;
        });
        if (statusFilter === 'unread') {
          return updatedItems.filter((n) => !n?.readAt);
        }
        if (statusFilter === 'read') {
          return updatedItems.filter((n) => n?.readAt);
        }
        return updatedItems;
      });
    } catch (err) {
      Alert.alert('Unable to mark as read', err?.message || 'Please try again.');
    } finally {
      setMarkingId(null);
    }
  }, [token, statusFilter]);

  const markAllRead = useCallback(async () => {
    if (!token || !hasUnread) return;
    const unreadIds = items
      .filter((n) => !n?.readAt)
      .map((n) => n._id || n.id)
      .filter(Boolean)
      .slice(0, 50);
    if (!unreadIds.length) return;
    setMarkingAll(true);
    try {
      await notificationsService.markNotificationsReadBulk({ ids: unreadIds, token });
      const nowIso = new Date().toISOString();
      setItems((prev) => {
        const updatedItems = prev.map((n) => {
          if (unreadIds.includes(n._id || n.id)) {
            return { ...n, readAt: n.readAt || nowIso };
          }
          return n;
        });
        if (statusFilter === 'unread') return [];
        if (statusFilter === 'read') return updatedItems.filter((n) => n?.readAt);
        return updatedItems;
      });
    } catch (err) {
      Alert.alert('Unable to update notifications', err?.message || 'Please try again.');
    } finally {
      setMarkingAll(false);
    }
  }, [token, items, hasUnread, statusFilter]);

  const renderItem = ({ item }) => {
    const unread = !item?.readAt;
    const id = item?._id || item?.id;
    const busy = markingId === id;
    return (
      <TouchableOpacity
        style={[styles.card, unread && styles.cardUnread]}
        activeOpacity={0.85}
        onPress={() => markOneRead(item)}
      >
        {item?.image ? <Image source={{ uri: item.image }} style={styles.thumb} /> : null}
        <View style={{ flex: 1 }}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.title, unread && styles.unreadTitle]}>{item?.title || 'Notification'}</Text>
            {unread ? <View style={styles.unreadDot} /> : null}
          </View>
          {item?.body ? <Text style={styles.body}>{item.body}</Text> : null}
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{formatRelativeTime(item?.createdAt)} ago</Text>
            {item?.type ? <Text style={styles.badge}>{humanizeType(item.type)}</Text> : null}
          </View>
        </View>
        {busy ? <ActivityIndicator color={colors.primary} style={{ marginLeft: 12 }} /> : null}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading notifications…</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchNotifications}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <EmptyState
        title="No notifications yet"
        description="You're all caught up. We'll let you know when something new arrives."
      />
    );
  }, [loading, error, fetchNotifications]);

  const listHeader = useMemo(() => (
    <View style={[styles.listHeader, hasUnread && statusFilter !== 'read' ? styles.listHeaderSpaced : null]}>
      <View style={styles.filterRow}>
        {['all', 'unread', 'read'].map((filter) => {
          const active = statusFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setStatusFilter(filter)}
              disabled={statusFilter === filter}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {hasUnread && statusFilter !== 'read' ? (
        <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead} disabled={markingAll}>
          <Text style={styles.markAllText}>{markingAll ? 'Marking…' : 'Mark all as read'}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  ), [statusFilter, hasUnread, markingAll, markAllRead]);

  const contentContainerStyle = useMemo(() => ({
    padding: 12,
    paddingBottom: 24,
    flexGrow: items.length === 0 ? 1 : 0,
  }), [items.length]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
              return;
            }
            const parent = navigation.getParent?.();
            if (parent?.navigate) {
              parent.navigate('Home', { screen: 'HomeIndex' });
            }
          }}
          style={styles.iconBtn}
        >
          <ChevronLeft color={colors.white} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.getParent()?.navigate('Profile', { screen: 'Settings' })}
        >
          <Settings color={colors.white} size={18} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item?._id || item?.id || Math.random().toString(36)}
        renderItem={renderItem}
        contentContainerStyle={contentContainerStyle}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={(
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        )}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={loading && items.length > 0 ? (
          <View style={styles.footerLoading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

function humanizeType(type = '') {
  const map = {
    PLAN_PURCHASE_SUCCESS: 'Plan',
    PRODUCT_APPROVAL_STATUS: 'Listing',
    TOURNAMENT_ENDING_SOON: 'Tournament',
    TOURNAMENT_ENDED: 'Tournament',
  };
  return map[type] || 'General';
}

function formatRelativeTime(dateInput) {
  if (!dateInput) return 'just now';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return 'just now';
  const now = Date.now();
  const diffMs = now - date.getTime();
  if (diffMs <= 0) return 'just now';
  const seconds = Math.round(diffMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.round(days / 7);
  if (weeks < 4) return `${weeks}w`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.round(days / 365);
  return `${years}y`;
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.textSecondary, fontWeight: '600' },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#FF7A7A', fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#3A4051' },
  retryText: { color: colors.white, fontWeight: '700' },
  card: { flexDirection: 'row', backgroundColor: '#2B2F39', borderRadius: 16, borderWidth: 1, borderColor: '#343B49', padding: 14, alignItems: 'flex-start' },
  cardUnread: { borderColor: colors.primary, backgroundColor: '#2F2440' },
  thumb: { width: 44, height: 44, borderRadius: 12, marginRight: 12, backgroundColor: '#1F2230' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.white, fontWeight: '700', marginBottom: 6, flex: 1, marginRight: 8 },
  unreadTitle: { fontWeight: '800' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  body: { color: colors.textSecondary, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meta: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  badge: { color: colors.white, backgroundColor: '#3A4051', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontWeight: '700', fontSize: 12, marginLeft: 12 },
  footerLoading: { paddingVertical: 16 },
  listHeader: { marginBottom: 0 },
  listHeaderSpaced: { marginBottom: 12 },
  filterRow: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  filterChip: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#343B49', backgroundColor: '#2B2F39' },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { color: colors.textSecondary, fontWeight: '700' },
  filterChipTextActive: { color: colors.white },
  markAllBtn: { paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#343B49', backgroundColor: '#2B2F39' },
  markAllText: { color: colors.accent, fontWeight: '700' },
});
