'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Wallet, FileText, Gift, TrendingUp, ArrowUpRight, Clock, Star, CreditCard, Building2 } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-[#0f2620]">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero Section with Background */}
      <div className="relative">
        {/* Background Image */}
        <div className="absolute inset-0 h-[50vh]">
          <Image
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80"
            alt="Modern architecture building"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f2620]/30 via-transparent to-[#0f2620]" />
        </div>

        {/* Content */}
        <div className="relative z-10 pt-32 pb-8 px-6 max-w-7xl mx-auto">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">
              שלום, {user?.name || 'אורח'} 👋
            </h1>
            <p className="text-white/70 mt-1">הנה סיכום הפעילות שלך</p>
          </motion.div>

          {/* Quick Stats Grid - Floating Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'יתרת נקודות', value: dashboardStats.points.toLocaleString(), icon: Star, color: 'text-emerald-400', borderColor: 'border-emerald-500/30', suffix: 'נק׳' },
              { label: 'חשבוניות פתוחות', value: dashboardStats.pendingInvoices, icon: Clock, color: 'text-amber-400', borderColor: 'border-amber-500/30' },
              { label: 'אושרו החודש', value: dashboardStats.approvedThisMonth, icon: FileText, color: 'text-green-400', borderColor: 'border-green-500/30' },
              { label: 'סה״כ זיכוי', value: `₪${dashboardStats.cash.toLocaleString()}`, icon: CreditCard, color: 'text-purple-400', borderColor: 'border-purple-500/30' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-white/5 backdrop-blur-md border ${stat.borderColor} rounded-2xl p-5 hover:bg-white/10 transition-all duration-300`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/60 text-sm">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color} mt-1`}>
                      {stat.value} {stat.suffix}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/10">
                    <stat.icon size={22} className={stat.color} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-8 max-w-7xl mx-auto mt-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Digital Card - Ticket Style */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">הכרטיס הדיגיטלי שלך</h2>

              {/* Card Preview - Emerald Style */}
              <div className="relative aspect-[1.6/1] rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-[#0a1f18] p-5 flex flex-col justify-between shadow-xl">
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
                    <Building2 size={24} className="text-white" />
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
                className="mt-4 flex items-center justify-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-medium"
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
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">תנועות אחרונות</h2>
                <Link
                  href="/wallet"
                  className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1 font-medium"
                >
                  <span>הכל</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>

              <div className="space-y-3">
                {txLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-3 border-b border-white/10 animate-pulse">
                      <div className="w-12 h-12 bg-white/10 rounded-xl" />
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-white/10 rounded mb-2" />
                        <div className="h-3 w-20 bg-white/5 rounded" />
                      </div>
                      <div className="h-5 w-16 bg-white/10 rounded" />
                    </div>
                  ))
                ) : recentTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                      <Wallet className="w-8 h-8 text-white/50" />
                    </div>
                    <p className="text-white/60">אין תנועות עדיין</p>
                  </div>
                ) : (
                  recentTransactions.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-3 border-b border-white/10 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          tx.type === 'CREDIT' ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                          {tx.type === 'CREDIT' ? (
                            <TrendingUp size={20} className="text-green-400" />
                          ) : (
                            <Gift size={20} className="text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{tx.description}</p>
                          <p className="text-white/50 text-sm">
                            {new Date(tx.createdAt).toLocaleDateString('he-IL')}
                          </p>
                        </div>
                      </div>
                      <span className={`font-bold ${
                        tx.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'
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
          <h2 className="text-lg font-bold text-white mb-4">פעולות מהירות</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'העלאת חשבונית', icon: FileText, href: '/invoices/upload', bgColor: 'bg-emerald-500/20', iconColor: 'text-emerald-400' },
              { label: 'חנות הטבות', icon: Gift, href: '/rewards', bgColor: 'bg-purple-500/20', iconColor: 'text-purple-400' },
              { label: 'הארנק שלי', icon: Wallet, href: '/wallet', bgColor: 'bg-green-500/20', iconColor: 'text-green-400' },
              { label: 'אירועים', icon: Star, href: '/events', bgColor: 'bg-amber-500/20', iconColor: 'text-amber-400' },
            ].map((action, i) => (
              <Link key={i} href={action.href}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 text-center"
                >
                  <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl ${action.bgColor} flex items-center justify-center`}>
                    <action.icon size={28} className={action.iconColor} />
                  </div>
                  <p className="text-white font-semibold">{action.label}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
