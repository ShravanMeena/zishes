import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, Linking, Share, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, Clock, Share2 } from 'lucide-react-native';
import ProgressBar from '../../components/common/ProgressBar';
import { useSelector } from 'react-redux';
import products from '../../services/products';
import { mapProductToCard } from '../../utils/productMapper';
import MyListingsSkeleton from '../../components/skeletons/MyListingsSkeleton';
import AppModal from '../../components/common/AppModal';

export default function MyListingsScreen({ navigation }) {
  const token = useSelector((s) => s.auth.token);
  const withdrawalBalance = useSelector((s) => s.wallet.withdrawalBalance);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingId, setCheckingId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const load = async () => {
    if (!token) { setItems([]); return; }
    setLoading(true); setError(null);
    try {
      const list = await products.getMyProducts(token);
      const mapped = Array.isArray(list) ? list.map(mapProductToCard) : [];
      setItems(mapped);
    } catch (e) {
      setError(e?.message || 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  };

  const handleShare = async (item) => {
    const url = item?.raw?.shareUrl || `https://zishes.com/item/${item.id}`;
    try {
      await Share.share({
        message: `Check out ${item.title} on Zishes: ${url}`,
        url,
      });
    } catch (_) {
      // ignore share cancellation/errors
    }
  };

  const handleEdit = async (item) => {
    if (!token) {
      Alert.alert('Sign in required', 'Please log in again to edit this listing.');
      return;
    }
    try {
      setCheckingId(item.id);
      const fresh = await products.getProductById(item.id, token);
      const freshStatus = String(fresh?.approvalStatus || '').toUpperCase();
      if (freshStatus === 'APPROVED') {
        Alert.alert('Already approved', 'Approved listings can no longer be edited. Share it with buyers instead.');
        await load();
        return;
      }
      const draftData = buildDraftFromProduct(fresh);
      navigation.navigate('Sell', { draftData, editingProductId: fresh?._id || fresh?.id });
    } catch (err) {
      Alert.alert('Unable to edit listing', err?.message || 'Please try again in a moment.');
    } finally {
      setCheckingId(null);
    }
  };

  const submitEarlyTermination = async () => {
    if (!cancelTarget) return;
    if (!token) {
      Alert.alert('Sign in required', 'Please log in again to manage your listings.');
      return;
    }
    setCancelLoading(true);
    setCancelError('');
    try {
      await products.cancelTournamentEarly({ product: cancelTarget.id, reason: cancelReason.trim() }, token);
      setCancelTarget(null);
      setCancelReason('');
      Alert.alert('Tournament ended', 'This tournament has been closed early.');
      await load();
    } catch (err) {
      setCancelError(err?.message || 'Failed to cancel the tournament.');
    } finally {
      setCancelLoading(false);
    }
  };

  const cancelContext = getEarlyTerminationContext(cancelTarget);
  const cancelProgressDisplay = cancelContext && Number.isFinite(cancelContext.progressPct)
    ? cancelContext.progressPct.toFixed(1)
    : null;
  const cancelThresholdDisplay = cancelContext && Number.isFinite(cancelContext.thresholdPct)
    ? cancelContext.thresholdPct.toFixed(1)
    : null;

  const renderItem = ({ item }) => {
    const approval = deriveApprovalState(item);
    const progressPct = Math.round(safeProgress(item) * 100);
    const earlyContext = getEarlyTerminationContext(item);
    const canTerminateEarly = canShowEarlyTermination(earlyContext);
    const supportUrl = 'mailto:support@zishes.com';
    const onSupport = () => {
      navigation.navigate('ReportIssue', {
        context: 'listing',
        listingId: item.id,
        headerTitle: 'Listing Support',
        presetCategory: 'Listing',
      });
    };
    const onEmailSupport = () => { Linking.openURL(supportUrl).catch(() => {}); };
    const onEarlyTerminate = () => {
      setCancelTarget(item);
      setCancelReason('');
      setCancelError('');
    };

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.push('Details', { item, from: 'MyListings' })} style={styles.card}>
        <Image source={{ uri: item.image }} style={styles.thumb} />
        <View style={{ flex: 1 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {approval.badgeLabel ? <Chip label={approval.badgeLabel} type={approval.badgeType} /> : null}
              {approval.status === 'APPROVED'
                ? (
                    <>
                      <TouchableOpacity onPress={() => handleShare(item)} style={styles.shareButton}>
                        <Share2 size={14} color={colors.white} style={{ marginRight: 6 }} />
                        <Text style={styles.shareButtonText}>Share</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={onSupport}>
                        <Chip label="Need Help" type="info" style={{ marginLeft: 8 }} />
                      </TouchableOpacity>
                    </>
                  )
                : (
                    <TouchableOpacity onPress={() => handleEdit(item)} disabled={checkingId === item.id}>
                      <Chip label={checkingId === item.id ? 'Opening…' : 'Edit'} type="accent" style={{ marginLeft: 8, opacity: checkingId === item.id ? 0.7 : 1 }} />
                    </TouchableOpacity>
                  )}
            </View>
          </View>

          {approval.notice ? (
            <View style={[styles.approvalNotice, styles[`approvalNotice${approval.notice.tone}`]]}>
              <Text style={styles.approvalTitle}>{approval.notice.title}</Text>
              {approval.notice.detail ? <Text style={styles.approvalDetail}>{approval.notice.detail}</Text> : null}
              {approval.notice.tone === 'Rejected' ? (
                <View style={styles.noticeActions}>
                  <TouchableOpacity onPress={() => handleEdit(item)} disabled={checkingId === item.id} style={[styles.noticeBtn, styles.noticeBtnPrimary, checkingId === item.id && { opacity: 0.7 }]}>
                    <Text style={styles.noticeBtnPrimaryTxt}>{checkingId === item.id ? 'Opening…' : 'Edit & Resubmit'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onEmailSupport} style={[styles.noticeBtn, styles.noticeBtnGhost, { marginLeft: 8 }]}>
                    <Text style={styles.noticeBtnGhostTxt}>Contact Support</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.rowBetween}>
            <Text style={styles.price}>{formatINR(item?.raw?.price)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={styles.time}>{'  '}{timeLeft(item)}</Text>
            </View>
          </View>

          <Text style={styles.progressTxt}>{`${progressPct}% seats filled`}</Text>
          <ProgressBar value={safeProgress(item)} />

          <View style={[styles.rowBetween, { marginTop: 10 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {canTerminateEarly ? (
                <TouchableOpacity onPress={onEarlyTerminate} style={styles.earlyButton}>
                  <Text style={styles.earlyButtonText}>End Early</Text>
                </TouchableOpacity>
              ) : null}
              {(String(item?.tournamentStatus || '').toUpperCase() === 'OVER') ? (
                <TouchableOpacity onPress={() => navigation.navigate('UploadProof', { item })}>
                  <Chip label="Upload Proof" type="accent" />
                </TouchableOpacity>
              ) : null}
              {String(item?.raw?.fulfillment?.verificationStatus || '').toUpperCase() === 'VERIFIED' ? (
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('Wallet', { screen: 'Withdraw', params: { maxAmount: withdrawalBalance, productId: item.id } });
                  }}
                >
                  <Chip label="Withdraw" type="success" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          {(String(item?.tournamentStatus || '').toUpperCase() === 'OVER') ? (
            (() => {
              const rc = item?.raw?.fulfillment?.receiverConfirmation || {};
              const receiverApproved = !!(rc?.confirmedAt || rc?.confirmed || (rc?.status && String(rc.status).toUpperCase() === 'CONFIRMED'));
              return !receiverApproved ? (
                <Text style={{ color: colors.textSecondary, marginTop: 6 }}>Waiting for winner to approve receipt.</Text>
              ) : null;
            })()
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft color={colors.white} size={20} /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Listings</Text>
        <View style={{ width: 32 }} />
      </View>
      {loading ? (
        <MyListingsSkeleton count={4} />
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <Text style={{ color: '#ffb3b3', fontWeight: '700', fontSize: 16, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity onPress={load} style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#3A4051' }}>
            <Text style={{ color: colors.white, fontWeight: '800' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={{ color: colors.textSecondary }}>You have not created any listings yet.</Text>
            </View>
          )}
        />
      )}
      <AppModal
        visible={!!cancelTarget}
        title="End Tournament Early"
        message="Closing this tournament now will stop new plays and notify participants."
        confirmText="Confirm End"
        cancelText="Keep Running"
        onCancel={() => { if (!cancelLoading) { setCancelTarget(null); setCancelReason(''); setCancelError(''); } }}
        onConfirm={submitEarlyTermination}
        confirmLoading={cancelLoading}
        confirmLoadingText="Ending…"
      >
        {cancelProgressDisplay != null && cancelThresholdDisplay != null ? (
          <Text style={styles.modalCopy}>
            Progress: {cancelProgressDisplay}% (threshold {cancelThresholdDisplay}%).
          </Text>
        ) : null}
        <Text style={styles.modalCopy}>Add a quick note for audit (optional).</Text>
        <TextInput
          style={styles.modalInput}
          placeholder="Reason for ending early"
          placeholderTextColor={colors.textSecondary}
          value={cancelReason}
          onChangeText={(text) => {
            if (text.length <= 500) setCancelReason(text);
          }}
          multiline
          maxLength={500}
        />
        <Text style={styles.modalHint}>{cancelReason.length}/500 characters</Text>
        {cancelError ? <Text style={styles.modalError}>{cancelError}</Text> : null}
      </AppModal>
    </SafeAreaView>
  );
}

function Chip({ label, type = 'default', style }) {
  const map = {
    default: { bg: '#3A4051', color: colors.white },
    info: { bg: '#3B82F6', color: colors.white },
    accent: { bg: colors.primary, color: colors.white },
    danger: { bg: '#E57373', color: colors.white },
    success: { bg: '#16a085', color: colors.white },
  };
  const s = map[type] || map.default;
  return (
    <View style={[styles.chip, { backgroundColor: s.bg }, style]}>
      <Text style={[styles.chipTxt, { color: s.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },

  card: { flexDirection: 'row', backgroundColor: '#2B2F39', borderRadius: 18, borderWidth: 1, borderColor: '#343B49', padding: 12 },
  thumb: { width: 80, height: 80, borderRadius: 10, marginRight: 12, backgroundColor: '#222' },
  title: { color: colors.white, fontWeight: '800', fontSize: 16, flexShrink: 1, paddingRight: 8 },
  price: { color: '#27c07d', fontWeight: '800', marginTop: 2 },
  time: { color: colors.textSecondary },
  progressTxt: { color: colors.textSecondary, marginTop: 6, marginBottom: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  chipTxt: { fontWeight: '700' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  shareButton: { marginLeft: 8, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, flexDirection: 'row', alignItems: 'center' },
  shareButtonText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  earlyButton: { backgroundColor: colors.error, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginRight: 8 },
  earlyButtonText: { color: colors.white, fontWeight: '800' },
  approvalNotice: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  approvalNoticePending: { borderColor: '#3A4051', backgroundColor: '#252a3b' },
  approvalNoticeApproved: { borderColor: '#275842', backgroundColor: '#1c3028' },
  approvalNoticeRejected: { borderColor: '#64323a', backgroundColor: '#3b1f24' },
  approvalTitle: { color: colors.white, fontWeight: '800' },
  approvalDetail: { color: colors.textSecondary, marginTop: 6 },
  noticeActions: { flexDirection: 'row', marginTop: 12 },
  noticeBtn: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  noticeBtnPrimary: { backgroundColor: colors.primary },
  noticeBtnPrimaryTxt: { color: colors.white, fontWeight: '800' },
  noticeBtnGhost: { borderWidth: 1, borderColor: '#4c576e' },
  noticeBtnGhostTxt: { color: colors.textSecondary, fontWeight: '700' },
  modalCopy: { color: colors.textSecondary, marginBottom: 8 },
  modalInput: { backgroundColor: '#2B2F39', borderRadius: 12, borderWidth: 1, borderColor: '#343B49', color: colors.white, paddingHorizontal: 12, paddingVertical: 10, minHeight: 90, textAlignVertical: 'top' },
  modalHint: { color: colors.textSecondary, alignSelf: 'flex-end', marginTop: 6 },
  modalError: { color: colors.error, marginTop: 8, fontWeight: '700' },
});

// Helpers
function isCompleted(item) {
  const s = (item?.tournamentStatus || '').toUpperCase();
  return s === 'OVER' || s === 'UNFILLED';
}
function deriveApprovalState(item) {
  const fallbackLabel = isCompleted(item) ? 'Completed' : 'Active';
  const fallbackType = isCompleted(item) ? 'danger' : 'info';

  const raw = (item?.approvalStatus || '').trim();
  if (!raw) {
    return { status: null, badgeLabel: fallbackLabel, badgeType: fallbackType, notice: null };
  }

  const status = raw.toUpperCase();

  if (status === 'PENDING') {
    return {
      status,
      badgeLabel: 'Pending Review',
      badgeType: 'info',
      notice: {
        tone: 'Pending',
        title: 'We are reviewing your product.',
        detail: 'Hang tight — approvals typically complete within a some time.',
      },
    };
  }

  if (status === 'APPROVED') {
    return {
      status,
      badgeLabel: 'Approved',
      badgeType: 'success',
      notice: null,
    };
  }

  if (status === 'REJECTED') {
    const reason = (item?.rejectionReason || '').trim();
    return {
      status,
      badgeLabel: 'Rejected',
      badgeType: 'danger',
      notice: {
        tone: 'Rejected',
        title: 'We could not approve this listing.',
        detail: reason ? `Reason: ${reason}` : 'Please review the policies, adjust the details, and submit again.',
      },
    };
  }

  const pretty = raw
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
    .join(' ');
  return { status, badgeLabel: pretty || fallbackLabel, badgeType: fallbackType, notice: null };
}

function buildDraftFromProduct(product) {
  if (!product) return null;
  const tournament = product?.tournament || {};
  const game = product?.game || tournament?.game || {};
  const delivery = product?.delivery || {};
  const policies = product?.policies || {};
  const images = Array.isArray(product?.images) ? product.images.filter(Boolean) : [];

  const toDateInput = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  return {
    loaded: true,
    isDirty: false,
    photos: images.map((uri) => ({ uri })),
    details: {
      name: product?.name || '',
      description: product?.description || '',
      category: product?.category || '',
      condition: product?.condition || '',
      qty: product?.quantity != null ? String(product.quantity) : '',
      productId: product?._id || product?.id || '',
    },
    play: {
      expectedPrice: product?.price != null ? String(product.price) : '',
      pricePerPlay: tournament?.entryFee != null ? String(tournament.entryFee) : '',
      playsCount: tournament?.expectedPlayers != null
        ? String(tournament.expectedPlayers)
        : (tournament?.totalSeats != null ? String(tournament.totalSeats) : ''),
      endDate: toDateInput(tournament?.endsAt || tournament?.endDate || tournament?.endedAt || tournament?.closeAt),
      game: game?._id || game?.id || '',
      gameName: game?.name || '',
      earlyTerminationEnabled: !!tournament?.earlyTerminationEnabled,
      earlyTerminationThresholdPct: tournament?.earlyTerminationThresholdPct != null
        ? Number(tournament.earlyTerminationThresholdPct)
        : 80,
      platinumOnly: !!tournament?.platinumOnly,
    },
    delivery: {
      method: delivery?.method || 'pickup',
      pickupNote: delivery?.pickupNote || '',
    },
    policies: {
      listing: policies?.listing === undefined ? true : !!policies.listing,
      dispute: policies?.dispute === undefined ? true : !!policies.dispute,
      antifraud: policies?.antifraud === undefined ? true : !!policies.antifraud,
      agreeAll: policies?.agreeAll === undefined ? true : !!policies.agreeAll,
      enableEarlyTerminationAck: true,
      listingExtensionAck: true,
      platinumOnlyAck: true,
    },
  };
}

function safeProgress(item) {
  const total = Number(item?.playsTotal || 0);
  const done = Number(item?.playsCompleted || 0);
  if (!total) return 0;
  return Math.max(0, Math.min(1, done / total));
}

function getEarlyTerminationContext(item) {
  if (!item) return null;
  const raw = item?.raw || {};
  const tournament = raw?.tournament || null;
  const status = String(tournament?.status || item?.tournamentStatus || '').toUpperCase();
  const termsAck = !!raw?.terms?.enableEarlyTerminationAck;
  const cfg = tournament?.earlyTermination || null;
  const hasConfig = !!(cfg && typeof cfg === 'object');
  const enabledFromConfig = hasConfig && ('enabled' in cfg) ? !!cfg.enabled : hasConfig;
  const enabled = termsAck || enabledFromConfig;

  const thresholdPct = (() => {
    const pct = Number(cfg?.thresholdPct);
    if (Number.isFinite(pct) && pct > 0) return pct;
    return 80;
  })();

  let progressPct = Number(tournament?.progress);
  if (Number.isFinite(progressPct)) {
    if (progressPct <= 1) progressPct *= 100;
  } else {
    const players = Number(tournament?.numberOfPlayers ?? tournament?.playsCompleted ?? raw?.playsCompleted ?? item?.playsCompleted ?? 0);
    const expected = Number(tournament?.expectedPlayers ?? tournament?.totalSeats ?? raw?.playsTotal ?? item?.playsTotal ?? 0);
    if (expected > 0) {
      progressPct = (players / expected) * 100;
    } else {
      progressPct = safeProgress(item) * 100;
    }
  }

  return {
    enabled,
    thresholdPct,
    progressPct,
    status,
  };
}

function canShowEarlyTermination(context) {
  if (!context) return false;
  const status = context.status;
  if (status === 'OVER' || status === 'UNFILLED' || status === 'CANCELLED') return false;
  const meetsThreshold = Number.isFinite(context.progressPct) && Number.isFinite(context.thresholdPct)
    ? context.progressPct >= context.thresholdPct
    : false;
  if (!meetsThreshold && !context.enabled) return false;
  return meetsThreshold || context.enabled;
}

function formatINR(n) {
  const val = Number(n);
  if (!isFinite(val)) return '—';
  try { return val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }); } catch { return `₹${val}`; }
}

function timeLeft(item) {
  const iso = item?.endedAt;
  if (!iso) return '—';
  const end = new Date(iso);
  const now = new Date();
  if (isNaN(end.getTime())) return '—';
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return 'Expired';
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `${days} day${days>1?'s':''} ${hours} hour${hours!==1?'s':''}`;
  const minutes = Math.floor((diffMs - totalHours * 3600000) / 60000);
  return `${hours} hour${hours!==1?'s':''} ${minutes} min`;
}
