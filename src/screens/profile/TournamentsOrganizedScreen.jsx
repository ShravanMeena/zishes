import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, Clock, UploadCloud, Gamepad2 } from 'lucide-react-native';
import ProgressBar from '../../components/common/ProgressBar';

export default function TournamentsOrganizedScreen({ navigation }) {
  const data = useMemo(() => ([
    { id: 't1', title: 'Vintage Leather Jacket', status: 'delivery_pending', time: 'Winner: @johndoe', done: 92, total: 100, image: 'https://images.unsplash.com/photo-1548883354-886cb1b43fb2?q=80&w=600&auto=format&fit=crop' },
    { id: 't2', title: 'Retro Camera', status: 'active', time: '2 days left', done: 45, total: 80, image: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?q=80&w=600&auto=format&fit=crop' },
    { id: 't3', title: 'Gaming Headset', status: 'completed', time: 'Winner: @ari', done: 100, total: 100, image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=600&auto=format&fit=crop' },
  ]), []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.thumb} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.badge, badgeStyle(item.status).wrap]}><Text style={[styles.badgeTxt, badgeStyle(item.status).txt]}>{badgeStyle(item.status).label}</Text></View>
          </View>
        </View>
        <Text style={styles.meta}>{item.time}</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <Gamepad2 size={14} color={colors.textSecondary} />
          <Text style={styles.meta}>{`  ${item.done}/${item.total} Gameplays`}</Text>
        </View>
        <ProgressBar value={Math.min(1, item.done / item.total)} />

        {item.status === 'delivery_pending' ? (
          <TouchableOpacity style={styles.proofBtn} onPress={() => navigation.navigate('UploadProof', { item })}>
            <UploadCloud size={16} color={colors.white} />
            <Text style={styles.proofTxt}>Upload Proof</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft color={colors.white} size={20} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Tournaments Organized</Text>
        <View style={{ width: 32 }} />
      </View>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function badgeStyle(status) {
  if (status === 'delivery_pending') return { label: 'Delivery', wrap: { backgroundColor: '#3B3F52' }, txt: { color: '#FFD166' } };
  if (status === 'completed') return { label: 'Completed', wrap: { backgroundColor: '#2E7D32' }, txt: { color: '#fff' } };
  return { label: 'Active', wrap: { backgroundColor: '#3B82F6' }, txt: { color: '#fff' } };
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },
  card: { flexDirection: 'row', backgroundColor: '#2B2F39', borderRadius: 18, borderWidth: 1, borderColor: '#343B49', padding: 12 },
  thumb: { width: 70, height: 70, borderRadius: 10, marginRight: 12, backgroundColor: '#222' },
  title: { color: colors.white, fontWeight: '800', fontSize: 16 },
  meta: { color: colors.textSecondary, marginVertical: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  badgeTxt: { fontWeight: '800' },
  proofBtn: { marginTop: 8, alignSelf: 'flex-start', flexDirection: 'row', gap: 8, backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  proofTxt: { color: colors.white, fontWeight: '800' },
});

