import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
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
        // Accent — Warm Gold
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
      },
      fontFamily: {
        sans: ['var(--font-assistant)', 'var(--font-heebo)', 'sans-serif'],
        display: ['var(--font-playfair)', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
      backdropBlur: {
        glass: '20px',
        heavy: '40px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
