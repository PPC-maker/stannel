import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  GOLD,
  CREAM,
  GOLD_METALLIC_STOPS,
  GOLD_METALLIC_LOCATIONS,
  SHADOW,
  FONT_WEIGHT,
  FONT_SIZE,
  RADIUS,
  SPACING,
} from '@/theme/tokens';

interface ProgressCardProps {
  nextLevelPoints?: number;
  currentBalance?: number;
  totalPoints?: number;
  style?: ViewStyle;
}

export default function ProgressCard({
  nextLevelPoints = 500,
  currentBalance = 0,
  totalPoints = 0,
  style,
}: ProgressCardProps) {
  const progress = nextLevelPoints > 0
    ? Math.min(totalPoints / nextLevelPoints, 1)
    : 0;

  return (
    <View style={[styles.card, SHADOW.card, style]}>
      <View style={styles.columns}>
        <View style={styles.column}>
          <Text style={styles.label}>דרגה הבאה</Text>
          <Text style={styles.value}>{nextLevelPoints.toLocaleString()} נקודות</Text>
        </View>

        <View style={styles.column}>
          <Text style={styles.label}>יתרה נוכחית</Text>
          <Text style={styles.value}>{currentBalance.toLocaleString()} &#8362;</Text>
        </View>

        <View style={styles.column}>
          <Text style={styles.label}>נקודות וזיכויים</Text>
          <Text style={styles.value}>{totalPoints.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.barTrack}>
        <View style={[styles.barFillWrapper, { width: `${progress * 100}%` }]}>
          <LinearGradient
            colors={[...GOLD_METALLIC_STOPS]}
            locations={[...GOLD_METALLIC_LOCATIONS]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.barFill, SHADOW.goldGlow]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CREAM.surface,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    color: GOLD.dark,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.regular,
    marginBottom: SPACING.xs,
  },
  value: {
    color: GOLD.text,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.medium,
  },
  barTrack: {
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: CREAM.muted,
    overflow: 'hidden',
  },
  barFillWrapper: {
    height: '100%',
    minWidth: 8,
  },
  barFill: {
    flex: 1,
    borderRadius: RADIUS.full,
  },
});
