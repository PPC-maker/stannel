import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GlassCard from '@/components/GlassCard';
import { useRewardProducts, useWalletBalance } from '@/lib/api-hooks';

export default function RewardsScreen() {
  const { data: productsResponse, isLoading: productsLoading } = useRewardProducts();
  const { data: balance, isLoading: balanceLoading } = useWalletBalance();

  const isLoading = productsLoading || balanceLoading;
  const products = productsResponse?.data || [];
  const userPoints = balance?.points || 0;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d4af37" />
          <Text style={styles.loadingText}>טוען הטבות...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Text style={styles.title}>חנות הטבות</Text>

        {/* Points Balance */}
        <GlassCard gold style={styles.balanceCard}>
          <View style={styles.balanceContent}>
            <MaterialCommunityIcons name="star" size={28} color="#d4af37" />
            <View>
              <Text style={styles.balanceLabel}>יתרה זמינה</Text>
              <Text style={styles.balanceValue}>{userPoints.toLocaleString()} נק׳</Text>
            </View>
          </View>
        </GlassCard>

        {/* Empty state */}
        {products.length === 0 && (
          <GlassCard style={styles.emptyCard}>
            <MaterialCommunityIcons name="gift-outline" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>אין מוצרים זמינים כרגע</Text>
          </GlassCard>
        )}

        {/* Products Grid */}
        <View style={styles.productsGrid}>
          {products.map((product: any) => {
            const canAfford = userPoints >= product.pointCost;
            return (
              <Pressable key={product.id} style={styles.productCard}>
                <GlassCard style={styles.productCardInner}>
                  <View style={styles.productImageContainer}>
                    {product.imageUrl ? (
                      <Image
                        source={{ uri: product.imageUrl }}
                        style={styles.productImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.productImage, styles.productImagePlaceholder]}>
                        <MaterialCommunityIcons name="gift" size={32} color="rgba(255,255,255,0.3)" />
                      </View>
                    )}
                    {product.stock <= 3 && product.stock > 0 && (
                      <View style={styles.stockBadge}>
                        <Text style={styles.stockText}>נשארו {product.stock}</Text>
                      </View>
                    )}
                    {!canAfford && (
                      <View style={styles.cantAffordOverlay}>
                        <Text style={styles.cantAffordText}>חסר נקודות</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                  {product.supplier?.companyName && (
                    <Text style={styles.supplierName} numberOfLines={1}>{product.supplier.companyName}</Text>
                  )}
                  <View style={styles.productFooter}>
                    <Text style={styles.productPrice}>{product.pointCost?.toLocaleString()} נק׳</Text>
                    <View style={[
                      styles.affordBadge,
                      { backgroundColor: canAfford ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }
                    ]}>
                      <Text style={[
                        styles.affordText,
                        { color: canAfford ? '#10b981' : '#ef4444' }
                      ]}>
                        {canAfford ? '✓' : '✗'}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            );
          })}
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
  balanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#d4af37',
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
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: '48%',
  },
  productCardInner: {
    padding: 0,
    overflow: 'hidden',
  },
  productImageContainer: {
    height: 120,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  cantAffordOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cantAffordText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  productName: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    padding: 12,
    paddingBottom: 2,
  },
  supplierName: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  productPrice: {
    color: '#d4af37',
    fontWeight: 'bold',
    fontSize: 14,
  },
  affordBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  affordText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
});
