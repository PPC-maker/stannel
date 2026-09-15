import type { ViewStyle } from 'react-native';

// Shared native values for the existing gold/cream components.
// Palette and metallic stops match apps/web/app/globals.css.
export const GOLD = {
  light: '#E8C97D',
  mid: '#C9A961',
  dark: '#8B6F3A',
  text: '#4A3A1F',
} as const;

export const CREAM = {
  surface: '#F6F1E7',
  muted: '#F2EAD8',
} as const;

export const FONT_WEIGHT = { regular: '400' } as const;
export const FONT_SIZE = { xxs: 10, xs: 12, sm: 14 } as const;

// Numeric equivalents of packages/ui/src/theme.ts for React Native.
export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24 } as const;
export const RADIUS = { sm: 8, md: 12, lg: 16 } as const;

export const SHADOW = {
  card: {
    shadowColor: GOLD.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
} satisfies Record<'card', ViewStyle>;

export const GOLD_METALLIC_STOPS = [
  '#E8C97D', '#C9A961', '#DDB870', '#A88845', '#E5C580', '#B8945A', '#8B6F3A',
] as const;

export const GOLD_METALLIC_LOCATIONS = [0, 0.18, 0.38, 0.55, 0.72, 0.9, 1] as const;
