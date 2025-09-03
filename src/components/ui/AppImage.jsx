import React, { useState } from 'react';
import { Image, View, StyleSheet } from 'react-native';

export default function AppImage({ uri, style, resizeMode = 'cover', borderRadius = 12, placeholderColor = '#222' }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <View style={[{ backgroundColor: placeholderColor, borderRadius, overflow: 'hidden' }, style]}>
      <Image source={{ uri }} onLoadEnd={() => setLoaded(true)} resizeMode={resizeMode} style={StyleSheet.absoluteFill} />
      {!loaded ? <View style={StyleSheet.absoluteFillObject} /> : null}
    </View>
  );
}

