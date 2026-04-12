'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Gift, Star, ShoppingCart, Loader2, Coins, Banknote, Plane, Smartphone, GraduationCap, Briefcase } from 'lucide-react';
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

// Category definitions
const CATEGORIES = [
  { id: 'all', label: 'הכל', icon: Gift, color: 'emerald' },
  { id: 'vacations', label: 'חופשות יוקרתיות', icon: Plane, color: 'blue' },
  { id: 'gadgets', label: 'סלולר וגאדג\'טים', icon: Smartphone, color: 'purple' },
  { id: 'academy', label: 'אקדמיה והעשרה', icon: GraduationCap, color: 'amber' },
  { id: 'business', label: 'לעסק שלך', icon: Briefcase, color: 'teal' },
];

// Keywords to categorize products
const categoryKeywords: Record<string, string[]> = {
  vacations: ['חופשה', 'טיסה', 'מלון', 'נופש', 'ספא', 'צימר', 'vacation', 'hotel', 'flight', 'resort', 'לילה', 'סופ"ש'],
  gadgets: ['טלפון', 'אוזניות', 'שעון', 'מחשב', 'טאבלט', 'מסך', 'סלולר', 'גאדג\'ט', 'phone', 'watch', 'headphones', 'laptop', 'iphone', 'samsung', 'apple'],
  academy: ['קורס', 'לימודים', 'הדרכה', 'סדנה', 'course', 'workshop', 'training', 'כנס', 'השתלמות'],
  business: ['עסקי', 'משרד', 'ציוד', 'תוכנה', 'שירות', 'business', 'office', 'software'],
};

function getCategoryForProduct(product: any): string {
  const searchText = `${product.name} ${product.description}`.toLowerCase();

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => searchText.includes(keyword.toLowerCase()))) {
      return category;
    }
  }

  return 'business'; // Default category
}

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

  const points = balance?.points || 0;
  const rank = card?.rank || user?.rank || 'BRONZE';
  const allProducts = (productsResponse as any)?.data || productsResponse || [];

  // Categorize and sort products - vacations first
  const categorizedProducts = useMemo(() => {
    const withCategory = allProducts.map((product: any) => ({
      ...product,
      category: getCategoryForProduct(product),
    }));

    // Sort: vacations first, then others
    return withCategory.sort((a: any, b: any) => {
      if (a.category === 'vacations' && b.category !== 'vacations') return -1;
      if (b.category === 'vacations' && a.category !== 'vacations') return 1;
      return 0;
    });
  }, [allProducts]);

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

      <div className="relative z-10 p-6 pt-28 max-w-7xl mx-auto">
        {/* Balance Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-600/30 to-emerald-800/30 backdrop-blur-md border border-emerald-500/30 rounded-3xl p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-500/30 flex items-center justify-center">
                <Star size={28} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-white/70 text-sm">יתרת נקודות זמינה</p>
                <p className="text-4xl font-bold text-white">
                  {points.toLocaleString()} <span className="text-lg">נק׳</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center md:text-left">
                <p className="text-white/70 text-sm">דרגה</p>
                <p className="text-2xl font-semibold text-white">{rankEmojis[rank]} {rank}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Header */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-white">חנות ההטבות</h1>
          <p className="text-white/60 mt-1">ממשו את הנקודות שצברתם להטבות מגוונות</p>
        </div>

        {/* Category Tabs */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const count = categoryCounts[category.id] || 0;
              const isSelected = selectedCategory === category.id;

              const colorClasses: Record<string, { bg: string; border: string; text: string; activeBg: string }> = {
                emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', activeBg: 'bg-emerald-500/20' },
                blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', activeBg: 'bg-blue-500/20' },
                purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', activeBg: 'bg-purple-500/20' },
                amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', activeBg: 'bg-amber-500/20' },
                teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400', activeBg: 'bg-teal-500/20' },
              };

              const colors = colorClasses[category.color];

              return (
                <motion.button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition-all ${
                    isSelected
                      ? `${colors.activeBg} ${colors.border} ${colors.text}`
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={20} className={isSelected ? colors.text : ''} />
                  <span className="font-medium whitespace-nowrap">{category.label}</span>
                  {count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      isSelected ? `${colors.bg} ${colors.text}` : 'bg-white/10 text-white/50'
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
              {(() => {
                const cat = CATEGORIES.find(c => c.id === selectedCategory);
                if (!cat) return null;
                const Icon = cat.icon;
                return <Icon size={24} className={`text-${cat.color}-400`} />;
              })()}
              {CATEGORIES.find(c => c.id === selectedCategory)?.label}
            </h2>
          </motion.div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div className="relative h-48 overflow-hidden">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <Gift size={48} className="text-white/30" />
                      </div>
                    )}
                    {/* Category Badge */}
                    {selectedCategory === 'all' && (
                      <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                        product.category === 'vacations' ? 'bg-blue-500/80 text-white' :
                        product.category === 'gadgets' ? 'bg-purple-500/80 text-white' :
                        product.category === 'academy' ? 'bg-amber-500/80 text-white' :
                        'bg-teal-500/80 text-white'
                      }`}>
                        {CATEGORIES.find(c => c.id === product.category)?.label}
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
                  <div className="p-6">
                    <h3 className="text-white font-semibold text-lg mb-2">{product.name}</h3>
                    <p className="text-white/60 text-sm mb-4 line-clamp-2">{product.description}</p>

                    {/* Price & Action */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-bold text-xl">
                          {product.pointCost.toLocaleString()} נק׳
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
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm">
                          <div className="flex items-center gap-2 text-blue-400 mb-1">
                            <Coins size={14} />
                            <span>חסרים {completion.missingPoints.toLocaleString()} נק׳</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-400 font-medium">
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
