import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { Bell } from 'lucide-react-native';
import ProgressBar from '../../components/common/ProgressBar';
import Button from '../../components/ui/Button';

import PhotosStep from './steps/PhotosStep';
import DetailsStep from './steps/DetailsStep';
import PlayToWinStep from './steps/PlayToWinStep';
import DeliveryStep from './steps/DeliveryStep';
import PoliciesStep from './steps/PoliciesStep';
import ReviewStep from './steps/ReviewStep';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

export default function SellScreen({ navigation }) {
  const steps = useMemo(
    () => [
      { key: 'photos', title: 'Photos' },
      { key: 'details', title: 'Details' },
      { key: 'play', title: 'Play-to-Win' },
      { key: 'delivery', title: 'Delivery' },
      { key: 'policies', title: 'Policies' },
      { key: 'review', title: 'Review & Publish' },
    ],
    []
  );

  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const routes = steps;
  const progress = (index + 1) / steps.length;

  const goNext = () => { if (index < routes.length - 1) setIndex(index + 1); };
  const goTo = (key) => {
    const i = routes.findIndex((r) => r.key === key);
    if (i >= 0) setIndex(i);
  };

  const activeKey = routes[index]?.key;
  const title = activeKey === 'details' ? 'Sell Item - Step 2: Details' : 'Create Listing';
  const isReview = activeKey === 'review';

  const onPrimary = () => {
    if (isReview) {
      // TODO: trigger publish action
      console.log('Publish Listing');
    } else {
      goNext();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home', { screen: 'Notifications' })}>
          <Bell size={18} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Tabs using react-native-tab-view */}
      <TabView
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        initialLayout={{ width }}
        renderScene={SceneMap({
          photos: () => <View style={{ flex: 1 }}><PhotosStep /></View>,
          details: () => <View style={{ flex: 1 }}><DetailsStep /></View>,
          play: () => <View style={{ flex: 1 }}><PlayToWinStep /></View>,
          delivery: () => <View style={{ flex: 1 }}><DeliveryStep /></View>,
          policies: () => <View style={{ flex: 1 }}><PoliciesStep /></View>,
          review: () => <View style={{ flex: 1 }}><ReviewStep onEdit={goTo} /></View>,
        })}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            scrollEnabled
            style={{ backgroundColor: 'transparent' }}
            contentContainerStyle={styles.tabsRow}
            // No active bottom border/indicator as requested
            indicatorStyle={{ backgroundColor: 'transparent', height: 0 }}
            tabStyle={{ width: 'auto' }}
            renderLabel={({ route, focused }) => (
              <Text style={[styles.tabTxt, focused && styles.tabTxtActive]}>{route.title}</Text>
            )}
          />
        )}
      />

      {/* Progress under tabs */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <ProgressBar value={progress} height={8} />
      </View>

      {/* Bottom actions mimic screenshot */}
      <View style={styles.bottomBar}>
        <Button title="Save Draft" variant="outline" onPress={() => {}} style={{ marginRight: 10 }} />
        <Button title={isReview ? "Let's Zish It !!" : 'Next'} onPress={onPrimary} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { height: 56, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 18 },
  tabsRow: { paddingHorizontal: 12, paddingVertical: 6, gap: 12, alignItems: 'center' },
  tabItem: { paddingVertical: 6, paddingHorizontal: 6 },
  tabTxt: { color: colors.textSecondary, fontWeight: '700', fontSize: 14 },
  tabTxtActive: { color: colors.primary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#22252C' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, gap: 12, backgroundColor: colors.black, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#22252C', flexDirection: 'row' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderTxt: { color: colors.textSecondary },
});


