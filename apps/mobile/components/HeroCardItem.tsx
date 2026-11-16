import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
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
import GiftIcon from '@/components/shared/GiftIcon';
import GoldBadge from '@/components/shared/GoldBadge';

export interface HeroSlide {
  id: string;
  imageUri: string;
  title: string;
}

interface HeroCardItemProps {
  slide: HeroSlide;
  index: number;
  total: number;
}

const IMAGE_HEIGHT = 160;
const ICON_SIZE = 52;

export default function HeroCardItem({ slide, index, total }: HeroCardItemProps) {
  return (
    <View style={[styles.card, SHADOW.elevated]}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: slide.imageUri }} style={styles.image} />
      </View>

      <View style={styles.badgePosition}>
        <GoldBadge label={`${index + 1}/${total}`} />
      </View>

      <View style={styles.iconAnchor}>
        <View style={[styles.iconRing, SHADOW.goldGlow]}>
          <LinearGradient
            colors={[...GOLD_METALLIC_STOPS]}
            locations={[...GOLD_METALLIC_LOCATIONS]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <GiftIcon />
          </LinearGradient>
        </View>
      </View>

      <View style={styles.textArea}>
        <Text style={styles.title}>{slide.title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CREAM.surface,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  imageWrapper: {
    height: IMAGE_HEIGHT,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badgePosition: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
  },
  iconAnchor: {
    position: 'absolute',
    top: IMAGE_HEIGHT - ICON_SIZE / 2,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  iconRing: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    borderWidth: 3,
    borderColor: CREAM.surface,
    overflow: 'hidden',
  },
  iconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textArea: {
    paddingTop: ICON_SIZE / 2 + SPACING.sm,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  title: {
    color: GOLD.text,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    textAlign: 'center',
  },
});
