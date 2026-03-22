'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { useAdminGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import {
  useAnalyticsTrends,
  useSlaReport,
  useTopArchitects,
  useSupplierPerformance,
} from '@/lib/api-hooks';
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Award,
  Star,
} from 'lucide-react';
import Link from 'next/link';

type Period = 'week' | 'month' | 'quarter';

export default function AdminAnalyticsPage() {
  const { isReady } = useAdminGuard();
  const [period, setPeriod] = useState<Period>('month');

  const { data: trendsData, isLoading: trendsLoading } = useAnalyticsTrends(period);
  const { data: slaData, isLoading: slaLoading } = useSlaReport();
  const { data: topArchitects, isLoading: architectsLoading } = useTopArchitects();
  const { data: supplierPerformance, isLoading: suppliersLoading } = useSupplierPerformance();

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  const periodLabels: Record<Period, string> = {
    week: 'שבוע אחרון',
    month: 'חודש אחרון',
    quarter: 'רבעון אחרון',
  };

  return (
    <div className="relative min-h-screen">
      <PageSlider images={sliderImages.dashboard}  />
      <div className="p-6 max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm"
        >
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-800 mb-4 transition-colors font-medium"
          >
            <ArrowRight size={18} />
            חזרה לפאנל ניהול
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="text-gold-500" />
                אנליטיקות מפורטות
              </h1>
              <p className="text-gray-600 mt-1 font-medium">נתונים וסטטיסטיקות מערכת</p>
            </div>
            <div className="flex gap-2">
              {(['week', 'month', 'quarter'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    period === p
                      ? 'bg-gold-400 text-primary-900'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <GlassCard hover={false}>
            <div className="text-center">
              <TrendingUp className="mx-auto text-gold-400 mb-2" size={28} />
              <p className="text-gray-500 text-sm">סה״כ חשבוניות</p>
              {trendsLoading ? (
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-500" />
              ) : (
                <p className="text-3xl font-bold text-gray-900">
                  {trendsData?.summary.totalInvoices || 0}
                </p>
              )}
            </div>
          </GlassCard>
          <GlassCard hover={false} className="bg-green-500/10">
            <div className="text-center">
              <CheckCircle className="mx-auto text-green-400 mb-2" size={28} />
              <p className="text-green-400/70 text-sm">אושרו</p>
              {trendsLoading ? (
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-500" />
              ) : (
                <p className="text-3xl font-bold text-green-400">
                  {trendsData?.summary.approvedCount || 0}
                </p>
              )}
            </div>
          </GlassCard>
          <GlassCard hover={false} className="bg-gold-500/10">
            <div className="text-center">
              <BarChart3 className="mx-auto text-gold-400 mb-2" size={28} />
              <p className="text-gold-400/70 text-sm">סה״כ סכום</p>
              {trendsLoading ? (
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-500" />
              ) : (
                <p className="text-3xl font-bold text-gold-400">
                  ₪{(trendsData?.summary.totalAmount || 0).toLocaleString()}
                </p>
              )}
            </div>
          </GlassCard>
          <GlassCard hover={false} className="bg-blue-500/10">
            <div className="text-center">
              <Clock className="mx-auto text-blue-400 mb-2" size={28} />
              <p className="text-blue-400/70 text-sm">עמידה ב-SLA</p>
              {slaLoading ? (
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-500" />
              ) : (
                <p className="text-3xl font-bold text-blue-400">
                  {slaData?.complianceRate || 0}%
                </p>
              )}
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Top Architects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard hover={false}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="text-[#0066CC]" size={20} />
                אדריכלים מובילים
              </h2>
              {architectsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-gold-400" />
                </div>
              ) : !topArchitects || topArchitects.length === 0 ? (
                <p className="text-gray-500 text-center py-8">אין נתונים</p>
              ) : (
                <div className="space-y-3">
                  {topArchitects.slice(0, 5).map((architect, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-gold-400 text-primary-900' :
                          index === 1 ? 'bg-gray-300 text-primary-900' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-gray-100 text-gray-900'
                        }`}>
                          {index < 3 ? <Award size={16} /> : architect.rank}
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{architect.name}</p>
                          <p className="text-gray-500 text-sm">{architect.invoiceCount} חשבוניות</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-gold-400 font-bold">₪{architect.totalEarned.toLocaleString()}</p>
                        <p className="text-gray-400 text-xs">{architect.tier}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Supplier Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard hover={false}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="text-[#0066CC]" size={20} />
                ביצועי ספקים
              </h2>
              {suppliersLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-gold-400" />
                </div>
              ) : !supplierPerformance || supplierPerformance.length === 0 ? (
                <p className="text-gray-500 text-center py-8">אין נתונים</p>
              ) : (
                <div className="space-y-3">
                  {supplierPerformance.slice(0, 5).map((supplier) => (
                    <div
                      key={supplier.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-gray-900 font-medium">{supplier.companyName}</p>
                        <p className="text-gray-500 text-sm">{supplier.invoiceCount} חשבוניות</p>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-gold-400" />
                          <span className="text-gray-900 font-bold">{supplier.trustScore}</span>
                        </div>
                        {supplier.hasActiveContract && (
                          <span className="text-xs text-green-400">חוזה פעיל</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        </div>

        {/* SLA Report */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard hover={false}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="text-[#0066CC]" size={20} />
              דו״ח עמידה ב-SLA (30 ימים אחרונים)
            </h2>
            {slaLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-gold-400" />
              </div>
            ) : !slaData ? (
              <p className="text-gray-500 text-center py-8">אין נתונים</p>
            ) : (
              <div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-sm">סה״כ</p>
                    <p className="text-2xl font-bold text-gray-900">{slaData.total}</p>
                  </div>
                  <div className="text-center p-4 bg-green-500/10 rounded-lg">
                    <p className="text-green-400/70 text-sm">עמדו ב-SLA</p>
                    <p className="text-2xl font-bold text-green-400">{slaData.compliant}</p>
                  </div>
                  <div className="text-center p-4 bg-red-500/10 rounded-lg">
                    <p className="text-red-400/70 text-sm">חריגות</p>
                    <p className="text-2xl font-bold text-red-400">{slaData.breached}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 text-sm">שיעור עמידה</span>
                    <span className="text-gray-900 font-medium">{slaData.complianceRate}%</span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        slaData.complianceRate >= 90 ? 'bg-green-400' :
                        slaData.complianceRate >= 70 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${slaData.complianceRate}%` }}
                    />
                  </div>
                </div>

                {/* By Supplier */}
                {Object.keys(slaData.bySupplier).length > 0 && (
                  <div>
                    <h3 className="text-gray-700 font-medium mb-3">לפי ספק:</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {Object.entries(slaData.bySupplier).map(([name, data]) => (
                        <div key={name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="text-gray-700">{name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-green-400 text-sm flex items-center gap-1">
                              <CheckCircle size={12} /> {data.compliant}
                            </span>
                            {data.breached > 0 && (
                              <span className="text-red-400 text-sm flex items-center gap-1">
                                <AlertTriangle size={12} /> {data.breached}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* AI Insights */}
        {trendsData?.aiInsights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <GlassCard hover={false} className="bg-purple-500/10 border-purple-500/30">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="text-[#0066CC]" size={20} />
                תובנות AI
              </h2>
              {typeof trendsData.aiInsights === 'string' ? (
                <p className="text-gray-700 whitespace-pre-wrap">{trendsData.aiInsights}</p>
              ) : (
                (() => {
                  const insights = trendsData.aiInsights as { summary?: string; trends?: string[]; alerts?: string[]; recommendations?: string[] };
                  return (
                    <div className="space-y-4">
                      {insights.summary && (
                        <div>
                          <h3 className="text-purple-600 font-medium mb-1">סיכום</h3>
                          <p className="text-gray-700">{insights.summary}</p>
                        </div>
                      )}
                      {insights.trends && insights.trends.length > 0 && (
                        <div>
                          <h3 className="text-purple-600 font-medium mb-1">מגמות</h3>
                          <ul className="list-disc list-inside text-gray-700 space-y-1">
                            {insights.trends.map((trend: string, i: number) => (
                              <li key={i}>{trend}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {insights.alerts && insights.alerts.length > 0 && (
                        <div>
                          <h3 className="text-red-600 font-medium mb-1">התראות</h3>
                          <ul className="list-disc list-inside text-red-600 space-y-1">
                            {insights.alerts.map((alert: string, i: number) => (
                              <li key={i}>{alert}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {insights.recommendations && insights.recommendations.length > 0 && (
                        <div>
                          <h3 className="text-green-600 font-medium mb-1">המלצות</h3>
                          <ul className="list-disc list-inside text-green-600 space-y-1">
                            {insights.recommendations.map((rec: string, i: number) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
