import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

export default function VerifyScreen({ navigation }) {
  const proceed = () => navigation.navigate('CountrySelect');
  const skip = () => navigation.navigate('CountrySelect');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      <View style={styles.header}><Text style={styles.headerTitle}>ID Verification</Text></View>
      <View style={{ padding: 20 }}>
        <Image source={{ uri: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80&auto=format&fit=crop' }} style={styles.hero} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Verify Your Identity</Text>
          <Text style={styles.cardText}>
            To ensure the security of your account and comply with regulations, we need to verify your government-issued ID. This process is quick and secure.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={proceed}>
            <Text style={styles.primaryText}>Proceed with Verification</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={skip}>
            <Text style={styles.secondaryText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, alignItems: 'center', justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  hero: { width: '100%', height: 180, borderRadius: 16, backgroundColor: '#222', marginBottom: 16 },
  card: { backgroundColor: '#2B2F39', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#343B49' },
  cardTitle: { color: colors.white, fontWeight: '800', fontSize: 18, marginBottom: 10 },
  cardText: { color: colors.textSecondary, marginBottom: 16 },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: colors.white, fontWeight: '700' },
  secondaryBtn: { borderColor: '#3A4051', borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  secondaryText: { color: colors.white, fontWeight: '700' },
});
