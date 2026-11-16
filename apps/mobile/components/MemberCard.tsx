import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect as SvgRect } from 'react-native-svg';
import {
  GOLD,
  GOLD_METALLIC_STOPS,
  GOLD_METALLIC_LOCATIONS,
  SHADOW,
  FONT_WEIGHT,
  FONT_SIZE,
  RADIUS,
  SPACING,
} from '@/theme/tokens';
import GlossyBullets from '@/components/shared/GlossyBullets';

interface MemberCardProps {
  cardNumber?: string;
  name?: string;
  points?: number;
  tier?: string;
  level?: number;
  style?: ViewStyle;
}

function QRIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <SvgRect x={0} y={0} width={6} height={6} rx={1} stroke={GOLD.text} strokeWidth={1.2} />
      <SvgRect x={10} y={0} width={6} height={6} rx={1} stroke={GOLD.text} strokeWidth={1.2} />
      <SvgRect x={0} y={10} width={6} height={6} rx={1} stroke={GOLD.text} strokeWidth={1.2} />
      <SvgRect x={10} y={10} width={6} height={6} rx={1} stroke={GOLD.text} strokeWidth={1.2} />
    </Svg>
  );
}

export default function MemberCard({
  cardNumber = 'cmnq',
  name = 'יפעת לייט',
  points = 0,
  tier = 'PLATINUM',
  level = 4,
  style,
}: MemberCardProps) {
  return (
    <View style={[styles.outer, SHADOW.elevated, style]}>
      <LinearGradient
        colors={[...GOLD_METALLIC_STOPS]}
        locations={[...GOLD_METALLIC_LOCATIONS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent', 'rgba(255,250,220,0.3)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.inner}>
        {/* Top row */}
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{level}</Text>
            </View>
            <Text style={styles.tierText}>{tier}</Text>
          </View>
          <View style={styles.topRight}>
            <Text style={styles.scanLabel}>{'סריקה ושימוש \u00BB'}</Text>
            <View style={styles.qrBox}>
              <LinearGradient
                colors={[GOLD.light, GOLD.dark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <QRIcon />
            </View>
          </View>
        </View>

        {/* Card number + bullets */}
        <View style={styles.middle}>
          <Text style={styles.cardNumber}>{cardNumber}</Text>
          <GlossyBullets />
        </View>

        {/* Bottom row */}
        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.labelSmall}>מספר כרטיס</Text>
            <Text style={styles.valueText}>{name}</Text>
          </View>
          <View style={styles.bottomRight}>
            <Text style={styles.labelSmall}>Points</Text>
            <Text style={styles.valueText}>{points.toLocaleString()}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  inner: {
    padding: SPACING.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  levelBadge: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: 'rgba(255,250,220,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    color: GOLD.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  tierText: {
    color: GOLD.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    letterSpacing: 1.5,
  },
  topRight: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  scanLabel: {
    color: GOLD.text,
    fontSize: FONT_SIZE.xxs,
  },
  qrBox: {
    width: 28,
    height: 24,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middle: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  cardNumber: {
    color: GOLD.text,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    letterSpacing: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bottomRight: {
    alignItems: 'flex-end',
  },
  labelSmall: {
    color: GOLD.text,
    fontSize: FONT_SIZE.xxs,
    fontWeight: FONT_WEIGHT.regular,
    opacity: 0.7,
    marginBottom: 2,
  },
  valueText: {
    color: GOLD.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
});
