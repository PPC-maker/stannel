import React, { ReactNode } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { BACKGROUNDS } from '@/theme/tokens';

interface MarbleBackgroundProps {
  children: ReactNode;
}

const { width, height } = Dimensions.get('window');
const { base, layers } = BACKGROUNDS.marbledCream;

export default function MarbleBackground({ children }: MarbleBackgroundProps) {
  return (
    <View style={[styles.container, { backgroundColor: base }]}>
      <Svg
        width={width}
        height={height}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          {layers.map((layer, i) => (
            <RadialGradient
              key={i}
              id={`marble${i}`}
              cx={`${layer.x * 100}%`}
              cy={`${layer.y * 100}%`}
              rx={`${layer.radius * 100}%`}
              ry={`${layer.radius * 100}%`}
            >
              <Stop offset="0%" stopColor={layer.color} stopOpacity={1} />
              <Stop offset="100%" stopColor={layer.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {layers.map((_, i) => (
          <Rect
            key={i}
            x="0"
            y="0"
            width={width}
            height={height}
            fill={`url(#marble${i})`}
          />
        ))}
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
