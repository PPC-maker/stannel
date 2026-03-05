import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import GlassCard from '@/components/GlassCard';
import { useInvoices } from '@/lib/api-hooks';

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  PENDING_ADMIN: { label: 'ממתין לאישור', color: '#f59e0b', icon: 'clock-outline' },
  CLARIFICATION_NEEDED: { label: 'דרוש הבהרה', color: '#f97316', icon: 'help-circle-outline' },
  APPROVED: { label: 'אושר', color: '#10b981', icon: 'check-circle-outline' },
  PENDING_SUPPLIER_PAY: { label: 'ממתין לתשלום', color: '#3b82f6', icon: 'clock-outline' },
  PAID: { label: 'שולם', color: '#22c55e', icon: 'check-all' },
  REJECTED: { label: 'נדחה', color: '#ef4444', icon: 'close-circle-outline' },
  OVERDUE: { label: 'באיחור', color: '#dc2626', icon: 'alert-circle-outline' },
};

export default function InvoicesScreen() {
  const { data: invoices, isLoading } = useInvoices();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d4af37" />
          <Text style={styles.loadingText}>טוען חשבוניות...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const invoiceList = invoices || [];
  const pendingCount = invoiceList.filter((inv: any) =>
    inv.status === 'PENDING_ADMIN' || inv.status === 'PENDING_SUPPLIER_PAY'
  ).length;
  const approvedCount = invoiceList.filter((inv: any) =>
    inv.status === 'APPROVED' || inv.status === 'PAID'
  ).length;

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
            { label: 'סה״כ', value: invoiceList.length, color: 'white' },
            { label: 'ממתינות', value: pendingCount, color: '#f59e0b' },
            { label: 'אושרו', value: approvedCount, color: '#10b981' },
          ].map((stat, i) => (
            <GlassCard key={i} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Invoices List */}
        <Text style={styles.sectionTitle}>חשבוניות אחרונות</Text>
        {invoiceList.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>אין חשבוניות עדיין</Text>
            <Pressable
              style={styles.uploadBtnEmpty}
              onPress={() => router.push('/invoices/upload')}
            >
              <Text style={styles.uploadBtnEmptyText}>העלו את החשבונית הראשונה</Text>
            </Pressable>
          </GlassCard>
        ) : (
          invoiceList.map((invoice: any) => {
            const status = statusConfig[invoice.status] || statusConfig.PENDING_ADMIN;
            return (
              <GlassCard key={invoice.id} style={styles.invoiceCard}>
                <View style={styles.invoiceHeader}>
                  <View style={styles.invoiceInfo}>
                    <Text style={styles.supplierName}>{invoice.supplier?.companyName || 'ספק'}</Text>
                    <Text style={styles.invoiceDate}>
                      {new Date(invoice.createdAt).toLocaleDateString('he-IL')} • #{invoice.id.slice(-4)}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
                    <MaterialCommunityIcons name={status.icon as any} size={14} color={status.color} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>
                <View style={styles.invoiceFooter}>
                  <Text style={styles.amountLabel}>סכום</Text>
                  <Text style={styles.amountValue}>₪{invoice.amount?.toLocaleString() || 0}</Text>
                </View>
              </GlassCard>
            );
          })
        )}
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
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
  uploadBtnEmpty: {
    marginTop: 8,
    backgroundColor: '#d4af37',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  uploadBtnEmptyText: {
    color: '#060f1f',
    fontWeight: '600',
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
