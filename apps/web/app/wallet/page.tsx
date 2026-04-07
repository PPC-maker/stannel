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
} from 'lucide-react';
import { useWalletBalance, useWalletCard, useWalletTransactions, useSuppliers, useArchitectSuppliers } from '@/lib/api-hooks';
import { useAuth } from '@/lib/auth-context';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import Link from 'next/link';

const rankConfig = {
  BRONZE: { label: 'ברונזה', color: 'text-amber-600', bg: 'bg-amber-100', emoji: '🥉', minPoints: 0, maxPoints: 5000 },
  SILVER: { label: 'כסף', color: 'text-gray-700', bg: 'bg-gray-100', emoji: '🥈', minPoints: 5000, maxPoints: 15000 },
  GOLD: { label: 'זהב', color: 'text-amber-500', bg: 'bg-amber-50', emoji: '🥇', minPoints: 15000, maxPoints: 50000 },
  PLATINUM: { label: 'פלטינה', color: 'text-cyan-600', bg: 'bg-cyan-50', emoji: '💎', minPoints: 50000, maxPoints: 100000 },
};

// Quick action categories with sub-items
const quickActionCategories = [
  {
    id: 'invoices',
    label: 'חשבוניות',
    icon: FileUp,
    bgColor: 'bg-green-500',
    iconColor: 'text-green-500',
    hoverBg: 'hover:bg-green-50',
    iconBg: 'bg-green-100',
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
    iconColor: 'text-purple-500',
    hoverBg: 'hover:bg-purple-50',
    iconBg: 'bg-purple-100',
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
    iconColor: 'text-orange-500',
    hoverBg: 'hover:bg-orange-50',
    iconBg: 'bg-orange-100',
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
    iconColor: 'text-blue-500',
    hoverBg: 'hover:bg-blue-50',
    iconBg: 'bg-blue-100',
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
    iconColor: 'text-pink-500',
    hoverBg: 'hover:bg-pink-50',
    iconBg: 'bg-pink-100',
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
  const { data: allSuppliers, isLoading: suppliersLoading } = useSuppliers(activeCategory === 'suppliers' && isAdmin);
  const { data: mySuppliers, isLoading: mySuppliersLoading } = useArchitectSuppliers(activeCategory === 'suppliers' && isArchitect);


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
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Section with Background */}
      <div className="relative">
        {/* Background extends to top of viewport behind navbar */}
        <div className="absolute inset-x-0 top-0 h-80">
          <Image
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80"
            alt="Modern Architecture"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0066CC]/80 via-[#0066CC]/60 to-[#F8FAFC]" />
        </div>

        <div className="relative z-10 pt-20 pb-6 px-6 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl font-bold text-white drop-shadow-lg flex items-center justify-center gap-3">
              <Wallet className="text-white" />
              הארנק שלי
            </h1>
            <p className="text-white/80 mt-1">ניהול נקודות, יתרות והטבות</p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 px-6 pb-8 max-w-7xl mx-auto -mt-8">
        {/* Main Balance Card */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-white rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                {/* User Profile & Progress */}
                <div className="flex items-center gap-3">
                  <Link href="/profile" className="relative group">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#0066CC] shadow-lg">
                      {user?.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.name || 'משתמש'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#0066CC] to-[#004499] flex items-center justify-center">
                          <User size={28} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={12} className="text-[#0066CC]" />
                    </div>
                  </Link>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#1E293B]">{user?.name || 'משתמש'}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#0066CC] to-[#00AAFF] rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#64748B]">{pointsToNextRank.toLocaleString()} לדרגה הבאה</span>
                    </div>
                  </div>
                </div>

                {/* Rank Badge */}
                <div className={`px-3 py-1 rounded-full ${rank.bg}`}>
                  <span className={`text-sm font-semibold ${rank.color}`}>
                    {rank.emoji} {rank.label}
                  </span>
                </div>
              </div>

              {/* Digital Card Visual - El Al Style */}
              <div className="relative aspect-[1.6/1] bg-gradient-to-br from-[#0066CC] via-[#0055AA] to-[#003377] rounded-2xl p-5 overflow-hidden shadow-xl">
                {/* Card Pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/30 blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
                </div>

                <div className="relative h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <Building2 size={24} className="text-white" />
                    </div>
                    <span className="text-white/80 text-sm font-semibold">STANNEL CLUB</span>
                  </div>

                  <div>
                    {isLoading ? (
                      <div className="h-6 w-40 bg-white/20 rounded animate-pulse mb-3" />
                    ) : (
                      <p className="text-lg font-mono text-white tracking-wider mb-3">
                        {card?.cardNumber
                          ? `•••• •••• •••• ${card.cardNumber.slice(-4).toUpperCase()}`
                          : '**** **** **** ****'}
                      </p>
                    )}

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-white/60 text-xs">שם</p>
                        <p className="text-white font-semibold">
                          {isSupplier ? (card as any)?.holderName : user?.name || 'משתמש'}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-white/60 text-xs">נקודות</p>
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

          {/* Stats Cards - Circles on Mobile, Cards on Desktop */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4 md:gap-6">
            {[
              {
                icon: Award,
                label: 'נקודות זמינות',
                value: isLoading ? '...' : (balance?.points || 0).toLocaleString(),
                color: 'text-[#0066CC]',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                suffix: 'נק׳',
                show: true,
              },
              {
                icon: CreditCard,
                label: 'יתרת מזומן',
                value: isLoading ? '...' : (balance?.cash || 0).toLocaleString(),
                color: 'text-green-600',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                prefix: '₪',
                show: !isSupplier,
              },
              {
                icon: TrendingUp,
                label: 'סה"כ נצבר',
                value: isLoading ? '...' : (balance?.totalEarned || 0).toLocaleString(),
                color: 'text-purple-600',
                bgColor: 'bg-purple-50',
                borderColor: 'border-purple-200',
                suffix: 'נק׳',
                show: true,
              },
              {
                icon: Gift,
                label: 'מומשו',
                value: isLoading ? '...' : (balance?.totalRedeemed || 0).toLocaleString(),
                color: 'text-amber-600',
                bgColor: 'bg-amber-50',
                borderColor: 'border-amber-200',
                suffix: 'נק׳',
                show: true,
              },
            ].filter(stat => stat.show).map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="flex justify-center"
              >
                {/* Mobile: Circle | Desktop: Rectangle Card */}
                <div className={`
                  md:hidden
                  w-[140px] h-[140px] rounded-full
                  bg-white shadow-lg border-2 ${stat.borderColor}
                  flex flex-col items-center justify-center
                  text-center p-3
                `}>
                  <div className={`p-2 rounded-full ${stat.bgColor} mb-2`}>
                    <stat.icon size={20} className={stat.color} />
                  </div>
                  <p className="text-[#64748B] text-xs mb-1">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color}`}>
                    {stat.prefix}{stat.value}
                  </p>
                  {stat.suffix && <span className={`text-xs ${stat.color}`}>{stat.suffix}</span>}
                </div>

                {/* Desktop: Regular Card */}
                <div className="hidden md:block bg-white rounded-2xl p-5 shadow-lg h-full w-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[#64748B] text-sm mb-1">{stat.label}</p>
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

        {/* Quick Actions - Circular Slider */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-[#1E293B] mb-6">פעולות מהירות</h2>

            {/* Circular Icons Slider - Native Scroll for Mobile */}
            <div
              className="flex gap-3 md:gap-5 py-2 px-1 overflow-x-auto md:overflow-visible md:justify-center"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {/* Items in order - CSS handles RTL scroll direction */}
              {quickActionCategories.map((category) => {
                const IconComponent = category.icon;
                const isActive = activeCategory === category.id;

                return (
                  <motion.button
                    key={category.id}
                    onClick={() => setActiveCategory(isActive ? null : category.id)}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="flex flex-col items-center gap-2 md:gap-3 min-w-[95px] md:min-w-[115px] flex-shrink-0 touch-manipulation"
                  >
                    <div
                      className={`
                        w-[88px] h-[88px] md:w-[110px] md:h-[110px] rounded-full flex items-center justify-center shadow-lg
                        transition-all duration-200
                        ${isActive
                          ? `${category.bgColor} ring-4 ring-offset-2 ring-gray-200 scale-105`
                          : 'bg-gradient-to-br from-gray-50 to-gray-100 active:from-gray-100 active:to-gray-200'
                        }
                      `}
                    >
                      <IconComponent
                        size={36}
                        className={`md:w-11 md:h-11 transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-600'}`}
                      />
                    </div>
                    <span className={`text-xs md:text-sm font-medium text-center whitespace-nowrap transition-colors duration-200 ${isActive ? 'text-[#0066CC] font-semibold' : 'text-[#64748B]'}`}>
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
                  className="mt-6 pt-6 border-t border-gray-100 overflow-hidden"
                >
                  {/* Suppliers Table - Special Case */}
                  {activeCategory === 'suppliers' ? (
                    <div>
                      <h3 className="text-lg font-semibold text-[#1E293B] mb-4">
                        {isAdmin ? 'כל הספקים במערכת' : 'הספקים שלי'}
                      </h3>

                      {(suppliersLoading || mySuppliersLoading) ? (
                        <div className="space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl animate-pulse">
                              <div className="w-12 h-12 bg-gray-200 rounded-full" />
                              <div className="flex-1">
                                <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                                <div className="h-3 w-24 bg-gray-100 rounded" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-right py-3 px-4 text-sm font-semibold text-[#64748B]">ספק</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-[#64748B]">אימייל</th>
                                {isArchitect && (
                                  <>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#64748B]">חשבוניות</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#64748B]">סה״כ</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {isAdmin && allSuppliers?.data && allSuppliers.data.length > 0 ? (
                                allSuppliers.data.map((supplier, index) => (
                                  <motion.tr
                                    key={supplier.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors"
                                  >
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                          <Building2 size={18} className="text-blue-600" />
                                        </div>
                                        <span className="font-medium text-[#1E293B]">{supplier.companyName}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-[#64748B] text-sm">{supplier.email || '-'}</td>
                                  </motion.tr>
                                ))
                              ) : isArchitect && mySuppliers?.data && mySuppliers.data.length > 0 ? (
                                mySuppliers.data.map((supplier, index) => (
                                  <motion.tr
                                    key={supplier.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors"
                                  >
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                          <Building2 size={18} className="text-blue-600" />
                                        </div>
                                        <span className="font-medium text-[#1E293B]">{supplier.companyName}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-[#64748B] text-sm">{supplier.email || '-'}</td>
                                    <td className="py-3 px-4 text-center">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {supplier.invoiceCount}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-[#1E293B] font-medium">
                                      ₪{supplier.totalAmount.toLocaleString()}
                                    </td>
                                  </motion.tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={isArchitect ? 4 : 2} className="py-12 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                        <Building2 size={32} className="text-gray-400" />
                                      </div>
                                      <p className="text-[#64748B]">
                                        {isArchitect ? 'עדיין אין לך ספקים מחוברים. העלה חשבונית כדי להתחיל!' : 'אין ספקים במערכת'}
                                      </p>
                                      {isArchitect && (
                                        <Link
                                          href="/invoices/upload"
                                          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                                        >
                                          העלאת חשבונית
                                        </Link>
                                      )}
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
                    /* Other Categories - Regular Link Buttons */
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
                                    className={`
                                      flex flex-col items-center gap-2 p-4 rounded-xl
                                      bg-gradient-to-br from-gray-50 to-gray-100
                                      ${category.hoverBg}
                                      border border-gray-100 hover:border-gray-200
                                      transition-all duration-200 group hover:shadow-md
                                    `}
                                  >
                                    <div className={`
                                      w-10 h-10 rounded-full flex items-center justify-center
                                      ${category.iconBg} transition-colors
                                    `}>
                                      <ItemIcon size={20} className={category.iconColor} />
                                    </div>
                                    <span className="text-sm font-medium text-[#1E293B] text-center">
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
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1E293B] flex items-center gap-2">
                <Clock size={20} className="text-[#0066CC]" />
                תנועות אחרונות
              </h2>
            </div>

            <div className="space-y-3">
              {transactionsLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 animate-pulse">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-4 w-40 bg-gray-100 rounded mb-2" />
                      <div className="h-3 w-24 bg-gray-50 rounded" />
                    </div>
                    <div className="h-5 w-20 bg-gray-100 rounded" />
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
                      className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0"
                    >
                      <div className={`p-3 rounded-xl ${isCredit ? 'bg-green-50' : 'bg-red-50'}`}>
                        {isCredit ? (
                          <ArrowUpRight className="text-green-600" size={20} />
                        ) : (
                          <ArrowDownRight className="text-red-500" size={20} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-[#1E293B] font-medium">{tx.description || (isCredit ? 'זיכוי' : 'חיוב')}</p>
                        <p className="text-[#94A3B8] text-sm">
                          {txDate.toLocaleDateString('he-IL')} {txDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className={`font-bold ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                        {isCredit ? '+' : '-'}{Math.abs(tx.amount || 0).toLocaleString()} {tx.currency === 'ILS' ? '₪' : 'נק׳'}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Wallet size={32} className="text-gray-600" />
                  </div>
                  <p className="text-[#64748B]">אין תנועות להצגה</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
