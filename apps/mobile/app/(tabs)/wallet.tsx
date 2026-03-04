import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GlassCard from '@/components/GlassCard';
import DigitalCard from '@/components/DigitalCard';

const mockTransactions = [
  { id: 1, description: 'זיכוי מחשבונית #A4F2', amount: 850, type: 'CREDIT', date: '12/03' },
  { id: 2, description: 'מימוש: כרטיס מתנה', amount: -500, type: 'DEBIT', date: '11/03' },
  { id: 3, description: 'בונוס יעד חודשי', amount: 1000, type: 'CREDIT', date: '10/03' },
  { id: 4, description: 'זיכוי מחשבונית #B2C1', amount: 1200, type: 'CREDIT', date: '08/03' },
];

export default function WalletScreen() {
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
              <Text style={styles.balanceValue}>12,500 נק׳</Text>
            </View>
            <View style={styles.rankBadge}>
              <Text style={styles.rankIcon}>🥇</Text>
              <Text style={styles.rankText}>GOLD</Text>
            </View>
          </View>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>סה״כ נצבר</Text>
              <Text style={styles.balanceSubValue}>45,200 נק׳</Text>
            </View>
            <View>
              <Text style={styles.balanceLabel}>סה״כ מומש</Text>
              <Text style={styles.balanceSubValue}>32,700 נק׳</Text>
            </View>
          </View>
        </GlassCard>

        {/* Digital Card */}
        <Text style={styles.sectionTitle}>הכרטיס הדיגיטלי</Text>
        <DigitalCard
          holderName="ישראל ישראלי"
          cardNumber="4521"
          points={12500}
          rank="GOLD"
        />

        {/* Transactions */}
        <Text style={styles.sectionTitle}>תנועות אחרונות</Text>
        <GlassCard style={styles.transactionsCard}>
          {mockTransactions.map((tx, i) => (
            <View
              key={tx.id}
              style={[
                styles.transaction,
                i < mockTransactions.length - 1 && styles.transactionBorder,
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
                  <Text style={styles.transactionDate}>{tx.date}</Text>
                </View>
              </View>
              <Text style={[
                styles.transactionAmount,
                { color: tx.type === 'CREDIT' ? '#10b981' : '#ef4444' }
              ]}>
                {tx.type === 'CREDIT' ? '+' : ''}{tx.amount.toLocaleString()} נק׳
              </Text>
            </View>
          ))}
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
