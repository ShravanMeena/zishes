import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, Image, useWindowDimensions } from 'react-native';
import BottomSheet from './BottomSheet';
import { colors } from '../../theme/colors';

export default function ImageViewerSheet({ visible, onClose, images = [], initialIndex = 0 }) {
  const { width, height } = useWindowDimensions();
  const listRef = useRef(null);
  const [index, setIndex] = useState(initialIndex || 0);

  useEffect(() => {
    if (visible && listRef.current && initialIndex > 0) {
      try { listRef.current.scrollToIndex({ index: initialIndex, animated: false }); } catch {}
    }
  }, [visible, initialIndex]);

  return (
    <BottomSheet visible={visible} onClose={onClose} full height={Math.round(height * 0.96)} noPadding showClose>
      <FlatList
        ref={listRef}
        data={images}
        horizontal
        pagingEnabled
        keyExtractor={(uri, i) => `${i}`}
        renderItem={({ item: uri }) => (
          <View style={{ width }}>
            <Image source={{ uri }} style={[styles.image, { height: Math.round(height * 0.86) }]} resizeMode="contain" />
          </View>
        )}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(idx);
        }}
        showsHorizontalScrollIndicator={false}
      />
      <View style={styles.dotsWrap}>
        {images.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />)
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', backgroundColor: '#000' },
  dotsWrap: { position: 'absolute', bottom: 14, alignSelf: 'center', flexDirection: 'row' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4E4E56', marginHorizontal: 3 },
  dotActive: { backgroundColor: colors.accent },
});

