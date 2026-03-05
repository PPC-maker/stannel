import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import GlassCard from '@/components/GlassCard';
import DigitalCard from '@/components/DigitalCard';
import { useAuth } from '@/lib/auth-context';
import { useDashboardStats } from '@/lib/api-hooks';

const quickActions = [
  { icon: 'file-upload', label: 'העלאת חשבונית', route: '/invoices/upload' },
  { icon: 'gift', label: 'הטבות', route: '/(tabs)/rewards' },
  { icon: 'wallet', label: 'ארנק', route: '/(tabs)/wallet' },
  { icon: 'calendar-star', label: 'אירועים', route: '/events' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  const isLoading = authLoading || statsLoading;

  // Show loading state
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

  const displayStats = stats || {
    points: 0,
    cash: 0,
    pendingInvoices: 0,
    approvedThisMonth: 0,
    cardNumber: '0000',
    rank: 'BRONZE',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>שלום, {user?.name || 'אורח'} 👋</Text>
            <Text style={styles.subtitle}>הנה סיכום הפעילות שלך</Text>
          </View>
          <Pressable style={styles.notificationBtn}>
            <MaterialCommunityIcons name="bell-outline" size={24} color="white" />
          </Pressable>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'נקודות', value: displayStats.points.toLocaleString(), icon: 'star', color: '#d4af37' },
            { label: 'פתוחות', value: displayStats.pendingInvoices, icon: 'clock-outline', color: '#f59e0b' },
            { label: 'אושרו', value: displayStats.approvedThisMonth, icon: 'check-circle-outline', color: '#10b981' },
            { label: 'זיכוי', value: `₪${displayStats.cash.toLocaleString()}`, icon: 'credit-card', color: '#3b82f6' },
          ].map((stat, i) => (
            <GlassCard key={i} style={styles.statCard}>
              <MaterialCommunityIcons name={stat.icon as any} size={20} color={stat.color} />
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Digital Card */}
        <Text style={styles.sectionTitle}>הכרטיס שלך</Text>
        <DigitalCard
          holderName={user?.name || 'אורח'}
          cardNumber={displayStats.cardNumber}
          points={displayStats.points}
          rank={displayStats.rank as 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'}
        />

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>פעולות מהירות</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, i) => (
            <Pressable
              key={i}
              style={styles.actionCard}
              onPress={() => router.push(action.route as any)}
            >
              <GlassCard style={styles.actionCardInner}>
                <LinearGradient
                  colors={['rgba(212,175,55,0.2)', 'rgba(212,175,55,0.05)']}
                  style={styles.actionIcon}
                >
                  <MaterialCommunityIcons name={action.icon as any} size={24} color="#d4af37" />
                </LinearGradient>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </GlassCard>
            </Pressable>
          ))}
        </View>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
    alignItems: 'flex-start',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
    marginTop: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
  },
  actionCardInner: {
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
});
