import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../../../theme/colors';
import { Pencil, Camera, Gamepad2, Truck, FileText } from 'lucide-react-native';
import { useSelector } from 'react-redux';

export default function ReviewStep({ onEdit }) {
  const photos = useSelector((s) => s.listingDraft.photos);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 160 }}>
      <Section
        icon={<Camera size={18} color={colors.white} />}
        title="Photos"
        onEdit={() => onEdit?.('photos')}
      >
        {Array.isArray(photos) && photos.length > 0 ? (
          <View style={styles.photosRow}>
            {photos.map((p, i) => (
              <View key={`${p.uri}-${i}`} style={styles.photoWrap}>
                {i === 0 && (
                  <View style={styles.coverBadge}><Text style={styles.coverTxt}>Cover</Text></View>
                )}
                <Image source={{ uri: p.uri }} style={styles.photo} />
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
        <Row label="Item Name" value="Vintage Polaroid SX-70 Camera" />
        <Row label="Description" value="A beautifully preserved classic instant camera, fully functional with minor signs of wear. Comes with original leather case." />
        <Row label="Category" value="Vintage Electronics" />
        <Row label="Quantity" value="1" last />
      </Section>

      <Section
        icon={<Gamepad2 size={18} color={colors.white} />}
        title="Play-to-Win"
        onEdit={() => onEdit?.('play')}
      >
        <Row label="Total Entries" value="100" />
        <Row label="Price Per Entry" value="5 Zishes Tokens" />
        <Row label="Total Price" value="500 Zishes Tokens" last />
      </Section>

      <Section
        icon={<Truck size={18} color={colors.white} />}
        title="Delivery Options"
        onEdit={() => onEdit?.('delivery')}
      >
        <Row label="Delivery Mode" value="Courier Delivery" />
        <Row label="Delivery Address ( only if Local Pickup Selected )" value="123 Vintage Lane, Retro City, RC 90210" last />
      </Section>

      <Section
        icon={<FileText size={18} color={colors.white} />}
        title="Policies & KYC"
        onEdit={() => onEdit?.('policies')}
      >
        <PillRow label="Marketplace Policies" value="Accepted" />
        <PillRow label="KYC Documents" value="Completed" />
        <PillRow label="Terms & Conditions" value="Agreed" />
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

function Row({ label, value, last }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}> 
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function PillRow({ label, value }) {
  return (
    <View style={[styles.row, styles.rowBorder]}> 
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.pill}><Text style={styles.pillTxt}>{value}</Text></View>
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

  photosRow: { flexDirection: 'row', gap: 10 },
  photoWrap: { flex: 1, aspectRatio: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: '#1E2128' },
  photo: { width: '100%', height: '100%' },
  coverBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#8B5CF6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, zIndex: 1 },
  coverTxt: { color: colors.white, fontWeight: '800', fontSize: 12 },

  pill: { backgroundColor: '#3A2B52', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  pillTxt: { color: colors.white, fontWeight: '800' },
});
