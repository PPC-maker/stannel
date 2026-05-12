'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import ImageWithLoader from '@/components/ui/ImageWithLoader';
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
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: balance } = useWalletBalance();
  const { data: card } = useWalletCard();
  const { data: productsResponse, isLoading: productsLoading } = useRewardProducts();
  const redeemMutation = useRedeemReward();

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  const isArchitect = user?.role === 'ARCHITECT';
  const points = balance?.points || 0;
  const rank = card?.rank || user?.rank || 'BRONZE';
  const allProducts = (productsResponse as any)?.data || productsResponse || [];

  // Use categories from products in DB
  const categorizedProducts = useMemo(() => {
    return allProducts.map((product: any) => ({
      ...product,
      category: product.category || 'כללי',
    }));
  }, [allProducts]);

  // Build dynamic categories from actual products
  const dynamicCategories = useMemo(() => {
    const cats = new Set<string>();
    categorizedProducts.forEach((p: any) => cats.add(p.category));
    return ['all', ...Array.from(cats)];
  }, [categorizedProducts]);

  // Filter by selected category
  const products = selectedCategory === 'all'
    ? categorizedProducts
    : categorizedProducts.filter((p: any) => p.category === selectedCategory);

  // Count products per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: categorizedProducts.length };
    categorizedProducts.forEach((p: any) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [categorizedProducts]);

  const canAfford = (product: any) => points >= product.pointCost;

  const handleRedeem = async (productId: string, useCash: boolean = false) => {
    const product = products.find((p: any) => p.id === productId);
    if (!product) return;

    const completion = calculateCashCompletion(points, product.pointCost, product.pointsPerShekel || 100);

    let confirmMessage = `האם ברצונך לממש את "${product.name}"?`;
    let confirmDetails = '';

    if (useCash && !completion.canAffordFull) {
      confirmDetails = `
        <div style="text-align: right; direction: rtl; margin-top: 10px;">
          <p>יתרת הנקודות שלך: <strong>${points.toLocaleString()}</strong></p>
          <p>עלות המוצר: <strong>${product.pointCost.toLocaleString()} נק׳</strong></p>
          <p>נקודות חסרות: <strong>${completion.missingPoints.toLocaleString()}</strong></p>
          <hr style="margin: 10px 0; opacity: 0.3;">
          <p style="color: #10b981; font-weight: bold;">תשלום להשלמה: ₪${completion.cashNeeded.toLocaleString()}</p>
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
      confirmButtonColor: '#10b981',
      background: '#0f2620',
      color: '#fff',
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
        background: '#0f2620',
        color: '#fff',
        confirmButtonColor: '#10b981',
      });
    } catch (error: any) {
      Swal.fire({
        title: 'שגיאה',
        text: error.message || 'שגיאה במימוש המוצר',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#0f2620',
        color: '#fff',
      });
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero Background */}
      <div className="absolute inset-x-0 top-0 h-[45vh]">
        <Image
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80"
          alt="Rewards"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2620]/30 via-transparent to-[#0f2620]" />
      </div>

      <div className="relative z-10 px-4 sm:px-6 pt-24 sm:pt-28 pb-6 max-w-7xl mx-auto">
        {/* Balance Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-600/30 to-emerald-800/30 backdrop-blur-md border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-8"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <Star size={20} className="text-emerald-400 sm:hidden" />
                <Star size={28} className="text-emerald-400 hidden sm:block" />
              </div>
              <div>
                <p className="text-white/70 text-xs sm:text-sm">יתרת נקודות זמינה</p>
                <p className="text-2xl sm:text-4xl font-bold text-white">
                  {points.toLocaleString()} <span className="text-sm sm:text-lg">נק׳</span>
                </p>
              </div>
            </div>
            <div className="text-center flex-shrink-0">
              <p className="text-white/70 text-xs sm:text-sm">דרגה</p>
              <p className="text-lg sm:text-2xl font-semibold text-white">{rankEmojis[rank]} {rank}</p>
            </div>
          </div>
        </motion.div>

        {/* Header */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">חנות ההטבות</h1>
          <p className="text-white/60 mt-1 text-sm sm:text-base">ממשו את הנקודות שצברתם להטבות מגוונות</p>
        </div>

        {/* Category Tabs */}
        <div className="mb-4 sm:mb-8 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          <div className="flex gap-2 sm:gap-3 min-w-max">
            {dynamicCategories.map((cat) => {
              const count = cat === 'all' ? categorizedProducts.length : (categoryCounts[cat] || 0);
              const isSelected = selectedCategory === cat;
              const label = cat === 'all' ? 'הכל' : cat;

              return (
                <motion.button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-xl border transition-all text-sm sm:text-base ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat === 'all' && <Gift size={20} />}
                  <span className="font-medium whitespace-nowrap">{label}</span>
                  {count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      isSelected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-white/50'
                    }`}>
                      {count}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Selected Category Title */}
        {selectedCategory !== 'all' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Gift size={24} className="text-emerald-400" />
              {selectedCategory}
            </h2>
          </motion.div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {productsLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-white/10" />
                <div className="p-6">
                  <div className="h-5 w-3/4 bg-white/10 rounded mb-2" />
                  <div className="h-4 w-full bg-white/5 rounded mb-4" />
                  <div className="flex justify-between">
                    <div className="h-6 w-20 bg-emerald-500/20 rounded" />
                    <div className="h-8 w-20 bg-white/10 rounded-lg" />
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
                <div
                  className={`bg-white/5 backdrop-blur-md border rounded-2xl overflow-hidden group hover:bg-white/10 transition-all cursor-pointer ${
                    selectedProduct === product.id ? 'border-emerald-500/50 ring-1 ring-emerald-500/30' : 'border-white/10'
                  }`}
                  onClick={() => setSelectedProduct(product.id)}
                >
                  {/* Product Image */}
                  <div className="relative h-48 overflow-hidden bg-white">
                    {product.imageUrl ? (
                      <ImageWithLoader
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <Gift size={48} className="text-white/30" />
                      </div>
                    )}
                    {/* Category Badge */}
                    {selectedCategory === 'all' && product.category && (
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm bg-emerald-500/80 text-white">
                        {product.category}
                      </div>
                    )}
                    {product.stock <= 3 && product.stock > 0 && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        נשארו {product.stock}!
                      </div>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white/80 text-sm">אזל מהמלאי</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4 sm:p-6">
                    <h3 className="text-white font-semibold text-base sm:text-lg mb-1 sm:mb-2">{product.name}</h3>
                    <p className="text-white/80 text-sm mb-4 line-clamp-2">{product.description}</p>

                    {/* Price & Action */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between" dir="rtl">
                        <span className="text-emerald-400 font-bold text-xl" dir="rtl">
                          {product.pointCost.toLocaleString('he-IL')} נק׳
                        </span>
                        {product.stock > 0 && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            product.stock > 5 ? 'bg-green-500/20 text-green-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            מלאי: {product.stock}
                          </span>
                        )}
                      </div>

                      {/* Cash completion info */}
                      {!affordable && product.stock > 0 && (
                        <div className="bg-blue-500/20 border border-blue-400/40 rounded-xl p-4">
                          <div className="flex items-center gap-2 text-blue-200 mb-2 font-semibold text-base">
                            <Coins size={18} />
                            <span>חסרים {completion.missingPoints.toLocaleString()} נק׳</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-300 font-bold text-lg">
                            <Banknote size={18} />
                            <span>השלם עם ₪{completion.cashNeeded.toLocaleString()}</span>
                          </div>
                        </div>
                      )}

                      {/* Share + Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const shareText = `היי! ראיתי את "${product.name}" ב-Stannel Club 🎁\nעלות: ${product.pointCost.toLocaleString()} נקודות\n\nhttps://stannelclub.co.il/rewards`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                          }}
                          className="w-11 h-11 flex-shrink-0 rounded-xl bg-[#25D366] text-white flex items-center justify-center hover:bg-[#20bd5a] transition-colors shadow-md shadow-green-900/30"
                          title="שיתוף בוואטסאפ"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </button>
                        {!isArchitect ? (
                          <Link
                            href="/login"
                            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-center border-2 border-emerald-500 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2"
                          >
                            <ShoppingCart size={16} />
                            להתחברות ומימוש ההטבה
                          </Link>
                        ) : affordable && product.stock > 0 ? (
                          <button
                            disabled={isRedeeming}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRedeem(product.id, false);
                            }}
                            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600"
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
                            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white/40 cursor-not-allowed"
                          >
                            אזל מהמלאי
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {!productsLoading && products.length === 0 && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
            <Gift size={48} className="mx-auto text-white/30 mb-4" />
            <p className="text-white/60">אין מוצרים זמינים כרגע</p>
          </div>
        )}
      </div>
    </div>
  );
}
