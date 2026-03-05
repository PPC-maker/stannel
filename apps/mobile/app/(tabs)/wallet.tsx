import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GlassCard from '@/components/GlassCard';
import DigitalCard from '@/components/DigitalCard';
import { useAuth } from '@/lib/auth-context';
import { useWalletBalance, useWalletCard, useWalletTransactions } from '@/lib/api-hooks';

const rankEmojis: Record<string, string> = {
  BRONZE: '🥉',
  SILVER: '🥈',
  GOLD: '🥇',
  PLATINUM: '💎',
};

export default function WalletScreen() {
  const { user } = useAuth();
  const { data: balance, isLoading: balanceLoading } = useWalletBalance();
  const { data: card, isLoading: cardLoading } = useWalletCard();
  const { data: transactions, isLoading: txLoading } = useWalletTransactions();

  const isLoading = balanceLoading || cardLoading || txLoading;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d4af37" />
          <Text style={styles.loadingText}>טוען...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const walletBalance = balance || { points: 0, cash: 0, totalEarned: 0, totalRedeemed: 0 };
  const cardData = card || { cardNumber: '0000', rank: 'BRONZE', pointsBalance: 0, holderName: '' };
  const txList = transactions || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Text style={styles.title}>הארנק שלי</Text>

        {/* Balance Card */}
        <GlassCard gold style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>יתרת נקודות</Text>
              <Text style={styles.balanceValue}>{walletBalance.points?.toLocaleString() || 0} נק׳</Text>
            </View>
            <View style={styles.rankBadge}>
              <Text style={styles.rankIcon}>{rankEmojis[cardData.rank || 'BRONZE']}</Text>
              <Text style={styles.rankText}>{cardData.rank || 'BRONZE'}</Text>
            </View>
          </View>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>סה״כ נצבר</Text>
              <Text style={styles.balanceSubValue}>{walletBalance.totalEarned?.toLocaleString() || 0} נק׳</Text>
            </View>
            <View>
              <Text style={styles.balanceLabel}>סה״כ מומש</Text>
              <Text style={styles.balanceSubValue}>{walletBalance.totalRedeemed?.toLocaleString() || 0} נק׳</Text>
            </View>
          </View>
        </GlassCard>

        {/* Digital Card */}
        <Text style={styles.sectionTitle}>הכרטיס הדיגיטלי</Text>
        <DigitalCard
          holderName={user?.name || cardData.holderName || 'אורח'}
          cardNumber={cardData.cardNumber?.slice(-4) || '0000'}
          points={walletBalance.points || 0}
          rank={(cardData.rank as 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM') || 'BRONZE'}
        />

        {/* Transactions */}
        <Text style={styles.sectionTitle}>תנועות אחרונות</Text>
        <GlassCard style={styles.transactionsCard}>
          {txList.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="wallet-outline" size={40} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyText}>אין תנועות עדיין</Text>
            </View>
          ) : (
            txList.map((tx, i) => (
              <View
                key={tx.id}
                style={[
                  styles.transaction,
                  i < txList.length - 1 && styles.transactionBorder,
                ]}
              >
                <View style={styles.transactionLeft}>
                  <View style={[
                    styles.transactionIcon,
                    { backgroundColor: tx.type === 'CREDIT' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }
                  ]}>
                    <MaterialCommunityIcons
                      name={tx.type === 'CREDIT' ? 'arrow-down' : 'arrow-up'}
                      size={18}
                      color={tx.type === 'CREDIT' ? '#10b981' : '#ef4444'}
                    />
                  </View>
                  <View>
                    <Text style={styles.transactionDesc}>{tx.description}</Text>
                    <Text style={styles.transactionDate}>
                      {new Date(tx.createdAt).toLocaleDateString('he-IL')}
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: tx.type === 'CREDIT' ? '#10b981' : '#ef4444' }
                ]}>
                  {tx.type === 'CREDIT' ? '+' : ''}{tx.amount?.toLocaleString() || 0} נק׳
                </Text>
              </View>
            ))
          )}
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  balanceCard: {
    padding: 20,
    marginBottom: 24,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#d4af37',
  },
  balanceSubValue: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212,175,55,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rankIcon: {
    fontSize: 16,
  },
  rankText: {
    color: '#d4af37',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
    marginTop: 8,
  },
  transactionsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  transaction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  transactionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDesc: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  transactionDate: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmount: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});
