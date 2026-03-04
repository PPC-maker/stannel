import { View, StyleSheet, ViewStyle } from 'react-native';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  gold?: boolean;
}

export default function GlassCard({ children, style, gold = false }: GlassCardProps) {
  return (
    <View style={[styles.card, gold && styles.cardGold, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    // Note: React Native doesn't support backdrop-filter
    // For iOS, you could use @react-native-community/blur
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardGold: {
    borderColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: '#d4af37',
    shadowOpacity: 0.1,
  },
});
