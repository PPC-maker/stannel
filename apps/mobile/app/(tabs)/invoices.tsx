import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import GlassCard from '@/components/GlassCard';

const mockInvoices = [
  { id: '1', supplier: 'אבני ירושלים', amount: 15000, status: 'PENDING', date: '14/03' },
  { id: '2', supplier: 'קרמיקה מודרנית', amount: 8500, status: 'APPROVED', date: '13/03' },
  { id: '3', supplier: 'עץ ואבן', amount: 22000, status: 'PAID', date: '12/03' },
];

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  PENDING: { label: 'ממתין', color: '#f59e0b', icon: 'clock-outline' },
  APPROVED: { label: 'אושר', color: '#10b981', icon: 'check-circle-outline' },
  PAID: { label: 'שולם', color: '#3b82f6', icon: 'check-all' },
  REJECTED: { label: 'נדחה', color: '#ef4444', icon: 'close-circle-outline' },
};

export default function InvoicesScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>חשבוניות</Text>
          <Pressable
            style={styles.uploadBtn}
            onPress={() => router.push('/invoices/upload')}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#060f1f" />
            <Text style={styles.uploadBtnText}>העלאה</Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'סה״כ', value: '15', color: 'white' },
            { label: 'ממתינות', value: '3', color: '#f59e0b' },
            { label: 'אושרו', value: '10', color: '#10b981' },
          ].map((stat, i) => (
            <GlassCard key={i} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Invoices List */}
        <Text style={styles.sectionTitle}>חשבוניות אחרונות</Text>
        {mockInvoices.map((invoice) => {
          const status = statusConfig[invoice.status];
          return (
            <GlassCard key={invoice.id} style={styles.invoiceCard}>
              <View style={styles.invoiceHeader}>
                <View style={styles.invoiceInfo}>
                  <Text style={styles.supplierName}>{invoice.supplier}</Text>
                  <Text style={styles.invoiceDate}>{invoice.date} • #{invoice.id}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
                  <MaterialCommunityIcons name={status.icon as any} size={14} color={status.color} />
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
              <View style={styles.invoiceFooter}>
                <Text style={styles.amountLabel}>סכום</Text>
                <Text style={styles.amountValue}>₪{invoice.amount.toLocaleString()}</Text>
              </View>
            </GlassCard>
          );
        })}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#d4af37',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  uploadBtnText: {
    color: '#060f1f',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  invoiceCard: {
    padding: 16,
    marginBottom: 12,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  supplierName: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  invoiceDate: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
  },
  amountLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  amountValue: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
