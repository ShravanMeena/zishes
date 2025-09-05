import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AppModal from '../common/AppModal';
import { colors } from '../../theme/colors';
import Markdown from '../common/Markdown';
import { useSelector } from 'react-redux';
import { getProductById } from '../../services/products';

export default function RulesModal({ visible, onCancel, onConfirm, title = 'Tournament Rules', item, confirmLoading = false }) {
  const token = useSelector((s) => s.auth.token);
  const baseRules = item?.tournament?.rules || item?.raw?.tournament?.rules || '';
  const [fetchedRules, setFetchedRules] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
  return (
    <AppModal
      visible={visible}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={title}
      confirmText="Play Now"
      cancelText="Back"
      confirmLoading={confirmLoading}
    >
      <View style={styles.box}>
        {loading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator color={colors.accent} />
            <Text style={{ color: colors.white, marginLeft: 8 }}>Loading rules…</Text>
          </View>
        ) : error ? (
          <Text style={styles.p}>{error}</Text>
        ) : rules ? (
          <Markdown content={rules} />
        ) : (
          <Text style={styles.p}>No rules provided.</Text>
        )}
      </View>
      <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
        By entering, you confirm you understand the tournament rules and game instructions.
      </Text>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#2B2F39', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#343B49', marginBottom: 12 },
  p: { color: colors.white, marginBottom: 6 },
});
