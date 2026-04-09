'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';
import {
  Wallet,
  CreditCard,
  TrendingUp,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Gift,
  Building2,
  User,
  Camera,
  FileUp,
  Calendar,
  Wrench,
  Users,
  ShoppingBag,
  FileText,
  History,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { useWalletBalance, useWalletCard, useWalletTransactions, useSuppliers } from '@/lib/api-hooks';
import { useAuth } from '@/lib/auth-context';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import Link from 'next/link';

const rankConfig = {
  BRONZE: { label: 'ברונזה', color: 'text-amber-400', bg: 'bg-amber-500/20', emoji: '🥉', minPoints: 0, maxPoints: 5000 },
  SILVER: { label: 'כסף', color: 'text-gray-300', bg: 'bg-gray-500/20', emoji: '🥈', minPoints: 5000, maxPoints: 15000 },
  GOLD: { label: 'זהב', color: 'text-yellow-400', bg: 'bg-yellow-500/20', emoji: '🥇', minPoints: 15000, maxPoints: 50000 },
  PLATINUM: { label: 'פלטינה', color: 'text-cyan-400', bg: 'bg-cyan-500/20', emoji: '💎', minPoints: 50000, maxPoints: 100000 },
};

// Quick action categories with sub-items
const quickActionCategories = [
  {
    id: 'invoices',
    label: 'חשבוניות',
    icon: FileUp,
    bgColor: 'bg-emerald-500',
    iconColor: 'text-emerald-400',
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
    bgColor: 'bg-purple-500',
    iconColor: 'text-purple-400',
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
    bgColor: 'bg-orange-500',
    iconColor: 'text-orange-400',
    items: [
      { label: 'דוחות חשבוניות', href: '/invoices', icon: FileText },
      { label: 'הגדרות', href: '/settings', icon: Wrench },
    ],
  },
  {
    id: 'suppliers',
    label: 'ספקים',
    icon: Building2,
    bgColor: 'bg-blue-500',
    iconColor: 'text-blue-400',
    items: [
      { label: 'כל הספקים', href: '/supplier', icon: Building2 },
      { label: 'ספקים מומלצים', href: '/supplier?filter=recommended', icon: Award },
      { label: 'הספקים שלי', href: '/supplier?filter=my', icon: Users },
    ],
  },
  {
    id: 'rewards',
    label: 'מתנות והטבות',
    icon: Gift,
    bgColor: 'bg-pink-500',
    iconColor: 'text-pink-400',
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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { data: balance, isLoading: balanceLoading } = useWalletBalance();
  const { data: card, isLoading: cardLoading } = useWalletCard();
  const { data: transactions, isLoading: transactionsLoading } = useWalletTransactions();

  // Suppliers data - fetch based on role
  const isAdmin = user?.role === 'ADMIN';
  const isArchitect = user?.role === 'ARCHITECT';
  const { data: allSuppliers, isLoading: suppliersLoading } = useSuppliers(activeCategory === 'suppliers' && (isAdmin || isArchitect));

  const currentRank = (card?.rank as keyof typeof rankConfig) || 'BRONZE';
  const rank = rankConfig[currentRank];
  const isLoading = balanceLoading || cardLoading;
  const isSupplier = user?.role === 'SUPPLIER';

  // Calculate progress to next rank
  const totalEarned = balance?.totalEarned || 0;
  const progressPercent = Math.min(100, ((totalEarned - rank.minPoints) / (rank.maxPoints - rank.minPoints)) * 100);
  const pointsToNextRank = Math.max(0, rank.maxPoints - totalEarned);

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  return (
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero Background */}
      <div className="absolute inset-x-0 top-0 h-[60vh]">
        <Image
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80"
          alt="Modern Architecture"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2620]/30 via-transparent to-[#0f2620]" />
      </div>

      {/* Content */}
      <div className="relative z-10 pt-32 px-6 pb-12 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3 mb-2">
            <Wallet className="text-emerald-400" />
            הארנק שלי
          </h1>
          <p className="text-white/60">ניהול נקודות, יתרות והטבות</p>
        </motion.div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Profile & Digital Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
              {/* User Profile Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Link href="/profile" className="relative group">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-400/50 shadow-lg shadow-emerald-500/20">
                      {user?.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.name || 'משתמש'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                          <User size={28} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white/10 backdrop-blur rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={12} className="text-white" />
                    </div>
                  </Link>
                  <div className="flex flex-col">
                    <span className="text-white font-semibold">{user?.name || 'משתמש'}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/50">{pointsToNextRank.toLocaleString()} לדרגה הבאה</span>
                    </div>
                  </div>
                </div>

                {/* Rank Badge */}
                <div className={`px-3 py-1.5 rounded-full ${rank.bg} border border-white/10`}>
                  <span className={`text-sm font-semibold ${rank.color}`}>
                    {rank.emoji} {rank.label}
                  </span>
                </div>
              </div>

              {/* Digital Card Visual */}
              <div className="relative aspect-[1.6/1] bg-gradient-to-br from-emerald-600 via-emerald-700 to-[#0a1f18] rounded-2xl p-5 overflow-hidden shadow-2xl">
                {/* Card Pattern */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/20 blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-emerald-300/20 blur-3xl" />
                </div>

                {/* Sparkle effect */}
                <div className="absolute top-4 left-4">
                  <Sparkles size={20} className="text-white/30" />
                </div>

                <div className="relative h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
                      <CreditCard size={24} className="text-white" />
                    </div>
                    <span className="text-white/80 text-sm font-semibold tracking-wider">STANNEL CLUB</span>
                  </div>

                  <div>
                    {isLoading ? (
                      <div className="h-6 w-40 bg-white/20 rounded animate-pulse mb-3" />
                    ) : (
                      <p className="text-lg font-mono text-white tracking-wider mb-3">
                        {card?.cardNumber
                          ? `${card.cardNumber.slice(0, 4)} •••• •••• ${card.cardNumber.slice(-4).toUpperCase()}`
                          : '**** **** **** ****'}
                      </p>
                    )}

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-white/50 text-xs">שם</p>
                        <p className="text-white font-semibold">
                          {isSupplier ? (card as any)?.holderName : user?.name || 'משתמש'}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-white/50 text-xs">נקודות</p>
                        <p className="text-white text-2xl font-bold">
                          {isLoading ? '...' : (balance?.points || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {[
              {
                icon: Award,
                label: 'נקודות זמינות',
                value: isLoading ? '...' : (balance?.points || 0).toLocaleString(),
                color: 'text-emerald-400',
                bgColor: 'bg-emerald-500/20',
                borderColor: 'border-emerald-500/30',
                suffix: 'נק׳',
                show: true,
              },
              {
                icon: CreditCard,
                label: 'יתרת מזומן',
                value: isLoading ? '...' : (balance?.cash || 0).toLocaleString(),
                color: 'text-green-400',
                bgColor: 'bg-green-500/20',
                borderColor: 'border-green-500/30',
                prefix: '₪',
                show: !isSupplier,
              },
              {
                icon: TrendingUp,
                label: 'סה"כ נצבר',
                value: isLoading ? '...' : (balance?.totalEarned || 0).toLocaleString(),
                color: 'text-purple-400',
                bgColor: 'bg-purple-500/20',
                borderColor: 'border-purple-500/30',
                suffix: 'נק׳',
                show: true,
              },
              {
                icon: Gift,
                label: 'מומשו',
                value: isLoading ? '...' : (balance?.totalRedeemed || 0).toLocaleString(),
                color: 'text-amber-400',
                bgColor: 'bg-amber-500/20',
                borderColor: 'border-amber-500/30',
                suffix: 'נק׳',
                show: true,
              },
            ].filter(stat => stat.show).map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.05 }}
              >
                <div className={`bg-white/5 backdrop-blur-md border ${stat.borderColor} rounded-2xl p-5 h-full`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white/60 text-sm mb-2">{stat.label}</p>
                      <p className={`text-3xl font-bold ${stat.color}`}>
                        {stat.prefix}
                        {stat.value}
                        {stat.suffix && <span className="text-lg mr-1">{stat.suffix}</span>}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <stat.icon size={24} className={stat.color} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles size={20} className="text-emerald-400" />
              פעולות מהירות
            </h2>

            {/* Circular Icons */}
            <div
              className="flex gap-4 md:gap-6 py-2 px-1 overflow-x-auto md:overflow-visible md:justify-center"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {quickActionCategories.map((category) => {
                const IconComponent = category.icon;
                const isActive = activeCategory === category.id;

                return (
                  <motion.button
                    key={category.id}
                    onClick={() => setActiveCategory(isActive ? null : category.id)}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="flex flex-col items-center gap-3 min-w-[100px] flex-shrink-0"
                  >
                    <div
                      className={`
                        w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center
                        transition-all duration-300 border-2
                        ${isActive
                          ? `${category.bgColor} border-white/30 shadow-lg shadow-${category.bgColor}/30 scale-110`
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        }
                      `}
                    >
                      <IconComponent
                        size={32}
                        className={`transition-colors duration-200 ${isActive ? 'text-white' : category.iconColor}`}
                      />
                    </div>
                    <span className={`text-sm font-medium text-center transition-colors duration-200 ${isActive ? 'text-white' : 'text-white/60'}`}>
                      {category.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
              {activeCategory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 pt-6 border-t border-white/10 overflow-hidden"
                >
                  {/* Suppliers Table */}
                  {activeCategory === 'suppliers' ? (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">
                        כל הספקים במערכת
                      </h3>

                      {suppliersLoading ? (
                        <div className="space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl animate-pulse">
                              <div className="w-12 h-12 bg-white/10 rounded-full" />
                              <div className="flex-1">
                                <div className="h-4 w-32 bg-white/10 rounded mb-2" />
                                <div className="h-3 w-24 bg-white/5 rounded" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-white/10">
                                <th className="text-right py-3 px-4 text-sm font-semibold text-white/60">ספק</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-white/60">אימייל</th>
                              </tr>
                            </thead>
                            <tbody>
                              {allSuppliers?.data && allSuppliers.data.length > 0 ? (
                                allSuppliers.data.map((supplier, index) => (
                                  <motion.tr
                                    key={supplier.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                  >
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                          <Building2 size={18} className="text-blue-400" />
                                        </div>
                                        <span className="font-medium text-white">{supplier.companyName}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-white/60 text-sm">{supplier.email || '-'}</td>
                                  </motion.tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={2} className="py-12 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                        <Building2 size={32} className="text-white/30" />
                                      </div>
                                      <p className="text-white/50">אין ספקים במערכת</p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Other Categories */
                    quickActionCategories
                      .filter(cat => cat.id === activeCategory)
                      .map(category => (
                        <div key={category.id}>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 group"
                                  >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/10 group-hover:bg-white/20 transition-colors`}>
                                      <ItemIcon size={20} className={category.iconColor} />
                                    </div>
                                    <span className="text-sm font-medium text-white/80 text-center group-hover:text-white transition-colors">
                                      {item.label}
                                    </span>
                                  </Link>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock size={20} className="text-emerald-400" />
                תנועות אחרונות
              </h2>
            </div>

            <div className="space-y-3">
              {transactionsLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-4 border-b border-white/5 animate-pulse">
                    <div className="w-12 h-12 bg-white/10 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-4 w-40 bg-white/10 rounded mb-2" />
                      <div className="h-3 w-24 bg-white/5 rounded" />
                    </div>
                    <div className="h-5 w-20 bg-white/10 rounded" />
                  </div>
                ))
              ) : transactions && transactions.length > 0 ? (
                transactions.slice(0, 10).map((tx: any, index: number) => {
                  const isCredit = tx.type === 'CREDIT';
                  const txDate = new Date(tx.createdAt);

                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 py-4 border-b border-white/5 last:border-0"
                    >
                      <div className={`p-3 rounded-xl ${isCredit ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {isCredit ? (
                          <ArrowUpRight className="text-green-400" size={20} />
                        ) : (
                          <ArrowDownRight className="text-red-400" size={20} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{tx.description || (isCredit ? 'זיכוי' : 'חיוב')}</p>
                        <p className="text-white/50 text-sm">
                          {txDate.toLocaleDateString('he-IL')} {txDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className={`font-bold ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                        {isCredit ? '+' : '-'}{Math.abs(tx.amount || 0).toLocaleString()} {tx.currency === 'ILS' ? '₪' : 'נק׳'}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <Wallet size={32} className="text-white/30" />
                  </div>
                  <p className="text-white/50">אין תנועות להצגה</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
