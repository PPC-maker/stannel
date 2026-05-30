'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import ImageWithLoader from '@/components/ui/ImageWithLoader';
import { Gift, Star, ShoppingCart, Loader2, Coins, Banknote } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AuthGuardLoader } from '@/lib/useAuthGuard';
import { rewardsApi, walletApi } from '@stannel/api-client';
import type { WalletBalance, DigitalCard } from '@stannel/types';
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

export default function RewardsContent() {
  const { user, loading: authLoading } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const isArchitect = !authLoading && user?.role === 'ARCHITECT';

  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [card, setCard] = useState<DigitalCard | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Fetch products — always (public endpoint)
  useEffect(() => {
    setProductsLoading(true);
    rewardsApi.getProducts()
      .then((res: any) => setAllProducts(res?.data || res || []))
      .catch(() => setAllProducts([]))
      .finally(() => setProductsLoading(false));
  }, []);

  // Fetch wallet data only for architects, after auth resolves
  useEffect(() => {
    if (!isArchitect) return;
    walletApi.getBalance().then(setBalance).catch(() => {});
    walletApi.getCard().then(setCard).catch(() => {});
  }, [isArchitect]);

  if (authLoading) {
    return <AuthGuardLoader />;
  }

  const points = balance?.points || 0;
  const rank = card?.rank || user?.rank || 'BRONZE';

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

    // BLOCK: If not enough points and not using cash completion
    if (!completion.canAffordFull && !useCash) {
      Swal.fire({
        title: 'אין מספיק נקודות',
        html: `
          <div style="text-align: right; direction: rtl; margin-top: 10px;">
            <p>יתרת הנקודות שלך: <strong>${points.toLocaleString()} נק׳</strong></p>
            <p>עלות המוצר: <strong>${product.pointCost.toLocaleString()} נק׳</strong></p>
            <p style="color: #dc2626; font-weight: bold;">חסרות: ${completion.missingPoints.toLocaleString()} נק׳</p>
            <hr style="margin: 12px 0; opacity: 0.2;">
            <p style="color: #8b7c69;">ניתן להשלים ב-₪${completion.cashNeeded.toLocaleString()} או לצבור עוד נקודות.</p>
          </div>
        `,
        icon: 'warning',
        confirmButtonText: 'הבנתי',
        background: '#f7f3f2',
        color: '#2b241d',
        confirmButtonColor: '#c99b4a',
      });
      return;
    }

    let confirmMessage = `האם ברצונך לממש את "${product.name}"?`;
    let confirmDetails = '';

    if (useCash && !completion.canAffordFull) {
      confirmDetails = `
        <div style="text-align: right; direction: rtl; margin-top: 10px;">
          <p>יתרת הנקודות שלך: <strong>${points.toLocaleString()}</strong></p>
          <p>עלות המוצר: <strong>${product.pointCost.toLocaleString()} נק׳</strong></p>
          <p>נקודות חסרות: <strong>${completion.missingPoints.toLocaleString()}</strong></p>
          <hr style="margin: 10px 0; opacity: 0.3;">
          <p style="color: #c99b4a; font-weight: bold;">תשלום להשלמה: ₪${completion.cashNeeded.toLocaleString()}</p>
          <p style="color: #8b7c69; font-size: 12px; margin-top: 8px;">הפרטים שלך יישלחו למנהל המערכת לטיפול.</p>
        </div>
      `;
    } else {
      confirmDetails = `
        <div style="text-align: right; direction: rtl; margin-top: 10px;">
          <p>יתרת הנקודות שלך: <strong>${points.toLocaleString()} נק׳</strong></p>
          <p>ינוכו: <strong>${product.pointCost.toLocaleString()} נק׳</strong></p>
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
      confirmButtonColor: '#c99b4a',
      background: '#f7f3f2',
      color: '#2b241d',
    });

    if (!result.isConfirmed) return;

    setRedeemingId(productId);
    try {
      await rewardsApi.redeem({ productId, cashAmount: useCash ? completion.cashNeeded : 0 });
      Swal.fire({
        title: 'ההטבה נוצלה בהצלחה!',
        text: 'נציג יצור איתך קשר בקרוב לתיאום מסירת ההטבה',
        icon: 'success',
        confirmButtonText: 'אישור',
        background: '#f7f3f2',
        color: '#2b241d',
        confirmButtonColor: '#c99b4a',
      });
    } catch (error: any) {
      Swal.fire({
        title: 'שגיאה',
        text: error.message || 'שגיאה במימוש המוצר',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#f7f3f2',
        color: '#2b241d',
      });
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="relative z-10 px-4 sm:px-6 pt-8 pb-24 max-w-7xl mx-auto">
        {/* Balance Banner */}
        <div className="bg-gradient-to-br from-[#c99b4a]/15 to-[#c99b4a]/25 border border-[#c99b4a]/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-[#c99b4a]/20 flex items-center justify-center flex-shrink-0">
                <Star size={20} className="text-[#c99b4a] sm:hidden" />
                <Star size={28} className="text-[#c99b4a] hidden sm:block" />
              </div>
              <div>
                <p className="text-[#8b7c69] text-xs sm:text-sm">Stannel Credits</p>
                <p className="text-2xl sm:text-4xl font-bold text-[#2b241d]">
                  {points.toLocaleString()} <span className="text-sm sm:text-lg">נק׳</span>
                </p>
              </div>
            </div>
            <div className="text-center flex-shrink-0">
              <p className="text-[#8b7c69] text-xs sm:text-sm">דרגה</p>
              <p className="text-lg sm:text-2xl font-semibold text-[#2b241d]">{rankEmojis[rank]} {rank}</p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2b241d]">חנות ההטבות</h1>
          <p className="text-[#8b7c69] mt-1 text-sm sm:text-base">ממשו את הנקודות שצברתם להטבות מגוונות</p>
        </div>

        {/* Category Tabs */}
        <div className="mb-4 sm:mb-8 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          <div className="flex gap-2 sm:gap-3 min-w-max">
            {dynamicCategories.map((cat) => {
              const count = cat === 'all' ? categorizedProducts.length : (categoryCounts[cat] || 0);
              const isSelected = selectedCategory === cat;
              const label = cat === 'all' ? 'הכל' : cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-xl border transition-all text-sm sm:text-base active:scale-95 ${
                    isSelected
                      ? 'bg-[#c99b4a]/15 border-[#c99b4a]/30 text-[#c99b4a]'
                      : 'bg-[#f7f3f2] border-[rgba(201,155,74,0.08)] text-[#8b7c69] hover:bg-white/90 hover:text-[#2b241d]'
                  }`}
                >
                  {cat === 'all' && <Gift size={20} />}
                  <span className="font-medium whitespace-nowrap">{label}</span>
                  {count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      isSelected ? 'bg-[#c99b4a]/10 text-[#c99b4a]' : 'bg-[#c99b4a]/10 text-[#a89b8a]'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Category Title */}
        {selectedCategory !== 'all' && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#2b241d] flex items-center gap-2">
              <Gift size={24} className="text-[#c99b4a]" />
              {selectedCategory}
            </h2>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {productsLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-[#c99b4a]/10" />
                <div className="p-6">
                  <div className="h-5 w-3/4 bg-[#c99b4a]/10 rounded mb-2" />
                  <div className="h-4 w-full bg-[#c99b4a]/5 rounded mb-4" />
                  <div className="flex justify-between">
                    <div className="h-6 w-20 bg-[#c99b4a]/15 rounded" />
                    <div className="h-8 w-20 bg-[#c99b4a]/10 rounded-lg" />
                  </div>
                </div>
              </div>
            ))
          ) : products.map((product: any, index: number) => {
            const affordable = canAfford(product);
            const isRedeeming = redeemingId === product.id;
            const completion = calculateCashCompletion(points, product.pointCost, product.pointsPerShekel || 100);

            return (
              <div
                key={product.id}
              >
                <div
                  className={`bg-[#f7f3f2] border rounded-2xl overflow-hidden group hover:bg-white/90 transition-all cursor-pointer ${
                    selectedProduct === product.id ? 'border-[#c99b4a]/50 ring-1 ring-[#c99b4a]/30' : 'border-[rgba(201,155,74,0.08)]'
                  }`}
                  onClick={() => setSelectedProduct(product.id)}
                >
                  {/* Product Image */}
                  <div className="relative w-full bg-[#c99b4a]/5" style={{ aspectRatio: '1/1' }}>
                    {product.imageUrl ? (
                      <ImageWithLoader
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-contain group-hover:scale-105 transition-transform duration-500"
                        priority={index < 6}
                        loading={index < 6 ? 'eager' : 'lazy'}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#c99b4a]/5 flex items-center justify-center">
                        <Gift size={48} className="text-[#a89b8a]" />
                      </div>
                    )}
                    {/* Category Badge */}
                    {selectedCategory === 'all' && product.category && (
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm bg-[#c99b4a] text-white">
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
                        <span className="text-white text-sm">אזל מהמלאי</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4 sm:p-6">
                    <h3 className="text-[#2b241d] font-semibold text-base sm:text-lg mb-1 sm:mb-2">{product.name}</h3>
                    <p className="text-[#8b7c69] text-sm mb-4 line-clamp-2">{product.description}</p>

                    {/* Price & Action */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between" dir="rtl">
                        <span className="text-[#c99b4a] font-bold text-xl" dir="rtl">
                          {product.pointCost.toLocaleString('he-IL')} נק׳
                        </span>
                        {product.stock > 0 && (
                          <span className="text-xs px-2 py-1 rounded bg-[#c99b4a]/15 text-[#c99b4a]">
                            מלאי: {product.stock}
                          </span>
                        )}
                      </div>

                      {/* Share + Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const shareText = `היי! ראיתי את "${product.name}" ב-Stannel Club 🎁\nעלות: ${product.pointCost.toLocaleString()} נקודות\n\nhttps://stannelclub.co.il/rewards`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                          }}
                          className="w-11 h-11 flex-shrink-0 rounded-xl bg-[#c99b4a] text-white flex items-center justify-center hover:bg-[#9e7746] transition-colors shadow-md shadow-[#c99b4a]/30"
                          title="שיתוף בוואטסאפ"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </button>
                        {!isArchitect ? (
                          <Link
                            href="/login"
                            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-center border-2 border-[#c99b4a] bg-[#c99b4a]/15 text-[#c99b4a] hover:bg-[#c99b4a]/25 transition-all flex items-center justify-center gap-2"
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
                            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 bg-[#c99b4a] text-white hover:bg-[#9e7746]"
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
                            disabled
                            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#c99b4a]/10 text-[#a89b8a] cursor-not-allowed"
                          >
                            אין מספיק נקודות
                          </button>
                        ) : (
                          <button
                            disabled
                            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#c99b4a]/10 text-[#a89b8a] cursor-not-allowed"
                          >
                            אזל מהמלאי
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {!productsLoading && products.length === 0 && (
          <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-12 text-center">
            <Gift size={48} className="mx-auto text-[#a89b8a] mb-4" />
            <p className="text-[#8b7c69]">אין מוצרים זמינים כרגע</p>
          </div>
        )}
      </div>
    </div>
  );
}
