import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '@/components/GlassCard';

const menuItems = [
  { icon: 'account-edit', label: 'עריכת פרופיל', route: '/profile/edit' },
  { icon: 'bell-outline', label: 'התראות', route: '/notifications' },
  { icon: 'shield-check', label: 'אבטחה', route: '/security' },
  { icon: 'help-circle-outline', label: 'עזרה ותמיכה', route: '/help' },
  { icon: 'file-document-outline', label: 'תנאי שימוש', route: '/terms' },
  { icon: 'information-outline', label: 'אודות', route: '/about' },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <GlassCard style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#1a3a6b', '#0f2750']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>יי</Text>
            </LinearGradient>
            <View style={styles.rankBadge}>
              <Text style={styles.rankEmoji}>🥇</Text>
            </View>
          </View>
          <Text style={styles.userName}>ישראל ישראלי</Text>
          <Text style={styles.userEmail}>israel@example.com</Text>
          <View style={styles.userStats}>
            <View style={styles.userStat}>
              <Text style={styles.userStatValue}>12,500</Text>
              <Text style={styles.userStatLabel}>נקודות</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.userStat}>
              <Text style={styles.userStatValue}>15</Text>
              <Text style={styles.userStatLabel}>חשבוניות</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.userStat}>
              <Text style={styles.userStatValue}>GOLD</Text>
              <Text style={styles.userStatLabel}>דרגה</Text>
            </View>
          </View>
        </GlassCard>

        {/* Menu Items */}
        <Text style={styles.sectionTitle}>הגדרות</Text>
        <GlassCard style={styles.menuCard}>
          {menuItems.map((item, i) => (
            <Pressable
              key={i}
              style={[
                styles.menuItem,
                i < menuItems.length - 1 && styles.menuItemBorder,
              ]}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuItemIcon}>
                  <MaterialCommunityIcons name={item.icon as any} size={22} color="#d4af37" />
                </View>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-left" size={22} color="rgba(255,255,255,0.4)" />
            </Pressable>
          ))}
        </GlassCard>

        {/* Logout */}
        <Pressable style={styles.logoutBtn}>
          <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>התנתקות</Text>
        </Pressable>

        {/* Version */}
        <Text style={styles.version}>גרסה 1.0.0</Text>
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
  profileCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: 'white',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankEmoji: {
    fontSize: 16,
  },
  userName: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  userEmail: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 4,
  },
  userStats: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    width: '100%',
    justifyContent: 'space-around',
  },
  userStat: {
    alignItems: 'center',
  },
  userStatValue: {
    color: '#d4af37',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userStatLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(212,175,55,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemLabel: {
    color: 'white',
    fontSize: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginTop: 24,
  },
});
