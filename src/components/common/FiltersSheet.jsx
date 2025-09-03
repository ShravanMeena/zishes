import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';
import Button from '../ui/Button';
import { X } from 'lucide-react-native';
import Slider from '../ui/Slider';

export default function FiltersSheet({ onClose, onApply, onReset, categories=[], initialCategory }) {
  const [price, setPrice] = useState(500);
  const [plays, setPlays] = useState(150);
  const [progress, setProgress] = useState(35);
  const [timeLeft, setTimeLeft] = useState('today');
  const [condition, setCondition] = useState('new');
  const [cat, setCat] = useState(initialCategory || 'all');
  const [sliding, setSliding] = useState(false);

  const apply = () => onApply?.({ price, plays, progress, timeLeft, condition, category: cat });
  const reset = () => {
    setPrice(500); setPlays(150); setProgress(35); setTimeLeft('today'); setCondition('new'); setCat('all');
    onReset?.();
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Filters</Text>
        <Pressable onPress={onClose} style={{ padding: 6 }}><X size={20} color={colors.white} /></Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} scrollEnabled={!sliding}>
        <View style={styles.section}>
          <Text style={styles.title}>Per Game Play</Text>
          <Text style={styles.caption}>Adjust the range of Game Play</Text>
          <Text style={styles.valueTxt}>${price}</Text>
          <Slider
            minimumValue={10}
            maximumValue={1000}
            step={10}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={'#7d7d87'}
            thumbTintColor={'#ddd'}
            value={price}
            onValueChange={setPrice}
            onSlidingStart={() => setSliding(true)}
            onSlidingComplete={() => setSliding(false)}
            tapToSeek
            style={styles.slider}
          />
          <View style={styles.rowBetween}><Text style={styles.tick}>$10</Text><Text style={styles.tick}>$200</Text><Text style={styles.tick}>$500</Text><Text style={styles.tick}>$1000+</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>No. of Game Plays</Text>
          <Text style={styles.caption}>Filter by the number of entries in the item pool.</Text>
          <Text style={styles.valueTxt}>{plays}</Text>
          <Slider
            minimumValue={10}
            maximumValue={1000}
            step={10}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={'#7d7d87'}
            thumbTintColor={'#ddd'}
            value={plays}
            onValueChange={setPlays}
            onSlidingStart={() => setSliding(true)}
            onSlidingComplete={() => setSliding(false)}
            tapToSeek
            style={styles.slider}
          />
          <View style={styles.rowBetween}><Text style={styles.tick}>10</Text><Text style={styles.tick}>1000+</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.caption}>Show items based on how full their entry pools are.</Text>
          <Slider
            minimumValue={0}
            maximumValue={100}
            step={1}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={'#7d7d87'}
            thumbTintColor={'#ddd'}
            value={progress}
            onValueChange={setProgress}
            onSlidingStart={() => setSliding(true)}
            onSlidingComplete={() => setSliding(false)}
            tapToSeek
            style={styles.slider}
          />
          <View style={styles.rowBetween}><Text style={styles.tick}>10</Text><Text style={styles.tick}>20</Text><Text style={styles.tick}>50</Text><Text style={styles.tick}>100</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Time Left</Text>
          <Text style={styles.caption}>Filter items by their remaining availability.</Text>
          <View style={styles.row}>
            {['month','today','week'].map((t) => (
              <Pressable key={t} onPress={()=>setTimeLeft(t)} style={[styles.segment, timeLeft===t && styles.segmentActive]}>
                <Text style={[styles.segmentTxt, timeLeft===t && styles.segmentTxtActive]}>
                  {t==='month'?'This Month':t==='today'?'Today':'This Week'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Condition of Item</Text>
          <Text style={styles.caption}>Select the physical condition of the item.</Text>
          <View style={styles.row}>
            {['new','likenew','used'].map((t) => (
              <Pressable key={t} onPress={()=>setCondition(t)} style={[styles.segment, condition===t && styles.segmentActive]}>
                <Text style={[styles.segmentTxt, condition===t && styles.segmentTxtActive]}>
                  {t==='likenew'?'Like New':t.charAt(0).toUpperCase()+t.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Categories</Text>
          <Text style={styles.caption}>Browse items within specific product categories.</Text>
          <View style={styles.rowWrap}>
            {([{ id:'all', label:'All' }].concat(categories)).map((c)=> (
              <Pressable key={c.id} onPress={()=>setCat(c.id)} style={[styles.chip, cat===c.id && styles.chipActive]}>
                <Text style={[styles.chipTxt, cat===c.id && styles.chipTxtActive]}>{c.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Sort By</Text>
          <Text style={styles.caption}>Order the search results based on a specific criterion.</Text>
          <View style={styles.selectBox}><Text style={{ color: colors.white }}>Most Popular</Text></View>
        </View>
      </ScrollView>

      <View style={styles.footerBar}>
        <Button
          variant="outline"
          title="Reset Filters"
          onPress={reset}
          fullWidth={false}
          style={{ width: '48%' }}
        />
        <Button
          title="Apply Filters"
          onPress={apply}
          fullWidth={false}
          style={{ width: '48%' }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: colors.primary, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  headerTitle: { color: colors.white, fontWeight: '800', fontSize: 22 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 140, paddingTop: 8 },

  section: { paddingVertical: 12 },
  title: { color: colors.white, fontWeight: '700', fontSize: 16 },
  caption: { color: colors.textSecondary, marginTop: 4 },
  valueTxt: { color: colors.accent, fontWeight: '800', fontSize: 28, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  tick: { color: colors.textSecondary },

  segment: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#343B49', marginRight: 10 },
  segmentActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentTxt: { color: colors.white, fontWeight: '700' },
  segmentTxtActive: { color: colors.white },

  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: '#3A4051', backgroundColor: '#2B2F39', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#3A2B52', borderColor: colors.accent },
  chipTxt: { color: colors.white },
  chipTxtActive: { color: colors.white, fontWeight: '700' },

  selectBox: { height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#3A4051', backgroundColor: '#2B2F39', alignItems: 'center', justifyContent: 'center', marginTop: 10, paddingHorizontal: 12 },

  footerBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1F232C', borderTopWidth: 1, borderTopColor: '#2E3440', zIndex: 10, elevation: 10 },
  slider: { height: 44, marginTop: 10 },
});
