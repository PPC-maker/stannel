import { View, StyleSheet, ViewStyle } from 'react-native';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  gold?: boolean;
  dark?: boolean;
}

export default function GlassCard({ children, style, gold = false, dark = false }: GlassCardProps) {
  return (
    <View style={[styles.card, gold && styles.cardGold, dark && styles.cardDark, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f7f3f2',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201,155,74,0.08)',
    shadowColor: '#402612',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  cardGold: {
    borderColor: 'rgba(201,155,74,0.2)',
    shadowColor: '#C9A961',
    shadowOpacity: 0.15,
  },
  cardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
});
