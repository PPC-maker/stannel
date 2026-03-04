'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import { Wallet, FileText, Gift, TrendingUp, ArrowUpRight, Clock, Star, CreditCard } from 'lucide-react';
import Link from 'next/link';

// Mock data - will be replaced with real API calls
const mockStats = {
  points: 12500,
  cash: 3200,
  pendingInvoices: 3,
  approvedThisMonth: 8,
};

const mockTransactions = [
  { id: 1, description: 'זיכוי מחשבונית #A4F2', amount: 850, type: 'CREDIT', date: new Date() },
  { id: 2, description: 'מימוש: כרטיס מתנה', amount: -500, type: 'DEBIT', date: new Date(Date.now() - 86400000) },
  { id: 3, description: 'בונוס יעד חודשי', amount: 1000, type: 'CREDIT', date: new Date(Date.now() - 172800000) },
];

export default function DashboardPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-display font-bold text-white">
          שלום, ישראל 👋
        </h1>
        <p className="text-white/60 mt-1">הנה סיכום הפעילות שלך</p>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'יתרת נקודות', value: mockStats.points.toLocaleString(), icon: Star, color: 'text-gold-400', suffix: 'נק׳' },
          { label: 'חשבוניות פתוחות', value: mockStats.pendingInvoices, icon: Clock, color: 'text-yellow-400' },
          { label: 'אושרו החודש', value: mockStats.approvedThisMonth, icon: FileText, color: 'text-green-400' },
          { label: 'סה״כ זיכוי', value: `₪${mockStats.cash.toLocaleString()}`, icon: CreditCard, color: 'text-blue-400' },
        ].map((stat, i) => (
          <GlassCard key={i} delay={i * 0.1}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/50 text-sm">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color} mt-1`}>
                  {stat.value} {stat.suffix}
                </p>
              </div>
              <div className={`p-2 rounded-lg bg-white/10`}>
                <stat.icon size={20} className={stat.color} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Digital Card */}
        <GlassCard gold className="lg:col-span-1" delay={0.2}>
          <h2 className="text-lg font-semibold text-white mb-4">הכרטיס הדיגיטלי שלך</h2>

          {/* Card Preview */}
          <div className="relative aspect-[1.6/1] rounded-xl overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 p-5 flex flex-col justify-between">
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-gold-400 blur-3xl" />
            </div>

            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-white/60 text-xs">STANNEL CLUB</p>
                <p className="text-gold-400 font-bold">🥇 GOLD</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                <span className="text-primary-900 font-bold">S</span>
              </div>
            </div>

            <div className="relative z-10">
              <p className="text-white/60 text-xs">מספר כרטיס</p>
              <p className="text-white font-mono tracking-wider">•••• •••• •••• 4521</p>
            </div>

            <div className="relative z-10 flex justify-between items-end">
              <div>
                <p className="text-white/60 text-xs">שם</p>
                <p className="text-white font-medium">ישראל ישראלי</p>
              </div>
              <div className="text-left">
                <p className="text-white/60 text-xs">נקודות</p>
                <p className="text-gold-400 font-bold">{mockStats.points.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <Link
            href="/wallet"
            className="mt-4 flex items-center justify-center gap-2 text-gold-400 hover:text-gold-300 transition-colors text-sm"
          >
            <span>צפייה בארנק המלא</span>
            <ArrowUpRight size={16} />
          </Link>
        </GlassCard>

        {/* Recent Activity */}
        <GlassCard className="lg:col-span-2" delay={0.3}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">תנועות אחרונות</h2>
            <Link
              href="/wallet"
              className="text-gold-400 hover:text-gold-300 text-sm flex items-center gap-1"
            >
              <span>הכל</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {mockTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-3 border-b border-white/10 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    tx.type === 'CREDIT' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {tx.type === 'CREDIT' ? (
                      <TrendingUp size={18} className="text-green-400" />
                    ) : (
                      <Gift size={18} className="text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{tx.description}</p>
                    <p className="text-white/50 text-sm">
                      {tx.date.toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </div>
                <span className={`font-bold ${
                  tx.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {tx.type === 'CREDIT' ? '+' : ''}{tx.amount.toLocaleString()} נק׳
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-white mb-4">פעולות מהירות</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'העלאת חשבונית', icon: FileText, href: '/invoices/upload', color: 'from-blue-500/20 to-blue-600/20' },
            { label: 'חנות הטבות', icon: Gift, href: '/rewards', color: 'from-purple-500/20 to-purple-600/20' },
            { label: 'הארנק שלי', icon: Wallet, href: '/wallet', color: 'from-green-500/20 to-green-600/20' },
            { label: 'אירועים', icon: Star, href: '/events', color: 'from-gold-400/20 to-gold-600/20' },
          ].map((action, i) => (
            <Link key={i} href={action.href}>
              <GlassCard delay={0.4 + i * 0.1} className="text-center py-6 hover:border-gold-400/30">
                <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                  <action.icon size={24} className="text-white" />
                </div>
                <p className="text-white font-medium">{action.label}</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
