import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../../../theme/colors';
import { Pencil, Camera, Gamepad2, Truck, FileText } from 'lucide-react-native';
import { useSelector } from 'react-redux';

const DELIVERY_LABELS = {
  pickup: 'Local Pickup',
  domestic: 'Courier Delivery (Domestic)',
  intl: 'Courier Delivery (International)',
  digital: 'Digital Delivery',
};

const BOOL_STATUS = (flag) => (flag ? 'Accepted' : 'Pending');

function parseNumber(value) {
  if (value == null) return null;
  const cleaned = String(value).replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCoins(value) {
  const num = parseNumber(value);
  if (num == null) return '—';
  return `${num.toLocaleString()} Coins`;
}

function formatCurrency(value) {
  const num = parseNumber(value);
  if (num == null) return '—';
  return `₹ ${num.toLocaleString()}`;
}

function resolvePhotoUri(photo) {
  if (!photo) return null;
  if (typeof photo === 'string') return photo;
  return photo.uri || photo.path || null;
}

export default function ReviewStep({ onEdit }) {
  const photos = useSelector((s) => s.listingDraft.photos);
  const details = useSelector((s) => s.listingDraft.details);
  const play = useSelector((s) => s.listingDraft.play);
  const delivery = useSelector((s) => s.listingDraft.delivery);
  const policies = useSelector((s) => s.listingDraft.policies);

  const preparedPhotos = Array.isArray(photos)
    ? photos
        .map((p, index) => {
          const uri = resolvePhotoUri(p);
          if (!uri) return null;
          return { uri, key: `${uri}-${index}`, isCover: index === 0 };
        })
        .filter(Boolean)
    : [];

  const methodLabel = DELIVERY_LABELS[delivery?.method] || 'Not selected yet';
  const pickupNote = delivery?.method === 'pickup'
    ? (delivery?.pickupNote?.trim() || 'No pickup instructions provided.')
    : 'Not applicable';

  const expectedPrice = formatCurrency(play?.expectedPrice);
  const pricePerPlay = formatCoins(play?.pricePerPlay);
  const playsCountNumber = parseNumber(play?.playsCount);
  const playsCountLabel = playsCountNumber != null ? playsCountNumber.toLocaleString() : '—';
  const totalProjected = (() => {
    const price = parseNumber(play?.pricePerPlay);
    if (!price || !playsCountNumber) return null;
    return `${(price * playsCountNumber).toLocaleString()} Coins`;
  })();

  const endDateLabel = play?.endDate
    ? new Date(play.endDate).toLocaleDateString()
    : 'Not set yet';
  const gameName = play?.gameName || 'Not selected yet';
  const earlyTerminationEnabled = !!play?.earlyTerminationEnabled;
  const thresholdPctNumber = parseNumber(play?.earlyTerminationThresholdPct);
  const earlyTerminationStatus = earlyTerminationEnabled ? 'Enabled' : 'Disabled';
  const earlyTerminationThreshold = earlyTerminationEnabled && thresholdPctNumber != null
    ? `${Math.round(thresholdPctNumber)}%`
    : 'Not set';
  const accessLabel = play?.platinumOnly ? 'Platinum members only' : 'All members';

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 160 }}>
      <Section
        icon={<Camera size={18} color={colors.white} />}
        title="Photos"
        onEdit={() => onEdit?.('photos')}
      >
        {preparedPhotos.length > 0 ? (
          <View style={styles.photosRow}>
            {preparedPhotos.map((photo) => (
              <View key={photo.key} style={styles.photoWrap}>
                {photo.isCover && (
                  <View style={styles.coverBadge}><Text style={styles.coverTxt}>Cover</Text></View>
                )}
                <Image source={{ uri: photo.uri }} style={styles.photo} />
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ color: colors.textSecondary }}>No photos added yet.</Text>
        )}
      </Section>

      <Section
        icon={<FileText size={18} color={colors.white} />}
        title="Item Details"
        onEdit={() => onEdit?.('details')}
      >
        <Row label="Item Name" value={details?.name || 'Not provided yet'} />
        <Row label="Category" value={details?.category || 'Not selected yet'} />
        <Row label="Condition" value={details?.condition || 'Not specified'} />
        <Row label="Quantity" value={details?.qty || '—'} />
        <Row label="Description" value={details?.description || 'No description added yet.'} stacked last />
      </Section>

      <Section
        icon={<Gamepad2 size={18} color={colors.white} />}
        title="Play-to-Win"
        onEdit={() => onEdit?.('play')}
      >
        <Row label="Expected Price" value={expectedPrice} />
        <Row label="Price Per Entry" value={pricePerPlay} />
        <Row label="Total Entries" value={playsCountLabel} />
        <Row label="Projected Gross" value={totalProjected || '—'} />
        <Row label="Game" value={gameName} />
        <Row label="Listing End Date" value={endDateLabel} />
        <Row label="Early Termination" value={earlyTerminationStatus} />
        {earlyTerminationEnabled ? (
          <Row label="Termination Threshold" value={earlyTerminationThreshold} />
        ) : null}
        <Row label="Access" value={accessLabel} last />
      </Section>

      <Section
        icon={<Truck size={18} color={colors.white} />}
        title="Delivery Options"
        onEdit={() => onEdit?.('delivery')}
      >
        <Row label="Delivery Mode" value={methodLabel} />
        <Row label="Pickup Instructions" value={pickupNote} stacked last />
      </Section>

      <Section
        icon={<FileText size={18} color={colors.white} />}
        title="Policies & Consents"
        onEdit={() => onEdit?.('policies')}
      >
        <PillRow label="Marketplace Policies" value={BOOL_STATUS(policies?.listing)} accepted={!!policies?.listing} />
        <PillRow label="Dispute Resolution" value={BOOL_STATUS(policies?.dispute)} accepted={!!policies?.dispute} />
        <PillRow label="Anti-Fraud Policy" value={BOOL_STATUS(policies?.antifraud)} accepted={!!policies?.antifraud} />
        <PillRow label="Terms & Privacy" value={policies?.agreeAll ? 'Agreed' : 'Pending'} accepted={!!policies?.agreeAll} />
      </Section>

    </ScrollView>
  );
}

function Section({ icon, title, onEdit, children }) {
  return (
    <View style={styles.card}> 
      <View style={styles.cardHeader}>
        <View style={styles.icon}>{icon}</View>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onEdit} style={styles.editRow}>
          <Pencil size={14} color={colors.white} />
          <Text style={styles.editTxt}>Edit</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 1, backgroundColor: '#3A4051', marginVertical: 10 }} />
      {children}
    </View>
  );
}

function Row({ label, value, last, stacked }) {
  if (stacked) {
    return (
      <View style={[styles.rowStacked, !last && styles.rowBorder]}> 
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValueFull}>{value}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.row, !last && styles.rowBorder]}> 
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function PillRow({ label, value, accepted }) {
  return (
    <View style={[styles.row, styles.rowBorder]}> 
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={[styles.pill, accepted ? styles.pillOn : styles.pillOff]}>
        <Text style={styles.pillTxt}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#2B2F39', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#343B49', marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#3A2B52', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  cardTitle: { color: colors.white, fontWeight: '900', fontSize: 18 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editTxt: { color: colors.white, fontWeight: '700' },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#3A4051' },
  rowLabel: { color: colors.white, opacity: 0.85, maxWidth: '60%' },
  rowValue: { color: colors.white, fontWeight: '700', maxWidth: '40%', textAlign: 'right' },
  rowStacked: { paddingVertical: 12 },
  rowValueFull: { color: colors.white, fontWeight: '600', marginTop: 6 },

  photosRow: { flexDirection: 'row', gap: 10 },
  photoWrap: { flex: 1, aspectRatio: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: '#1E2128' },
  photo: { width: '100%', height: '100%' },
  coverBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#8B5CF6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, zIndex: 1 },
  coverTxt: { color: colors.white, fontWeight: '800', fontSize: 12 },

  pill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  pillOn: { backgroundColor: '#1F5F50' },
  pillOff: { backgroundColor: '#45324C' },
  pillTxt: { color: colors.white, fontWeight: '800' },
});
