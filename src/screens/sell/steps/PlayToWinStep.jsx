import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { colors } from '../../../theme/colors';
import LinearGradient from 'react-native-linear-gradient';
import { ChevronDown } from 'lucide-react-native';
import ProgressBar from '../../../components/common/ProgressBar';
import DatePickerModal, { formatDateYYYYMMDD } from '../../../components/ui/DatePickerModal';
import { useDispatch, useSelector } from 'react-redux';
import { updatePlay } from '../../../store/listingDraft/listingDraftSlice';

export default function PlayToWinStep() {
  const dispatch = useDispatch();
  const form = useSelector((s) => s.listingDraft.play);
  const set = (k, v) => dispatch(updatePlay({ [k]: v }));

  const gameOptions = useMemo(() => [
    'Word Map',
    'Colour Jumble',
    'Math Mash',
    'Tap Dash',
    'Quick Memory',
  ], []);
  const [showGame, setShowGame] = useState(false);
  const [showDate, setShowDate] = useState(false);

  return (
    <KeyboardAwareScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }} enableOnAndroid extraScrollHeight={20}>
      <View style={styles.card}>
        <Text style={styles.title}>Configure Zishes</Text>
        <Text style={styles.desc}>
          Set the number of gameplays, your price, and listing duration to define your zishes mechanics
        </Text>

        <FieldLabel>Expected Selling Price <Text style={{ color: '#ff8181' }}>*</Text></FieldLabel>
        <Input
          placeholder="25000  INR"
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
            placeholder="10"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={form.pricePerPlay}
            onChangeText={(t) => set('pricePerPlay', t)}
            style={[styles.input, { flex: 1 }]}
          />
        </View>
        <FieldHint>Cost for a single gameplay</FieldHint>

        <FieldLabel>Number of Game plays</FieldLabel>
        <Input
          placeholder="2500"
          keyboardType="numeric"
          value={form.playsCount}
          onChangeText={(t) => set('playsCount', t)}
        />
        <FieldHint>Define the total available play-to-win entries.</FieldHint>

        <FieldLabel>Listing End Date <Text style={{ color: '#ff8181' }}>*</Text></FieldLabel>
        <Select value={form.endDate} placeholder="Select a date" onPress={() => setShowDate(true)} />
        <FieldHint>Select the final date for your listing to be active.</FieldHint>

        <FieldLabel>Game Option <Text style={{ color: '#ff8181' }}>*</Text></FieldLabel>
        <Select value={form.game} placeholder="Word Map, Colour Jumble etc." onPress={() => setShowGame(true)} />
        <FieldHint>Select the final date for your listing to be active.</FieldHint>
      </View>

      {/* Early Termination Option */}
      <EarlyTermination
        expectedPrice={parseFloat(form.expectedPrice) || 0}
        playsTotal={parseInt(form.playsCount || '1200', 10) || 1200}
      />

      {/* Payout Details */}
      <PayoutDetails expectedPrice={parseFloat(form.expectedPrice) || 0} />

      <PickerModal
        visible={showGame}
        title="Select Game"
        options={gameOptions}
        onClose={() => setShowGame(false)}
        onSelect={(v) => { set('game', v); setShowGame(false); }}
      />
      <DatePickerModal
        visible={showDate}
        value={form.endDate ? new Date(form.endDate) : new Date()}
        onClose={() => setShowDate(false)}
        onConfirm={(d) => { set('endDate', formatDateYYYYMMDD(d)); setShowDate(false); }}
      />
    </KeyboardAwareScrollView>
  );
}

function FieldLabel({ children }) { return <Text style={styles.label}>{children}</Text>; }
function FieldHint({ children }) { return <Text style={styles.hint}>{children}</Text>; }
function Input(props) { return <TextInput {...props} placeholderTextColor={colors.textSecondary} style={styles.input} />; }

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
          {options.map((opt) => (
            <TouchableOpacity key={opt} style={styles.optionRow} onPress={() => onSelect(opt)}>
              <Text style={styles.optionTxt}>{opt}</Text>
            </TouchableOpacity>
          ))}
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

  subTitle: { color: colors.white, fontSize: 20, fontWeight: '800' },
  pillRow: { flexDirection: 'row', marginBottom: 8 },
  pill: { alignSelf: 'flex-start', backgroundColor: '#1E2128', borderWidth: 1, borderColor: '#3A4051', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },
  pillTxt: { color: colors.white, fontWeight: '800' },
  pctRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  pctBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  pctTxt: { color: colors.textSecondary, fontWeight: '700' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: colors.primary, backgroundColor: 'transparent' },
  checkboxOn: { backgroundColor: colors.primary },
  rowTitle: { color: colors.white, fontWeight: '800' },
});

function EarlyTermination({ expectedPrice, playsTotal }) {
  const thresholds = [0.75, 0.8, 0.9, 1.0];
  const [idx, setIdx] = useState(1); // default 80%
  const [enabled, setEnabled] = useState(true);
  const [ack, setAck] = useState(false);
  const [platinumOnly, setPlatinum] = useState(false);

  const pct = thresholds[idx];
  const earlyPrice = Math.round((expectedPrice || 0) * pct);
  const entriesNeeded = Math.ceil(playsTotal * pct);

  const fmt = (n) => (isNaN(n) ? '0' : n.toLocaleString('en-IN'));

  return (
    <View style={[styles.card, { marginTop: 14 }]}> 
      <Text style={styles.subTitle}>Early Termination Option</Text>

      <Text style={[styles.label, { marginTop: 12 }]}>End Early Option <Text style={{ color: '#ff8181' }}>*</Text></Text>
      <View style={styles.pillRow}>
        <View style={styles.pill}><Text style={styles.pillTxt}>{fmt(earlyPrice)} INR</Text></View>
      </View>

      <ProgressBar value={pct} height={10} />
      <View style={styles.pctRow}>
        {thresholds.map((t, i) => (
          <TouchableOpacity key={t} style={styles.pctBtn} onPress={() => setIdx(i)}>
            <Text style={[styles.pctTxt, i === idx && { color: colors.primary, fontWeight: '800' }]}>{Math.round(t * 100)}%</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.hint}>You can close this tournament once at least <Text style={{ color: colors.primary, fontWeight: '800' }}>{Math.round(pct * 100)}%</Text> of entries are filled.</Text>
      <Text style={styles.hint}>Current entries: 0 / {playsTotal} → Early termination available after <Text style={{ color: colors.accent, fontWeight: '800' }}>{entriesNeeded}</Text> entries.</Text>
      <Text style={styles.hint}>Closing early declares a winner immediately and no further entries are accepted.</Text>

      <TouchableOpacity style={styles.checkRow} onPress={() => setEnabled((v) => !v)}>
        <View style={[styles.checkbox, enabled && styles.checkboxOn]} />
        <Text style={styles.checkTxt}>Enable early termination option for this tournament</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.checkRow, { marginTop: 10 }]} onPress={() => setAck((v) => !v)}>
        <View style={[styles.checkbox, ack && styles.checkboxOn]} />
        <Text style={styles.hint}>I acknowledge that i will be allowed to extend the listing only <Text style={{ color: '#ff4d4d', fontWeight: '800' }}>TWICE</Text> in case above gameplays are not achieved.</Text>
      </TouchableOpacity>

      <View style={[styles.card, { marginTop: 16 }]}> 
        <TouchableOpacity style={styles.checkRow} onPress={() => setPlatinum((v) => !v)}>
          <View style={[styles.checkbox, platinumOnly && styles.checkboxOn]} />
          <Text style={[styles.label, { marginTop: 0 }]}>Make this a <Text style={{ fontWeight: '900' }}>Platinum</Text> Membership Listing ONLY</Text>
        </TouchableOpacity>
        <Text style={[styles.hint, { marginLeft: 36 }]}>( Only Platinum members will be allowed to participate )</Text>
      </View>
    </View>
  );
}

function PayoutDetails({ expectedPrice }) {
  const revenue = expectedPrice || 0;
  const platformFee = Math.round(revenue * 0.15);
  const gstOnFee = Math.round(platformFee * 0.18);
  const tcs = Math.round(revenue * 0.01);
  const finalPayout = revenue - platformFee - gstOnFee - tcs;
  const fmt = (n) => (isNaN(n) ? '0' : n.toLocaleString('en-IN'));

  return (
    <View style={[styles.card, { marginTop: 16 }]}> 
      <Text style={styles.subTitle}>Payout Details <Text style={{ color: colors.textSecondary }}>( on Estimated Selling Price )</Text></Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
        <Text style={styles.rowTitle}>Total Estimated Revenue</Text>
        <Text style={styles.rowTitle}>{fmt(revenue)} INR</Text>
      </View>

      <View style={{ marginTop: 10 }}>
        <Row label="Platform Fee (15%)" value={`- ${fmt(platformFee)} INR`} />
        <Row label="GST/Govt. Tax (18% of fee)" value={`- ${fmt(gstOnFee)} INR`} />
        <Row label="TCS (1% of Prize Value)" value={`- ${fmt(tcs)} INR`} />
      </View>

      <View style={{ height: 1, backgroundColor: '#3A4051', marginVertical: 12 }} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#5ee787', fontWeight: '900', fontSize: 18 }}>Your Final Payout</Text>
        <Text style={{ color: '#27c07d', fontWeight: '900', fontSize: 22 }}>{fmt(finalPayout)} INR</Text>
      </View>
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
