// STANNEL Design System - Theme Configuration
// El-Al Inspired Premium Design Language

export const theme = {
  colors: {
    // Primary — Deep Navy (El-Al Blue)
    primary: {
      50: '#e8edf7',
      100: '#c5d0ea',
      200: '#9fb2db',
      300: '#7894cc',
      400: '#5a7dc1',
      500: '#1a3a6b',
      600: '#0f2750',
      700: '#0a1c3d',
      800: '#06122a',
      900: '#060f1f',
    },
    // Accent — Warm Gold (Architecture/Luxury)
    gold: {
      50: '#fff9e6',
      100: '#fff0bf',
      200: '#ffe699',
      300: '#ffd966',
      400: '#d4af37',
      500: '#b8960c',
      600: '#9a7b0a',
      700: '#7c6208',
      800: '#5e4a06',
      900: '#403204',
    },
    // Glass effect backgrounds
    glass: {
      white: 'rgba(255, 255, 255, 0.08)',
      whiteMedium: 'rgba(255, 255, 255, 0.12)',
      whiteHover: 'rgba(255, 255, 255, 0.15)',
      dark: 'rgba(0, 0, 0, 0.45)',
      border: 'rgba(255, 255, 255, 0.15)',
      borderLight: 'rgba(255, 255, 255, 0.2)',
    },
    // Status colors
    status: {
      pending: '#f59e0b',
      pendingBg: 'rgba(245, 158, 11, 0.2)',
      approved: '#10b981',
      approvedBg: 'rgba(16, 185, 129, 0.2)',
      rejected: '#ef4444',
      rejectedBg: 'rgba(239, 68, 68, 0.2)',
      overdue: '#dc2626',
      overdueBg: 'rgba(220, 38, 38, 0.2)',
      info: '#3b82f6',
      infoBg: 'rgba(59, 130, 246, 0.2)',
    },
    // Text
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.5)',
      muted: 'rgba(255, 255, 255, 0.4)',
    },
  },
  fonts: {
    primary: "'Assistant', sans-serif",
    display: "'Assistant', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  fontWeights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  blur: {
    glass: '20px',
    heavy: '40px',
    light: '10px',
  },
  shadows: {
    glass: '0 8px 32px rgba(0, 0, 0, 0.3)',
    glassHover: '0 12px 40px rgba(0, 0, 0, 0.4)',
    gold: '0 4px 20px rgba(212, 175, 55, 0.3)',
    card: '0 4px 16px rgba(0, 0, 0, 0.2)',
  },
  radii: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  transitions: {
    fast: '150ms ease',
    normal: '300ms ease',
    slow: '500ms ease',
    slider: '1500ms ease-in-out',
  },
  zIndex: {
    background: -10,
    base: 0,
    content: 10,
    header: 100,
    modal: 1000,
    tooltip: 1100,
  },
};

export type Theme = typeof theme;
export default theme;
