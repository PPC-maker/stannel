import React from 'react';
import { View, StyleSheet, Dimensions, FlatList, ViewStyle } from 'react-native';
import { SPACING } from '@/theme/tokens';
import HeroCardItem, { HeroSlide } from '@/components/HeroCardItem';

interface HeroCardProps {
  slides?: HeroSlide[];
  style?: ViewStyle;
}

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80';

const DEFAULT_SLIDES: HeroSlide[] = [
  { id: '1', imageUri: PLACEHOLDER_IMAGE, title: 'חנות מתנות אקסקלוסיבית' },
  { id: '2', imageUri: PLACEHOLDER_IMAGE, title: 'הטבות חברי מועדון' },
  { id: '3', imageUri: PLACEHOLDER_IMAGE, title: 'מוצרים נבחרים' },
  { id: '4', imageUri: PLACEHOLDER_IMAGE, title: 'קולקציה חדשה' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PEEK = 24;
const CARD_WIDTH = SCREEN_WIDTH - SPACING.lg * 2 - PEEK * 2;

export default function HeroCard({
  slides = DEFAULT_SLIDES,
  style,
}: HeroCardProps) {
  return (
    <View style={style}>
      <FlatList
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        inverted
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + SPACING.md}
        decelerationRate="fast"
        contentContainerStyle={styles.carousel}
        renderItem={({ item, index }) => (
          <View style={styles.slideWrapper}>
            <HeroCardItem
              slide={item}
              index={index}
              total={slides.length}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  carousel: {
    paddingHorizontal: PEEK,
  },
  slideWrapper: {
    width: CARD_WIDTH,
    marginLeft: SPACING.md,
  },
});
