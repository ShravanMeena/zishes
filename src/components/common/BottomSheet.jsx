import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, View, StyleSheet, Animated, TouchableWithoutFeedback, Dimensions, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

export default function BottomSheet({ visible, onClose, children, height, full = true, noPadding = false, showClose = false, maxRatio = 0.96 }) {
  const insets = useSafeAreaInsets();
  const screenH = Dimensions.get('window').height;
  const [contentH, setContentH] = useState(0);

  const maxAllowed = screenH - insets.top - 8;
  const computedH = useMemo(() => {
    if (height) return Math.min(height, maxAllowed);
    if (full) return Math.min(maxAllowed, Math.round(screenH * maxRatio));
    const desired = Math.max(220, contentH || Math.round(screenH * 0.45));
    return Math.min(desired, maxAllowed);
  }, [height, full, contentH, maxAllowed, screenH]);

  const translateY = useRef(new Animated.Value(computedH)).current;

  useEffect(() => {
    if (!visible) translateY.setValue(computedH);
  }, [computedH, visible, translateY]);

  useEffect(() => {
    Animated.timing(translateY, { toValue: visible ? 0 : computedH, duration: 220, useNativeDriver: true }).start();
  }, [visible, computedH, translateY]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: 'height', default: undefined })}>
        <Animated.View style={[
          styles.sheet,
          noPadding ? { paddingLeft: 0, paddingRight: 0, paddingTop: 0 } : null,
          // add extra bottom breathing room for compact sheets
          { paddingBottom: (noPadding ? 0 : (full ? 12 : 36)) + insets.bottom },
          { height: computedH, transform: [{ translateY }] }
        ]}>
          <View style={{ flex: 1 }} onLayout={(e) => setContentH(e.nativeEvent.layout.height)}>
            {children}
          </View>
          {showClose ? (
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
              <X color="#fff" size={20} />
            </TouchableOpacity>
          ) : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1F232C',
    borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, borderTopWidth: 1, borderColor: '#2E3440'
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
