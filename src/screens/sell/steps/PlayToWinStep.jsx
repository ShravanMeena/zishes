import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ActivityIndicator, Keyboard, Linking } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { colors } from '../../../theme/colors';
import LinearGradient from 'react-native-linear-gradient';
import { ChevronDown, Check } from 'lucide-react-native';
import ProgressBar from '../../../components/common/ProgressBar';
import DatePickerModal, { formatDateYYYYMMDD } from '../../../components/ui/DatePickerModal';
import { useDispatch, useSelector } from 'react-redux';
import { updatePlay } from '../../../store/listingDraft/listingDraftSlice';
import { updatePolicies } from '../../../store/listingDraft/listingDraftSlice';
import gamesApi from '../../../services/games';
import { calculateProductTaxes, getEntrySuggestion } from '../../../services/products';
import { formatCurrency, formatNumber, getCurrencyConfig } from '../../../utils/currency';

export default function PlayToWinStep() {
  const dispatch = useDispatch();
  const form = useSelector((s) => s.listingDraft.play);
  const token = useSelector((s) => s.auth.token);
  const userCountry = useSelector((s) => s.auth?.user?.address?.country);
  const set = (k, v) => dispatch(updatePlay({ [k]: v }));
  const currencyConfig = useMemo(() => getCurrencyConfig(userCountry), [userCountry]);
  const currencyCode = currencyConfig.code;

  const gameOptions = useMemo(() => [
    'Word Map',
    'Colour Jumble',
    'Math Mash',
    'Tap Dash',
    'Quick Memory',
  ], []);
  const [showGame, setShowGame] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [games, setGames] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [gamesError, setGamesError] = useState(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [playsTouched, setPlaysTouched] = useState(false);
  const playsTouchedRef = useRef(false);
  const [dateError, setDateError] = useState('');

  useEffect(() => { playsTouchedRef.current = playsTouched; }, [playsTouched]);

  useEffect(() => {
    if (!form.endDate) {
      setDateError('');
      return;
    }
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const parsed = new Date(form.endDate);
      parsed.setHours(0, 0, 0, 0);
      setDateError(parsed < today ? 'End date cannot be in the past.' : '');
    } catch (_) {
      setDateError('');
    }
  }, [form.endDate]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setGamesLoading(true); setGamesError(null);
      try {
        const list = await gamesApi.listPublishedGames();
        if (!alive) return;
        setGames(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!alive) return;
        setGamesError(e?.message || 'Failed to fetch games');
      } finally {
        if (alive) setGamesLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const price = parseFloat(form.expectedPrice);
    const fee = parseFloat(form.pricePerPlay);
    const currentSeats = Number(form.playsCount);
    if (!price || price <= 0 || !fee || fee <= 0) {
      setSuggestion(null);
      setSuggestionError('');
      setSuggestionLoading(false);
      return;
    }

    let cancelled = false;
    setSuggestionError('');
    setSuggestionLoading(true);

    const timer = setTimeout(() => {
      (async () => {
        try {
          const res = await getEntrySuggestion({ price, entryFee: fee }, token, { guest: !token });
          if (cancelled) return;
          setSuggestion(res);
          if (!playsTouchedRef.current && res?.recommended?.seats != null) {
            const recommended = Number(res.recommended.seats);
            if (!Number.isNaN(recommended) && recommended > 0 && recommended !== currentSeats) {
              dispatch(updatePlay({ playsCount: String(recommended) }));
            }
          }
        } catch (err) {
          if (cancelled) return;
          setSuggestion(null);
          let message = err?.message || 'Unable to fetch entry suggestion.';
          if (err?.status === 401) message = 'Please sign in again to view entry suggestions.';
          if (err?.status === 422) message = err?.data?.message || 'Check your price and entry fee values.';
          setSuggestionError(message);
        } finally {
          if (!cancelled) setSuggestionLoading(false);
        }
      })();
    }, 420);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [form.expectedPrice, form.pricePerPlay, token, dispatch]);

  return (
    <KeyboardAwareScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }} enableOnAndroid extraScrollHeight={20}>
      <View style={styles.card}>
        <Text style={styles.title}>Configure Zishes</Text>
        <Text style={styles.desc}>
          Set the number of gameplays, your price, and listing duration to define your zishes mechanics
        </Text>

        <FieldLabel>Expected Selling Price <Text style={{ color: '#ff8181' }}>*</Text></FieldLabel>
          <Input
            placeholder={`Expected price (${currencyCode})`}
          keyboardType="numeric"
          value={form.expectedPrice}
          onChangeText={(t) => set('expectedPrice', t)}
        />
        <FieldHint>The anticipated price you expect to ZISH your item for</FieldHint>

        <FieldLabel>Price per Gameplay <Text style={{ color: '#ff8181' }}>*</Text></FieldLabel>
        <View style={styles.rowInputWrap}>
          <View style={styles.coinWrap}>
            <LinearGradient colors={[colors.primary, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coinBg}>
              <Text style={styles.coinTxt}>Z</Text>
            </LinearGradient>
          </View>
          <TextInput
            placeholder="Price per play (ZishCoin)"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={form.pricePerPlay}
            onChangeText={(t) => set('pricePerPlay', t)}
            style={[styles.input, { flex: 1 }]}
            blurOnSubmit
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
        </View>
        <FieldHint>Cost for a single gameplay</FieldHint>

        <FieldLabel>Number of Game Plays</FieldLabel>
          <Input
            placeholder="Auto-filled from price"
          keyboardType="numeric"
          value={form.playsCount}
          editable={false}
        />
        <FieldHint>The seat count adjusts automatically based on your price and entry fee.</FieldHint>
        {/* <SuggestionSummary
          loading={suggestionLoading}
          error={suggestionError}
          suggestion={suggestion}
          currencyConfig={currencyConfig}
          onApplySeats={(seats) => {
            if (!seats) return;
            dispatch(updatePlay({ playsCount: String(seats) }));
            setPlaysTouched(false);
          }}
        /> */}

        <FieldLabel>Listing End Date <Text style={{ color: '#ff8181' }}>*</Text></FieldLabel>
        <Select
          value={form.endDate}
          placeholder="Pick end date"
          onPress={() => {
            setDateError('');
            setShowDate(true);
          }}
        />
        <FieldHint>Select the final date for your listing to be active.</FieldHint>
        {dateError ? <FieldHint style={{ color: '#ff9999' }}>{dateError}</FieldHint> : null}

        <FieldLabel>Game Option <Text style={{ color: '#ff8181' }}>*</Text></FieldLabel>
        <Select value={form.gameName} placeholder={gamesLoading ? 'Loading games…' : 'Choose a game'} onPress={() => setShowGame(true)} />
        {gamesError ? <FieldHint style={{ color: '#ff9999' }}>{gamesError}</FieldHint> : <FieldHint>Select a published game for this tournament.</FieldHint>}
      </View>

      {/* Early Termination Option */}
      <EarlyTermination
        expectedPrice={parseFloat(form.expectedPrice) || 0}
        playsTotal={parseInt(form.playsCount || '1200', 10) || 1200}
        currencyConfig={currencyConfig}
      />

      {/* Payout Details */}
      <PayoutDetails expectedPrice={parseFloat(form.expectedPrice) || 0} currencyConfig={currencyConfig} />

      <View style={styles.kycCard}>
        <Text style={styles.kycText}>
          I agree to carry out my KYC as per government regulations while withdrawing from my money wallet.
        </Text>
        <TouchableOpacity
          accessibilityRole="link"
          onPress={() => Linking.openURL('https://www.hyperverge.co/kyc').catch(() => {})}
        >
          <Text style={styles.kycLink}>Read more</Text>
        </TouchableOpacity>
      </View>

      <PickerModal
        visible={showGame}
        title="Select Game"
        options={games}
        onClose={() => setShowGame(false)}
        onSelect={(g) => { set('game', g?._id); set('gameName', g?.name); setShowGame(false); }}
      />
      <DatePickerModal
        visible={showDate}
        value={form.endDate ? new Date(form.endDate) : new Date()}
        onClose={() => setShowDate(false)}
        onConfirm={(d) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const picked = new Date(d);
          picked.setHours(0, 0, 0, 0);
          if (picked < today) {
            setDateError('End date cannot be in the past.');
            setShowDate(false);
            return;
          }
          set('endDate', formatDateYYYYMMDD(d));
          setDateError('');
          setShowDate(false);
        }}
      />
    </KeyboardAwareScrollView>
  );
}

function FieldLabel({ children }) { return <Text style={styles.label}>{children}</Text>; }
function FieldHint({ children, style }) { return <Text style={[styles.hint, style]}>{children}</Text>; }
function Input({ style, multiline, onSubmitEditing, returnKeyType, ...rest }) {
  const handleSubmit = onSubmitEditing || (!multiline ? () => Keyboard.dismiss() : undefined);
  return (
    <TextInput
      {...rest}
      multiline={multiline}
      placeholderTextColor={colors.textSecondary}
      style={[styles.input, style]}
      blurOnSubmit={!multiline}
      returnKeyType={returnKeyType || (multiline ? 'default' : 'done')}
      onSubmitEditing={handleSubmit}
    />
  );
}

function Select({ placeholder, value, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.input, styles.select]}>
      <Text style={[styles.selTxt, { color: value ? colors.white : colors.textSecondary }]}>{value || placeholder}</Text>
      <ChevronDown size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

function PickerModal({ visible, title, options, onClose, onSelect }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.modalBackdrop}>
        <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{title}</Text>
          {Array.isArray(options) && options.length > 0 ? (
            options.map((opt) => {
              const key = opt?._id || opt?.id || String(opt?.name || opt);
              const label = opt?.name || String(opt);
              return (
                <TouchableOpacity key={key} style={styles.optionRow} onPress={() => onSelect(opt)}>
                  <Text style={styles.optionTxt}>{label}</Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={[styles.optionTxt, { opacity: 0.7 }]}>No games available</Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#2B2F39', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#343B49' },
  title: { color: colors.white, fontSize: 26, fontWeight: '800', marginBottom: 8 },
  desc: { color: colors.textSecondary, marginBottom: 16 },
  label: { color: colors.white, fontWeight: '700', marginTop: 10, marginBottom: 8 },
  input: { backgroundColor: '#1E2128', borderWidth: 1, borderColor: '#3A4051', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, color: colors.white },
  hint: { color: colors.textSecondary, marginTop: 6, marginBottom: 10 },

  rowInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  coinWrap: { width: 54, height: 54, borderRadius: 12, overflow: 'hidden', backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#3A4051', alignItems: 'center', justifyContent: 'center' },
  coinBg: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  coinTxt: { color: colors.white, fontWeight: '800', fontSize: 16 },

  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selTxt: { fontWeight: '600' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#1E2128', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#343B49' },
  modalTitle: { color: colors.white, fontWeight: '800', fontSize: 16, marginBottom: 8 },
  optionRow: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2B2F39' },
  optionTxt: { color: colors.white, fontWeight: '600' },

  kycCard: { marginTop: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#3A4051', backgroundColor: '#232633' },
  kycText: { color: colors.white, fontWeight: '600', lineHeight: 20 },
  kycLink: { marginTop: 8, color: colors.accent, fontWeight: '700' },

  subTitle: { color: colors.white, fontSize: 20, fontWeight: '800' },
  earlyCard: { backgroundColor: '#2B2F39', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#343B49', marginTop: 14 },
  earlyDesc: { color: colors.textSecondary, marginTop: 8 },
  earlySummaryRow: { flexDirection: 'row', marginTop: 14 },
  earlySummaryBox: { flex: 1, backgroundColor: '#1F2230', borderRadius: 12, borderWidth: 1, borderColor: '#343B49', padding: 12 },
  earlySummaryBoxSpacer: { marginRight: 12 },
  metricLabel: { color: colors.textSecondary, fontSize: 12, textTransform: 'uppercase', fontWeight: '700' },
  metricValue: { color: colors.white, fontWeight: '800', fontSize: 16, marginTop: 4 },
  thresholdRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  thresholdBtn: { flex: 1, borderRadius: 20, borderWidth: 1, borderColor: '#3A4051', paddingVertical: 8, marginHorizontal: 4, alignItems: 'center', backgroundColor: '#1F2230' },
  thresholdBtnActive: { backgroundColor: '#342a4a', borderColor: colors.primary },
  thresholdTxt: { color: colors.textSecondary, fontWeight: '700' },
  thresholdTxtActive: { color: colors.white },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  toggleCheckbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: 'transparent' },
  toggleCheckboxOn: { backgroundColor: colors.primary },
  toggleLabel: { flex: 1, color: colors.white, fontWeight: '700' },
  toggleHint: { color: colors.textSecondary, marginTop: 6, marginLeft: 36 },
  rowTitle: { color: colors.white, fontWeight: '800' },
  suggestionCard: { backgroundColor: '#1E2128', borderRadius: 16, borderWidth: 1, borderColor: '#343B49', padding: 16, marginTop: 10 },
  suggestionTitle: { color: colors.white, fontWeight: '800', fontSize: 16 },
  suggestionSubtitle: { color: colors.textSecondary, marginTop: 4, marginBottom: 10 },
  suggestionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  suggestionLabel: { color: colors.textSecondary, fontWeight: '600' },
  suggestionValue: { color: colors.white, fontWeight: '800', fontSize: 18 },
  suggestionButton: { marginTop: 14, borderRadius: 12, backgroundColor: colors.primary, paddingVertical: 12, alignItems: 'center' },
  suggestionButtonTxt: { color: colors.white, fontWeight: '800' },
  suggestionDivider: { height: 1, backgroundColor: '#2E3440', marginVertical: 12 },
  suggestionError: { color: '#FF9C9C', marginTop: 8 },
  suggestionBadge: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#2F3140', marginTop: 6 },
  suggestionBadgeTxt: { color: colors.accent, fontWeight: '700', fontSize: 12 },
});

function SuggestionSummary({ loading, error, suggestion, onApplySeats, currencyConfig }) {
  if (!loading && !error && !suggestion) return null;

  const toNumberOrNull = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };
  const fmtNumber = (n) => {
    const numeric = toNumberOrNull(n);
    return numeric == null ? '—' : formatNumber(numeric, { config: currencyConfig });
  };
  const fmtCurrencyValue = (n) => {
    const numeric = toNumberOrNull(n);
    return numeric == null ? '—' : formatCurrency(numeric, { config: currencyConfig });
  };

  const recommendedSeats = suggestion?.recommended?.seats;
  const recommendedCoverage = suggestion?.recommended?.coverageAmount;
  const rationale = suggestion?.recommended?.rationale;
  const exactMatch = suggestion?.exactMatch;

  return (
    <View style={styles.suggestionCard}>
      <Text style={styles.suggestionTitle}>Entry Seat Suggestions</Text>
      {loading ? (
        <View style={{ alignItems: 'center', marginTop: 12 }}><ActivityIndicator color={colors.accent} /></View>
      ) : error ? (
        <Text style={styles.suggestionError}>{error}</Text>
      ) : (
        <>
          <Text style={styles.suggestionSubtitle}>
            {exactMatch ? 'Exact match recommendation' : (rationale || 'Optimized to maximize coverage without overshooting')}
          </Text>
          <View style={styles.suggestionRow}>
            <View>
              <Text style={styles.suggestionLabel}>Recommended Seats</Text>
              <Text style={styles.suggestionValue}>{fmtNumber(recommendedSeats)}</Text>
            </View>
            <View>
              <Text style={styles.suggestionLabel}>Coverage</Text>
              <Text style={styles.suggestionValue}>{fmtCurrencyValue(recommendedCoverage)}</Text>
            </View>
          </View>
          <View style={styles.suggestionBadge}>
            <Text style={styles.suggestionBadgeTxt}>
              Total Coins Needed: {fmtNumber(suggestion?.totalCoinsToCover)}
            </Text>
          </View>
          <View style={styles.suggestionDivider} />
          <View style={{ gap: 8 }}>
            <Text style={styles.suggestionLabel}>Cover the full price</Text>
            <Text style={styles.suggestionValue}>
              {fmtNumber(suggestion?.minSeatsToCover)} seats · {fmtCurrencyValue(suggestion?.minSeatsCoverageAmount)}
            </Text>
          </View>
          <View style={{ marginTop: 12, gap: 8 }}>
            <Text style={styles.suggestionLabel}>Stay under the price</Text>
            <Text style={styles.suggestionValue}>
              {fmtNumber(suggestion?.maxSeatsNotExceed)} seats · {fmtCurrencyValue(suggestion?.maxSeatsCoverageAmount)}
            </Text>
          </View>
          {suggestion?.shortfallAmount > 0 ? (
            <Text style={[styles.suggestionLabel, { marginTop: 12 }]}>Shortfall: {fmtCurrencyValue(suggestion.shortfallAmount)}</Text>
          ) : null}
          {suggestion?.overageAmount > 0 ? (
            <Text style={[styles.suggestionLabel, { marginTop: 4 }]}>Overage: {fmtCurrencyValue(suggestion.overageAmount)}</Text>
          ) : null}
          {recommendedSeats ? (
            <TouchableOpacity style={styles.suggestionButton} onPress={() => onApplySeats(recommendedSeats)}>
              <Text style={styles.suggestionButtonTxt}>Use {fmtNumber(recommendedSeats)} Seats</Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </View>
  );
}

function EarlyTermination({ expectedPrice, playsTotal, currencyConfig }) {
  const thresholds = [0.6, 0.7, 0.8, 0.9];
  const dispatch = useDispatch();
  const { earlyTerminationEnabled, earlyTerminationThresholdPct, platinumOnly } = useSelector((s) => s.listingDraft.play);
  const { listingExtensionAck } = useSelector((s) => s.listingDraft.policies);
  const userCountry = useSelector((s) => s.auth?.user?.address?.country || '');

  const pctValue = Number(earlyTerminationThresholdPct || 80) / 100;
  const selectedThreshold = thresholds.find((t) => Math.round(t * 100) === Math.round(pctValue * 100)) ?? 0.8;
  const thresholdPct = Math.round(selectedThreshold * 100);
  const triggerAmount = Math.max(0, (expectedPrice || 0) * selectedThreshold);
  const seatsNeeded = Math.max(0, Math.ceil((playsTotal || 0) * selectedThreshold));
  const showPlatinumOnly = String(userCountry).trim().toLowerCase() === 'india';

  const formatCount = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? formatNumber(numeric, { config: currencyConfig }) : '—';
  };

  const formatAmount = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return formatCurrency(0, { config: currencyConfig });
    return formatCurrency(numeric, {
      config: currencyConfig,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const renderCheckbox = (checked) => (
    <View style={[styles.toggleCheckbox, checked && styles.toggleCheckboxOn]}>
      {checked ? <Check size={14} color={colors.white} strokeWidth={3} /> : null}
    </View>
  );

  return (
    <View style={styles.earlyCard}> 
      <Text style={styles.subTitle}>Early Termination Option</Text>
      <Text style={styles.earlyDesc}>
        Close the tournament early once you have covered enough entries. Winners are declared instantly and no further plays are accepted.
      </Text>
      <TouchableOpacity style={styles.toggleRow} onPress={() => dispatch(updatePlay({ earlyTerminationEnabled: !earlyTerminationEnabled }))}>
        {renderCheckbox(earlyTerminationEnabled)}
        <Text style={styles.toggleLabel}>Enable early termination for this tournament</Text>
      </TouchableOpacity>

      {earlyTerminationEnabled ? (
        <>
          <Text style={styles.toggleHint}>We will monitor progress and let you wrap early once the threshold is crossed.</Text>

          <View style={styles.earlySummaryRow}>
            <View style={[styles.earlySummaryBox, styles.earlySummaryBoxSpacer]}>
              <Text style={styles.metricLabel}>Threshold</Text>
              <Text style={styles.metricValue}>{thresholdPct}% game plays</Text>
            </View>
            <View style={[styles.earlySummaryBox, styles.earlySummaryBoxSpacer]}>
              <Text style={styles.metricLabel}>Trigger Amount</Text>
              <Text style={styles.metricValue}>{formatAmount(triggerAmount)}</Text>
            </View>
            <View style={styles.earlySummaryBox}>
              <Text style={styles.metricLabel}>Game Plays Needed</Text>
              <Text style={styles.metricValue}>{formatCount(seatsNeeded)}</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <ProgressBar value={selectedThreshold} height={10} />
          </View>
          <View style={styles.thresholdRow}>
            {thresholds.map((t) => {
              const pct = Math.round(t * 100);
              const active = pct === thresholdPct;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.thresholdBtn, active && styles.thresholdBtnActive]}
                  onPress={() => dispatch(updatePlay({ earlyTerminationThresholdPct: pct }))}
                >
                  <Text style={[styles.thresholdTxt, active && styles.thresholdTxtActive]}>{pct}%</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : null}

      <TouchableOpacity style={styles.toggleRow} onPress={() => dispatch(updatePolicies({ listingExtensionAck: !listingExtensionAck }))}>
        {renderCheckbox(listingExtensionAck)}
        <Text style={styles.toggleLabel}>⁠I understand I can extend this listing only ONCE.</Text>
      </TouchableOpacity>

      {showPlatinumOnly ? (
        <TouchableOpacity style={styles.toggleRow} onPress={() => dispatch(updatePlay({ platinumOnly: !platinumOnly }))}>
          {renderCheckbox(platinumOnly)}
          <Text style={styles.toggleLabel}>Allow only Platinum members to join this tournament.</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function PayoutDetails({ expectedPrice, currencyConfig }) {
  const token = useSelector((s) => s.auth.token);
  const [taxes, setTaxes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const amount = Number(expectedPrice) || 0;

  useEffect(() => {
    const numericAmount = Number(expectedPrice);
    if (!token || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setTaxes(null);
      setLoading(false);
      setError(token ? '' : '');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    const timer = setTimeout(() => {
      (async () => {
        try {
          const res = await calculateProductTaxes({ amount: numericAmount }, token);
          if (cancelled) return;
          setTaxes(res);
        } catch (err) {
          if (cancelled) return;
          setTaxes(null);
          let message = err?.message || 'Unable to fetch payout details.';
          if (err?.status === 401) message = 'Please sign in again to view payout details.';
          setError(message);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 420);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [expectedPrice, token]);

  const fmtCurrencyValue = (value, options = {}) => {
    const { maxDecimals = 2, minDecimals = 0 } = options;
    const num = Number(value);
    if (!Number.isFinite(num)) return formatCurrency(0, { config: currencyConfig, maximumFractionDigits: maxDecimals, minimumFractionDigits: minDecimals });
    return formatCurrency(num, {
      config: currencyConfig,
      maximumFractionDigits: maxDecimals,
      minimumFractionDigits: minDecimals,
    });
  };

  const deductionRows = Array.isArray(taxes?.calculatedTaxes) ? taxes.calculatedTaxes : [];
  const finalPayout = Number(taxes?.finalPrice);
  const totalDeductable = Number(taxes?.deductable);
  const countryLabel = taxes?.country;
  const effectiveFinalPayout = Number.isFinite(finalPayout)
    ? finalPayout
    : (Number.isFinite(totalDeductable) ? amount - totalDeductable : amount);
  const taxLabelMap = {
    platform_fee: 'Platform Fee',
    gst: 'GST / Govt. Taxes',
    tds: 'TDS',
    processing_fee: 'Processing Fee',
  };
  const toTitleCase = (value) => (typeof value === 'string'
    ? value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Tax');

  const renderBody = () => {
    if (!token) {
      return <Text style={[styles.hint, { color: colors.textSecondary, marginTop: 12 }]}>Sign in to view payout breakdown.</Text>;
    }
    if (amount <= 0) {
      return <Text style={[styles.hint, { color: colors.textSecondary, marginTop: 12 }]}>Enter an estimated selling price to preview payout details.</Text>;
    }
    if (loading) {
      return (
        <View style={{ alignItems: 'center', marginVertical: 18 }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      );
    }
    if (error) {
      return <Text style={[styles.hint, { color: '#FF9C9C', marginTop: 12 }]}>{error}</Text>;
    }
    return (
      <>
        <View style={{ marginTop: 10 }}>
          {deductionRows.length ? deductionRows.map((tax, idx) => {
            const key = tax?.key ? String(tax.key) : `tax-${idx}`;
            const baseLabel = taxLabelMap[tax?.key] || toTitleCase(tax?.key);
            const pctSuffix = tax?.type === 'PERCENT' && Number.isFinite(Number(tax?.value)) ? ` (${Number(tax.value)}%)` : '';
            return (
              <Row
                key={key}
                label={`${baseLabel}${pctSuffix}`}
                value={`- ${fmtCurrencyValue(tax?.calculatedTax)}`}
              />
            );
          }) : (
            <Text style={[styles.hint, { color: colors.textSecondary, marginTop: 2 }]}>No taxes configured for your account.</Text>
          )}
        </View>

        <View style={{ height: 1, backgroundColor: '#3A4051', marginVertical: 12 }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#5ee787', fontWeight: '900', fontSize: 18 }}>Your Final Payout</Text>
          <Text style={{ color: '#27c07d', fontWeight: '900', fontSize: 22 }}>{fmtCurrencyValue(effectiveFinalPayout)}</Text>
        </View>

        {Number.isFinite(totalDeductable) ? (
          <Text style={[styles.hint, { color: colors.textSecondary, marginTop: 6 }]}>Total deductions: {fmtCurrencyValue(totalDeductable)}</Text>
        ) : null}

        {countryLabel ? (
          <Text style={[styles.hint, { color: colors.textSecondary, marginTop: 4 }]}>Taxes based on {countryLabel} rules.</Text>
        ) : null}
      </>
    );
  };

  return (
    <View style={[styles.card, { marginTop: 16 }]}> 
      <Text style={styles.subTitle}>Payout Details <Text style={{ color: colors.textSecondary }}>( on Estimated Selling Price )</Text></Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
        <Text style={styles.rowTitle}>Total Estimated Revenue</Text>
        <Text style={styles.rowTitle}>{fmtCurrencyValue(amount, { maxDecimals: 2 })}</Text>
      </View>

      {renderBody()}
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
      <Text style={{ color: colors.white }}>{label}</Text>
      <Text style={{ color: '#FF7A7A', fontWeight: '800' }}>{value}</Text>
    </View>
  );
}
