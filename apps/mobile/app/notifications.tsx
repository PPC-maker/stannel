import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@stannel/api-client';
import GlassCard from '@/components/GlassCard';

const typeConfig: Record<string, { icon: string; color: string }> = {
  INVOICE: { icon: 'file-document-outline', color: '#3b82f6' },
  REDEMPTION: { icon: 'gift-outline', color: '#d4af37' },
  GOAL_BONUS: { icon: 'trophy-outline', color: '#10b981' },
  RANK_UPGRADE: { icon: 'star-outline', color: '#f59e0b' },
  SYSTEM: { icon: 'bell-outline', color: '#8b5cf6' },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll(),
  });

  const notifications = data?.data || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-right" size={24} color="white" />
        </Pressable>
        <Text style={styles.title}>התראות</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d4af37" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <GlassCard style={styles.emptyCard}>
            <MaterialCommunityIcons name="bell-off-outline" size={56} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>אין התראות חדשות</Text>
          </GlassCard>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {notifications.map((notif: any) => {
            const config = typeConfig[notif.type] || typeConfig.SYSTEM;
            return (
              <GlassCard key={notif.id} style={[styles.notifCard, !notif.isRead && styles.notifUnread]}>
                <View style={[styles.notifIcon, { backgroundColor: `${config.color}20` }]}>
                  <MaterialCommunityIcons name={config.icon as any} size={22} color={config.color} />
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifTitle}>{notif.title}</Text>
                  <Text style={styles.notifMessage}>{notif.message}</Text>
                  <Text style={styles.notifTime}>
                    {new Date(notif.createdAt).toLocaleDateString('he-IL')}
                  </Text>
                </View>
              </GlassCard>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 10,
  },
  notifCard: {
    padding: 16,
    flexDirection: 'row',
    gap: 14,
  },
  notifUnread: {
    borderColor: 'rgba(212,175,55,0.3)',
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'right',
  },
  notifMessage: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  notifTime: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'right',
  },
});
