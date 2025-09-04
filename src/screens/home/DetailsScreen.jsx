import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, FlatList, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useDispatch, useSelector } from 'react-redux';
import { addFavorite, removeFavorite } from '../../store/favorites/favoritesSlice';
import { colors } from '../../theme/colors';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/common/ProgressBar';
import ShareSheet from '../../components/common/ShareSheet';
import RulesModal from '../../components/modals/RulesModal';
import { ChevronLeft, Bell, Star, Share2 } from 'lucide-react-native';
import DescriptionTab from './details/DescriptionTab';
import ProductDetailsTab from './details/ProductDetailsTab';
import SellerReviewTab from './details/SellerReviewTab';
import RulesTab from './details/RulesTab';
import LeaderboardTab from './details/LeaderboardTab';

export default function DetailsScreen({ route, navigation }) {
  const { item } = route.params;
  const dispatch = useDispatch();
  const favItems = useSelector((s) => s.favorites.items);
  const isFav = !!favItems.find((it) => it.id === item.id);
  const toggleFav = () => {
    if (isFav) dispatch(removeFavorite(item.id));
    else dispatch(addFavorite(item));
  };
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'desc', title: 'Description' },
    { key: 'details', title: 'Product Details' },
    { key: 'reviews', title: 'Seller Review' },
    { key: 'rules', title: 'Rules' },
    { key: 'leader', title: 'Leader Board' },
  ]);
  const [shareOpen, setShareOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const { width, height: screenH } = useWindowDimensions();
  const [slide, setSlide] = useState(0);
  const sliderRef = useRef(null);

  const images = useMemo(() => item.images && item.images.length ? item.images : [item.image, item.image, item.image], [item]);
  const progress = item.playsTotal ? Math.min(1, item.playsCompleted / item.playsTotal) : 0;

  const playNow = () => setRulesOpen(true);
  const confirmPlay = () => {
    setRulesOpen(false);
    navigation.navigate('UnityGame', { scene: item.scene || 'Game1' });
  };

  const renderScene = SceneMap({
    desc: () => <View style={styles.panel}><DescriptionTab item={item} /></View>,
    details: () => <View style={styles.panel}><ProductDetailsTab item={item} /></View>,
    reviews: () => <View style={styles.panel}><SellerReviewTab item={item} /></View>,
    rules: () => <View style={styles.panel}><RulesTab item={item} /></View>,
    leader: () => <View style={styles.panel}><LeaderboardTab item={item} /></View>,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <ChevronLeft size={22} color={colors.accent} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{item.title}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.headerBtn}>
          <Bell size={20} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Slider */}
        <FlatList
          ref={sliderRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(uri, i) => `${i}`}
          renderItem={({ item: uri }) => (
            <View style={{ width }}>
              <Image source={{ uri }} style={styles.hero} />
              <TouchableOpacity style={[styles.circle, styles.leftCircle]} onPress={toggleFav}>
                <Star color={colors.white} {...(isFav ? { fill: colors.accent } : {})} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.circle, styles.rightCircle]} onPress={() => setShareOpen(true)}>
                <Share2 color={colors.white} />
              </TouchableOpacity>
            </View>
          )}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setSlide(idx);
          }}
        />
        <View style={styles.dotsWrap}>
          {images.map((_, i) => (
            <View key={i} style={[styles.dot, i === slide && styles.dotActive]} />
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Price:</Text>
            <Text style={styles.priceValue}>₹4,000</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.feeLabel}>Per Play Fee:</Text>
            <Text style={styles.feeValue}> {item.coinPerPlay} ZC</Text>
          </View>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.statusTitle}>Game Play Status</Text>
            <Text style={styles.statusPct}>{Math.round(progress * 100)}% Complete</Text>
          </View>
          <ProgressBar value={progress} />
          <Text style={styles.endsIn}>Ends in: 01d 30h 45m</Text>
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 12, marginBottom: 12 }}>
          <Button title="Play Now" onPress={playNow} />
        </View>

        {/* Tabs */}
        <View style={{ flex: 1 }}>
          <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            initialLayout={{ width }}
            style={{ height: Math.max(420, Math.round(screenH * 0.55)) }}
            renderTabBar={(props) => (
              <TabBar
                {...props}
                scrollEnabled
                style={{ backgroundColor: 'transparent' }}
                contentContainerStyle={styles.tabsRow}
                indicatorStyle={{ backgroundColor: colors.accent, height: 3, borderRadius: 2 }}
                tabStyle={{ width: 'auto' }}
                renderLabel={({ route, focused }) => (
                  <Text style={[styles.tab, focused && styles.tabActive]}>{route.title}</Text>
                )}
              />
            )}
          />
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <Button variant="outline" title="Share" onPress={() => setShareOpen(true)} style={{ marginTop: 12 }} />
        </View>
      </ScrollView>

      <ShareSheet visible={shareOpen} onClose={() => setShareOpen(false)} url={`https://example.com/item/${item.id}`} />
      <RulesModal visible={rulesOpen} onCancel={() => setRulesOpen(false)} onConfirm={confirmPlay} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#22252C' },
  headerBtn: { padding: 8 },
  headerTitle: { color: colors.white, fontWeight: '700', fontSize: 18, maxWidth: '70%' },
  hero: { width: '100%', height: 220, backgroundColor: '#222' },
  circle: { position: 'absolute', top: 14, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  leftCircle: { left: 12 },
  rightCircle: { right: 12 },
  dotsWrap: { flexDirection: 'row', alignSelf: 'center', marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4E4E56', marginHorizontal: 3 },
  dotActive: { backgroundColor: colors.accent },
  card: { backgroundColor: '#2B2F39', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: '#343B49' },
  title: { color: colors.white, fontWeight: '800', fontSize: 20 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  priceLabel: { color: colors.white, fontWeight: '600' },
  priceValue: { color: colors.accent, fontWeight: '800', marginLeft: 6, fontSize: 18 },
  feeLabel: { color: colors.white, fontWeight: '600' },
  feeValue: { color: '#27c07d', fontWeight: '800' },
  statusCard: { backgroundColor: '#2B2F39', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: '#343B49' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusTitle: { color: colors.white, fontWeight: '700' },
  statusPct: { color: colors.white, fontWeight: '700' },
  endsIn: { color: colors.white, marginTop: 10 },
  tabsRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  tab: { color: colors.white, backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#3A4051', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 10, textAlign: 'center' },
  tabActive: { backgroundColor: '#3A2B52', borderColor: colors.accent },
  panel: { backgroundColor: '#2B2F39', borderWidth: 1, borderColor: '#343B49', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 10 },
});
