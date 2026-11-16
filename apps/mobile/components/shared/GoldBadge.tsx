import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  GOLD,
  GOLD_METALLIC_STOPS,
  GOLD_METALLIC_LOCATIONS,
  FONT_WEIGHT,
  FONT_SIZE,
  RADIUS,
  SPACING,
} from '@/theme/tokens';

interface GoldBadgeProps {
  label: string;
}

export default function GoldBadge({ label }: GoldBadgeProps) {
  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[...GOLD_METALLIC_STOPS]}
        locations={[...GOLD_METALLIC_LOCATIONS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.badge}
      >
        <Text style={styles.text}>{label}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  text: {
    color: GOLD.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
});
