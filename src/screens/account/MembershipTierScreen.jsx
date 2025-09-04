import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { ChevronLeft, CheckCircle2, Sparkles, Crown } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import Button from '../../components/ui/Button';
import CongratsModal from '../../components/modals/CongratsModal';

export default function MembershipTierScreen({ navigation }) {
  const [congratsOpen, setCongratsOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const subscribe = (tier) => {
    setSelectedTier(tier);
    setCongratsOpen(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={20} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Membership Tier</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Silver */}
        <View style={styles.cardDark}>
          <Text style={[styles.tierTitle, { color: '#C0C4CF' }]}>Silver</Text>
          <Text style={styles.price}>₹499/mo</Text>
          <Text style={styles.credits}>500 ZC credits</Text>
          <Feature text="Basic access to marketplace" />
          <Feature text="Standard badges" />
          <Button title="Subscribe Now" onPress={() => subscribe('silver')} style={{ marginTop: 14 }} />
        </View>

        {/* Gold (Best Value) */}
        <View style={styles.cardGoldOuter}>
          <LinearGradient
            colors={[colors.primary, '#3D2B85']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.cardGold]}
          >
            <View style={styles.goldBadge}><Text style={styles.goldBadgeTxt}>BEST VALUE</Text></View>

            <View style={styles.goldHeader}>
              <View style={styles.crownWrap}><Crown size={18} color="#FFD966" /></View>
              <Text style={styles.goldTitle}>Gold</Text>
            </View>

            <Text style={styles.goldPrice}>₹999/mo</Text>
            <Text style={styles.goldCredits}>1000 ZC credits</Text>

            <Feature text="All Access to Marketplace" light />
            <Feature text="Priority badges" light />
            <Feature text="Voting rights" light />

            <Button title="Subscribe Now" onPress={() => subscribe('gold')} style={styles.goldBtn} />
          </LinearGradient>
        </View>

        {/* Platinum */}
        <View style={[styles.cardDark, { marginTop: 16 }]}> 
          <Text style={[styles.tierTitle, { color: colors.accent }]}>Platinum</Text>
          <Text style={styles.price}>₹1999/mo</Text>
          <Text style={styles.credits}>2000 ZC credits</Text>
          <Feature text="Exclusive access to  Platinum Listing" />
          <Feature text="Early access to new features" />
          <Feature text="Elite badges" />
          <Feature text="VIP support" />
          <Feature text="Proposal rights" />
          <Feature text="Surprise perks" icon={<Sparkles size={16} color={colors.white} />} />
          <Button title="Subscribe Now" onPress={() => subscribe('platinum')} style={{ marginTop: 14 }} />
        </View>

        <Text style={styles.note}>Membership automatically renews. Benefits and terms are subject to change.</Text>
      </ScrollView>
      <CongratsModal
        visible={congratsOpen}
        title="Membership Activated"
        message={selectedTier ? `Your ${selectedTier.toUpperCase()} membership is live. Enjoy the perks!` : 'Your membership is live. Enjoy the perks!'}
        primaryText="Awesome!"
        onPrimary={() => { setCongratsOpen(false); navigation.goBack(); }}
        onRequestClose={() => setCongratsOpen(false)}
      />
    </SafeAreaView>
  );
}

function Feature({ text, icon, light }) {
  return (
    <View style={styles.featureRow}>
      {icon || <CheckCircle2 size={16} color={light ? '#EAEFFF' : colors.white} />}
      <Text style={[styles.featureTxt, light && { color: '#EAEFFF' }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#343B49' },

  card: { borderRadius: 18, padding: 16, overflow: 'visible' },
  cardDark: { backgroundColor: '#2B2F39', borderRadius: 18, borderWidth: 1, borderColor: '#343B49', padding: 16 },
  tierTitle: { fontSize: 24, fontWeight: '900', color: colors.white, textAlign: 'center', marginBottom: 4 },
  price: { color: colors.white, fontWeight: '900', fontSize: 28, textAlign: 'center' },
  credits: { color: colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  featureTxt: { color: colors.white, fontWeight: '600' },
  badge: { position: 'absolute', top: -12, alignSelf: 'center', backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, overflow: 'hidden' },
  badgeTxt: { color: colors.white, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  note: { color: colors.textSecondary, textAlign: 'center', marginTop: 16 },

  // Gold styles
  cardGoldOuter: {
    marginTop: 16,
    borderRadius: 22,
    padding: 2,
    backgroundColor: 'rgba(255,217,102,0.25)',
    shadowColor: '#FFD966',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    overflow: 'hidden',
  },
  cardGold: {
    borderRadius: 20,
    padding: 16,
    paddingTop: 28, // make room for badge inside the radius
    borderWidth: 1,
    borderColor: 'rgba(255,217,102,0.45)',
    overflow: 'hidden',
    marginBottom:4

  },
  goldBadge: {
    position: 'absolute',
    top: 8, // place inside clipped corners
    alignSelf: 'center',
    backgroundColor: '#FFD966',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    zIndex: 2,
  },
  goldBadgeTxt: { color: '#1B1B1B', fontWeight: '900', fontSize: 12, letterSpacing: 0.8 },
  goldHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  crownWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,217,102,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,217,102,0.35)' },
  goldTitle: { color: '#FFE9A6', fontWeight: '900', fontSize: 24 },
  goldPrice: { color: '#FFFFFF', fontWeight: '900', fontSize: 28, textAlign: 'center', marginTop: 6 },
  goldCredits: { color: '#EAEFFF', textAlign: 'center', marginTop: 4, marginBottom: 12 },
  goldBtn: { marginTop: 16, backgroundColor: '#6E36D9' },
});
