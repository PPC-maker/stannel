'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAdminGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import {
  useAnalyticsTrends,
  useSlaReport,
  useTopArchitects,
  useSupplierPerformance,
  useActivityReport,
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
  Download,
  Search,
  DollarSign,
  Activity,
} from 'lucide-react';
import Link from 'next/link';

type Period = 'week' | 'month' | 'quarter' | 'year';
type ReportTab = 'overview' | 'architects' | 'suppliers' | 'commissions' | 'sla' | 'activity';

const activityGroups: { label: string; roles: string[] }[] = [
  { label: 'אדריכלים ומעצבים', roles: ['ARCHITECT', 'DESIGNER'] },
  { label: 'ספקים', roles: ['SUPPLIER'] },
  { label: 'מנהלים', roles: ['ADMIN'] },
];

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '-' : d.toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
}

const periodLabels: Record<Period, string> = {
  week: 'שבוע',
  month: 'חודש',
  quarter: 'רבעון',
  year: 'שנה',
};

function exportToCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','))
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminAnalyticsPage() {
  const { isReady } = useAdminGuard();
  const [period, setPeriod] = useState<Period>('month');
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [commissionStats, setCommissionStats] = useState<any>(null);

  const { data: trendsData, isLoading: trendsLoading } = useAnalyticsTrends(period);
  const { data: slaData, isLoading: slaLoading } = useSlaReport();
  const { data: topArchitects, isLoading: architectsLoading } = useTopArchitects();
  const { data: supplierPerformance, isLoading: suppliersLoading } = useSupplierPerformance();
  const [activityDays, setActivityDays] = useState(7);
  const { data: activityData, isLoading: activityLoading, isError: activityError } = useActivityReport(activityDays);
  const roleSum = (roles: string[], key: 'total' | 'activeToday' | 'active7d' | 'active30d' | 'neverSeen') =>
    roles.reduce((sum, r) => sum + (activityData?.byRole?.[r]?.[key] || 0), 0);

  // Fetch commission stats
  useEffect(() => {
    import('@stannel/api-client').then(({ fetchWithAuth, config, getHeaders }) => {
      fetchWithAuth(`${config.baseUrl}/admin/commission-stats`, {
        headers: getHeaders() as Record<string, string>,
      })
        .then(res => res.json())
        .then(data => setCommissionStats(data))
        .catch(console.error);
    });
  }, []);

  // Filtered architects
  const filteredArchitects = useMemo(() => {
    if (!topArchitects) return [];
    if (!searchQuery) return topArchitects;
    return topArchitects.filter((a: any) =>
      a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [topArchitects, searchQuery]);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    if (!supplierPerformance) return [];
    if (!searchQuery) return supplierPerformance;
    return supplierPerformance.filter((s: any) =>
      s.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [supplierPerformance, searchQuery]);

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  const tabs: { id: ReportTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'סקירה כללית', icon: BarChart3 },
    { id: 'architects', label: 'אדריכלים', icon: Users },
    { id: 'suppliers', label: 'ספקים', icon: Building2 },
    { id: 'commissions', label: 'עמלות', icon: DollarSign },
    { id: 'sla', label: 'SLA', icon: Clock },
    { id: 'activity', label: 'פעילות משתמשים', icon: Activity },
  ];

  return (
    <div className="min-h-screen pt-8">
      <div className="px-4 sm:px-6 max-w-7xl mx-auto relative z-10 pb-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <Link href="/admin" className="inline-flex items-center gap-2 text-[#8b7c69] hover:text-[#c99b4a] mb-4 transition-colors">
            <ArrowRight size={16} />
            חזרה לפאנל ניהול
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2b241d] flex items-center gap-3 mb-1">
              <BarChart3 className="text-[#c99b4a]" size={28} />
              אנליטיקות ודוחות
            </h1>
            <p className="text-[#8b7c69] text-sm">נתונים, סטטיסטיקות וייצוא דוחות</p>
          </div>
          {/* Period Selector */}
          <div className="flex gap-1.5 mt-3">
            {(['week', 'month', 'quarter', 'year'] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${period === p ? 'bg-[#c99b4a] text-white' : 'bg-[#f7f3f2] text-[#8b7c69] hover:bg-[#f0ebe6]'}`}>
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'חשבוניות', value: trendsData?.summary?.totalInvoices || 0, color: 'text-[#2b241d]', border: 'border-[rgba(201,155,74,0.08)]' },
            { label: 'אושרו', value: trendsData?.summary?.approvedCount || 0, color: 'text-[#c99b4a]', border: 'border-[#c99b4a]/30' },
            { label: 'סה"כ סכום', value: `₪${(trendsData?.summary?.totalAmount || 0).toLocaleString()}`, color: 'text-amber-400', border: 'border-amber-500/30' },
            { label: 'עמלת מנהל', value: commissionStats ? `₪${commissionStats.adminCommission.toLocaleString()}` : '...', color: 'text-[#c99b4a]', border: 'border-[#c99b4a]/30' },
            { label: 'SLA', value: slaData ? `${slaData.complianceRate}%` : '...', color: 'text-blue-400', border: 'border-blue-500/30' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className={`bg-[#f7f3f2] border ${stat.border} rounded-xl p-3 sm:p-4 text-center`}>
                <p className="text-[#a89b8a] text-[10px] sm:text-xs mb-1">{stat.label}</p>
                <p className={`text-lg sm:text-xl font-bold ${stat.color}`}>{trendsLoading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : String(stat.value)}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4 -mx-1 px-1">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }} className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${activeTab === tab.id ? 'bg-[#c99b4a] text-white' : 'bg-[#f7f3f2] text-[#8b7c69] hover:bg-[#f0ebe6]'}`}>
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search (for relevant tabs) */}
        {(activeTab === 'architects' || activeTab === 'suppliers') && (
          <div className="relative mb-4">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89b8a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'architects' ? 'חיפוש אדריכל...' : 'חיפוש ספק...'}
              className="w-full pr-10 pl-4 py-2.5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-xl text-[#2b241d] text-sm placeholder:text-[#a89b8a] focus:outline-none focus:border-[#c99b4a]"
            />
          </div>
        )}

        {/* Tab Content */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top Architects */}
              <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[#2b241d] flex items-center gap-2">
                    <Users size={18} className="text-[#c99b4a]" />
                    אדריכלים מובילים
                  </h2>
                  <button onClick={() => setActiveTab('architects')} className="text-[#c99b4a] text-sm hover:underline">הצג הכל</button>
                </div>
                {architectsLoading ? (
                  <div className="text-center py-8"><Loader2 className="w-8 h-8 mx-auto animate-spin text-[#c99b4a]" /></div>
                ) : !topArchitects?.length ? (
                  <p className="text-[#a89b8a] text-center py-8">אין נתונים</p>
                ) : (
                  <div className="space-y-2">
                    {topArchitects.slice(0, 5).map((arch: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-[#f7f3f2] rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-amber-400 text-black' : i === 1 ? 'bg-gray-300 text-black' : i === 2 ? 'bg-amber-600 text-white' : 'bg-[#f7f3f2] text-[#2b241d]'}`}>
                            {i < 3 ? <Award size={14} /> : i + 1}
                          </div>
                          <div>
                            <p className="text-[#2b241d] font-medium text-sm">{arch.name}</p>
                            <p className="text-[#a89b8a] text-xs">{arch.invoiceCount} חשבוניות</p>
                          </div>
                        </div>
                        <p className="text-[#c99b4a] font-bold text-sm">₪{arch.totalEarned?.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Suppliers */}
              <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[#2b241d] flex items-center gap-2">
                    <Building2 size={18} className="text-[#c99b4a]" />
                    ספקים מובילים
                  </h2>
                  <button onClick={() => setActiveTab('suppliers')} className="text-[#c99b4a] text-sm hover:underline">הצג הכל</button>
                </div>
                {suppliersLoading ? (
                  <div className="text-center py-8"><Loader2 className="w-8 h-8 mx-auto animate-spin text-[#c99b4a]" /></div>
                ) : !supplierPerformance?.length ? (
                  <p className="text-[#a89b8a] text-center py-8">אין נתונים</p>
                ) : (
                  <div className="space-y-2">
                    {supplierPerformance.slice(0, 5).map((sup: any) => (
                      <div key={sup.id} className="flex items-center justify-between p-3 bg-[#f7f3f2] rounded-xl">
                        <div>
                          <p className="text-[#2b241d] font-medium text-sm">{sup.companyName}</p>
                          <p className="text-[#a89b8a] text-xs">{sup.invoiceCount} חשבוניות</p>
                        </div>
                        <div className="text-left">
                          {sup.hasActiveContract && <span className="text-xs text-[#c99b4a]">חוזה פעיל</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Insights */}
              {trendsData?.aiInsights && (
                <div className="lg:col-span-2 bg-purple-50 border border-purple-500/30 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-[#2b241d] mb-3 flex items-center gap-2">
                    <TrendingUp size={18} className="text-purple-400" />
                    תובנות AI
                  </h2>
                  {typeof trendsData.aiInsights === 'string' ? (
                    <p className="text-[#8b7c69] whitespace-pre-wrap text-sm">{trendsData.aiInsights}</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {(trendsData.aiInsights as any).summary && <div><h3 className="text-purple-400 font-medium text-sm mb-1">סיכום</h3><p className="text-[#8b7c69] text-sm">{String((trendsData.aiInsights as any).summary)}</p></div>}
                      {(trendsData.aiInsights as any).trends?.length > 0 && <div><h3 className="text-purple-400 font-medium text-sm mb-1">מגמות</h3><ul className="text-[#8b7c69] text-sm space-y-1">{(trendsData.aiInsights as any).trends.map((t: any, i: number) => <li key={i}>• {typeof t === 'object' ? (t.title ? `${t.title}: ${t.insight || t.action || ''}` : JSON.stringify(t)) : String(t)}</li>)}</ul></div>}
                      {(trendsData.aiInsights as any).recommendations?.length > 0 && <div><h3 className="text-[#c99b4a] font-medium text-sm mb-1">המלצות</h3><ul className="text-[#8b7c69] text-sm space-y-1">{(trendsData.aiInsights as any).recommendations.map((r: any, i: number) => <li key={i}>• {typeof r === 'object' ? (r.message || r.text || JSON.stringify(r)) : String(r)}</li>)}</ul></div>}
                      {(trendsData.aiInsights as any).alerts?.length > 0 && <div><h3 className="text-red-400 font-medium text-sm mb-1">התראות</h3><ul className="text-red-400/80 text-sm space-y-1">{(trendsData.aiInsights as any).alerts.map((a: any, i: number) => <li key={i}>• {typeof a === 'object' ? (a.message || a.text || JSON.stringify(a)) : String(a)}</li>)}</ul></div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Architects Tab */}
          {activeTab === 'architects' && (
            <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#2b241d]">דוח אדריכלים ({filteredArchitects.length})</h2>
                <button
                  onClick={() => exportToCSV(filteredArchitects.map((a: any) => ({
                    שם: a.name, אימייל: a.email || '', חשבוניות: a.invoiceCount, 'סה"כ ₪': a.totalEarned, דרגה: a.tier
                  })), 'architects_report')}
                  className="px-3 py-2 bg-[#c99b4a]/15 border border-[#c99b4a]/30 text-[#c99b4a] rounded-lg text-xs sm:text-sm flex items-center gap-1.5 hover:bg-[#c99b4a]/25 whitespace-nowrap"
                >
                  <Download size={14} />
                  ייצוא CSV
                </button>
              </div>
              {architectsLoading ? (
                <div className="text-center py-12"><Loader2 className="w-8 h-8 mx-auto animate-spin text-[#c99b4a]" /></div>
              ) : filteredArchitects.length === 0 ? (
                <p className="text-[#a89b8a] text-center py-12">{searchQuery ? 'לא נמצאו תוצאות' : 'אין נתונים'}</p>
              ) : (
                <>
                  {/* Table Header */}
                  <div className="hidden md:grid grid-cols-5 gap-4 px-4 py-2 text-[#a89b8a] text-sm border-b border-[rgba(201,155,74,0.08)] mb-2">
                    <span>#</span><span>שם</span><span>חשבוניות</span><span>סה"כ סכום</span><span>דרגה</span>
                  </div>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {filteredArchitects.map((arch: any, i: number) => (
                      <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center p-4 bg-[#f7f3f2] rounded-xl hover:bg-[#f0ebe6] transition-colors">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-400 text-black' : i === 1 ? 'bg-gray-300 text-black' : i === 2 ? 'bg-amber-600 text-white' : 'bg-[#f7f3f2] text-[#8b7c69]'}`}>
                            {i + 1}
                          </div>
                        </div>
                        <div>
                          <p className="text-[#2b241d] font-medium text-sm">{arch.name}</p>
                          <p className="text-[#a89b8a] text-xs md:hidden">{arch.invoiceCount} חשבוניות • ₪{arch.totalEarned?.toLocaleString()}</p>
                        </div>
                        <p className="text-[#8b7c69] text-sm hidden md:block">{arch.invoiceCount}</p>
                        <p className="text-[#c99b4a] font-bold text-sm hidden md:block">₪{arch.totalEarned?.toLocaleString()}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs w-fit hidden md:inline ${arch.tier === 'PLATINUM' ? 'bg-cyan-500/20 text-cyan-400' : arch.tier === 'GOLD' ? 'bg-yellow-500/20 text-yellow-400' : arch.tier === 'SILVER' ? 'bg-gray-500/20 text-gray-300' : 'bg-amber-500/20 text-amber-400'}`}>
                          {arch.tier || 'BRONZE'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Suppliers Tab */}
          {activeTab === 'suppliers' && (
            <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#2b241d]">דוח ספקים ({filteredSuppliers.length})</h2>
                <button
                  onClick={() => exportToCSV(filteredSuppliers.map((s: any) => ({
                    חברה: s.companyName, חשבוניות: s.invoiceCount, 'חוזה פעיל': s.hasActiveContract ? 'כן' : 'לא'
                  })), 'suppliers_report')}
                  className="px-3 py-2 bg-[#c99b4a]/15 border border-[#c99b4a]/30 text-[#c99b4a] rounded-lg text-xs sm:text-sm flex items-center gap-1.5 hover:bg-[#c99b4a]/25 whitespace-nowrap"
                >
                  <Download size={14} />
                  ייצוא CSV
                </button>
              </div>
              {suppliersLoading ? (
                <div className="text-center py-12"><Loader2 className="w-8 h-8 mx-auto animate-spin text-[#c99b4a]" /></div>
              ) : filteredSuppliers.length === 0 ? (
                <p className="text-[#a89b8a] text-center py-12">{searchQuery ? 'לא נמצאו תוצאות' : 'אין נתונים'}</p>
              ) : (
                <>
                  <div className="hidden md:grid grid-cols-3 gap-4 px-4 py-2 text-[#a89b8a] text-sm border-b border-[rgba(201,155,74,0.08)] mb-2">
                    <span>חברה</span><span>חשבוניות</span><span>סטטוס חוזה</span>
                  </div>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {filteredSuppliers.map((sup: any) => (
                      <div key={sup.id} className="grid grid-cols-2 md:grid-cols-3 gap-4 items-center p-4 bg-[#f7f3f2] rounded-xl hover:bg-[#f0ebe6] transition-colors">
                        <div>
                          <p className="text-[#2b241d] font-medium text-sm">{sup.companyName}</p>
                          <p className="text-[#a89b8a] text-xs md:hidden">{sup.invoiceCount} חשבוניות</p>
                        </div>
                        <p className="text-[#8b7c69] text-sm hidden md:block">{sup.invoiceCount}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs w-fit hidden md:inline ${sup.hasActiveContract ? 'bg-[#c99b4a]/15 text-[#c99b4a]' : 'bg-[#f7f3f2] text-[#a89b8a]'}`}>
                          {sup.hasActiveContract ? 'חוזה פעיל' : 'ללא חוזה'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Commissions Tab */}
          {activeTab === 'commissions' && (
            <div className="space-y-6">
              <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[#2b241d] flex items-center gap-2">
                    <DollarSign size={18} className="text-[#c99b4a]" />
                    דוח עמלות
                  </h2>
                  <button
                    onClick={() => {
                      if (!commissionStats) return;
                      exportToCSV([{
                        'חשבוניות ששולמו': commissionStats.totalPaidInvoices,
                        'מחזור כולל ₪': commissionStats.totalRevenue,
                        'עמלה כוללת ₪': commissionStats.totalCommission,
                        'עמלת מנהל ₪': commissionStats.adminCommission,
                        'עמלת אדריכלים ₪': commissionStats.architectCommission,
                        'נקודות אדריכלים': commissionStats.architectPoints,
                        'שער המרה': commissionStats.pointsPerShekel,
                      }], 'commission_report');
                    }}
                    className="px-3 py-2 bg-[#c99b4a]/15 border border-[#c99b4a]/30 text-[#c99b4a] rounded-lg text-xs sm:text-sm flex items-center gap-1.5 hover:bg-[#c99b4a]/25 whitespace-nowrap"
                  >
                    <Download size={14} />
                    ייצוא CSV
                  </button>
                </div>

                {!commissionStats ? (
                  <div className="text-center py-12"><Loader2 className="w-8 h-8 mx-auto animate-spin text-[#c99b4a]" /></div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      <div className="bg-[#c99b4a]/10 border border-[#c99b4a]/20 rounded-xl p-5 text-center">
                        <p className="text-[#c99b4a]/70 text-sm mb-1">מחזור כולל</p>
                        <p className="text-2xl font-bold text-[#c99b4a]">₪{commissionStats.totalRevenue.toLocaleString()}</p>
                      </div>
                      <div className="bg-[#c99b4a]/10 border border-[#c99b4a]/20 rounded-xl p-5 text-center">
                        <p className="text-[#c99b4a]/70 text-sm mb-1">עמלת מנהל (2%)</p>
                        <p className="text-2xl font-bold text-[#c99b4a]">₪{commissionStats.adminCommission.toLocaleString()}</p>
                      </div>
                      <div className="bg-purple-50 border border-purple-500/20 rounded-xl p-5 text-center">
                        <p className="text-purple-500/70 text-sm mb-1">עמלת אדריכלים (2%)</p>
                        <p className="text-2xl font-bold text-purple-500">₪{commissionStats.architectCommission.toLocaleString()}</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-500/20 rounded-xl p-5 text-center">
                        <p className="text-amber-600/70 text-sm mb-1">נקודות שחולקו</p>
                        <p className="text-2xl font-bold text-amber-600">{commissionStats.architectPoints.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="bg-[#f7f3f2] rounded-xl p-4">
                        <p className="text-[#a89b8a] text-sm">חשבוניות ששולמו</p>
                        <p className="text-xl font-bold text-[#2b241d]">{commissionStats.totalPaidInvoices}</p>
                      </div>
                      <div className="bg-[#f7f3f2] rounded-xl p-4">
                        <p className="text-[#a89b8a] text-sm">שיעור עמלה</p>
                        <p className="text-xl font-bold text-[#2b241d]">{commissionStats.commissionRate}</p>
                      </div>
                      <div className="bg-[#f7f3f2] rounded-xl p-4">
                        <p className="text-[#a89b8a] text-sm">שער המרה</p>
                        <p className="text-xl font-bold text-[#2b241d]">1₪ = {commissionStats.pointsPerShekel} נקודות</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* SLA Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              {activityLoading ? (
                <div className="text-center py-12"><Loader2 className="w-8 h-8 mx-auto animate-spin text-[#c99b4a]" /></div>
              ) : activityError || !activityData?.trackingReady ? (
                <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6 text-center text-[#8b7c69] text-sm">
                  לא ניתן לטעון את נתוני הפעילות כרגע. נסו לרענן את הדף.
                </div>
              ) : (
                <>
                  {/* Logged in today, split by role */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { label: 'התחברו היום', value: roleSum(['ARCHITECT', 'DESIGNER', 'SUPPLIER', 'ADMIN'], 'activeToday'), color: 'text-[#2b241d]' },
                      { label: 'אדריכלים ומעצבים היום', value: roleSum(['ARCHITECT', 'DESIGNER'], 'activeToday'), color: 'text-[#c99b4a]' },
                      { label: 'ספקים היום', value: roleSum(['SUPPLIER'], 'activeToday'), color: 'text-blue-400' },
                      { label: 'מנהלים היום', value: roleSum(['ADMIN'], 'activeToday'), color: 'text-[#8b7c69]' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl p-3 sm:p-4 text-center">
                        <p className="text-[#a89b8a] text-[10px] sm:text-xs mb-1">{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Breakdown table */}
                  <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-4 sm:p-6 overflow-x-auto">
                    <h2 className="text-lg font-semibold text-[#2b241d] mb-1 flex items-center gap-2">
                      <Users size={18} className="text-[#c99b4a]" />
                      פעילות לפי סוג משתמש
                    </h2>
                    <p className="text-[#a89b8a] text-xs mb-4">הנתונים נאספים מרגע הפעלת המעקב. "טרם נכנסו" מתייחס למשתמשים פעילים שלא נצפו מאז.</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[#a89b8a] text-xs border-b border-[rgba(201,155,74,0.12)]">
                          <th className="text-right py-2 font-medium">סוג</th>
                          <th className="py-2 font-medium">משתמשים פעילים</th>
                          <th className="py-2 font-medium">היום</th>
                          <th className="py-2 font-medium">7 ימים</th>
                          <th className="py-2 font-medium">30 ימים</th>
                          <th className="py-2 font-medium">טרם נכנסו</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activityGroups.map((g) => (
                          <tr key={g.label} className="border-b border-[rgba(201,155,74,0.06)] text-center text-[#2b241d]">
                            <td className="text-right py-2 font-medium">{g.label}</td>
                            <td className="py-2">{roleSum(g.roles, 'total')}</td>
                            <td className="py-2 font-bold text-[#c99b4a]">{roleSum(g.roles, 'activeToday')}</td>
                            <td className="py-2">{roleSum(g.roles, 'active7d')}</td>
                            <td className="py-2">{roleSum(g.roles, 'active30d')}</td>
                            <td className="py-2 text-[#8b7c69]">{roleSum(g.roles, 'neverSeen')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Most viewed pages */}
                  <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-4 sm:p-6 overflow-x-auto">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h2 className="text-lg font-semibold text-[#2b241d] flex items-center gap-2">
                        <Activity size={18} className="text-[#c99b4a]" />
                        העמודים הנצפים ביותר
                      </h2>
                      <div className="flex gap-1.5">
                        {[1, 7, 30].map((d) => (
                          <button key={d} onClick={() => setActivityDays(d)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${activityDays === d ? 'bg-[#c99b4a] text-white' : 'bg-white text-[#8b7c69] hover:bg-[#f0ebe6]'}`}>
                            {d === 1 ? 'היום' : `${d} ימים`}
                          </button>
                        ))}
                      </div>
                    </div>
                    {activityData.topPages.length === 0 ? (
                      <p className="text-center text-[#a89b8a] text-sm py-4">עדיין אין צפיות בעמודים בטווח הזה.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[#a89b8a] text-xs border-b border-[rgba(201,155,74,0.12)]">
                            <th className="text-right py-2 font-medium">עמוד</th>
                            <th className="py-2 font-medium">צפיות</th>
                            <th className="py-2 font-medium">אדריכלים</th>
                            <th className="py-2 font-medium">ספקים</th>
                            <th className="py-2 font-medium">מנהלים</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activityData.topPages.map((p) => (
                            <tr key={p.path} className="border-b border-[rgba(201,155,74,0.06)] text-center text-[#2b241d]">
                              <td className="text-right py-2 font-mono text-xs" dir="ltr">{p.path}</td>
                              <td className="py-2 font-bold text-[#c99b4a]">{p.total}</td>
                              <td className="py-2">{p.architects}</td>
                              <td className="py-2">{p.suppliers}</td>
                              <td className="py-2 text-[#8b7c69]">{p.admins}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Recent users */}
                  <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-4 sm:p-6 overflow-x-auto">
                    <h2 className="text-lg font-semibold text-[#2b241d] mb-4">פעילים לאחרונה</h2>
                    {activityData.recentUsers.length === 0 ? (
                      <p className="text-center text-[#a89b8a] text-sm py-4">עדיין לא נרשמה פעילות.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[#a89b8a] text-xs border-b border-[rgba(201,155,74,0.12)]">
                            <th className="text-right py-2 font-medium">שם</th>
                            <th className="py-2 font-medium">סוג</th>
                            <th className="py-2 font-medium">פעילות אחרונה</th>
                            <th className="py-2 font-medium">כניסה אחרונה</th>
                            <th className="py-2 font-medium">כניסות</th>
                            <th className="py-2 font-medium">פלטפורמה</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activityData.recentUsers.map((u) => (
                            <tr key={u.id} className="border-b border-[rgba(201,155,74,0.06)] text-center text-[#2b241d]">
                              <td className="text-right py-2">
                                <span className="font-medium">{u.name}</span>
                                {u.company ? <span className="text-[#a89b8a] text-xs"> · {u.company}</span> : null}
                              </td>
                              <td className="py-2 text-xs">{u.role === 'SUPPLIER' ? 'ספק' : u.role === 'ADMIN' ? 'מנהל' : u.role === 'DESIGNER' ? 'מעצב' : 'אדריכל'}</td>
                              <td className="py-2 text-xs whitespace-nowrap">{formatDateTime(u.lastSeenAt)}</td>
                              <td className="py-2 text-xs whitespace-nowrap">{formatDateTime(u.lastLoginAt)}</td>
                              <td className="py-2">{u.loginCount}</td>
                              <td className="py-2 text-xs">{u.platform === 'mobile' ? 'אפליקציה' : 'אתר'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'sla' && (
            <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[#2b241d] flex items-center gap-2">
                  <Clock size={18} className="text-blue-400" />
                  דוח עמידה ב-SLA (30 ימים אחרונים)
                </h2>
                {slaData && (
                  <button
                    onClick={() => {
                      const rows = Object.entries(slaData.bySupplier).map(([name, data]: [string, any]) => ({
                        ספק: name, 'עמדו ב-SLA': data.compliant, חריגות: data.breached, 'סה"כ': data.compliant + data.breached
                      }));
                      exportToCSV(rows, 'sla_report');
                    }}
                    className="px-3 py-2 bg-[#c99b4a]/15 border border-[#c99b4a]/30 text-[#c99b4a] rounded-lg text-xs sm:text-sm flex items-center gap-1.5 hover:bg-[#c99b4a]/25 whitespace-nowrap"
                  >
                    <Download size={14} />
                    ייצוא CSV
                  </button>
                )}
              </div>

              {slaLoading ? (
                <div className="text-center py-12"><Loader2 className="w-8 h-8 mx-auto animate-spin text-[#c99b4a]" /></div>
              ) : !slaData ? (
                <p className="text-[#a89b8a] text-center py-12">אין נתונים</p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-5 bg-[#f7f3f2] rounded-xl">
                      <p className="text-[#8b7c69] text-sm">סה"כ</p>
                      <p className="text-2xl font-bold text-[#2b241d]">{slaData.total}</p>
                    </div>
                    <div className="text-center p-5 bg-[#c99b4a]/10 rounded-xl">
                      <p className="text-[#c99b4a]/70 text-sm">עמדו ב-SLA</p>
                      <p className="text-2xl font-bold text-[#c99b4a]">{slaData.compliant}</p>
                    </div>
                    <div className="text-center p-5 bg-red-500/10 rounded-xl">
                      <p className="text-red-400/70 text-sm">חריגות</p>
                      <p className="text-2xl font-bold text-red-400">{slaData.breached}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-[#8b7c69] text-sm">שיעור עמידה</span>
                      <span className="text-[#2b241d] font-bold">{slaData.complianceRate}%</span>
                    </div>
                    <div className="h-4 bg-[#f7f3f2] rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${slaData.complianceRate >= 90 ? 'bg-[#c99b4a]' : slaData.complianceRate >= 70 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${slaData.complianceRate}%` }} />
                    </div>
                  </div>

                  {/* By Supplier */}
                  {Object.keys(slaData.bySupplier).length > 0 && (
                    <div>
                      <h3 className="text-[#8b7c69] font-medium mb-3">לפי ספק:</h3>
                      <div className="space-y-2">
                        {Object.entries(slaData.bySupplier).map(([name, data]: [string, any]) => (
                          <div key={name} className="flex items-center justify-between p-3 bg-[#f7f3f2] rounded-xl">
                            <span className="text-[#2b241d] font-medium text-sm">{name}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-[#c99b4a] text-sm flex items-center gap-1"><CheckCircle size={14} /> {data.compliant}</span>
                              {data.breached > 0 && <span className="text-red-400 text-sm flex items-center gap-1"><AlertTriangle size={14} /> {data.breached}</span>}
                              <div className="w-20 h-2 bg-[#f7f3f2] rounded-full overflow-hidden">
                                <div className="h-full bg-[#c99b4a] rounded-full" style={{ width: `${(data.compliant / (data.compliant + data.breached)) * 100}%` }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
