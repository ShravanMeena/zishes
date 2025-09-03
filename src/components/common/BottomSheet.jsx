import React, { useEffect, useMemo, useRef } from 'react';
import { Modal, View, StyleSheet, Animated, TouchableWithoutFeedback, Dimensions } from 'react-native';

export default function BottomSheet({ visible, onClose, children, height, full = true, noPadding = false }) {
  const screenH = Dimensions.get('window').height;
  const sheetH = useMemo(() => (height ? height : (full ? screenH : Math.round(screenH * 0.96))), [height, screenH, full]);
  const translateY = useRef(new Animated.Value(sheetH)).current;

  useEffect(() => {
    Animated.timing(translateY, { toValue: visible ? 0 : sheetH, duration: 200, useNativeDriver: true }).start();
  }, [visible, sheetH, translateY]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <Animated.View style={[styles.sheet, noPadding && { padding: 0 }, { height: sheetH, transform: [{ translateY }] }]}>
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1F232C',
    borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, borderTopWidth: 1, borderColor: '#2E3440'
  },
});
