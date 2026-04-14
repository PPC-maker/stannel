'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import ImageWithLoader from '@/components/ui/ImageWithLoader';
import { useState, useEffect } from 'react';
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

  return (
    <div className="min-h-screen -mt-16 pt-20" style={{ background: 'linear-gradient(180deg, #f5f0eb 0%, #ede7e0 50%, #f5f0eb 100%)' }}>
      <div className="max-w-lg mx-auto px-5 pb-12">

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4 pt-2"
        >
          <h1 className="text-2xl font-bold text-[#2d2d2d] mb-0.5">
            שלום {firstName} 👋
          </h1>
          <p className="text-[#8a8a8a] text-sm">
            {isAdmin ? 'מה נעשה היום?' : 'מה תרצה לעשות היום?'}
          </p>
        </motion.div>

        {/* Digital Membership Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <div className="relative rounded-3xl shadow-xl" style={{ WebkitTransform: 'translateZ(0)' }}>
            {/* Card Background - Green Leather Texture */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2d5a3d] via-[#3a6b4a] to-[#1e4430]" />
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
              {/* Subtle grain overlay */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
              }} />
            </div>

            {/* Card Content */}
            <div className="relative p-5 flex flex-col gap-4">
              {/* Top Row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {/* Card Icon */}
                  <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/15" style={{ WebkitBackdropFilter: 'blur(4px)' }}>
                    <CreditCard size={22} className="text-white/80" />
                  </div>
                  {/* Accumulation Link */}
                  <Link href="/rewards" className="flex items-center gap-1 group">
                    <span className="text-white/70 text-sm font-medium group-hover:text-white/90 transition-colors">
                      צבירה ומימוש
                    </span>
                    <ChevronLeft size={14} className="text-white/50 group-hover:text-white/70 transition-colors" />
                    <ChevronLeft size={14} className="text-white/40 -mr-2" />
                    <ChevronLeft size={14} className="text-white/30 -mr-2" />
                  </Link>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-white/60 text-xs tracking-[0.2em] font-medium">STANNEL CLUB</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-base tracking-wider">{rank.label}</span>
                    <div className="w-7 h-7 rounded-full bg-emerald-300/30 flex items-center justify-center border border-emerald-200/30">
                      <span className="text-white text-xs font-bold">{rank.badge}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Number */}
              <div>
                {isLoading ? (
                  <div className="h-7 w-56 bg-white/10 rounded animate-pulse" />
                ) : (
                  <p className="text-xl font-mono text-white tracking-[0.15em] font-medium" dir="ltr">
                    {card?.cardNumber
                      ? `${card.cardNumber.slice(0, 4)} •••• •••• ••••`
                      : '**** •••• •••• ••••'}
                  </p>
                )}
              </div>

              {/* Bottom Row */}
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-white/50 text-xs mb-0.5">{isAdmin ? 'עמלה' : 'Points'}</p>
                  <p className="text-white text-2xl font-bold">
                    {isAdmin
                      ? (adminStats ? `₪${adminStats.adminCommission.toLocaleString()}` : '...')
                      : (isLoading ? '...' : (balance?.points || 0).toLocaleString())
                    }
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-white/50 text-xs mb-0.5">מספר כרטיס</p>
                  <p className="text-white font-semibold text-base">
                    {isSupplier ? (card as any)?.holderName : user?.name || 'משתמש'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Tiles - 2x2 Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 gap-3 mb-4"
        >
          {[
            { id: 'events', label: 'אירועים', href: '/events', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80' },
            { id: 'rewards', label: 'חנות מתנות', href: '/rewards', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80' },
            { id: 'tools', label: 'כלי עיצוב', href: '/invoices', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80' },
            { id: 'suppliers', label: 'פגישה עם ספק', href: '/suppliers', image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80' },
          ].map((tile, index) => (
            <motion.div
              key={tile.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <Link
                href={tile.href}
                className="block relative rounded-2xl overflow-hidden shadow-md group"
                style={{ aspectRatio: '1.4/1' }}
              >
                <ImageWithLoader
                  src={tile.image}
                  alt={tile.label}
                  fill
                  sizes="(max-width: 768px) 50vw, 300px"
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-[#2d5a3d]/85 backdrop-blur-sm py-2.5 px-3 rounded-b-2xl">
                  <p className="text-white font-bold text-sm tracking-wide text-center">{tile.label}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Admin Stats Row */}
        {isAdmin && adminStats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 gap-3 mb-6"
          >
            {[
              { label: 'מחזור חשבוניות', value: `₪${adminStats.totalRevenue.toLocaleString()}`, color: 'text-emerald-700' },
              { label: 'נקודות אדריכלים', value: `${adminStats.architectPoints.toLocaleString()} נק׳`, color: 'text-purple-700' },
              { label: 'חשבוניות ששולמו', value: adminStats.totalPaidInvoices.toString(), color: 'text-amber-700' },
              { label: 'עמלה (2%)', value: `₪${adminStats.adminCommission.toLocaleString()}`, color: 'text-emerald-700' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/70 backdrop-blur rounded-2xl p-4 border border-white/50 shadow-sm">
                <p className="text-[#8a8a8a] text-xs mb-1">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Balance + Progress combined row */}
        {!isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-4"
          >
            <div className="bg-white/70 backdrop-blur rounded-2xl p-3.5 border border-white/50 shadow-sm">
              {/* Balance row */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-[#8a8a8a] text-[10px]">נקודות זמינות</p>
                    <p className="text-xl font-bold text-[#2d5a3d]">
                      {isLoading ? '...' : (balance?.points || 0).toLocaleString()}
                    </p>
                  </div>
                  {!isSupplier && (
                    <div className="border-r border-[#e5ddd5] pr-4">
                      <p className="text-[#8a8a8a] text-[10px]">יתרת מזומן</p>
                      <p className="text-xl font-bold text-[#2d5a3d]">
                        ₪{isLoading ? '...' : (balance?.cash || 0).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-[#8a8a8a]">{pointsToNextRank.toLocaleString()} לדרגה הבאה</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-[#e5ddd5] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-[#2d5a3d] to-[#4a8c5c] rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-5"
        >
          <div className="bg-white/70 backdrop-blur rounded-3xl p-5 border border-white/50 shadow-sm">
            <h2 className="text-lg font-bold text-[#2d2d2d] mb-5 flex items-center justify-center gap-2">
              <Sparkles size={18} className="text-[#2d5a3d]" />
              פעולות מהירות
            </h2>

            {/* Circular Category Icons */}
            <div
              className="flex gap-4 md:gap-3 py-2 px-2 overflow-x-auto md:overflow-visible md:justify-center"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {quickActionCategories.map((category) => {
                const IconComponent = category.icon;
                const isActive = activeCategory === category.id;

                return (
                  <motion.button
                    key={category.id}
                    onClick={() => setActiveCategory(isActive ? null : category.id)}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-3 min-w-[72px] md:min-w-[76px] flex-shrink-0"
                  >
                    <div
                      className={`
                        w-20 h-20 md:w-20 md:h-20 rounded-full flex items-center justify-center
                        transition-all duration-300 border-2
                        ${isActive
                          ? `${category.color} border-white/30 shadow-lg scale-110`
                          : 'bg-[#e5ddd5]/50 border-[#d5cdc5] hover:bg-[#e5ddd5]'
                        }
                      `}
                    >
                      <IconComponent
                        size={32}
                        className={`transition-colors duration-200 ${isActive ? 'text-white' : category.iconColor}`}
                      />
                    </div>
                    <span className={`text-xs font-medium text-center transition-colors duration-200 ${isActive ? 'text-[#2d2d2d]' : 'text-[#8a8a8a]'}`}>
                      {category.label}
                    </span>
                  </motion.button>
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
                  className="mt-5 pt-5 border-t border-[#e5ddd5] overflow-hidden"
                >
                  {/* Suppliers Grid */}
                  {activeCategory === 'suppliers' ? (
                    <div>
                      <h3 className="text-base font-semibold text-[#2d2d2d] mb-3">כל הספקים במערכת</h3>
                      {suppliersLoading ? (
                        <div className="grid grid-cols-2 gap-3">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-[#e5ddd5]/40 rounded-2xl overflow-hidden animate-pulse">
                              <div className="aspect-[4/3] bg-[#d5cdc5]/50" />
                              <div className="p-2.5">
                                <div className="h-3.5 w-20 bg-[#d5cdc5]/50 rounded mb-1.5" />
                                <div className="h-3 w-14 bg-[#d5cdc5]/30 rounded" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : allSuppliers?.data && allSuppliers.data.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {allSuppliers.data.map((supplier: any, index: number) => {
                            const coverImage = supplier.businessImages?.[0] || supplier.profileImage || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80';
                            return (
                              <motion.div
                                key={supplier.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                <Link
                                  href={`/suppliers/${supplier.id}`}
                                  className="block bg-[#e5ddd5]/40 rounded-2xl overflow-hidden border border-[#d5cdc5]/50 hover:border-[#2d5a3d]/30 transition-all group"
                                >
                                  <div className="relative aspect-[4/3]">
                                    <Image
                                      src={coverImage}
                                      alt={supplier.companyName || ''}
                                      fill
                                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                                      unoptimized={coverImage.includes('localhost')}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                                      <h3 className="text-white font-bold text-xs tracking-wide uppercase">{supplier.companyName}</h3>
                                    </div>
                                  </div>
                                  <div className="p-2.5">
                                    <p className="text-[#8a8a8a] text-[10px] line-clamp-2">{supplier.description || 'לחץ לצפייה בפרופיל'}</p>
                                    <div className="mt-1.5 flex items-center justify-between">
                                      <span className="text-[#2d5a3d] text-[10px] font-medium">צפה בפרופיל</span>
                                      <ArrowLeft size={12} className="text-[#2d5a3d]" />
                                    </div>
                                  </div>
                                </Link>
                              </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <Building2 size={32} className="mx-auto text-[#8a8a8a] mb-2" />
                          <p className="text-[#8a8a8a] text-sm">אין ספקים במערכת</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Other Category Items */
                    quickActionCategories
                      .filter(cat => cat.id === activeCategory)
                      .map(category => (
                        <div key={category.id} className="grid grid-cols-2 gap-3">
                          {category.items.map((item, index) => {
                            const ItemIcon = item.icon;
                            return (
                              <motion.div
                                key={item.href}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                <Link
                                  href={item.href}
                                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#e5ddd5]/40 border border-[#d5cdc5]/50 hover:bg-[#e5ddd5]/70 transition-all duration-200 group"
                                >
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/60 group-hover:bg-white/80 transition-colors">
                                    <ItemIcon size={20} className={category.iconColor} />
                                  </div>
                                  <span className="text-xs font-medium text-[#2d2d2d] text-center group-hover:text-[#2d5a3d] transition-colors">
                                    {item.label}
                                  </span>
                                </Link>
                              </motion.div>
                            );
                          })}
                        </div>
                      ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className="bg-white/70 backdrop-blur rounded-3xl p-5 border border-white/50 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#2d2d2d] flex items-center gap-2">
                <Clock size={18} className="text-[#2d5a3d]" />
                תנועות אחרונות
              </h2>
            </div>

            <div className="space-y-1">
              {transactionsLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-[#e5ddd5]/50 animate-pulse">
                    <div className="w-10 h-10 bg-[#e5ddd5] rounded-xl" />
                    <div className="flex-1">
                      <div className="h-3.5 w-32 bg-[#e5ddd5] rounded mb-1.5" />
                      <div className="h-3 w-20 bg-[#e5ddd5]/60 rounded" />
                    </div>
                    <div className="h-4 w-16 bg-[#e5ddd5] rounded" />
                  </div>
                ))
              ) : transactions && transactions.length > 0 ? (
                transactions.slice(0, 5).map((tx: any, index: number) => {
                  const isCredit = tx.type === 'CREDIT';
                  const txDate = new Date(tx.createdAt);

                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 py-3 border-b border-[#e5ddd5]/50 last:border-0"
                    >
                      <div className={`p-2.5 rounded-xl ${isCredit ? 'bg-green-100' : 'bg-red-100'}`}>
                        {isCredit ? (
                          <ArrowUpRight className="text-green-600" size={18} />
                        ) : (
                          <ArrowDownRight className="text-red-500" size={18} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#2d2d2d] font-medium text-sm truncate">{tx.description || (isCredit ? 'זיכוי' : 'חיוב')}</p>
                        <p className="text-[#8a8a8a] text-xs">
                          {txDate.toLocaleDateString('he-IL')} {txDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className={`font-bold text-sm ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                        {isCredit ? '+' : '-'}{Math.abs(tx.amount || 0).toLocaleString()} {tx.currency === 'ILS' ? '₪' : 'נק׳'}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#e5ddd5]/50 flex items-center justify-center">
                    <Wallet size={28} className="text-[#8a8a8a]" />
                  </div>
                  <p className="text-[#8a8a8a] text-sm">אין תנועות להצגה</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
