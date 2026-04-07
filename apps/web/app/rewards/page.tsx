'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { Gift, Star, ShoppingCart, Loader2, Coins, Banknote } from 'lucide-react';
import { useWalletBalance, useRewardProducts, useRedeemReward, useWalletCard } from '@/lib/api-hooks';
import { useAuth } from '@/lib/auth-context';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import Swal from 'sweetalert2';

const rankEmojis: Record<string, string> = {
  BRONZE: '🥉',
  SILVER: '🥈',
  GOLD: '🥇',
  PLATINUM: '💎',
};

// Calculate cash needed to complete redemption
function calculateCashCompletion(userPoints: number, productPointCost: number, pointsPerShekel: number) {
  if (userPoints >= productPointCost) {
    return { canAffordFull: true, missingPoints: 0, cashNeeded: 0, useAllPoints: true };
  }

  const missingPoints = productPointCost - userPoints;
  const cashNeeded = Math.ceil(missingPoints / pointsPerShekel);

  return {
    canAffordFull: false,
    missingPoints,
    cashNeeded,
    useAllPoints: userPoints > 0,
  };
}

export default function RewardsPage() {
  const { isReady } = useAuthGuard();
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const { data: balance } = useWalletBalance();
  const { data: card } = useWalletCard();
  const { data: productsResponse, isLoading: productsLoading } = useRewardProducts();
  const redeemMutation = useRedeemReward();

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  // לא חוסמים את כל הדף - מציגים מבנה מיידית
  const points = balance?.points || 0;
  const rank = card?.rank || user?.rank || 'BRONZE';
  const products = (productsResponse as any)?.data || productsResponse || [];

  const canAfford = (product: any) => points >= product.pointCost;

  const handleRedeem = async (productId: string, useCash: boolean = false) => {
    const product = products.find((p: any) => p.id === productId);
    if (!product) return;

    const completion = calculateCashCompletion(points, product.pointCost, product.pointsPerShekel || 100);

    // Show confirmation dialog
    let confirmMessage = `האם ברצונך לממש את "${product.name}"?`;
    let confirmDetails = '';

    if (useCash && !completion.canAffordFull) {
      confirmDetails = `
        <div style="text-align: right; direction: rtl; margin-top: 10px;">
          <p>יתרת הנקודות שלך: <strong>${points.toLocaleString()}</strong></p>
          <p>עלות המוצר: <strong>${product.pointCost.toLocaleString()} נק׳</strong></p>
          <p>נקודות חסרות: <strong>${completion.missingPoints.toLocaleString()}</strong></p>
          <hr style="margin: 10px 0; opacity: 0.3;">
          <p style="color: #16a34a; font-weight: bold;">תשלום להשלמה: ₪${completion.cashNeeded.toLocaleString()}</p>
        </div>
      `;
    }

    const result = await Swal.fire({
      title: 'אישור מימוש',
      html: confirmMessage + confirmDetails,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: useCash ? `מימוש עם ₪${completion.cashNeeded}` : 'מימוש',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#d4af37',
    });

    if (!result.isConfirmed) return;

    setRedeemingId(productId);
    try {
      await redeemMutation.mutateAsync({ productId, cashPayment: useCash ? completion.cashNeeded : 0 });
      Swal.fire({
        title: 'המוצר נרכש בהצלחה!',
        text: useCash ? `שילמת ₪${completion.cashNeeded} + ${points.toLocaleString()} נקודות` : 'המימוש בוצע בהצלחה',
        icon: 'success',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } catch (error: any) {
      Swal.fire({
        title: 'שגיאה',
        text: error.message || 'שגיאה במימוש המוצר',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className="relative bg-[#F8FAFC] min-h-screen">
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
              <p className="text-white/80 text-sm">יתרת נקודות זמינה</p>
              <p className="text-4xl font-bold text-white">
                {points.toLocaleString()} <span className="text-lg">נק׳</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center md:text-left">
              <p className="text-white/80 text-sm">דרגה</p>
              <p className="text-2xl font-semibold text-white">{rankEmojis[rank]} {rank}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">חנות ההטבות</h1>
          <p className="text-gray-600 mt-1">ממשו את הנקודות שצברתם להטבות מגוונות</p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productsLoading ? (
          // Skeleton while loading
          [...Array(6)].map((_, i) => (
            <div key={i} className="glass-card overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-100" />
              <div className="p-6">
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-full bg-gray-100 rounded mb-4" />
                <div className="flex justify-between">
                  <div className="h-6 w-20 bg-gold-400/20 rounded" />
                  <div className="h-8 w-20 bg-gray-200 rounded-lg" />
                </div>
              </div>
            </div>
          ))
        ) : products.map((product: any, index: number) => {
          const affordable = canAfford(product);
          const isRedeeming = redeemingId === product.id;
          const completion = calculateCashCompletion(points, product.pointCost, product.pointsPerShekel || 100);

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
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Gift size={48} className="text-gray-300" />
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
                </div>

                {/* Product Info */}
                <h3 className="text-gray-800 font-semibold text-lg mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>

                {/* Price & Action */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gold-400 font-bold text-xl">
                      {product.pointCost.toLocaleString()} נק׳
                    </span>
                    {product.stock > 0 && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        product.stock > 5 ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        מלאי: {product.stock}
                      </span>
                    )}
                  </div>

                  {/* Cash completion info when not enough points */}
                  {!affordable && product.stock > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2 text-blue-700 mb-1">
                        <Coins size={14} />
                        <span>חסרים {completion.missingPoints.toLocaleString()} נק׳</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-700 font-medium">
                        <Banknote size={14} />
                        <span>השלם עם ₪{completion.cashNeeded.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {affordable && product.stock > 0 ? (
                      <button
                        disabled={isRedeeming}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRedeem(product.id, false);
                        }}
                        className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 bg-gold-400 text-primary-900 hover:bg-gold-300"
                      >
                        {isRedeeming ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>
                            <ShoppingCart size={16} />
                            <span>מימוש</span>
                          </>
                        )}
                      </button>
                    ) : product.stock > 0 ? (
                      <button
                        disabled={isRedeeming}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRedeem(product.id, true);
                        }}
                        className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 bg-green-500 text-white hover:bg-green-600"
                      >
                        {isRedeeming ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>
                            <Banknote size={16} />
                            <span>מימוש עם ₪{completion.cashNeeded}</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
                      >
                        אזל מהמלאי
                      </button>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {!productsLoading && products.length === 0 && (
        <GlassCard className="text-center py-12">
          <Gift size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">אין מוצרים זמינים כרגע</p>
        </GlassCard>
      )}
        </div>
    </div>
  );
}
