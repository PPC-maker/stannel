import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useDashboardStats } from '@/lib/api-hooks';
import { GOLD, FONT_WEIGHT, FONT_SIZE, SPACING } from '@/theme/tokens';
import MarbleBackground from '@/components/shared/MarbleBackground';
import StannelHeader from '@/components/shared/StannelHeader';
import MemberCard from '@/components/MemberCard';
import HeroCard from '@/components/HeroCard';
import ProgressCard from '@/components/ProgressCard';
import AudienceBanner from '@/components/AudienceBanner';
import QuickActionsNav from '@/components/QuickActionsNav';
import MagazineCarousel from '@/components/MagazineCarousel';

export default function HomeScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  const isLoading = authLoading || statsLoading;

  if (isLoading) {
    return (
      <MarbleBackground>
        <SafeAreaView style={styles.loading} edges={['top']}>
          <ActivityIndicator size="large" color={GOLD.mid} />
        </SafeAreaView>
      </MarbleBackground>
    );
  }

  const s = stats || {
    points: 0,
    cash: 0,
    pendingInvoices: 0,
    approvedThisMonth: 0,
    cardNumber: 'cmnq',
    rank: 'PLATINUM',
  };

  const handleQuickAction = (action: 'service' | 'projects' | 'tools' | 'events' | 'accounts') => {
    const routes = {
      service: '/profile',
      projects: '/suppliers',
      tools: '/tools',
      events: '/events',
      accounts: '/(tabs)/invoices',
    } as const;
    router.push(routes[action] as any);
  };

  return (
    <MarbleBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StannelHeader
          onMenuPress={() => router.push('/profile' as any)}
          onNotificationPress={() => {}}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <MemberCard
            cardNumber={s.cardNumber}
            name={user?.name || 'יפעת לייט'}
            points={s.points}
            tier={s.rank}
            level={4}
            style={styles.section}
          />

          <HeroCard />

          <ProgressCard
            nextLevelPoints={500}
            currentBalance={s.cash}
            totalPoints={s.points}
            style={styles.section}
          />

          <AudienceBanner style={styles.banner} />

          <View style={styles.quickActionsTitle}>
            <Text style={styles.starGold}>✦</Text>
            <Text style={styles.quickActionsLabel}>פעולות מהירות</Text>
            <Text style={styles.starGold}>✦</Text>
          </View>

          <QuickActionsNav
            onPress={handleQuickAction}
            style={styles.section}
          />

          <MagazineCarousel style={styles.section} />
        </ScrollView>
      </SafeAreaView>
    </MarbleBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingBottom: 100,
  },
  section: {
    marginTop: SPACING.md,
    marginHorizontal: SPACING.md,
  },
  banner: {
    marginTop: SPACING.lg,
  },
  quickActionsTitle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  starGold: {
    color: GOLD.mid,
    fontSize: FONT_SIZE.sm,
  },
  quickActionsLabel: {
    color: GOLD.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
});
