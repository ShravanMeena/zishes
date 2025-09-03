import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Pressable } from 'react-native';

function clamp(v, min, max) {
  'worklet';
  return Math.min(max, Math.max(min, v));
}

export default function Slider({
  minimumValue = 0,
  maximumValue = 1,
  step = 0,
  value = 0,
  onValueChange,
  onSlidingStart,
  onSlidingComplete,
  minimumTrackTintColor = '#3b82f6',
  maximumTrackTintColor = '#4b5563',
  thumbTintColor = '#e5e7eb',
  tapToSeek = true,
  style,
}) {
  const trackRef = useRef(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [internal, setInternal] = useState(value);

  useEffect(() => {
    if (!isSliding) setInternal(value);
  }, [value, isSliding]);

  const range = useMemo(() => maximumValue - minimumValue, [maximumValue, minimumValue]);
  const ratio = useMemo(() => (range > 0 ? (clamp(internal, minimumValue, maximumValue) - minimumValue) / range : 0), [internal, range, minimumValue, maximumValue]);

  const getValueForX = useCallback((x) => {
    if (trackWidth <= 0) return minimumValue;
    const r = clamp(x / trackWidth, 0, 1);
    let next = minimumValue + r * range;
    if (step && step > 0) {
      const steps = Math.round((next - minimumValue) / step);
      next = minimumValue + steps * step;
    }
    return clamp(next, minimumValue, maximumValue);
  }, [trackWidth, range, minimumValue, maximumValue, step]);

  const notifyChange = useCallback((v) => {
    onValueChange && onValueChange(v);
  }, [onValueChange]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsSliding(true);
        onSlidingStart && onSlidingStart();
        if (tapToSeek && trackRef.current) {
          trackRef.current.measure((fx, fy, w, h, px, py) => {
            const x = clamp(evt.nativeEvent.pageX - px, 0, w);
            const v = getValueForX(x);
            setInternal(v);
            notifyChange(v);
          });
        }
      },
      onPanResponderMove: (_, gestureState) => {
        if (!trackRef.current) return;
        trackRef.current.measure((fx, fy, w, h, px, py) => {
          const x = clamp(gestureState.moveX - px, 0, w);
          const v = getValueForX(x);
          setInternal(v);
          notifyChange(v);
        });
      },
      onPanResponderRelease: () => {
        setIsSliding(false);
        onSlidingComplete && onSlidingComplete();
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderTerminate: () => {
        setIsSliding(false);
        onSlidingComplete && onSlidingComplete();
      },
    })
  ).current;

  return (
    <View style={[styles.container, style]}>
      <Pressable
        ref={trackRef}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        style={[styles.track, { backgroundColor: maximumTrackTintColor }]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.filled, { width: `${ratio * 100}%`, backgroundColor: minimumTrackTintColor }]} />
        <View style={[styles.thumb, { left: `${ratio * 100}%`, backgroundColor: thumbTintColor }]} />
      </Pressable>
    </View>
  );
}

const THUMB_SIZE = 20;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'visible',
    justifyContent: 'center',
  },
  filled: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    marginLeft: -THUMB_SIZE / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.2)',
  },
});

