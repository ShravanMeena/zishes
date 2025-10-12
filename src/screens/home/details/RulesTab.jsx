import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { useSelector } from 'react-redux';
import { Lock, Wallet, Undo2, Scale, Gift } from 'lucide-react-native';

import { colors } from '../../../theme/colors';
import Markdown from '../../../components/common/Markdown';
import { getProductById } from '../../../services/products';

export default function RulesTab({ item }) {
  const token = useSelector((s) => s.auth.token);
  const baseRules = item?.tournament?.rules || item?.raw?.tournament?.rules || '';
  const [fetchedRules, setFetchedRules] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (baseRules && String(baseRules).trim().length) {
        setFetchedRules('');
        setLoading(false);
        setError(null);
        return;
      }
      const id = item?.id || item?._id;
      if (!id || !token) {
        setFetchedRules('');
        return;
      }
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
  }, [baseRules, item?.id, item?._id, token]);

  const rules = useMemo(() => {
    return (baseRules && String(baseRules).trim().length) ? baseRules : fetchedRules;
  }, [baseRules, fetchedRules]);

  const entryFee = item?.tournament?.entryFee;
  const entryFeeText = useMemo(() => {
    if (typeof entryFee === 'number' && !Number.isNaN(entryFee)) {
      return `Coins are deducted from your Zish Wallet when you join (Entry Fee: ${entryFee})`;
    }
    return 'Coins are deducted from your Zish Wallet when you join.';
  }, [entryFee]);

  const ruleHighlights = useMemo(() => ([
    { key: 'limited', Icon: Lock, text: 'Limited Entries → Each tournament has a fixed number of slots.' },
    { key: 'fee', Icon: Wallet, text: entryFeeText },
    { key: 'refunds', Icon: Undo2, text: 'Refunds → If cancelled or not filled, coins return to your Zish Wallet (no cash refunds).' },
    { key: 'fair', Icon: Scale, text: 'Fair Play → All players and sellers must follow Zishes rules.' },
    { key: 'prize', Icon: Gift, text: 'Prize → The listed item is the prize.' },
  ]), [entryFeeText]);

  return (
    <View>
      <Text style={styles.heading}>How to Play</Text>
      {/* <Text style={styles.instructions}>{instructions}</Text> */}

      <View style={styles.card}>
        <Text style={styles.subHeading}>Tournament Rules</Text>
       

        {ruleHighlights.map(({ key, Icon, text }) => (
          <View key={key} style={styles.ruleRow}>
            <View style={styles.ruleIconWrap}>
              <Icon size={18} color={colors.white} />
            </View>
            <Text style={styles.ruleText}>{text}</Text>
          </View>
        ))}

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.white} size="small" />
            <Text style={styles.loadingText}>Loading rules…</Text>
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : rules ? (
          <View style={styles.additionalRules}>
            <Markdown content={rules} />
          </View>
        ) : (
          <Text style={styles.ruleText}>No additional rules provided.</Text>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
  },
  subHeading: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 10,
  },
  instructions: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1E212A',
    borderRadius: 12,
    padding: 16,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ruleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2A2F3B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  ruleText: {
    flex: 1,
    color: colors.white,
    fontSize: 14,
    lineHeight: 20,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  loadingText: {
    color: colors.white,
    marginLeft: 10,
    fontSize: 14,
  },
  errorText: {
    color: '#FFB4B4',
    marginTop: 12,
    fontSize: 14,
  },
  additionalRules: {
    marginTop: 8,
  },
  footerNote: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 18,
  },
});
