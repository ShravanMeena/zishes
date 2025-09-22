import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import paymentMethods from '../../services/paymentMethods';
import payouts from '../../services/payouts';
import { fetchMyWallet } from '../../store/wallet/walletSlice';
import AppModal from '../../components/common/AppModal';

export default function WithdrawScreen({ navigation, route }) {
  const routeAmount = Number(route?.params?.maxAmount || 0);
  const productId = route?.params?.productId || null;
  const [methods, setMethods] = useState({ upis: [], bankAccounts: [], defaultMethod: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [taxPreview, setTaxPreview] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const userEditedAmount = useRef(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  const withdrawalBalance = useSelector((s) => s.wallet.withdrawalBalance);

  const baseWithdrawable = Number(withdrawalBalance ?? 0);
  const fallbackAmount = Number.isFinite(routeAmount) ? routeAmount : 0;
  const maxCoins = Math.max(0, baseWithdrawable > 0 ? baseWithdrawable : fallbackAmount);
  const amountNumber = useMemo(() => {
    const n = Number(amountInput);
    if (Number.isNaN(n)) return 0;
    return n;
  }, [amountInput]);
  const amountTooHigh = amountNumber > maxCoins && maxCoins > 0;

  const loadMethods = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentMethods.getMyPaymentMethods();
      const doc = data || {};
      const upis = doc?.upis || [];
      const bankAccounts = doc?.bankAccounts || [];
      const defaultMethod = doc?.defaultMethod || null;
      setMethods({ upis, bankAccounts, defaultMethod });
      if (defaultMethod?.type && defaultMethod?.refId) {
        setSelected({ type: defaultMethod.type, id: defaultMethod.refId });
      } else if (upis[0]?._id) {
        setSelected({ type: 'UPI', id: upis[0]._id });
      } else if (bankAccounts[0]?._id) {
        setSelected({ type: 'BANK', id: bankAccounts[0]._id });
      } else {
        setSelected(null);
      }
    } catch (e) {
      if (e?.status && e.status !== 404) {
        setError(e?.message || 'Failed to load payment methods');
      }
      setMethods({ upis: [], bankAccounts: [], defaultMethod: null });
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      if (token) {
        try { dispatch(fetchMyWallet()); } catch {}
      }
      userEditedAmount.current = false;
      loadMethods();
    });
    return unsub;
  }, [navigation, loadMethods, dispatch, token]);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  const feeItems = useMemo(() => {
    if (!taxPreview || !Array.isArray(taxPreview)) return [];
    return taxPreview;
  }, [taxPreview]);

  const totalFees = useMemo(() => feeItems.reduce((sum, fee) => sum + Number(fee?.amount || 0), 0), [feeItems]);
  const netAmount = Math.max(0, amountNumber - totalFees);

  const onSelectMethod = (type, id) => {
    setSelected({ type, id });
  };

  const onFetchTaxes = async (amt) => {
    if (!amt || amt <= 0) {
      setTaxPreview(null);
      return;
    }
    try {
      setError(null);
      const preview = await payouts.getTaxes(amt);
      setTaxPreview(preview || []);
    } catch (e) {
      setTaxPreview(null);
    }
  };

  useEffect(() => {
    const amt = Math.min(amountNumber, maxCoins || amountNumber);
    if (amt > 0) onFetchTaxes(amt);
    else setTaxPreview(null);
  }, [amountNumber, maxCoins]);

  useEffect(() => {
    if (!userEditedAmount.current) {
      const defaultVal = maxCoins > 0 ? String(maxCoins) : '';
      setAmountInput(defaultVal);
    }
  }, [maxCoins]);

  const hasMethods = useMemo(() => {
    return (methods?.bankAccounts?.length || 0) > 0 || (methods?.upis?.length || 0) > 0;
  }, [methods]);

  const onChangeAmount = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    userEditedAmount.current = true;
    setAmountInput(cleaned);
  };

  const onConfirm = async () => {
    if (!selected || !selected.id) {
      Alert.alert('Select Method', 'Please choose a payment method before withdrawing.');
      return;
    }
    const amt = Math.min(amountNumber, maxCoins || amountNumber);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid Amount', 'Enter a valid withdrawal amount.');
      return;
    }
    if (amt > maxCoins) {
      Alert.alert('Amount Too High', `The maximum you can withdraw is ${maxCoins.toLocaleString()} Coins.`);
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await paymentMethods.setDefault({ type: selected.type, id: selected.id });
      const payload = productId ? { amount: amt, productId, token } : { amount: amt, token };
      await payouts.request(payload);
      try { dispatch(fetchMyWallet()); } catch {}
      setSuccessOpen(true);
    } catch (e) {
      Alert.alert('Withdrawal Failed', e?.message || 'Unable to process withdrawal.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderMethod = (type, method) => {
    const id = method?._id;
    const isSelected = selected?.id === id && selected?.type === type;
    const meta = type === 'UPI' ? method?.upi : method?.accountNumber ? `••${String(method.accountNumber).slice(-4)}` : '-';
    const title = type === 'UPI' ? 'UPI' : 'Bank Account';
    const subtitle = type === 'UPI' ? method?.label || method?.upi : method?.bankName || 'Bank';
    return (
      <TouchableOpacity key={`${type}-${id}`} style={[styles.methodCard, isSelected && styles.methodCardActive]} onPress={() => onSelectMethod(type, id)}>
        <View>
          <Text style={styles.methodTitle}>{title}</Text>
          <Text style={styles.methodMeta}>{subtitle}</Text>
          <Text style={styles.methodMeta}>{meta}</Text>
        </View>
        <View style={[styles.radio, isSelected && styles.radioOn]} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw Funds</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Withdrawable Balance</Text>
          <Text style={styles.balance}>{maxCoins.toLocaleString()} Coins</Text>
          <Text style={styles.summaryHint}>You can request any amount up to your withdrawable balance.</Text>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.amountInputWrap}>
          <Text style={styles.amountLabel}>Amount to withdraw</Text>
          <TextInput
            value={amountInput}
            onChangeText={onChangeAmount}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            style={styles.amountInput}
          />
          <Text style={styles.amountHint}>Max {maxCoins.toLocaleString()} Coins</Text>
        </View>

        <Text style={styles.sectionTitle}>Available Methods</Text>
        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <ActivityIndicator color={colors.white} />
            <Text style={{ color: colors.white, marginTop: 8 }}>Loading payment methods…</Text>
          </View>
        ) : (
          <>
            {(methods?.bankAccounts || []).map((b) => renderMethod('BANK', b))}
            {(methods?.upis || []).map((u) => renderMethod('UPI', u))}
            {!hasMethods ? (
              <View style={styles.emptyBox}>
                <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No payment methods yet. Add one to continue.</Text>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('PaymentMethods')}>
                  <Text style={styles.secondaryBtnText}>Add Payment Method</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        )}

        {amountTooHigh ? (
          <Text style={styles.errorInline}>You cannot withdraw more than {maxCoins.toLocaleString()} Coins.</Text>
        ) : null}

        {feeItems.length ? (
          <View style={styles.feeCard}>
            <Text style={styles.sectionTitle}>Fee Breakdown</Text>
            {feeItems.map((fee, idx) => (
              <View key={`${fee.name}-${idx}`} style={styles.feeRow}>
                <Text style={styles.feeLabel}>{fee.name}</Text>
                <Text style={styles.feeValue}>₹{Number(fee.amount || 0).toLocaleString()}</Text>
              </View>
            ))}
            <View style={[styles.feeRow, styles.feeDivider]}>
              <Text style={[styles.feeLabel, { color: colors.white }]}>Net Amount</Text>
              <Text style={[styles.feeValue, { color: colors.white }]}>{netAmount.toLocaleString()} Coins</Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryBtn, (!selected || submitting || !hasMethods || amountNumber <= 0 || amountNumber > maxCoins) && { opacity: 0.6 }]}
          onPress={onConfirm}
          disabled={!selected || submitting || !hasMethods || amountNumber <= 0 || amountNumber > maxCoins}
        >
          <Text style={styles.primaryBtnText}>{submitting ? 'Requesting…' : 'Request Withdrawal'}</Text>
        </TouchableOpacity>
      </ScrollView>
      <AppModal
        visible={successOpen}
        title="Withdrawal Requested"
        message="Thanks! Your withdrawal request is queued. Expect funds within 7–10 business days."
        confirmText="Great"
        onConfirm={() => {
          setSuccessOpen(false);
          navigation.pop();
        }}
        onCancel={() => {
          setSuccessOpen(false);
          navigation.pop();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },

  summaryCard: { backgroundColor: '#2B2F39', borderRadius: 16, borderWidth: 1, borderColor: '#343B49', padding: 16 },
  summaryTitle: { color: colors.white, fontWeight: '700', fontSize: 16 },
  balance: { color: colors.white, fontWeight: '900', fontSize: 28, marginTop: 6 },
  summaryHint: { color: colors.textSecondary, marginTop: 4 },
  errorBox: { backgroundColor: 'rgba(255,122,122,0.18)', borderRadius: 12, borderWidth: 1, borderColor: '#FF7A7A', padding: 12, marginTop: 16 },
  errorText: { color: '#FF7A7A', fontWeight: '700', textAlign: 'center' },

  amountInputWrap: { marginTop: 16, backgroundColor: '#2B2F39', borderRadius: 14, borderWidth: 1, borderColor: '#343B49', padding: 16 },
  amountLabel: { color: colors.textSecondary, marginBottom: 8 },
  amountInput: { backgroundColor: '#1E2128', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.white, fontWeight: '700', fontSize: 18 },
  amountHint: { color: colors.textSecondary, marginTop: 6 },
  errorInline: { color: '#FF7A7A', marginTop: 8, fontWeight: '700' },

  sectionTitle: { color: colors.white, fontWeight: '800', fontSize: 16, marginTop: 20, marginBottom: 12 },
  methodCard: { backgroundColor: '#1E2128', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2F3542', marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  methodCardActive: { borderColor: colors.primary },
  methodTitle: { color: colors.white, fontWeight: '800', fontSize: 16 },
  methodMeta: { color: colors.textSecondary, marginTop: 4 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#667085' },
  radioOn: { borderColor: colors.primary, backgroundColor: 'rgba(105,13,171,0.35)' },

  emptyBox: { backgroundColor: '#1E2128', borderRadius: 14, borderWidth: 1, borderColor: '#2F3542', padding: 16, alignItems: 'center' },
  secondaryBtn: { marginTop: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10 },
  secondaryBtnText: { color: colors.primary, fontWeight: '700' },

  feeCard: { backgroundColor: '#1E2128', borderRadius: 14, borderWidth: 1, borderColor: '#2F3542', padding: 16, marginTop: 16 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  feeDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#343B49', marginTop: 14, paddingTop: 12 },
  feeLabel: { color: colors.textSecondary },
  feeValue: { color: colors.white, fontWeight: '700' },

  primaryBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  primaryBtnText: { color: colors.white, fontWeight: '800', fontSize: 16 },
});
