import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface DigitalCardProps {
  holderName: string;
  cardNumber: string;
  points: number;
  rank: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
}

const rankConfig = {
  BRONZE: { icon: '🥉', label: 'BRONZE' },
  SILVER: { icon: '🥈', label: 'SILVER' },
  GOLD: { icon: '🥇', label: 'GOLD' },
  PLATINUM: { icon: '💎', label: 'PLATINUM' },
};

export default function DigitalCard({ holderName, cardNumber, points, rank }: DigitalCardProps) {
  const rankInfo = rankConfig[rank];

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={['#1a3a6b', '#0f2750', '#060f1f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Decorative elements */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        {/* Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.clubLabel}>STANNEL CLUB</Text>
            <View style={styles.rankBadge}>
              <Text style={styles.rankIcon}>{rankInfo.icon}</Text>
              <Text style={styles.rankText}>{rankInfo.label}</Text>
            </View>
          </View>
          <View style={styles.logo}>
            <Text style={styles.logoText}>S</Text>
          </View>
        </View>

        {/* Card Number */}
        <View style={styles.cardNumberSection}>
          <Text style={styles.cardNumberLabel}>מספר כרטיס</Text>
          <Text style={styles.cardNumber}>•••• •••• •••• {cardNumber}</Text>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.footerLabel}>שם</Text>
            <Text style={styles.footerValue}>{holderName}</Text>
          </View>
          <View style={styles.pointsSection}>
            <Text style={styles.footerLabel}>נקודות</Text>
            <Text style={styles.pointsValue}>{points.toLocaleString()}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  card: {
    aspectRatio: 1.6,
    padding: 20,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(212,175,55,0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clubLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rankIcon: {
    fontSize: 14,
  },
  rankText: {
    color: '#d4af37',
    fontWeight: 'bold',
    fontSize: 14,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#060f1f',
    fontWeight: 'bold',
    fontSize: 20,
  },
  cardNumberSection: {
    marginTop: -10,
  },
  cardNumberLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginBottom: 4,
  },
  cardNumber: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginBottom: 2,
  },
  footerValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  pointsSection: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    color: '#d4af37',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
