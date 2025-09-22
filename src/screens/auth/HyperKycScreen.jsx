import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, NativeModules, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ShieldCheck } from 'lucide-react-native';
import { useDispatch } from 'react-redux';
import { colors } from '../../theme/colors';
import Button from '../../components/ui/Button';
import { completeVerification } from '../../store/auth/authSlice';
import { HYPERKYC_APP_ID, HYPERKYC_APP_KEY, HYPERKYC_WORKFLOW_ID } from '../../config/hyperkyc';

const { Hyperkyc } = NativeModules;

function generateTransactionId() {
  const random = Math.random().toString(36).slice(2, 8);
  return `txn-${Date.now()}-${random}`;
}

export default function HyperKycScreen({ navigation }) {
  const dispatch = useDispatch();
  const [transactionId, setTransactionId] = useState(() => generateTransactionId());
  const [running, setRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [lastStatus, setLastStatus] = useState('');

  const unavailable = useMemo(() => !Hyperkyc || typeof Hyperkyc.launch !== 'function', []);

  const goBack = () => {
    if (!running) navigation.goBack();
  };

  const handleResult = useCallback(async (result) => {
    const payload = result || {};
    const status = payload.status || '';
    setLastStatus(status);
    setTransactionId(generateTransactionId());

    if (status === 'auto_approved' || status === 'needs_review') {
      setStatusMessage('Verification submitted successfully.');
      await dispatch(completeVerification());
      navigation.replace('CountrySelect');
      return;
    }

    if (status === 'user_cancelled') {
      setStatusMessage('You cancelled the verification. Start again when ready.');
      return;
    }

    if (status === 'auto_declined') {
      setStatusMessage('Your verification was declined. Please try again or contact support.');
      return;
    }

    const errorText = payload.errorMessage || 'Verification did not complete. Please retry.';
    setStatusMessage(errorText);
  }, [dispatch, navigation]);

  const startVerification = useCallback(async () => {
    if (unavailable) {
      setStatusMessage('HyperKYC SDK is not available on this build.');
      return;
    }
    if (running) return;

    setRunning(true);
    try {
      Hyperkyc.launch({
        appId: HYPERKYC_APP_ID,
        appKey: HYPERKYC_APP_KEY,
        workflowId: HYPERKYC_WORKFLOW_ID,
        transactionId,
        useLocation: false,
      }, (result) => {
        setRunning(false);
        handleResult(result);
      });
    } catch (err) {
      setRunning(false);
      setStatusMessage(err?.message || 'Unable to start HyperKYC flow.');
    }
  }, [handleResult, running, transactionId, unavailable]);

  const skip = useCallback(() => {
    if (running) return;
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    const parent = navigation.getParent?.();
    if (parent?.canGoBack?.()) {
      parent.goBack();
      return;
    }
    dispatch(completeVerification());
  }, [dispatch, navigation, running]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.iconBtn} disabled={running}>
          <ChevronLeft size={20} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HyperKYC Verification</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.heroIcon}>
          <ShieldCheck size={36} color={colors.primary} />
        </View>
        <Text style={styles.title}>Verify Your Identity</Text>
        <Text style={styles.subtitle}>
          Complete the HyperKYC flow to keep your account secure and unlock all features. The process takes just a minute.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What happens next?</Text>
          <Text style={styles.cardText}>• We will redirect you to HyperVerge&apos;s secure flow.</Text>
          <Text style={styles.cardText}>• Provide the requested documents and complete the checks.</Text>
          <Text style={styles.cardText}>• We will update your verification status once finished.</Text>
          <Text style={styles.cardHint}>Transaction ID: {transactionId}</Text>
        </View>

        <Button
          title={running ? 'Launching…' : 'Start Verification'}
          onPress={startVerification}
          disabled={running}
        />

        <TouchableOpacity style={styles.skipBtn} onPress={skip} disabled={running}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>

        {running && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.loadingText}>Opening HyperKYC…</Text>
          </View>
        )}

        {!!statusMessage && (
          <View style={styles.statusBox}>
            <Text style={styles.statusTitle}>Latest update ({lastStatus || 'pending'})</Text>
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#22252C',
  },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2B2F39',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#343B49',
  },
  content: { flex: 1, padding: 20 },
  heroIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2B2F39',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { color: colors.white, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: colors.textSecondary, textAlign: 'center', marginTop: 12, marginBottom: 24 },
  card: {
    backgroundColor: '#2B2F39',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#343B49',
    padding: 16,
    marginBottom: 24,
  },
  cardTitle: { color: colors.white, fontWeight: '800', marginBottom: 8 },
  cardText: { color: colors.textSecondary, marginBottom: 6 },
  cardHint: { color: '#7E8498', marginTop: 12, fontSize: 12 },
  skipBtn: { marginTop: 12, alignSelf: 'center' },
  skipText: { color: colors.textSecondary, fontWeight: '700' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  loadingText: { color: colors.textSecondary, marginLeft: 8 },
  statusBox: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1F2330',
    borderWidth: 1,
    borderColor: '#2D3240',
  },
  statusTitle: { color: colors.white, fontWeight: '700', marginBottom: 6, textTransform: 'capitalize' },
  statusText: { color: colors.textSecondary },
});
