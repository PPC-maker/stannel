import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GlassCard from '@/components/GlassCard';

const mockProducts = [
  {
    id: '1',
    name: 'כרטיס מתנה IKEA',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
    pointCost: 5000,
    stock: 10,
  },
  {
    id: '2',
    name: 'Apple AirPods Pro',
    imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400',
    pointCost: 15000,
    stock: 3,
  },
  {
    id: '3',
    name: 'יום ספא יוקרתי',
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
    pointCost: 8000,
    stock: 5,
  },
  {
    id: '4',
    name: 'ארוחה זוגית',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
    pointCost: 6000,
    stock: 8,
  },
];

const userPoints = 12500;

export default function RewardsScreen() {
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

        {/* Products Grid */}
        <View style={styles.productsGrid}>
          {mockProducts.map((product) => {
            const canAfford = userPoints >= product.pointCost;
            return (
              <Pressable key={product.id} style={styles.productCard}>
                <GlassCard style={styles.productCardInner}>
                  <View style={styles.productImageContainer}>
                    <Image
                      source={{ uri: product.imageUrl }}
                      style={styles.productImage}
                      contentFit="cover"
                    />
                    {product.stock <= 3 && (
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
                  <View style={styles.productFooter}>
                    <Text style={styles.productPrice}>{product.pointCost.toLocaleString()} נק׳</Text>
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
    paddingBottom: 8,
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
