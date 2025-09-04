import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../../../theme/colors';
import { Store, Truck, TruckIcon, Mail, Check } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { updateDelivery } from '../../../store/listingDraft/listingDraftSlice';

export default function DeliveryStep() {
  const dispatch = useDispatch();
  const { method, pickupNote } = useSelector((s) => s.listingDraft.delivery);
  const setMethod = (v) => dispatch(updateDelivery({ method: v }));
  const setPickupNote = (v) => dispatch(updateDelivery({ pickupNote: v }));

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
      <Text style={styles.title}>Choose Delivery Method</Text>
      <Text style={styles.subtitle}>Select how you'd like to deliver your item to the buyer.</Text>

      <OptionCard
        icon={<Store size={22} color={colors.white} />}
        title="Local Pickup"
        desc="Winner collects item directly from your specified location at an agreed time."
        selected={method === 'pickup'}
        onPress={() => setMethod('pickup')}
      >
        <Text style={styles.fieldLabel}>Pickup Instructions</Text>
        <TextInput
          placeholder="e.g., 'Available after 5 PM, call before'"
          placeholderTextColor={colors.textSecondary}
          value={pickupNote}
          onChangeText={setPickupNote}
          style={styles.input}
        />
      </OptionCard>

      <OptionCard
        icon={<Truck size={22} color={colors.white} />}
        title="Courier Delivery ( Domestic )"
        desc="Item is shipped via a trusted third-party courier service to the Winners address."
        selected={method === 'domestic'}
        onPress={() => setMethod('domestic')}
      />

      <OptionCard
        icon={<TruckIcon size={22} color={colors.white} />}
        title="Courier Delivery ( International )"
        desc="Item is shipped via a trusted third-party courier service to the Winners address."
        selected={method === 'intl'}
        onPress={() => setMethod('intl')}
        badge="Coming Soon"
        disabled
      />

      <OptionCard
        icon={<Mail size={22} color={colors.white} />}
        title="Digital Delivery"
        desc="Item is delivered electronically, suitable for digital goods like e-books, software, or links."
        selected={method === 'digital'}
        onPress={() => setMethod('digital')}
      />
    </ScrollView>
  );
}

function OptionCard({ icon, title, desc, selected, onPress, children, badge, disabled }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} disabled={disabled} style={[styles.card, selected && styles.cardActive, disabled && { opacity: 0.6 }]}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>{icon}</View>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={{ flex: 1 }} />
        {selected ? (
          <View style={styles.checkWrap}><Check size={16} color={colors.white} /></View>
        ) : null}
        {badge ? <View style={styles.badge}><Text style={styles.badgeTxt}>{badge}</Text></View> : null}
      </View>
      <Text style={styles.cardDesc}>{desc}</Text>
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.white, fontWeight: '800', fontSize: 24 },
  subtitle: { color: colors.textSecondary, marginTop: 8, marginBottom: 14 },

  card: { backgroundColor: '#2B2F39', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#343B49', marginBottom: 14 },
  cardActive: { borderColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#3A2B52', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  cardTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  cardDesc: { color: colors.textSecondary, marginTop: 8 },
  fieldLabel: { color: colors.white, fontWeight: '700', marginTop: 14, marginBottom: 8 },
  input: { backgroundColor: '#1E2128', borderWidth: 1, borderColor: '#3A4051', color: colors.white, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12 },
  badge: { backgroundColor: '#FFF2D6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, position: 'absolute', right: 8, top: -10 },
  badgeTxt: { color: '#5C4100', fontWeight: '800', fontSize: 12 },
});
