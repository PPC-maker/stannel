import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import {
  GOLD,
  CREAM,
  GOLD_METALLIC_STOPS,
  GOLD_METALLIC_LOCATIONS,
  FONT_WEIGHT,
  FONT_SIZE,
  SPACING,
} from '@/theme/tokens';

interface StannelHeaderProps {
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
}

function MenuIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12h18M3 6h18M3 18h18"
        stroke={GOLD.dark}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function BellIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 01-3.46 0"
        stroke={GOLD.dark}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function StannelHeader({
  onMenuPress,
  onNotificationPress,
}: StannelHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onMenuPress} style={styles.iconBtn}>
        <MenuIcon />
      </Pressable>

      <View style={styles.center}>
        <View style={styles.logoCircle}>
          <LinearGradient
            colors={[...GOLD_METALLIC_STOPS]}
            locations={[...GOLD_METALLIC_LOCATIONS]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.logoText}>S</Text>
        </View>
        <Text style={styles.clubName}>STANNEL CLUB</Text>
        <Text style={styles.subtitle}>Israel Design Community</Text>
      </View>

      <Pressable onPress={onNotificationPress} style={styles.iconBtn}>
        <BellIcon />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  logoText: {
    color: CREAM.surface,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
  clubName: {
    color: GOLD.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    letterSpacing: 2,
  },
  subtitle: {
    color: GOLD.mid,
    fontSize: FONT_SIZE.xxs,
    fontWeight: FONT_WEIGHT.regular,
    marginTop: 2,
  },
});
