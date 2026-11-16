import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Ellipse } from 'react-native-svg';
import { GOLD } from '@/theme/tokens';

interface AudienceBannerProps {
  style?: ViewStyle;
  glowOpacity?: number;
}

const BANNER_HEIGHT = 56;

const BACK_ROW = [
  { cx: 38, cy: 39, rx: 6, ry: 7 },
  { cx: 76, cy: 41, rx: 6, ry: 7 },
  { cx: 118, cy: 38, rx: 6, ry: 7 },
  { cx: 158, cy: 40, rx: 6, ry: 7 },
  { cx: 200, cy: 39, rx: 6, ry: 7 },
  { cx: 240, cy: 41, rx: 6, ry: 7 },
  { cx: 276, cy: 38, rx: 6, ry: 7 },
  { cx: 314, cy: 40, rx: 6, ry: 7 },
  { cx: 352, cy: 39, rx: 6, ry: 7 },
];

const FRONT_ROW = [
  { cx: 20, cy: 48, rx: 12, ry: 14 },
  { cx: 58, cy: 51, rx: 10, ry: 13 },
  { cx: 96, cy: 46, rx: 13, ry: 15 },
  { cx: 138, cy: 49, rx: 11, ry: 14 },
  { cx: 178, cy: 47, rx: 12, ry: 13 },
  { cx: 218, cy: 50, rx: 10, ry: 14 },
  { cx: 256, cy: 46, rx: 13, ry: 15 },
  { cx: 294, cy: 49, rx: 11, ry: 13 },
  { cx: 334, cy: 48, rx: 12, ry: 14 },
  { cx: 370, cy: 47, rx: 10, ry: 13 },
];

export default function AudienceBanner({
  style,
  glowOpacity = 1,
}: AudienceBannerProps) {
  return (
    <View style={[styles.container, style]}>
      <Svg width="100%" height={BANNER_HEIGHT} preserveAspectRatio="xMidYMax slice">
        <Defs>
          <RadialGradient id="stageGlow" cx="50%" cy="0%" rx="60%" ry="80%">
            <Stop offset="0%" stopColor={GOLD.light} stopOpacity={0.4 * glowOpacity} />
            <Stop offset="50%" stopColor={GOLD.mid} stopOpacity={0.15 * glowOpacity} />
            <Stop offset="100%" stopColor={GOLD.dark} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Rect x="0" y="0" width="100%" height={BANNER_HEIGHT} fill="#0A1015" />
        <Rect x="0" y="0" width="100%" height={BANNER_HEIGHT} fill="url(#stageGlow)" />

        {BACK_ROW.map((h, i) => (
          <Ellipse key={`b${i}`} cx={h.cx} cy={h.cy} rx={h.rx} ry={h.ry} fill="#000000" />
        ))}
        {FRONT_ROW.map((h, i) => (
          <Ellipse key={`f${i}`} cx={h.cx} cy={h.cy} rx={h.rx} ry={h.ry} fill="#000000" />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: BANNER_HEIGHT,
    overflow: 'hidden',
  },
});
