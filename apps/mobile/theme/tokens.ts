// STANNEL Design Tokens
// Premium loyalty club — El-Al inspired gold metallic + cream marble

// ─── Color Palette ───────────────────────────────────────────

export const GOLD = {
  light: '#E8C97D',
  mid: '#C9A961',
  dark: '#8B6F3A',
  text: '#4A3A1F',
} as const;

export const CREAM = {
  bg: '#F6F1E7',
  surface: '#FFFFFF',
  muted: '#F2EAD8',
} as const;

// ─── Gradients ───────────────────────────────────────────────

/** 7-stop metallic gold gradient (vertical by default) */
export const GOLD_METALLIC_STOPS = [
  '#E8C97D',
  '#C9A961',
  '#DDB870',
  '#A88845',
  '#E5C580',
  '#B8945A',
  '#8B6F3A',
] as const;

/** Location values matching the 7 stops above */
export const GOLD_METALLIC_LOCATIONS = [
  0, 0.18, 0.38, 0.55, 0.72, 0.9, 1,
] as const;

/** Diagonal shine overlay (semi-transparent white) */
export const SHINE_OVERLAY_STOPS = [
  'rgba(255,255,255,0)',
  'rgba(255,255,255,0.25)',
  'rgba(255,255,255,0.05)',
  'rgba(255,255,255,0)',
] as const;

export const SHINE_OVERLAY_LOCATIONS = [
  0, 0.4, 0.6, 1,
] as const;

// ─── Shadows ─────────────────────────────────────────────────

export const SHADOW = {
  /** Subtle card shadow */
  card: {
    shadowColor: GOLD.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  /** Elevated card with more depth */
  elevated: {
    shadowColor: GOLD.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  /** Gold glow effect */
  goldGlow: {
    shadowColor: GOLD.mid,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// ─── Backgrounds ────────────────────────────────────────────

export const BACKGROUNDS = {
  marbledCream: {
    base: CREAM.bg,
    layers: [
      { color: 'rgba(229,197,128,0.18)', x: 0.15, y: 0.10, radius: 0.45 },
      { color: 'rgba(201,169,97,0.12)', x: 0.90, y: 0.30, radius: 0.50 },
      { color: 'rgba(184,148,90,0.10)', x: 0.30, y: 0.90, radius: 0.55 },
    ],
  },
} as const;

// ─── Typography ──────────────────────────────────────────────

export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
};

export const FONT_SIZE = {
  xxs: 9,
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
} as const;

// ─── Spacing / Radius ────────────────────────────────────────

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;
