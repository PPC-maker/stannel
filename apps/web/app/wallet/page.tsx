'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import ImageWithLoader from '@/components/ui/ImageWithLoader';
import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { useWalletBalance, useWalletCard, useWalletTransactions, useSuppliersDirectory } from '@/lib/api-hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import Link from 'next/link';

const rankConfig = {
  BRONZE: { label: 'BRONZE', color: 'text-amber-700', bg: 'bg-amber-100', emoji: '🥉', badge: '3', minPoints: 0, maxPoints: 5000 },
  SILVER: { label: 'SILVER', color: 'text-gray-500', bg: 'bg-gray-100', emoji: '🥈', badge: '2', minPoints: 5000, maxPoints: 15000 },
  GOLD: { label: 'GOLD', color: 'text-yellow-600', bg: 'bg-yellow-100', emoji: '🥇', badge: '1', minPoints: 15000, maxPoints: 50000 },
  PLATINUM: { label: 'PLATINUM', color: 'text-cyan-500', bg: 'bg-cyan-100', emoji: '💎', badge: '0', minPoints: 50000, maxPoints: 100000 },
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
    items: [
      { label: 'דוחות חשבוניות', href: '/invoices', icon: FileText },
      { label: 'הגדרות', href: '/settings', icon: Wrench },
    ],
  },
  {
    id: 'suppliers',
    label: 'ספקים',
    icon: Building2,
    color: 'bg-blue-500',
    iconColor: 'text-blue-500',
    items: [
      { label: 'כל הספקים', href: '/suppliers', icon: Building2 },
      { label: 'ספקים מומלצים', href: '/suppliers?filter=recommended', icon: Award },
      { label: 'הספקים שלי', href: '/suppliers?filter=my', icon: Users },
    ],
  },
  {
    id: 'rewards',
    label: 'מתנות והטבות',
    icon: Gift,
    color: 'bg-pink-500',
    iconColor: 'text-pink-500',
    items: [
      { label: 'קטלוג הטבות', href: '/rewards', icon: ShoppingBag },
      { label: 'ההטבות שלי', href: '/rewards?filter=my', icon: Gift },
      { label: 'היסטוריית מימושים', href: '/rewards?filter=history', icon: History },
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
  { title: 'בין אייקונים מקומיים לאופק בינלאומי חדש | קימל אשכולות', excerpt: 'משרד האדריכלים קימל אשכולות מציין השנה 40 שנות פעילות', image: 'https://stannelmarketplace.com/wp-content/uploads/2025/12/22.jpg', url: 'https://stannelmarketplace.com/%d7%91%d7%99%d7%9f-%d7%90%d7%99%d7%99%d7%a7%d7%95%d7%a0%d7%99%d7%9d/' },
  { title: 'הפנינה השחורה – בית עכשווי המאזן בין חומריות, אור וצל', excerpt: 'מכל זווית ובכל מבט, הבית הזה מרשים ומוקפד', image: 'https://stannelmarketplace.com/wp-content/uploads/2025/11/שער.jpg', url: 'https://stannelmarketplace.com/%d7%94%d7%a4%d7%a0%d7%99%d7%a0%d7%94-%d7%94%d7%a9%d7%97%d7%95%d7%a8%d7%94/' },
  { title: 'בית חלומי בנחלה – משפחה ישראלית פוגשת סטייל איטלקי', excerpt: 'שיפוץ בית במושב במרכז הארץ עבור בני זוג בגיל השלישי', image: 'https://stannelmarketplace.com/wp-content/uploads/2025/09/שער-אורלי.jpg', url: 'https://stannelmarketplace.com/%d7%91%d7%99%d7%aa-%d7%97%d7%9c%d7%95%d7%9e%d7%99/' },
  { title: 'להוריד הילוך מעל העיר | פנטהאוז בדרום תל אביב', excerpt: 'בדרום תל־אביב, בלב אזור תעשייתי של נגריות, בתי מלאכה וחנויות', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/02/Yael.jpg', url: 'https://stannelmarketplace.com/%d7%9c%d7%94%d7%95%d7%a8%d7%99%d7%93-%d7%94%d7%99%d7%9c%d7%95%d7%9a/' },
  { title: 'יוצרת העולמות של קפה גן סיפור | שני רינג', excerpt: 'המסעדות של גן סיפור אינן פועלות בתוך המרחב העירוני הרגיל', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/02/שער-שני.jpg', url: 'https://stannelmarketplace.com/2574/' },
  { title: 'לחיות את העיר בקצב אחר | דירת לופט בלב תל אביב', excerpt: 'מגדל תל־אביבי גבוה או שכונה ותיקה ובעלת אופי?', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/01/שער-קטן-1.jpg', url: 'https://stannelmarketplace.com/%d7%9c%d7%97%d7%99%d7%95%d7%aa-%d7%90%d7%aa-%d7%94%d7%a2%d7%99%d7%a8/' },
  { title: 'בין קצב גלובלי לשקט מקומי | בית על חופי אשקלון', excerpt: 'על רצועת החוף של אשקלון שוכן פרויקט מגורים יוקרתי בשטח של 560 מ״ר', image: 'https://stannelmarketplace.com/wp-content/uploads/2026/01/שער-כתבה-1.jpg', url: 'https://stannelmarketplace.com/%d7%91%d7%99%d7%9f-%d7%a7%d7%a6%d7%91/' },
  { title: 'מינימליזם יוקרתי בהרמונייה עם הטבע', excerpt: 'ליעד יוסף, מעצב פנים שכבר ביסס את מעמדו גם ככוכב רשת ומשפיען', image: 'https://stannelmarketplace.com/wp-content/uploads/2025/09/15.png', url: 'https://stannelmarketplace.com/%d7%9e%d7%99%d7%a0%d7%99%d7%9e%d7%9c%d7%99%d7%96%d7%9d/' },
  { title: 'איך נראה "חלומודרני" בבית במזכרת בתיה', excerpt: 'אדריכל רז קשלס, העוסק בבנייה פרטית לצד תכנון מסחרי ומשרדים', image: 'https://stannelmarketplace.com/wp-content/uploads/2025/09/13.png', url: 'https://stannelmarketplace.com/%d7%90%d7%99%d7%9a-%d7%a0%d7%a8%d7%90%d7%94/' },
  { title: 'אדריכלות טוטאלית בסביון – חלל, חומר וטבע', excerpt: 'לתפיסתו של אדריכל סטפן מטי, המבנה הוא שיח בין האדם לסביבתו', image: 'https://stannelmarketplace.com/wp-content/uploads/2025/09/14.png', url: 'https://stannelmarketplace.com/stefan-matty-architect/' },
];

function MagazineCarousel({ metalGradient, goldShadowLight }: { metalGradient: string; goldShadowLight: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % magazineArticles.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Show 1 article on mobile, 3 on desktop
  const getVisibleArticles = useCallback(() => {
    const articles = [];
    for (let i = 0; i < 3; i++) {
      articles.push(magazineArticles[(currentIndex + i) % magazineArticles.length]);
    }
    return articles;
  }, [currentIndex]);

  const visible = getVisibleArticles();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: metalGradient }}>
            <span className="text-sm font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>S</span>
          </div>
          <div>
            <h3 className="text-[#4A3A1F] font-bold text-sm tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>stannel magazine</h3>
            <p className="text-[#C9A961] text-[10px]">השראה, טרנדים ועיצוב</p>
          </div>
        </div>
        <a href="https://stannelmarketplace.com/" target="_blank" rel="noopener noreferrer" className="text-[#C9A961] text-xs hover:text-[#8B6F3A] transition-colors flex items-center gap-1">
          כל הכתבות
          <ChevronLeft size={14} />
        </a>
      </div>

      {/* Carousel */}
      <div className="overflow-hidden rounded-2xl bg-white border border-[#F2EAD8]" style={{ boxShadow: goldShadowLight }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.4 }}
          >
            {/* Mobile: 1 article */}
            <a href={visible[0].url} target="_blank" rel="noopener noreferrer" className="block sm:hidden group">
              <div className="relative h-48 overflow-hidden">
                <img src={visible[0].image} alt={visible[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-[9px] font-medium text-white/90" style={{ background: metalGradient }}>
                  stannel magazine
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h4 className="text-white font-bold text-sm leading-snug mb-1">{visible[0].title}</h4>
                  <p className="text-white/70 text-xs line-clamp-2">{visible[0].excerpt}</p>
                </div>
              </div>
            </a>

            {/* Desktop: 3 articles */}
            <div className="hidden sm:grid grid-cols-3 gap-[5px] bg-white p-[5px]">
              {visible.map((article, i) => (
                <a key={i} href={article.url} target="_blank" rel="noopener noreferrer" className="group rounded-xl overflow-hidden">
                  <div className="relative h-44 overflow-hidden">
                    <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    {i === 0 && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[8px] font-medium text-white/90" style={{ background: metalGradient }}>
                        stannel magazine
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="text-[#4A3A1F] font-semibold text-xs leading-snug mb-1 line-clamp-2 group-hover:text-[#8B6F3A] transition-colors">{article.title}</h4>
                    <p className="text-[#8B6F3A]/70 text-[10px] line-clamp-2">{article.excerpt}</p>
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots indicator */}
        <div className="flex justify-center gap-1 pb-3 pt-1">
          {magazineArticles.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'w-5' : 'w-1.5'
              }`}
              style={{ background: i === currentIndex ? metalGradient : '#E2D5B8' }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function WalletPage() {
  const { isReady } = useAuthGuard();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const isAdmin = user?.role === 'ADMIN';
  const isArchitect = user?.role === 'ARCHITECT';
  const isSupplier = user?.role === 'SUPPLIER';
  const hasWallet = !isAdmin && !!user;

  const { data: balance, isLoading: balanceLoading } = useWalletBalance(hasWallet);
  const { data: card, isLoading: cardLoading } = useWalletCard(hasWallet);
  const { data: transactions, isLoading: transactionsLoading } = useWalletTransactions(hasWallet);
  const [adminStats, setAdminStats] = useState<any>(null);

  // Suppliers data for expanded view
  const { data: allSuppliers, isLoading: suppliersLoading } = useSuppliersDirectory({}, activeCategory === 'suppliers' && (isAdmin || isArchitect));

  // Fetch admin commission stats
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

  // WebSocket for real-time wallet updates
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
  const progressPercent = Math.min(100, ((totalEarned - rank.minPoints) / (rank.maxPoints - rank.minPoints)) * 100);
  const pointsToNextRank = Math.max(0, rank.maxPoints - totalEarned);

  // Get first name for greeting
  const firstName = user?.name?.split(' ')[0] || 'משתמש';

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  const metalGradient = 'linear-gradient(135deg, #E8C97D 0%, #C9A961 18%, #DDB870 38%, #A88845 55%, #E5C580 72%, #B8945A 90%, #8B6F3A 100%)';
  const shineOverlay = 'linear-gradient(135deg, transparent 0%, rgba(255,250,220,0.3) 45%, transparent 100%)';
  const marbleBg = `radial-gradient(ellipse 90% 90% at 15% 10%, rgba(229,197,128,0.18), transparent), radial-gradient(ellipse 100% 100% at 90% 30%, rgba(201,169,97,0.12), transparent), radial-gradient(ellipse 110% 110% at 30% 90%, rgba(184,148,90,0.10), transparent), #F6F1E7`;
  const goldShadow = '0 6px 24px rgba(139,111,58,0.18), 0 2px 8px rgba(139,111,58,0.12)';
  const goldShadowLight = '0 4px 16px rgba(139,111,58,0.12), 0 1px 4px rgba(139,111,58,0.08)';

  return (
    <div className="min-h-screen -mt-16 pt-20" style={{ background: marbleBg }}>
      <div className="max-w-lg mx-auto px-4 pb-12">

        {/* ── MemberCard ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-3">
          <div className="relative rounded-2xl overflow-hidden" style={{ boxShadow: goldShadow }}>
            <div className="absolute inset-0" style={{ background: metalGradient }} />
            <div className="absolute inset-0" style={{ background: shineOverlay }} />
            <div className="relative p-5 flex flex-col gap-4">
              {/* Top Row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[rgba(255,250,220,0.4)] flex items-center justify-center">
                    <span className="text-[#4A3A1F] text-xs font-medium">{rank.badge}</span>
                  </div>
                  <span className="text-[#4A3A1F] text-sm font-medium tracking-[1.5px]">{rank.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/rewards" className="text-[#4A3A1F]/70 text-[9px] hover:text-[#4A3A1F] transition-colors">
                    צריכה ושימוש &laquo;&laquo;
                  </Link>
                  <div className="w-7 h-6 rounded overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8C97D, #8B6F3A)' }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="0" y="0" width="6" height="6" rx="1" stroke="#4A3A1F" strokeWidth="1.2"/><rect x="10" y="0" width="6" height="6" rx="1" stroke="#4A3A1F" strokeWidth="1.2"/><rect x="0" y="10" width="6" height="6" rx="1" stroke="#4A3A1F" strokeWidth="1.2"/><rect x="10" y="10" width="6" height="6" rx="1" stroke="#4A3A1F" strokeWidth="1.2"/></svg>
                  </div>
                </div>
              </div>

              {/* Card Number + Glossy Dots */}
              <div className="flex flex-col items-center gap-2">
                {isLoading ? (
                  <div className="h-5 w-40 bg-[rgba(255,250,220,0.3)] rounded animate-pulse" />
                ) : (
                  <p className="text-base text-[#4A3A1F] tracking-[3px] font-medium" dir="ltr">
                    {card?.cardNumber ? card.cardNumber.slice(0, 4) : 'cmnq'}
                  </p>
                )}
                <div className="flex items-center gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={`a${i}`} className="w-2.5 h-2.5 rounded-full" style={{ background: 'radial-gradient(circle at 30% 30%, #FFE9A8, #C9A961, #8B6F3A)' }} />
                  ))}
                  <div className="w-4" />
                  {[...Array(4)].map((_, i) => (
                    <div key={`b${i}`} className="w-2.5 h-2.5 rounded-full" style={{ background: 'radial-gradient(circle at 30% 30%, #FFE9A8, #C9A961, #8B6F3A)' }} />
                  ))}
                </div>
              </div>

              {/* Bottom Row */}
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[#4A3A1F]/60 text-[9px] mb-0.5">מספר כרטיס</p>
                  <p className="text-[#4A3A1F] text-sm font-medium">
                    {isSupplier ? (card as any)?.holderName : user?.name || 'יפעת לייט'}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-[#4A3A1F]/60 text-[9px] mb-0.5">{isAdmin ? 'עמלה' : 'Points'}</p>
                  <p className="text-[#4A3A1F] text-sm font-medium">
                    {isAdmin
                      ? (adminStats ? `₪${adminStats.adminCommission.toLocaleString()}` : '...')
                      : (isLoading ? '...' : (balance?.points || 0).toLocaleString())
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── HeroCard Carousel ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-3">
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {[
              { label: 'חנות מתנות אקסקלוסיבית', href: '/rewards', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80' },
              { label: 'אירועים', href: '/events', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80' },
              { label: 'כלי עיצוב', href: '/tools', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80' },
              { label: 'פגישה עם ספק', href: '/suppliers', image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80' },
            ].map((slide, i, arr) => (
              <Link key={i} href={slide.href} className="flex-shrink-0 group" style={{ width: '85%' }}>
                <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: goldShadow }}>
                  <div className="relative h-40">
                    <ImageWithLoader src={slide.image} alt={slide.label} fill sizes="85vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    {/* Badge */}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] text-[#4A3A1F] font-medium" style={{ background: metalGradient }}>
                      {i + 1}/{arr.length}
                    </div>
                  </div>
                  {/* Gift icon floating */}
                  <div className="flex justify-center -mt-5 relative z-10">
                    <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center" style={{ background: metalGradient, boxShadow: '0 0 12px rgba(201,169,97,0.35)' }}>
                      <Gift size={18} className="text-white" />
                    </div>
                  </div>
                  <div className="text-center pb-4 pt-1">
                    <p className="text-[#4A3A1F] text-sm font-medium">{slide.label}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ── ProgressCard ── */}
        {!isAdmin && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-3 mx-1">
            <div className="bg-white rounded-2xl p-4" style={{ boxShadow: goldShadowLight }}>
              <div className="flex items-center mb-3">
                <div className="flex-1 text-center">
                  <p className="text-[#8B6F3A] text-[10px]">דרגה הבאה</p>
                  <p className="text-[#4A3A1F] text-sm font-medium">{pointsToNextRank.toLocaleString()} נקודות</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-[#8B6F3A] text-[10px]">יתרה נוכחית</p>
                  <p className="text-[#4A3A1F] text-sm font-medium">
                    {isLoading ? '...' : `${(balance?.cash || 0).toLocaleString()} ₪`}
                  </p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-[#8B6F3A] text-[10px]">נקודות וזיכויים</p>
                  <p className="text-[#4A3A1F] text-sm font-medium">
                    {isLoading ? '...' : (balance?.points || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="w-full h-2 bg-[#F2EAD8] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: metalGradient, boxShadow: '0 0 12px rgba(201,169,97,0.35)' }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Admin Stats */}
        {isAdmin && adminStats && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'מחזור חשבוניות', value: `₪${adminStats.totalRevenue.toLocaleString()}`, href: '/admin?tab=invoices' },
              { label: 'נקודות אדריכלים', value: `${adminStats.architectPoints.toLocaleString()} נק׳`, href: '/admin?tab=users' },
              { label: 'חשבוניות ששולמו', value: adminStats.totalPaidInvoices.toString(), href: '/invoices?filter=paid' },
              { label: 'עמלה (2%)', value: `₪${adminStats.adminCommission.toLocaleString()}`, href: '/admin?tab=invoices' },
            ].map((stat, i) => (
              <Link key={i} href={stat.href} className="bg-white rounded-2xl p-4 group hover:border-[#C9A961]/30 border border-transparent transition-all" style={{ boxShadow: goldShadowLight }}>
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center justify-center gap-2 my-4">
          <span className="text-[#C9A961] text-sm">&#10022;</span>
          <span className="text-[#4A3A1F] text-sm font-medium">פעולות מהירות</span>
          <span className="text-[#C9A961] text-sm">&#10022;</span>
        </motion.div>

        {/* ── QuickActionsNav ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-5">
          <div className="flex justify-around mb-4">
            {quickActionCategories.slice(0, 4).map((category) => {
              const IconComponent = category.icon;
              const isActive = activeCategory === category.id;
              return (
                <button key={category.id} onClick={() => setActiveCategory(isActive ? null : category.id)} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-13 h-13 rounded-full flex items-center justify-center border transition-all duration-300 ${
                      isActive ? 'border-[#C9A961] scale-110' : 'border-[#C9A961]/50 hover:border-[#C9A961]'
                    }`}
                    style={{ width: 52, height: 52, background: isActive ? metalGradient : 'linear-gradient(180deg, #FFFFFF, #F2EAD8)', boxShadow: isActive ? '0 4px 16px rgba(201,169,97,0.35)' : goldShadowLight }}
                  >
                    <IconComponent size={22} className={isActive ? 'text-white' : 'text-[#C9A961]'} strokeWidth={1.6} />
                  </div>
                  <span className="text-[9px] text-[#4A3A1F]">{category.label}</span>
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
                                <span className="text-[10px] font-medium text-[#4A3A1F] text-center">{item.label}</span>
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

        {/* ── Recent Transactions ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="bg-white rounded-2xl p-5 border border-[#F2EAD8]" style={{ boxShadow: goldShadowLight }}>
            <h2 className="text-sm font-medium text-[#4A3A1F] mb-4 flex items-center gap-2">
              <Clock size={16} className="text-[#C9A961]" />
              תנועות אחרונות
            </h2>
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
                        <p className="text-[#4A3A1F] font-medium text-sm truncate">{tx.description || (isCredit ? 'זיכוי' : 'חיוב')}</p>
                        <p className="text-[#8B6F3A]/60 text-xs">{txDate.toLocaleDateString('he-IL')} {txDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className={`font-medium text-sm ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
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

        {/* ── Magazine Carousel ── */}
        <MagazineCarousel metalGradient={metalGradient} goldShadowLight={goldShadowLight} />

        <div className="h-6" />
      </div>
    </div>
  );
}
