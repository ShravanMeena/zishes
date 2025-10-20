import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import AppModal from '../common/AppModal';
import { colors } from '../../theme/colors';
import Markdown from '../common/Markdown';
import { useSelector } from 'react-redux';
import { getProductById } from '../../services/products';
import LinearGradient from 'react-native-linear-gradient';
import { Lock, Wallet, Undo2, Scale, Gift, PlayCircle, X } from 'lucide-react-native';
import { Linking } from 'react-native';
import Button from '../ui/Button';
import ProgressBar from '../common/ProgressBar';

export default function RulesModal({ visible, onCancel, onConfirm, title = 'Tournament Rules', item, confirmLoading = false }) {
  const token = useSelector((s) => s.auth.token);
  const baseRules = item?.tournament?.rules || item?.raw?.tournament?.rules || '';
  const [fetchedRules, setFetchedRules] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [progressAnim, setProgressAnim] = useState(0);
  const WebViewComponent = useMemo(() => {
    try {
      // Lazy require so bundles that do not include the module yet do not crash.
      // eslint-disable-next-line global-require
      return require('react-native-webview').WebView;
    } catch (_) {
      return null;
    }
  }, []);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!visible) return;
      if (baseRules && String(baseRules).trim().length) { setFetchedRules(''); setLoading(false); setError(null); return; }
      const id = item?.id || item?._id;
      if (!id || !token) { setFetchedRules(''); return; }
      try {
        setLoading(true);
        setError(null);
        const data = await getProductById(id, token);
        if (!alive) return;
        const rules = data?.tournament?.rules || '';
        setFetchedRules(rules || '');
      } catch (e) {
        if (!alive) return;
        setError(e?.message || 'Failed to load rules');
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [visible, baseRules, item?.id, item?._id, token]);

  const rules = useMemo(() => {
    return (baseRules && String(baseRules).trim().length) ? baseRules : fetchedRules;
  }, [baseRules, fetchedRules]);

  const gameTitle = useMemo(() => {
    return item?.game?.name || item?.gameType || item?.raw?.game?.name || 'Game';
  }, [item?.game?.name, item?.gameType, item?.raw?.game?.name]);

  const instructions = useMemo(() => {
    return item?.game?.instructions || item?.game?.description || item?.description || 'Instructions will appear here once provided.';
  }, [item?.game?.instructions, item?.game?.description, item?.description]);

  
  const entryFee = item?.tournament?.entryFee;
  const entryFeeText = typeof entryFee === 'number' && !Number.isNaN(entryFee)
    ? `Coins are deducted from your Zish Wallet when you join (Entry Fee: ${entryFee})`
    : 'Coins are deducted from your Zish Wallet when you join.';

  const ruleHighlights = useMemo(() => ([
    { key: 'limited', Icon: Lock, text: 'Limited Entries → Each tournament has a fixed number of slots.' },
    { key: 'fee', Icon: Wallet, text: entryFeeText },
    { key: 'refunds', Icon: Undo2, text: 'Refunds → If cancelled or not filled, coins return to your Zish Wallet (no cash refunds).' },
    { key: 'fair', Icon: Scale, text: 'Fair Play → All players and sellers must follow Zishes rules.' },
    { key: 'prize', Icon: Gift, text: 'Prize → The listed item is the prize.' },
  ]), [entryFeeText]);

  const howToPlayUrl = item?.game?.howToPlay

  const openHowToPlay = () => {
    if (WebViewComponent) {
      setHowToPlayOpen(true);
      return;
    }
    Linking.openURL(howToPlayUrl).catch(() => {});
  };

  useEffect(() => {
    if (!confirmLoading) {
      setProgressAnim(0);
      return;
    }
    let value = 0.2;
    setProgressAnim(value);
    const timer = setInterval(() => {
      value += 0.12;
      if (value > 1) value = 0.2;
      setProgressAnim(value);
    }, 420);
    return () => clearInterval(timer);
  }, [confirmLoading]);

  return (
    <AppModal
      visible={visible}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={title}
      confirmText="Play Now"
      cancelText="Back"
      confirmLoading={confirmLoading}
      footer={confirmLoading ? (
        <View style={styles.footerLoading}>
          <View style={styles.footerLoadingRow}>
            <ActivityIndicator color={colors.white} size="small" />
            <Text style={styles.footerLoadingText}>Entering tournament…</Text>
          </View>
          <ProgressBar value={progressAnim} height={8} />
        </View>
      ) : (
        <View style={styles.footerRow}>
          <Button
            title="Play Now"
            onPress={onConfirm}
            style={[styles.footerButton, styles.footerPrimary]}
            textStyle={styles.footerPrimaryText}
          />
          <Button
            title="Back"
            variant="outline"
            onPress={onCancel}
            style={[styles.footerButton, styles.footerSecondary]}
            textStyle={styles.footerSecondaryText}
          />
        </View>
      )}
    >
      <View style={styles.heroWrap}>
        <LinearGradient colors={[colors.primary, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroGradient}>
          <View style={styles.heroCircleLarge} />
          <View style={styles.heroCircleSmall} />
          <Text style={styles.heroTitle}>{gameTitle}</Text>
        </LinearGradient>
      </View>

  {howToPlayUrl &&    <TouchableOpacity activeOpacity={0.9} style={styles.howToPlayButton} onPress={openHowToPlay}>
        <LinearGradient colors={[colors.accent, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.howToPlayGradient}>
          <PlayCircle size={20} color={colors.white} style={{ marginRight: 12 }} />
          <Text style={styles.howToPlayText}>How to Play?</Text>
        </LinearGradient>
      </TouchableOpacity>
}


      <View style={styles.rulesCard}>
        <Text style={styles.rulesHeading}>Tournament Rules</Text>
        {ruleHighlights.map(({ key, Icon, text }) => (
          <View key={key} style={styles.ruleRow}>
            <View style={styles.ruleIconWrap}>
              <Icon size={20} color={colors.white} />
            </View>
            <Text style={styles.ruleText}>{text}</Text>
          </View>
        ))}
        <View style={styles.ruleAckCard}>
          <Text style={styles.ruleAckText}>
            By confirming your order, you acknowledge that you understand and agree to these rules and instructions. If gameplay stops mid-match, only the entry fee will be credited — gameplay time is not refunded. Fees are strictly non-refundable except when tournaments are cancelled or unfilled; any such refunds are credited to your Zish Wallet.
          </Text>
        </View>
        {loading ? (
          <View style={styles.rulesLoadingRow}>
            <ActivityIndicator color={colors.white} />
            <Text style={styles.ruleText}>Loading rules…</Text>
          </View>
        ) : error ? (
          <Text style={[styles.ruleText, { color: '#FFB4B4' }]}>{error}</Text>
        ) : rules ? (
          <View style={styles.additionalRules}>
            <Markdown content={rules} />
          </View>
        ) : null}
      </View>


      {WebViewComponent ? (
        <Modal
          visible={howToPlayOpen}
          animationType="slide"
          onRequestClose={() => setHowToPlayOpen(false)}
          presentationStyle="fullScreen"
        >
          <SafeAreaView style={styles.webviewContainer}>
            <View style={styles.webviewHeader}>
              <Text style={styles.webviewTitle}>How to Play</Text>
              <TouchableOpacity onPress={() => setHowToPlayOpen(false)} accessibilityRole="button">
                <X size={22} color={colors.white} />
              </TouchableOpacity>
            </View>
            <WebViewComponent
              source={{ uri: howToPlayUrl }}
              style={styles.webview}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webviewLoader}>
                  <ActivityIndicator color={colors.accent} />
                </View>
              )}
              allowsFullscreenVideo
            />
          </SafeAreaView>
        </Modal>
      ) : null}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  heroWrap: { borderRadius: 18, overflow: 'hidden', marginBottom: 16 },
  heroGradient: { paddingVertical: 32, borderRadius: 18, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  heroCircleLarge: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroCircleSmall: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.12)' },
  heroTitle: { color: colors.white, fontSize: 28, fontWeight: '800', letterSpacing: 1.2 },
  howToPlayButton: { marginBottom: 16 },
  howToPlayGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 24, paddingVertical: 12, paddingHorizontal: 12 },
  howToPlayText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  instructionsCard: { backgroundColor: colors.white, borderRadius: 20, padding: 18, marginBottom: 18 },
  instructionsText: { color: '#1F232C', fontSize: 15, lineHeight: 22, fontWeight: '600' },
  rulesCard: { borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#5B3EA6', backgroundColor: '#3A1E64' },
  rulesHeading: { color: colors.white, fontWeight: '800', fontSize: 18, marginBottom: 12 },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  ruleIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  ruleText: { color: colors.white, flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  ruleAckCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  ruleAckText: {
    color: colors.white,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  rulesLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  additionalRules: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.18)' },
  acknowledgeText: { color: colors.white, marginBottom: 16, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  footerLoading: { width: '100%', gap: 12 },
  footerLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerLoadingText: { color: colors.white, fontWeight: '700' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingTop: 8 },
  footerButton: { flex: 1, borderRadius: 24, paddingVertical: 12 },
  footerPrimary: { backgroundColor: colors.primary },
  footerPrimaryText: { fontSize: 15, fontWeight: '800' },
  footerSecondary: { backgroundColor: colors.white, borderColor: colors.white },
  footerSecondaryText: { color: '#1F232C', fontWeight: '800', fontSize: 15 },
  webviewContainer: { flex: 1, backgroundColor: colors.black },
  webviewHeader: { paddingHorizontal: 16, paddingBottom: 10, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#11131A', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C', zIndex: 2 },
  webviewTitle: { color: colors.white, fontSize: 19, fontWeight: '700' },
  webview: { flex: 1, backgroundColor: colors.black },
  webviewLoader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.black },
});
