import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

const BULLET_R = 5;
const GAP = 14;
const GROUP_GAP = 22;
const TOTAL_W = BULLET_R * 2 * 8 + GAP * 6 + GROUP_GAP;

export default function GlossyBullets() {
  const positions: number[] = [];
  for (let i = 0; i < 4; i++) {
    positions.push(BULLET_R + i * (BULLET_R * 2 + GAP));
  }
  const offset = positions[3] + BULLET_R + GROUP_GAP;
  for (let i = 0; i < 4; i++) {
    positions.push(offset + i * (BULLET_R * 2 + GAP));
  }

  return (
    <View style={styles.container}>
      <Svg width={TOTAL_W} height={BULLET_R * 2 + 2}>
        <Defs>
          <RadialGradient id="bulletGlow" cx="30%" cy="30%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#FFE9A8" stopOpacity={1} />
            <Stop offset="50%" stopColor="#C9A961" stopOpacity={1} />
            <Stop offset="100%" stopColor="#8B6F3A" stopOpacity={1} />
          </RadialGradient>
        </Defs>
        {positions.map((cx, i) => (
          <Circle
            key={i}
            cx={cx}
            cy={BULLET_R + 1}
            r={BULLET_R}
            fill="url(#bulletGlow)"
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
