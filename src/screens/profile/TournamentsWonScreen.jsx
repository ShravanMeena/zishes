import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, Filter, CheckCircle2 } from 'lucide-react-native';

export default function TournamentsWonScreen({ navigation }) {
  const data = useMemo(() => ([
    {
      id: 'w1',
      title: 'Pro Gamer Headset',
      date: 'March 15, 2024',
      seller: 'GameHaven Studios',
      status: 'Pending',
      img: 'https://images.unsplash.com/photo-1516709331517-9e39be34efd4?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id: 'w2',
      title: 'Some Table',
      date: 'February 28, 2024',
      seller: 'ArtFlow Marketplace',
      status: 'Acknowledged',
      img: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop'
    },
  ]), []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.img }} style={styles.hero} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.meta}>Won on: {item.date}</Text>
      <Text style={styles.meta}>Seller: {item.seller}</Text>

      <View style={styles.rowBetween}>
        <Text style={styles.meta}>Payout To</Text>
        <View style={[styles.badge, item.status === 'Acknowledged' ? styles.badgeAck : styles.badgePending]}>
          {item.status === 'Acknowledged' ? <CheckCircle2 size={14} color={colors.white} /> : null}
          <Text style={styles.badgeText}>{' '}{item.status}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <Text style={styles.caption}>Please confirm you have received the item to release payment to the seller.</Text>
      <TouchableOpacity style={styles.primary}>
        <Text style={styles.primaryTxt}>Acknowledge Item Received</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft color={colors.white} size={20} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Tournaments Won</Text>
        <TouchableOpacity style={styles.iconBtn}><Filter color={colors.white} size={18} /></TouchableOpacity>
      </View>
      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },

  card: { backgroundColor: '#2B2F39', borderRadius: 18, borderWidth: 1, borderColor: '#343B49', padding: 12 },
  hero: { width: '100%', height: 150, borderRadius: 12, backgroundColor: '#222', marginBottom: 10 },
  title: { color: colors.white, fontWeight: '800', fontSize: 18 },
  meta: { color: colors.textSecondary, marginTop: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#3A4051', marginVertical: 10 },
  caption: { color: colors.textSecondary },
  primary: { backgroundColor: colors.primary, borderRadius: 16, alignItems: 'center', paddingVertical: 14, marginTop: 12 },
  primaryTxt: { color: colors.white, fontWeight: '800' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  badgePending: { backgroundColor: '#E2B93B' },
  badgeAck: { backgroundColor: '#6D5BD0' },
  badgeText: { color: colors.white, fontWeight: '700' },
});

