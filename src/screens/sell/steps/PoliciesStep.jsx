import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Dimensions } from 'react-native';
import { colors } from '../../../theme/colors';
import { CheckCircle2 } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { updatePolicies } from '../../../store/listingDraft/listingDraftSlice';
import BottomSheet from '../../../components/common/BottomSheet';
import { WEB_ORIGIN } from '../../../config/links';
import appConfigService from '../../../services/appConfig';

const FALLBACK_POLICY_KEYS = ['listing', 'dispute', 'antifraud'];

const TERMS_URL = `${WEB_ORIGIN}/legal/terms-and-conditions`;
const PRIVACY_URL = `${WEB_ORIGIN}/legal/privacy-policy`;

export default function PoliciesStep() {
  const dispatch = useDispatch();
  const { policies, agreeAll } = useSelector((s) => ({ policies: s.listingDraft.policies, agreeAll: s.listingDraft.policies.agreeAll }));
  const toggle = (key) => dispatch(updatePolicies({ [key]: !policies[key] }));
  const [policySheet, setPolicySheet] = useState(null);
  const [policyDocs, setPolicyDocs] = useState([]);

  const WebViewComp = useMemo(() => {
    try {
      const { WebView } = require('react-native-webview');
      return WebView;
    } catch (_) {
      return null;
    }
  }, []);
  const sanitizeUrl = useCallback((raw) => {
    const value = raw?.trim?.();
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('/')) return `${WEB_ORIGIN}${value}`;
    return `${WEB_ORIGIN}/${value.replace(/^\/+/, '')}`;
  }, []);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await appConfigService.getAppConfig();
        const links = Array.isArray(data?.otherLinks) ? data.otherLinks : [];
        const marketPolicies = links.filter((link) => (link?.tab || '').toLowerCase() === 'market_policies');
        if (!alive) return;
        const docs = marketPolicies.map((item, index) => {
          const key = FALLBACK_POLICY_KEYS[index] || `policy_${index}`;
          return {
            key,
            title: item?.title?.trim?.() || `Policy ${index + 1}`,
            url: sanitizeUrl(item?.url),
            description: (item?.description || '').trim() || null,
          };
        });
        setPolicyDocs(docs);
      } catch (err) {
        if (__DEV__) {
          console.warn('[PoliciesStep] Failed to load marketplace policies:', err?.message || err);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [sanitizeUrl]);

  useEffect(() => {
    const updates = {};
    let hasUpdates = false;
    const activeKeys = new Set(policyDocs.map((doc) => doc.key));
    policyDocs.forEach((doc) => {
      if (policies[doc.key] === undefined) {
        updates[doc.key] = false;
        hasUpdates = true;
      }
    });
    FALLBACK_POLICY_KEYS.forEach((fallbackKey) => {
      if (!activeKeys.has(fallbackKey) && policies[fallbackKey] !== true) {
        updates[fallbackKey] = true;
        hasUpdates = true;
      }
    });
    if (hasUpdates) {
      dispatch(updatePolicies(updates));
    }
  }, [policyDocs, policies, dispatch]);
  const openPolicy = useCallback((doc) => {
    if (!doc?.url) return;
    setPolicySheet(doc);
  }, []);
  const closePolicy = useCallback(() => setPolicySheet(null), []);
  const ReadMore = ({ doc }) => {
    if (!doc?.url) return null;
    return (
      <TouchableOpacity onPress={() => openPolicy(doc)}>
        <Text style={styles.readMore}>Read More</Text>
      </TouchableOpacity>
    );
  };

  const sheetHeight = useMemo(() => Math.round(Dimensions.get('window').height * 0.82), []);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
      {/* Marketplace Policies */}
      <View style={[styles.card, { backgroundColor: '#252545' }]}> 
        <Text style={styles.cardTitle}>Marketplace Policies</Text>
        {policyDocs.length ? policyDocs.map((doc) => (
          <PolicyItem
            key={doc.key}
            title={doc.title}
            checked={!!policies[doc.key]}
            onToggle={() => toggle(doc.key)}
            description={doc.description}
          >
            <ReadMore doc={doc} />
          </PolicyItem>
        )) : (
          <Text style={[styles.policyEmpty, { marginTop: 16 }]}>Marketplace policies will appear here soon.</Text>
        )}
      </View>

      {/* Terms & Privacy */}
      <View style={styles.consentCard}>
        <TouchableOpacity style={styles.row} onPress={() => dispatch(updatePolicies({ agreeAll: !agreeAll }))}>
          <View style={[styles.checkbox, agreeAll && styles.checkboxOn]}>
            {agreeAll ? <CheckCircle2 size={18} color={colors.white} /> : null}
          </View>
          <Text style={styles.consentTxt}>
            I agree to Zishes
            <Text> </Text>
            <Text style={styles.link} onPress={() => Linking.openURL(TERMS_URL)}>Terms of Service</Text>
            <Text> and </Text>
            <Text style={styles.link} onPress={() => Linking.openURL(PRIVACY_URL)}>Privacy Policy</Text>.
          </Text>
        </TouchableOpacity>
      </View>

      <BottomSheet visible={!!policySheet} onClose={closePolicy} height={sheetHeight} full={false} maxRatio={0.9} showClose>
        <View style={styles.sheetWrap}>
          <Text style={styles.sheetTitle}>{policySheet?.title || 'Policy'}</Text>
          <View style={styles.sheetDivider} />
          {policySheet?.description ? (
            <Text style={styles.sheetDescription}>{policySheet.description}</Text>
          ) : null}
          {WebViewComp && policySheet?.url ? (
            <WebViewComp source={{ uri: policySheet.url }} startInLoadingState style={{ flex: 1 }} />
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 12 }}>
              <Text style={{ color: colors.textSecondary }}>
                {`We couldn't load the policy viewer on this device. Tap below to open in your browser.`}
              </Text>
              {policySheet?.url ? (
                <TouchableOpacity style={styles.sheetLink} onPress={() => Linking.openURL(policySheet.url).catch(() => {})}>
                  <Text style={styles.sheetLinkTxt}>Open in Browser</Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          )}
        </View>
      </BottomSheet>
    </ScrollView>
  );
}

function PolicyItem({ title, checked, onToggle, description, children }) {
  return (
    <View style={{ marginTop: 16 }}>
      <TouchableOpacity style={styles.policyRow} onPress={onToggle} activeOpacity={0.85}>
        <View style={[styles.checkbox, checked && styles.checkboxOn]}>
          {checked ? <CheckCircle2 size={18} color={colors.white} /> : null}
        </View>
        <View style={styles.policyTextWrap}>
          <Text style={styles.policyTitle}>{title}</Text>
        </View>
      </TouchableOpacity>
      {(description || children) ? (
        <View style={styles.policyMeta}>
          {!!description && <Text style={styles.policyDescription}>{description}</Text>}
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#2B2F39', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#343B49', marginBottom: 14 },
  cardTitle: { color: colors.white, fontWeight: '900', fontSize: 22 },
  cardDesc: { color: colors.textSecondary, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  policyRow: { flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.accent,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  policyTextWrap: { flex: 1, paddingRight: 4 },
  policyTitle: { color: colors.white, fontWeight: '700', fontSize: 18, flexWrap: 'wrap', flexShrink: 1, lineHeight: 24 },
  policyMeta: { marginLeft: 40, marginTop: 6 },
  policyDescription: { color: colors.textSecondary, marginBottom: 4, lineHeight: 18 },
  readMore: { color: colors.accent, fontWeight: '700' },
  policyEmpty: { color: colors.textSecondary },
  consentCard: { backgroundColor: '#2B2F39', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#343B49' },
  consentTxt: { color: colors.white, flex: 1, flexWrap: 'wrap' },
  link: { color: '#7B79FF', fontWeight: '700' },
  sheetWrap: { flex: 1 },
  sheetTitle: { color: colors.white, fontWeight: '900', fontSize: 18, textAlign: 'center' },
  sheetDivider: { height: 1, backgroundColor: '#2F3645', marginVertical: 12 },
  sheetDescription: { color: colors.textSecondary, textAlign: 'center', marginBottom: 12, paddingHorizontal: 12 },
  sheetLink: { marginTop: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
  sheetLinkTxt: { color: colors.white, fontWeight: '800' },
});
