import React from 'react';
import { Slider as RNESlider } from '@miblanchard/react-native-slider';

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
  const normalized = Array.isArray(value) ? value : [value];
  return (
    <RNESlider
      value={normalized}
      minimumValue={minimumValue}
      maximumValue={maximumValue}
      step={step || 0}
      onValueChange={(v) => {
        const next = Array.isArray(v) ? v[0] : v;
        onValueChange && onValueChange(next);
      }}
      onSlidingStart={() => onSlidingStart && onSlidingStart()}
      onSlidingComplete={() => onSlidingComplete && onSlidingComplete()}
      minimumTrackTintColor={minimumTrackTintColor}
      maximumTrackTintColor={maximumTrackTintColor}
      thumbTintColor={thumbTintColor}
      allowTouchTrack={!!tapToSeek}
      style={style}
    />
  );
}
