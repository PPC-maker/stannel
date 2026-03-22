'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Wallet, FileText, Gift, TrendingUp, ArrowUpRight, Clock, Star, CreditCard, Plane } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useDashboardStats, useWalletTransactions, useWalletCard } from '@/lib/api-hooks';

const rankEmojis: Record<string, string> = {
  BRONZE: '🥉',
  SILVER: '🥈',
  GOLD: '🥇',
  PLATINUM: '💎',
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const { data: stats } = useDashboardStats();
  const { data: transactions, isLoading: txLoading } = useWalletTransactions();
  const { data: card } = useWalletCard();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
    if (!loading && user?.role === 'SUPPLIER') {
      router.replace('/supplier');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role === 'SUPPLIER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="spinner" />
      </div>
    );
  }

  const dashboardStats = {
    points: stats?.points || 0,
    cash: stats?.cash || 0,
    pendingInvoices: stats?.pendingInvoices || 0,
    approvedThisMonth: stats?.approvedThisMonth || 0,
  };

  const recentTransactions = (transactions || []).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Section with Background */}
      <div className="relative">
        {/* Background Image */}
        <div className="absolute inset-0 h-80">
          <Image
            src="https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920&q=80"
            alt="Travel destination"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0066CC]/60 via-[#0066CC]/40 to-[#F8FAFC]" />
        </div>

        {/* Content */}
        <div className="relative z-10 pt-24 pb-8 px-6 max-w-7xl mx-auto">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">
              שלום, {user?.name || 'אורח'} 👋
            </h1>
            <p className="text-white/80 mt-1">הנה סיכום הפעילות שלך</p>
          </motion.div>

          {/* Quick Stats Grid - Floating Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'יתרת נקודות', value: dashboardStats.points.toLocaleString(), icon: Star, color: 'text-[#0066CC]', bgColor: 'bg-blue-50', suffix: 'נק׳' },
              { label: 'חשבוניות פתוחות', value: dashboardStats.pendingInvoices, icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50' },
              { label: 'אושרו החודש', value: dashboardStats.approvedThisMonth, icon: FileText, color: 'text-green-600', bgColor: 'bg-green-50' },
              { label: 'סה״כ זיכוי', value: `₪${dashboardStats.cash.toLocaleString()}`, icon: CreditCard, color: 'text-purple-600', bgColor: 'bg-purple-50' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[#64748B] text-sm">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color} mt-1`}>
                      {stat.value} {stat.suffix}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                    <stat.icon size={22} className={stat.color} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-8 max-w-7xl mx-auto -mt-4">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Digital Card - Ticket Style */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h2 className="text-lg font-bold text-[#1E293B] mb-4">הכרטיס הדיגיטלי שלך</h2>

              {/* Card Preview - El Al Style */}
              <div className="relative aspect-[1.6/1] rounded-2xl overflow-hidden bg-gradient-to-br from-[#0066CC] via-[#0055AA] to-[#003377] p-5 flex flex-col justify-between shadow-xl">
                {/* Pattern overlay */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/30 blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
                </div>

                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <p className="text-white/70 text-xs">STANNEL CLUB</p>
                    <p className="text-white font-bold text-lg">
                      {rankEmojis[user?.rank || 'BRONZE']} {user?.rank || 'BRONZE'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <Plane size={24} className="text-white" />
                  </div>
                </div>

                <div className="relative z-10">
                  <p className="text-white/70 text-xs">מספר כרטיס</p>
                  <p className="text-white font-mono tracking-wider text-lg">
                    •••• •••• •••• {card?.cardNumber?.slice(-4) || '0000'}
                  </p>
                </div>

                <div className="relative z-10 flex justify-between items-end">
                  <div>
                    <p className="text-white/70 text-xs">שם</p>
                    <p className="text-white font-semibold">{user?.name || 'אורח'}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-white/70 text-xs">נקודות</p>
                    <p className="text-white font-bold text-xl">{dashboardStats.points.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <Link
                href="/wallet"
                className="mt-4 flex items-center justify-center gap-2 text-[#0066CC] hover:text-[#0055AA] transition-colors text-sm font-medium"
              >
                <span>צפייה בארנק המלא</span>
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#1E293B]">תנועות אחרונות</h2>
                <Link
                  href="/wallet"
                  className="text-[#0066CC] hover:text-[#0055AA] text-sm flex items-center gap-1 font-medium"
                >
                  <span>הכל</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>

              <div className="space-y-3">
                {txLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-100 animate-pulse">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-gray-100 rounded mb-2" />
                        <div className="h-3 w-20 bg-gray-50 rounded" />
                      </div>
                      <div className="h-5 w-16 bg-gray-100 rounded" />
                    </div>
                  ))
                ) : recentTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <Wallet className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-[#64748B]">אין תנועות עדיין</p>
                  </div>
                ) : (
                  recentTransactions.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          tx.type === 'CREDIT' ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          {tx.type === 'CREDIT' ? (
                            <TrendingUp size={20} className="text-green-600" />
                          ) : (
                            <Gift size={20} className="text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-[#1E293B] font-medium">{tx.description}</p>
                          <p className="text-[#94A3B8] text-sm">
                            {new Date(tx.createdAt).toLocaleDateString('he-IL')}
                          </p>
                        </div>
                      </div>
                      <span className={`font-bold ${
                        tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {tx.type === 'CREDIT' ? '+' : ''}{tx.amount?.toLocaleString() || 0} נק׳
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <h2 className="text-lg font-bold text-[#1E293B] mb-4">פעולות מהירות</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'העלאת חשבונית', icon: FileText, href: '/invoices/upload', color: 'bg-blue-50', iconColor: 'text-[#0066CC]' },
              { label: 'חנות הטבות', icon: Gift, href: '/rewards', color: 'bg-purple-50', iconColor: 'text-purple-600' },
              { label: 'הארנק שלי', icon: Wallet, href: '/wallet', color: 'bg-green-50', iconColor: 'text-green-600' },
              { label: 'אירועים', icon: Star, href: '/events', color: 'bg-amber-50', iconColor: 'text-amber-600' },
            ].map((action, i) => (
              <Link key={i} href={action.href}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center"
                >
                  <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl ${action.color} flex items-center justify-center`}>
                    <action.icon size={28} className={action.iconColor} />
                  </div>
                  <p className="text-[#1E293B] font-semibold">{action.label}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
