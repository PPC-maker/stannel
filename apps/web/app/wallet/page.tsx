'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import ImageWithLoader from '@/components/ui/ImageWithLoader';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wallet,
  CreditCard,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft,
  Clock,
  FileUp,
  Calendar,
  Wrench,
  Building2,
  Gift,
  Users,
  ShoppingBag,
  FileText,
  History,
  CheckCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Star,
  BarChart3,
  Receipt,
  Settings,
  Headphones,
  Search,
} from 'lucide-react';
import { useWalletBalance, useWalletCard, useWalletTransactions, useSuppliersDirectory, useRewardProducts } from '@/lib/api-hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import Link from 'next/link';

const rankConfig = {
  BRONZE: { label: 'BRONZE', color: 'text-amber-700', bg: 'bg-amber-100', emoji: '🥉', badge: '3', minPoints: 0, maxPoints: 5000, next: 'SILVER' },
  SILVER: { label: 'SILVER', color: 'text-gray-500', bg: 'bg-gray-100', emoji: '🥈', badge: '2', minPoints: 5000, maxPoints: 15000, next: 'GOLD' },
  GOLD: { label: 'GOLD', color: 'text-yellow-600', bg: 'bg-yellow-100', emoji: '🥇', badge: '1', minPoints: 15000, maxPoints: 50000, next: 'PLATINUM' },
  PLATINUM: { label: 'PLATINUM', color: 'text-cyan-500', bg: 'bg-cyan-100', emoji: '💎', badge: '0', minPoints: 50000, maxPoints: 100000, next: 'PLATINUM' },
};

// Quick action categories with sub-items
const quickActionCategories = [
  {
    id: 'invoices',
    label: 'חשבוניות',
    icon: FileUp,
    color: 'bg-emerald-500',
    iconColor: 'text-emerald-500',
    items: [
      { label: 'העלאת חשבונית', href: '/invoices/upload', icon: FileUp },
      { label: 'החשבוניות שלי', href: '/invoices', icon: FileText },
      { label: 'היסטוריה', href: '/invoices?filter=history', icon: History },
      { label: 'ממתינות לאישור', href: '/invoices?filter=pending', icon: Clock },
      { label: 'אושרו', href: '/invoices?filter=approved', icon: CheckCircle },
    ],
  },
  {
    id: 'events',
    label: 'אירועים',
    icon: Calendar,
    color: 'bg-purple-500',
    iconColor: 'text-purple-500',
    items: [
      { label: 'אירועים קרובים', href: '/events', icon: Calendar },
      { label: 'האירועים שלי', href: '/events?filter=registered', icon: CheckCircle },
      { label: 'היסטוריית אירועים', href: '/events?filter=past', icon: History },
    ],
  },
  {
    id: 'tools',
    label: 'כלי עבודה',
    icon: Wrench,
    color: 'bg-orange-500',
    iconColor: 'text-orange-500',
    directHref: '/tools',
    items: [],
  },
  {
    id: 'suppliers',
    label: 'ספקים',
    icon: Users,
    color: 'bg-blue-500',
    iconColor: 'text-blue-500',
    items: [
      { label: 'כל הספקים', href: '/suppliers', icon: Building2 },
      { label: 'ספקים מומלצים', href: '/suppliers?filter=recommended', icon: Award },
      { label: 'הספקים שלי', href: '/suppliers?filter=my', icon: Users },
    ],
  },
  {
    id: 'service',
    label: 'שירות אישי',
    icon: Headphones,
    color: 'bg-teal-500',
    iconColor: 'text-teal-500',
    items: [
      { label: 'צור קשר', href: '/contact', icon: Headphones },
    ],
  },
];

// Magazine articles from stannelmarketplace.com
const magazineArticles = [
  { title: 'בית החווה Farasha | אירוח איטי בין הרי האטלס למרקש', excerpt: 'בית החווה פאראשה ממוקם במרוקו, כ-40 דקות נסיעה משדה התעופה של מרקש', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/04/שער.png', url: 'https://stannelmarketplace.com/%d7%91%d7%99%d7%aa-%d7%94%d7%97%d7%95%d7%95%d7%94-farasha/' },
  { title: 'המתח העדין שבין קרבה לניכור | לירן ורדיאל', excerpt: 'השפה של לירן ורדיאל אינה מתמסרת להגדרה אחת ברורה', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/04/COVER.jpg', url: 'https://stannelmarketplace.com/%d7%94%d7%9e%d7%aa%d7%97-%d7%94%d7%a2%d7%93%d7%99%d7%9f/' },
  { title: 'שפה מאופקת מול נוף דרמטי | בית על חוף ספרד', excerpt: 'על מגרש תלול המשקיף אל הים, באזור טויש-מסקראט שבקאלפה', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/04/שער-1.jpg', url: 'https://stannelmarketplace.com/%d7%a9%d7%a4%d7%94-%d7%9e%d7%90%d7%95%d7%a4%d7%a7%d7%aa/' },
  { title: 'קווים נקיים, בטון חשוף וגרם מדרגות פיסולי', excerpt: 'הבית שתכנן אדריכל ירון אלדד יחד עם הנדסאית האדריכלות נוי סנדגרטן', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/02/אינסטגרם.jpg', url: 'https://stannelmarketplace.com/%d7%a7%d7%95%d7%95%d7%99%d7%9d-%d7%a0%d7%a7%d7%99%d7%99%d7%9d/' },
  { title: 'מחוברים לאדמה | יקב בוטיק ואורווה מקצועית', excerpt: 'פרויקט שמחבר בין שני חלומות ושני מגרשים צמודים ביקנעם המושבה', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/02/שער-אינסטגרם-כתבה.jpg', url: 'https://stannelmarketplace.com/%d7%9e%d7%97%d7%95%d7%91%d7%a8%d7%99%d7%9d-%d7%9c%d7%90%d7%93%d7%9e%d7%94/' },
  { title: 'איך מתכננים בית שבו מסות כבדות נדמות כמרחפות', excerpt: 'בית בהרצליה פיתוח, שנבנה עבור משפחה בת שש נפשות על מגרש ששטחו דונם', image: 'https://stannelmarketplace.com/wp-content/uploads/2025/12/Image.jpg', url: 'https://stannelmarketplace.com/%d7%90%d7%99%d7%9a-%d7%9e%d7%aa%d7%9b%d7%a0%d7%a0%d7%99%d7%9d/' },
  { title: 'ספוטלייט | האדריכלות ההוליסטית של נוימן חיינר', excerpt: 'משרד האדריכלים נוימן-חיינר הוא בין המגוונים והמשפיעים בתחום', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/01/שער-קטן.jpg', url: 'https://stannelmarketplace.com/%d7%a1%d7%a4%d7%95%d7%98%d7%9c%d7%99%d7%99%d7%98/' },
  { title: 'הפרויקט הסודי בעיר הלבנה | פנטהאוז בבניין לשימור', excerpt: 'שיפוץ מיוחד ומסקרן לדירת פנטהאוז בבניין תל-אביבי לשימור', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/01/שער-כתבה-.jpg', url: 'https://stannelmarketplace.com/2277/' },
  { title: 'הבית שתל אביב לא ראתה קודם | אסיה פוגשת מזרח־תיכון', excerpt: 'בני זוג ושלושת בניהם המתבגרים רכשו בית ברחוב שקט בצפון תל אביב', image: 'https://stannelmarketplace.com/wp-content/uploads/2025/12/cover-big.jpg', url: 'https://stannelmarketplace.com/%d7%90%d7%a1%d7%99%d7%94-%d7%a4%d7%95%d7%92%d7%a9%d7%aa/' },
  { title: 'יש לי ספריה בראש על כל לקוח | קרן ליזרוביץ', excerpt: 'בסבלנות, בהקשבה ובמסירות, תופרת אדריכלית קרן ליזרוביץ פרויקט ייחודי', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/03/5-1.jpg', url: 'https://stannelmarketplace.com/%d7%99%d7%a9-%d7%9c%d7%99-%d7%a1%d7%a4%d7%a8%d7%99%d7%94/' },
];

function MagazineCarousel({ metalGradient, goldShadowLight }: { metalGradient: string; goldShadowLight: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll every 3 seconds (RTL-aware)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.85;
    const timer = setInterval(() => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      const currentScroll = Math.abs(el.scrollLeft);
      if (currentScroll >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: -step, behavior: 'smooth' });
      }
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mt-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: metalGradient }}>
            <span className="text-sm font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>S</span>
          </div>
          <div>
            <h3 className="text-[#2b241d] font-bold text-base tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>stannel magazine</h3>
            <p className="text-[#c99b4a] text-xs">השראה, טרנדים ועיצוב</p>
          </div>
        </div>
        <a href="https://stannelmarketplace.com/" target="_blank" rel="noopener noreferrer" className="text-[#c99b4a] text-sm font-medium hover:text-[#7c5a40] transition-colors flex items-center gap-1">
          כל הכתבות
          <ChevronLeft size={14} />
        </a>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide rounded-2xl"
        style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth', scrollSnapType: 'x mandatory' }}
      >
        {magazineArticles.map((article, i) => (
          <a
            key={i}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 block rounded-2xl overflow-hidden group"
            style={{ width: '85%', scrollSnapAlign: 'start', boxShadow: goldShadowLight }}
          >
            <div className="relative" style={{ aspectRatio: '3/4' }}>
              <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" draggable={false} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              {i === 0 && (
                <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white/90" style={{ background: metalGradient }}>
                  stannel magazine
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h4 className="text-white font-bold text-lg leading-snug mb-2 line-clamp-2">{article.title}</h4>
                <p className="text-white/60 text-[13px] line-clamp-2 leading-relaxed">{article.excerpt}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </motion.div>
  );
}

// ── Rewards Carousel ──
function RewardsCarousel({ products, metalGradient, goldShadowLight }: { products: any[]; metalGradient: string; goldShadowLight: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll every 3 seconds (RTL-aware)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.65;
    const timer = setInterval(() => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      const currentScroll = Math.abs(el.scrollLeft);
      if (currentScroll >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: -step, behavior: 'smooth' });
      }
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: metalGradient }}>
            <Gift size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-[#2b241d] font-bold text-base tracking-tight">חנות הטבות</h3>
            <p className="text-[#c99b4a] text-xs">ממשו נקודות להטבות</p>
          </div>
        </div>
        <Link href="/rewards" className="text-[#c99b4a] text-sm font-medium hover:text-[#7c5a40] transition-colors flex items-center gap-1">
          כל ההטבות
          <ChevronLeft size={14} />
        </Link>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide rounded-2xl"
        style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth', scrollSnapType: 'x mandatory' }}
      >
        {products.map((product: any, i: number) => (
          <Link
            key={product.id || i}
            href="/rewards"
            className="flex-shrink-0 block rounded-2xl overflow-hidden group bg-white"
            style={{ width: '60%', scrollSnapAlign: 'start', boxShadow: goldShadowLight }}
          >
            <div className="relative h-48 overflow-hidden">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" draggable={false} />
              ) : (
                <div className="w-full h-full bg-[#f0e6d2] flex items-center justify-center">
                  <Gift size={40} className="text-[#c99b4a]/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: metalGradient }}>
                {product.pointCost?.toLocaleString('he-IL')} נק׳
              </div>
            </div>
            <div className="p-3">
              <h4 className="text-[#2b241d] font-bold text-sm leading-snug mb-1 line-clamp-1">{product.name}</h4>
              <p className="text-[#8b7c69] text-[11px] line-clamp-2">{product.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

// ── Suppliers Carousel ──
function SuppliersCarousel({ metalGradient, goldShadowLight, allSuppliers, suppliersLoading }: { metalGradient: string; goldShadowLight: string; allSuppliers: any; suppliersLoading: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const suppliers = allSuppliers?.data || [];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || suppliers.length === 0) return;
    const step = 100;
    const timer = setInterval(() => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      const currentScroll = Math.abs(el.scrollLeft);
      if (currentScroll >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: -step, behavior: 'smooth' });
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [suppliers.length]);

  if (suppliersLoading || suppliers.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: metalGradient }}>
            <Building2 size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-[#2b241d] font-bold text-base tracking-tight">הספקים שלנו</h3>
            <p className="text-[#c99b4a] text-xs">ספקים מובילים בתעשייה</p>
          </div>
        </div>
        <Link href="/suppliers" className="text-[#c99b4a] text-sm font-medium hover:text-[#7c5a40] transition-colors flex items-center gap-1">
          כל הספקים
          <ChevronLeft size={14} />
        </Link>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth', scrollSnapType: 'x mandatory' }}
      >
        {suppliers.map((supplier: any) => {
          const logo = supplier.profileImage || supplier.businessImages?.[0];
          return (
            <Link
              key={supplier.id}
              href={`/suppliers/${supplier.id}`}
              className="flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl group hover:bg-white/50 transition-all"
              style={{ width: 100, scrollSnapAlign: 'start' }}
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center">
                {logo ? (
                  <img src={logo} alt={supplier.companyName || ''} className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={24} className="text-[#c99b4a]" />
                )}
              </div>
              <span className="text-[10px] font-bold text-[#2b241d] text-center line-clamp-2 leading-tight">{supplier.companyName || supplier.name}</span>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Circular Progress SVG ──
function CircularProgress({ percent, nextTier }: { percent: number; nextTier: string }) {
  const size = 120;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.12)" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="url(#goldGrad)" strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e6cc8d" />
            <stop offset="100%" stopColor="#9f7645" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-white text-[28px] font-bold drop-shadow-sm">{percent}%</span>
        <span className="text-white/55 text-[10px] leading-tight text-center font-medium">התקדמות ל<br />{nextTier}</span>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const { isReady } = useAuthGuard();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [transactionsOpen, setTransactionsOpen] = useState(false);
  const isAdmin = user?.role === 'ADMIN';
  const isArchitect = user?.role === 'ARCHITECT';
  const isSupplier = user?.role === 'SUPPLIER';
  const hasWallet = !isAdmin && !!user;

  const { data: balance, isLoading: balanceLoading } = useWalletBalance(hasWallet);
  const { data: card, isLoading: cardLoading } = useWalletCard(hasWallet);
  const { data: transactions, isLoading: transactionsLoading } = useWalletTransactions(hasWallet);
  const { data: productsResponse } = useRewardProducts();
  const rewardProducts = (productsResponse as any)?.data || productsResponse || [];
  const [adminStats, setAdminStats] = useState<any>(null);

  const { data: allSuppliers, isLoading: suppliersLoading } = useSuppliersDirectory({});

  const fetchAdminStats = () => {
    if (!isAdmin) return;
    import('@stannel/api-client').then(({ fetchWithAuth, config, getHeaders }) => {
      fetchWithAuth(`${config.baseUrl}/admin/commission-stats`, {
        headers: getHeaders() as Record<string, string>,
      })
        .then(res => res.json())
        .then(data => setAdminStats(data))
        .catch(console.error);
    });
  };

  useEffect(() => {
    fetchAdminStats();
  }, [isAdmin]);

  useEffect(() => {
    const wsUrl = (process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') || 'ws://localhost:7070') + '/ws';
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        ws.onopen = async () => {
          try {
            const { getIdToken } = await import('@/lib/firebase');
            const token = await getIdToken();
            if (token && ws?.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'auth', token }));
            }
          } catch {}
        };
        ws.onmessage = () => {
          queryClient.invalidateQueries({ queryKey: ['wallet'] });
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          queryClient.invalidateQueries({ queryKey: ['supplier'] });
          fetchAdminStats();
        };
        ws.onclose = () => { reconnectTimeout = setTimeout(connect, 5000); };
        ws.onerror = () => {};
      } catch {}
    };

    connect();
    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  const currentRank = (card?.rank as keyof typeof rankConfig) || 'BRONZE';
  const rank = rankConfig[currentRank];
  const isLoading = balanceLoading || cardLoading;

  const totalEarned = balance?.totalEarned || 0;
  const progressPercent = Math.min(100, Math.round(((totalEarned - rank.minPoints) / (rank.maxPoints - rank.minPoints)) * 100));
  const points = balance?.points || 0;
  const cash = balance?.cash || 0;

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  const metalGradient = 'linear-gradient(135deg, #d8ba72 0%, #9f7645 100%)';
  const bronzeCardBg = 'linear-gradient(135deg, #7a5a44 0%, #a67c5b 30%, #6f4f3b 65%, #b08a68 100%)';
  const bronzeCardGloss = 'linear-gradient(120deg, rgba(255,255,255,0.22), rgba(255,255,255,0.03) 40%, transparent 60%)';
  const bronzeCardShadow = '0 18px 45px rgba(64,38,18,0.25), 0 8px 18px rgba(64,38,18,0.18)';
  const pageBg = '#f7f3f2';
  const darkStatBg = 'linear-gradient(180deg, #2b2d32, #1f2024)';
  const darkStatShadow = '0 12px 25px rgba(0,0,0,0.22)';
  const goldIconBg = 'linear-gradient(135deg, #d8ba72, #9e7746)';
  const goldIconShadow = '0 6px 18px rgba(201,155,74,0.35)';
  const goldShadow = '0 12px 30px rgba(64,38,18,0.20)';
  const goldShadowLight = '0 8px 20px rgba(64,38,18,0.14)';

  return (
    <div className="min-h-screen -mt-16 pt-20" style={{ background: pageBg }}>
      <div className="max-w-lg mx-auto px-4 pb-12">

        {/* ── Bronze Membership Card ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-3">
          <div className="relative rounded-[22px] overflow-hidden" style={{ background: bronzeCardBg, boxShadow: bronzeCardShadow }}>
            {/* Glossy overlay */}
            <div className="absolute inset-0" style={{ background: bronzeCardGloss }} />

            <div className="relative p-5">
              {/* Tier label */}
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-white/95 text-sm font-bold tracking-[2.5px] drop-shadow-sm">{rank.label}</span>
                <div className="w-6 h-6 rounded bg-white/15 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white/80 text-xs font-bold">{rank.badge}</span>
                </div>
              </div>

              {/* Main row: Balance - Progress - Points */}
              <div className="flex items-center justify-between mb-4">
                {/* Left: Cash balance */}
                <div className="text-center flex-1">
                  <p className="text-white/55 text-xs mb-1.5 font-medium">יתרת נקודות</p>
                  {isLoading ? (
                    <div className="h-6 w-20 mx-auto bg-white/10 rounded animate-pulse" />
                  ) : (
                    <p className="text-white text-xl font-bold drop-shadow-sm">₪{cash.toLocaleString()}</p>
                  )}
                </div>

                {/* Center: Circular Progress */}
                <div className="flex-shrink-0">
                  <CircularProgress percent={progressPercent} nextTier={rank.next} />
                </div>

                {/* Right: Points */}
                <div className="text-center flex-1">
                  <p className="text-white/55 text-xs mb-1.5 font-medium">רמת מאסטר</p>
                  {isLoading ? (
                    <div className="h-6 w-20 mx-auto bg-white/10 rounded animate-pulse" />
                  ) : (
                    <p className="text-white text-xl font-bold drop-shadow-sm">{points.toLocaleString()}</p>
                  )}
                </div>
              </div>

              {/* Bottom row */}
              <div className="flex items-center justify-end">
                <span className="text-[#e6cc8d]/80 text-xs flex items-center gap-1.5">
                  <Sparkles size={12} className="text-[#e6cc8d]" />
                  Admin כניסה מהירה
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Quick Actions Row (below card) ── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mb-3">
          <div className="flex justify-between gap-2">
            {[
              { label: 'שירות אישי', icon: Headphones, href: '/profile' },
              { label: 'ספקים', icon: Building2, href: '/suppliers' },
              { label: 'אירועים', icon: Calendar, href: '/events' },
              { label: 'הטבות', icon: Gift, href: '/rewards' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center gap-2 py-3 rounded-2xl hover:bg-white/50 transition-all group">
                <div className="w-11 h-11 rounded-[14px] flex items-center justify-center bg-white" style={{ boxShadow: '0 2px 8px rgba(64,38,18,0.06)' }}>
                  <item.icon size={20} className="text-[#7a5a44] group-hover:text-[#5a3d2a] transition-colors" strokeWidth={1.6} />
                </div>
                <span className="text-[11px] font-bold text-[#2b241d]">{item.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ── Benefits Banner ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-3">
          <div className="relative rounded-[20px] overflow-hidden h-[200px]" style={{ boxShadow: '0 16px 40px rgba(64,38,18,0.22)' }}>
            <ImageWithLoader
              src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80"
              alt="הטבות בלעדיות"
              fill
              sizes="(max-width: 512px) 100vw, 512px"
              className="object-cover brightness-[0.85] contrast-[1.1]"
            />
            {/* Cinematic overlay */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.05), rgba(0,0,0,0.55))' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />

            {/* Star badge */}
            <div className="absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,155,74,0.35)', backdropFilter: 'blur(6px)', boxShadow: '0 4px 12px rgba(201,155,74,0.2)' }}>
              <Star size={17} className="text-[#e6cc8d] fill-[#e6cc8d]" />
            </div>

            {/* Top label */}
            <p className="absolute top-4 right-4 text-white/50 text-xs font-medium tracking-wide">הטבות שמחכות לחבר</p>

            {/* Content */}
            <div className="absolute bottom-0 right-0 p-5">
              <h3 className="text-white text-[28px] font-bold leading-tight mb-2 drop-shadow-lg">הטבות<br />בלעדיות</h3>
              <p className="text-white/60 text-[13px] leading-relaxed mb-3">
                גישה לשלושות השירות,<br />הזדמנויות ותוכניות<br />הטבות ביוחד.
              </p>
              <Link href="/rewards" className="text-[#e6cc8d] text-[15px] font-bold hover:text-white transition-colors">
                ← לכל ההטבות
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ── Stats Grid (4 bronze/white cards) ── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-4 gap-2.5 mb-4">
          {[
            { icon: Wallet, value: isLoading ? '...' : `₪${cash.toLocaleString()}`, label: 'יתרה' },
            { icon: Receipt, value: isLoading ? '...' : (transactions?.length || 0).toString(), label: 'קבלות' },
            { icon: Star, value: isLoading ? '...' : points.toLocaleString(), label: 'נקודות' },
            { icon: BarChart3, value: isLoading ? '...' : `₪${totalEarned.toLocaleString()}`, label: 'מחזור המכירות' },
          ].map((stat, i) => {
            const IconComp = stat.icon;
            return (
              <div key={i} className="rounded-[16px] py-3.5 px-2 flex flex-col items-center gap-2 bg-white" style={{ boxShadow: '0 4px 12px rgba(64,38,18,0.08)', border: '1px solid #f0e6d2' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: metalGradient }}>
                  <IconComp size={19} className="text-white" />
                </div>
                <p className="text-[#2b241d] text-[13px] font-bold text-center leading-tight">{stat.value}</p>
                <p className="text-[11px] text-center text-[#8b7c69]">{stat.label}</p>
              </div>
            );
          })}
        </motion.div>

        {/* Admin Stats (for admin users) */}
        {isAdmin && adminStats && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: 'מחזור חשבוניות', value: `₪${adminStats.totalRevenue.toLocaleString()}`, href: '/admin?tab=invoices' },
              { label: 'נקודות אדריכלים', value: `${adminStats.architectPoints.toLocaleString()} נק׳`, href: '/admin?tab=users' },
              { label: 'חשבוניות ששולמו', value: adminStats.totalPaidInvoices.toString(), href: '/invoices?filter=paid' },
              { label: 'עמלה (2%)', value: `₪${adminStats.adminCommission.toLocaleString()}`, href: '/admin?tab=invoices' },
            ].map((stat, i) => (
              <Link key={i} href={stat.href} className="bg-white rounded-2xl p-4 group hover:border-[#C9A961]/30 border border-[#F2EAD8] transition-all" style={{ boxShadow: goldShadowLight }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[#8B6F3A] text-xs">{stat.label}</p>
                  <ChevronLeft size={14} className="text-[#C9A961] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[#4A3A1F] text-xl font-medium">{stat.value}</p>
              </Link>
            ))}
          </motion.div>
        )}

        {/* ── Quick Actions Title ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center justify-center gap-2 my-3">
          <span className="text-[#c99b4a] text-base">&#10022;</span>
          <span className="text-[#2b241d] text-base font-bold">פעולות מהירות</span>
          <span className="text-[#c99b4a] text-base">&#10022;</span>
        </motion.div>

        {/* ── Quick Actions Nav ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-5">
          <div className="flex justify-around mb-4">
            {quickActionCategories.map((category) => {
              const IconComponent = category.icon;
              const isActive = activeCategory === category.id;
              return (
                <button key={category.id} onClick={() => (category as any).directHref ? window.location.assign((category as any).directHref) : setActiveCategory(isActive ? null : category.id)} className="flex flex-col items-center gap-2 quick-action-btn">
                  <div
                    className={`flex items-center justify-center transition-all duration-300 ${
                      isActive ? 'scale-110' : ''
                    }`}
                    style={{
                      width: 48,
                      height: 48,
                      background: isActive ? metalGradient : 'transparent',
                      boxShadow: isActive ? '0 6px 20px rgba(201,155,74,0.4)' : 'none',
                      borderRadius: 18,
                    }}
                  >
                    <IconComponent size={20} className={isActive ? 'text-white' : 'text-[#7a5a44]'} strokeWidth={1.6} />
                  </div>
                  <span className="text-[11px] text-[#2b241d] font-bold">{category.label}</span>
                </button>
              );
            })}
          </div>

          {/* Expanded Sub-Items */}
          <AnimatePresence>
            {activeCategory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-2xl p-4 border border-[#F2EAD8]" style={{ boxShadow: goldShadowLight }}>
                  {activeCategory === 'suppliers' ? (
                    <div>
                      <h3 className="text-sm font-medium text-[#4A3A1F] mb-3">כל הספקים במערכת</h3>
                      {suppliersLoading ? (
                        <div className="grid grid-cols-2 gap-3">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-[#F2EAD8]/40 rounded-xl overflow-hidden animate-pulse">
                              <div className="aspect-[4/3] bg-[#F2EAD8]" />
                              <div className="p-2"><div className="h-3 w-16 bg-[#F2EAD8] rounded" /></div>
                            </div>
                          ))}
                        </div>
                      ) : allSuppliers?.data && allSuppliers.data.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {allSuppliers.data.map((supplier: any, index: number) => {
                            const coverImage = supplier.businessImages?.[0] || supplier.profileImage || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80';
                            return (
                              <motion.div key={supplier.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                                <Link href={`/suppliers/${supplier.id}`} className="block rounded-xl overflow-hidden border border-[#F2EAD8] hover:border-[#C9A961]/30 transition-all group">
                                  <div className="relative aspect-[4/3]">
                                    <Image src={coverImage} alt={supplier.companyName || ''} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized={coverImage.includes('localhost')} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-2">
                                      <h3 className="text-white font-medium text-xs">{supplier.companyName}</h3>
                                    </div>
                                  </div>
                                  <div className="p-2">
                                    <p className="text-[#8B6F3A] text-[10px] line-clamp-1">{supplier.description || 'צפה בפרופיל'}</p>
                                  </div>
                                </Link>
                              </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-6 text-center">
                          <Building2 size={28} className="mx-auto text-[#C9A961] mb-2" />
                          <p className="text-[#8B6F3A] text-sm">אין ספקים במערכת</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    quickActionCategories.filter(cat => cat.id === activeCategory).map(category => (
                      <div key={category.id} className="grid grid-cols-2 gap-3">
                        {category.items.map((item, index) => {
                          const ItemIcon = item.icon;
                          return (
                            <motion.div key={item.href} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                              <Link href={item.href} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[#F2EAD8] hover:border-[#C9A961]/30 transition-all group">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #FFFFFF, #F2EAD8)' }}>
                                  <ItemIcon size={18} className="text-[#C9A961]" />
                                </div>
                                <span className="text-xs font-semibold text-[#2b241d] text-center">{item.label}</span>
                              </Link>
                            </motion.div>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Recent Transactions (Collapsible) ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <button
            onClick={() => setTransactionsOpen(!transactionsOpen)}
            className="w-full rounded-[20px] p-4 flex items-center justify-between transition-all"
            style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', boxShadow: goldShadowLight, border: '1px solid rgba(201,155,74,0.08)' }}
          >
            <ChevronLeft size={18} className={`text-[#c99b4a] transition-transform duration-300 ${transactionsOpen ? '-rotate-90' : ''}`} />
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#2b241d]">תנועות אחרונות</span>
              <Clock size={18} className="text-[#c99b4a]" />
            </div>
          </button>
          <AnimatePresence>
            {transactionsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="rounded-[20px] p-5 mt-2" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', boxShadow: goldShadowLight, border: '1px solid rgba(201,155,74,0.08)' }}>
                  <div className="space-y-1">
                    {transactionsLoading ? (
                      [...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 py-3 border-b border-[#F2EAD8] animate-pulse">
                          <div className="w-9 h-9 bg-[#F2EAD8] rounded-xl" />
                          <div className="flex-1"><div className="h-3 w-28 bg-[#F2EAD8] rounded mb-1" /><div className="h-2.5 w-16 bg-[#F2EAD8]/60 rounded" /></div>
                          <div className="h-3 w-14 bg-[#F2EAD8] rounded" />
                        </div>
                      ))
                    ) : transactions && transactions.length > 0 ? (
                      transactions.slice(0, 5).map((tx: any, index: number) => {
                        const isCredit = tx.type === 'CREDIT';
                        const txDate = new Date(tx.createdAt);
                        return (
                          <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="flex items-center gap-3 py-3 border-b border-[#F2EAD8] last:border-0">
                            <div className={`p-2 rounded-xl ${isCredit ? 'bg-green-50' : 'bg-red-50'}`}>
                              {isCredit ? <ArrowUpRight className="text-green-600" size={16} /> : <ArrowDownRight className="text-red-500" size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[#2b241d] font-semibold text-[15px] truncate">{tx.description || (isCredit ? 'זיכוי' : 'חיוב')}</p>
                              <p className="text-[#8b7c69] text-[13px]">{txDate.toLocaleDateString('he-IL')} {txDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div className={`font-bold text-[15px] ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                              {isCredit ? '+' : '-'}{Math.abs(tx.amount || 0).toLocaleString()} {tx.currency === 'ILS' ? '₪' : 'נק׳'}
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#F2EAD8] flex items-center justify-center">
                          <Wallet size={24} className="text-[#C9A961]" />
                        </div>
                        <p className="text-[#8B6F3A] text-sm">אין תנועות להצגה</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Suppliers Carousel ── */}
        <SuppliersCarousel metalGradient={metalGradient} goldShadowLight={goldShadowLight} allSuppliers={allSuppliers} suppliersLoading={suppliersLoading} />

        {/* ── Magazine Carousel ── */}
        <MagazineCarousel metalGradient={metalGradient} goldShadowLight={goldShadowLight} />

        {/* ── Rewards Carousel ── */}
        {rewardProducts.length > 0 && (
          <RewardsCarousel products={rewardProducts} metalGradient={metalGradient} goldShadowLight={goldShadowLight} />
        )}

        {/* Spacer for bottom nav */}
        <div className="h-24" />
      </div>

      {/* ── Bottom Navigation ── */}
      <div className="bottom-nav">
        <Link href="/rewards" className="bottom-nav-item">
          <Gift size={20} />
          <span>הטבות</span>
        </Link>
        <Link href="/suppliers" className="bottom-nav-item">
          <Search size={20} />
          <span>ספקים</span>
        </Link>
        <Link href="/wallet" className="bottom-nav-home">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </Link>
        <Link href="/invoices" className="bottom-nav-item">
          <FileText size={20} />
          <span>חשבוניות</span>
        </Link>
        <Link href="/profile" className="bottom-nav-item">
          <Users size={20} />
          <span>פרופיל</span>
        </Link>
      </div>
    </div>
  );
}
