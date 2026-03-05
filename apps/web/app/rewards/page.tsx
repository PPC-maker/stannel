'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { Gift, Star, ShoppingCart, Loader2 } from 'lucide-react';
import { useWalletBalance, useRewardProducts, useRedeemReward, useWalletCard } from '@/lib/api-hooks';
import { useAuth } from '@/lib/auth-context';

const rankEmojis: Record<string, string> = {
  BRONZE: '🥉',
  SILVER: '🥈',
  GOLD: '🥇',
  PLATINUM: '💎',
};

export default function RewardsPage() {
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const { data: balance } = useWalletBalance();
  const { data: card } = useWalletCard();
  const { data: productsResponse, isLoading: productsLoading } = useRewardProducts();
  const redeemMutation = useRedeemReward();

  // לא חוסמים את כל הדף - מציגים מבנה מיידית
  const points = balance?.points || 0;
  const rank = card?.rank || user?.rank || 'BRONZE';
  const products = (productsResponse as any)?.data || productsResponse || [];

  const canAfford = (product: any) => points >= product.pointCost;

  const handleRedeem = async (productId: string) => {
    setRedeemingId(productId);
    try {
      await redeemMutation.mutateAsync(productId);
      alert('המוצר נרכש בהצלחה!');
    } catch (error: any) {
      alert(error.message || 'שגיאה במימוש המוצר');
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className="relative">
      <PageSlider images={sliderImages.rewards} />
      <div className="p-6 max-w-7xl mx-auto relative z-10">
      {/* Balance Banner */}
      <GlassCard gold className="mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <Star size={28} className="text-primary-900" />
            </div>
            <div>
              <p className="text-white/60 text-sm">יתרת נקודות זמינה</p>
              <p className="text-4xl font-bold text-gold-400">
                {points.toLocaleString()} <span className="text-lg">נק׳</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center md:text-left">
              <p className="text-white/60 text-sm">דרגה</p>
              <p className="text-2xl font-semibold text-white">{rankEmojis[rank]} {rank}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">חנות ההטבות</h1>
          <p className="text-white/60 mt-1">ממשו את הנקודות שצברתם להטבות מגוונות</p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productsLoading ? (
          // Skeleton while loading
          [...Array(6)].map((_, i) => (
            <div key={i} className="glass-card overflow-hidden animate-pulse">
              <div className="h-48 bg-white/5" />
              <div className="p-6">
                <div className="h-5 w-3/4 bg-white/10 rounded mb-2" />
                <div className="h-4 w-full bg-white/5 rounded mb-4" />
                <div className="flex justify-between">
                  <div className="h-6 w-20 bg-gold-400/20 rounded" />
                  <div className="h-8 w-20 bg-white/10 rounded-lg" />
                </div>
              </div>
            </div>
          ))
        ) : products.map((product: any, index: number) => {
          const affordable = canAfford(product);
          const isRedeeming = redeemingId === product.id;

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <GlassCard
                className={`overflow-hidden group ${
                  selectedProduct === product.id ? 'ring-2 ring-gold-400' : ''
                }`}
                onClick={() => setSelectedProduct(product.id)}
              >
                {/* Product Image */}
                <div className="relative h-48 -mx-6 -mt-6 mb-4 overflow-hidden">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center">
                      <Gift size={48} className="text-white/30" />
                    </div>
                  )}
                  {product.stock <= 3 && product.stock > 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      נשארו {product.stock}!
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white/80 text-sm">אזל מהמלאי</span>
                    </div>
                  )}
                  {!affordable && product.stock > 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white/80 text-sm">חסרים נקודות</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <h3 className="text-white font-semibold text-lg mb-2">{product.name}</h3>
                <p className="text-white/60 text-sm mb-4 line-clamp-2">{product.description}</p>

                {/* Price & Action */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gold-400 font-bold text-xl">
                      {product.pointCost.toLocaleString()} נק׳
                    </span>
                    {product.cashCost > 0 && (
                      <span className="text-white/50 text-sm mr-2">+ ₪{product.cashCost}</span>
                    )}
                  </div>
                  <button
                    disabled={!affordable || product.stock === 0 || isRedeeming}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRedeem(product.id);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      affordable && product.stock > 0
                        ? 'bg-gold-400 text-primary-900 hover:bg-gold-300'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                    }`}
                  >
                    {isRedeeming ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : affordable && product.stock > 0 ? (
                      <>
                        <ShoppingCart size={16} />
                        <span>מימוש</span>
                      </>
                    ) : (
                      <span>{product.stock === 0 ? 'אזל' : 'חסר'}</span>
                    )}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {!productsLoading && products.length === 0 && (
        <GlassCard className="text-center py-12">
          <Gift size={48} className="mx-auto text-white/30 mb-4" />
          <p className="text-white/60">אין מוצרים זמינים כרגע</p>
        </GlassCard>
      )}
        </div>
    </div>
  );
}
