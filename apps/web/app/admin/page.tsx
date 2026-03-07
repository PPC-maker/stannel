'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { adminApi } from '@stannel/api-client';
import type { SystemLog, SystemLogStats } from '@stannel/types';
import { SystemLogSeverity, SystemLogCategory } from '@stannel/types';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  XCircle,
  CheckCircle,
  RefreshCw,
  Copy,
  Filter,
  Activity,
  Server,
  Database,
  Shield,
  Clock,
  Users,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  Search,
  UserCheck,
  Mail,
  Phone,
  Building2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

type TabType = 'users' | 'logs' | 'scan';

interface PendingUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  createdAt: string;
  architectProfile?: { id: string } | null;
  supplierProfile?: { id: string; companyName: string } | null;
}

interface ScanReport {
  id: string;
  isHealthy: boolean;
  checksRun: number;
  checksPassed: number;
  checksFailed: number;
  checksWarnings: number;
  results: Array<{
    name: string;
    category: string;
    status: 'ok' | 'warning' | 'error';
    message: string;
    responseTime?: number;
  }>;
  errorsLast24h: number;
  claudeFormat?: string;
  createdAt: string;
}

const severityConfig = {
  INFO: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'מידע' },
  WARNING: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'אזהרה' },
  ERROR: { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'שגיאה' },
  CRITICAL: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'קריטי' },
};

const categoryConfig = {
  HEALTH_CHECK: { icon: Activity, label: 'בדיקת בריאות' },
  SECURITY: { icon: Shield, label: 'אבטחה' },
  API_TEST: { icon: Server, label: 'בדיקת API' },
  DATABASE: { icon: Database, label: 'מסד נתונים' },
  PERFORMANCE: { icon: Clock, label: 'ביצועים' },
  SCHEDULER: { icon: RefreshCw, label: 'משימות מתוזמנות' },
};

const roleLabels: Record<string, string> = {
  ARCHITECT: 'אדריכל',
  SUPPLIER: 'ספק',
  ADMIN: 'מנהל',
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState<SystemLogStats | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [latestScan, setLatestScan] = useState<ScanReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [filter, setFilter] = useState<{
    severity?: SystemLogSeverity;
    category?: SystemLogCategory;
    resolved?: boolean;
  }>({ resolved: false });
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [approvingUser, setApprovingUser] = useState<string | null>(null);

  const fetchPendingUsers = async () => {
    try {
      const response = await adminApi.getPendingUsers();
      setPendingUsers(response.data as PendingUser[]);
    } catch (error) {
      console.error('Error fetching pending users:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const [logsRes, statsRes] = await Promise.all([
        adminApi.getSystemLogs({
          pageSize: 50,
          ...filter,
        }),
        adminApi.getSystemLogStats(),
      ]);
      setLogs(logsRes.data);
      setStats(statsRes);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const fetchLatestScan = async () => {
    try {
      const response = await adminApi.getLatestScanReport();
      if (response && 'id' in response) {
        setLatestScan(response as ScanReport);
      }
    } catch (error) {
      console.error('Error fetching scan:', error);
    }
  };

  const fetchData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchPendingUsers(), fetchLogs(), fetchLatestScan()]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [filter]);

  const handleApproveUser = async (userId: string) => {
    setApprovingUser(userId);
    try {
      await adminApi.activateUser(userId, true);
      await fetchPendingUsers();
    } catch (error) {
      console.error('Error approving user:', error);
    } finally {
      setApprovingUser(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedUsers.size === 0) return;
    setRefreshing(true);
    try {
      await adminApi.bulkActivateUsers(Array.from(selectedUsers), true);
      setSelectedUsers(new Set());
      await fetchPendingUsers();
    } catch (error) {
      console.error('Error bulk approving users:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleResolve = async (logId: string) => {
    try {
      await adminApi.resolveSystemLog(logId);
      fetchLogs();
      if (selectedLog?.id === logId) {
        setSelectedLog(null);
      }
    } catch (error) {
      console.error('Error resolving log:', error);
    }
  };

  const handleCopyToClipboard = async (log: SystemLog) => {
    const text = log.claudeFormat || `
## System Error Report - STANNEL

**Error ID:** ${log.id}
**Time:** ${new Date(log.createdAt).toISOString()}
**Severity:** ${log.severity}
**Category:** ${log.category}

### Issue
**${log.title}**
${log.message}

### Details
\`\`\`
${log.details || 'No additional details'}
\`\`\`

${log.stackTrace ? `### Stack Trace\n\`\`\`\n${log.stackTrace}\n\`\`\`` : ''}

### Request Info
- Endpoint: ${log.endpoint || 'N/A'}
- Response Time: ${log.responseTime || 'N/A'}ms

---
Please analyze this error and provide a fix.
    `.trim();

    await navigator.clipboard.writeText(text);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyScanReport = async () => {
    if (!latestScan?.claudeFormat) return;
    await navigator.clipboard.writeText(latestScan.claudeFormat);
    setCopiedId('scan');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const runScan = async () => {
    try {
      setRefreshing(true);
      await adminApi.runSystemScan();
      await fetchLatestScan();
      await fetchLogs();
    } catch (error) {
      console.error('Error running scan:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const selectAllUsers = () => {
    if (selectedUsers.size === pendingUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(pendingUsers.map((u) => u.id)));
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <PageSlider images={sliderImages.dashboard} opacity={0.15} />
        <div className="flex flex-col items-center gap-4 z-10">
          <Loader2 className="w-10 h-10 text-gold-400 animate-spin" />
          <p className="text-white/60">טוען נתוני מערכת...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <PageSlider images={sliderImages.dashboard} opacity={0.15} />
      <div className="p-6 max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                <Shield className="text-gold-400" />
                פאנל ניהול
              </h1>
              <p className="text-white/60 mt-1">ניהול משתמשים ומעקב אחרי תקלות המערכת</p>
            </div>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              רענון
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-gold-400 text-primary-900'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Users size={18} />
            משתמשים ממתינים
            {pendingUsers.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              activeTab === 'scan'
                ? 'bg-gold-400 text-primary-900'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Activity size={18} />
            סריקת מערכת
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'bg-gold-400 text-primary-900'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <FileText size={18} />
            לוגים
            {stats && stats.unresolved > 0 && (
              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                {stats.unresolved}
              </span>
            )}
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard hover={false}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <UserCheck className="text-gold-400" />
                  משתמשים ממתינים לאישור ({pendingUsers.length})
                </h2>
                {pendingUsers.length > 0 && (
                  <button
                    onClick={handleBulkApprove}
                    disabled={selectedUsers.size === 0 || refreshing}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 size={18} />
                    אשר נבחרים ({selectedUsers.size})
                  </button>
                )}
              </div>

              {pendingUsers.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle className="w-20 h-20 mx-auto text-green-400 mb-4" />
                  <p className="text-white text-xl font-medium">אין משתמשים ממתינים</p>
                  <p className="text-white/60 mt-2">כל המשתמשים אושרו</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="py-3 px-4 text-right">
                          <input
                            type="checkbox"
                            checked={selectedUsers.size === pendingUsers.length}
                            onChange={selectAllUsers}
                            className="w-4 h-4 rounded bg-white/10 border-white/20 text-gold-400"
                          />
                        </th>
                        <th className="py-3 px-4 text-right text-white/60 font-medium">שם</th>
                        <th className="py-3 px-4 text-right text-white/60 font-medium">אימייל</th>
                        <th className="py-3 px-4 text-right text-white/60 font-medium">טלפון</th>
                        <th className="py-3 px-4 text-right text-white/60 font-medium">תפקיד</th>
                        <th className="py-3 px-4 text-right text-white/60 font-medium">חברה</th>
                        <th className="py-3 px-4 text-right text-white/60 font-medium">תאריך הרשמה</th>
                        <th className="py-3 px-4 text-right text-white/60 font-medium">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <input
                              type="checkbox"
                              checked={selectedUsers.has(user.id)}
                              onChange={() => toggleUserSelection(user.id)}
                              className="w-4 h-4 rounded bg-white/10 border-white/20 text-gold-400"
                            />
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-primary-900 font-bold">
                                {user.name.charAt(0)}
                              </div>
                              <span className="text-white font-medium">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-white/80 flex items-center gap-2">
                              <Mail size={14} className="text-white/40" />
                              {user.email}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-white/80 flex items-center gap-2">
                              <Phone size={14} className="text-white/40" />
                              {user.phone || '-'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm ${
                                user.role === 'ARCHITECT'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-purple-500/20 text-purple-400'
                              }`}
                            >
                              {roleLabels[user.role] || user.role}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-white/80 flex items-center gap-2">
                              <Building2 size={14} className="text-white/40" />
                              {user.supplierProfile?.companyName || '-'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-white/60 flex items-center gap-2">
                              <Calendar size={14} className="text-white/40" />
                              {new Date(user.createdAt).toLocaleDateString('he-IL')}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => handleApproveUser(user.id)}
                              disabled={approvingUser === user.id}
                              className="btn-gold text-sm flex items-center gap-2 disabled:opacity-50"
                            >
                              {approvingUser === user.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <UserCheck size={16} />
                              )}
                              אשר
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* Scan Tab */}
        {activeTab === 'scan' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Scan Header */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={runScan}
                disabled={refreshing}
                className="btn-primary flex items-center gap-2"
              >
                <Search size={18} className={refreshing ? 'animate-spin' : ''} />
                הפעל סריקה
              </button>
              {latestScan?.claudeFormat && (
                <button
                  onClick={handleCopyScanReport}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Copy size={18} />
                  {copiedId === 'scan' ? 'הועתק!' : 'העתק ל-Claude'}
                </button>
              )}
            </div>

            {latestScan ? (
              <>
                {/* Scan Status Banner */}
                <GlassCard
                  hover={false}
                  className={`mb-6 ${
                    latestScan.isHealthy
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <div className="text-center py-4">
                    <div
                      className={`text-4xl mb-2 ${
                        latestScan.isHealthy ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {latestScan.isHealthy ? '✅' : '⚠️'}
                    </div>
                    <h2
                      className={`text-2xl font-bold ${
                        latestScan.isHealthy ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {latestScan.isHealthy ? 'דוח סטטוס מערכת' : 'התראת מערכת'}
                    </h2>
                    <p className="text-white/60 mt-2">
                      זמן: {new Date(latestScan.createdAt).toLocaleString('he-IL')}
                    </p>
                  </div>
                </GlassCard>

                {/* Scan Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <GlassCard hover={false}>
                    <div className="text-center">
                      <p className="text-white/50 text-sm">בדיקות</p>
                      <p className="text-3xl font-bold text-white">{latestScan.checksRun}</p>
                    </div>
                  </GlassCard>
                  <GlassCard hover={false} className="bg-green-500/10">
                    <div className="text-center">
                      <p className="text-green-400/70 text-sm">עברו</p>
                      <p className="text-3xl font-bold text-green-400">{latestScan.checksPassed}</p>
                    </div>
                  </GlassCard>
                  <GlassCard hover={false} className="bg-yellow-500/10">
                    <div className="text-center">
                      <p className="text-yellow-400/70 text-sm">אזהרות</p>
                      <p className="text-3xl font-bold text-yellow-400">{latestScan.checksWarnings}</p>
                    </div>
                  </GlassCard>
                  <GlassCard hover={false} className="bg-red-500/10">
                    <div className="text-center">
                      <p className="text-red-400/70 text-sm">נכשלו</p>
                      <p className="text-3xl font-bold text-red-400">{latestScan.checksFailed}</p>
                    </div>
                  </GlassCard>
                </div>

                {/* Scan Results */}
                <GlassCard hover={false}>
                  <h3 className="text-lg font-semibold text-white mb-4">תוצאות הסריקה</h3>
                  <div className="space-y-2">
                    {latestScan.results.map((result, i) => {
                      const statusConfig = {
                        ok: { bg: 'bg-green-500/20', border: 'border-green-500/30', icon: '✅' },
                        warning: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', icon: '⚠️' },
                        error: { bg: 'bg-red-500/20', border: 'border-red-500/30', icon: '❌' },
                      };
                      const config = statusConfig[result.status];

                      return (
                        <div
                          key={i}
                          className={`p-4 rounded-lg border ${config.bg} ${config.border}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{config.icon}</span>
                              <div>
                                <p className="text-white font-medium">{result.name}</p>
                                <p className="text-white/60 text-sm">{result.message}</p>
                              </div>
                            </div>
                            {result.responseTime && (
                              <span className="text-white/40 text-sm">
                                {result.responseTime}ms
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              </>
            ) : (
              <GlassCard hover={false}>
                <div className="text-center py-16">
                  <Search className="w-16 h-16 mx-auto text-white/20 mb-4" />
                  <p className="text-white/60">אין דוחות סריקה</p>
                  <p className="text-white/40 text-sm mt-2">לחץ על "הפעל סריקה" להפעלת סריקת מערכת</p>
                </div>
              </GlassCard>
            )}
          </motion.div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {[
                  { label: 'סה״כ לוגים', value: stats.total, icon: FileText, color: 'text-blue-400' },
                  { label: 'לא טופלו', value: stats.unresolved, icon: AlertCircle, color: 'text-yellow-400' },
                  { label: 'קריטיים', value: stats.critical, icon: XCircle, color: 'text-red-400' },
                  { label: 'שגיאות', value: stats.errors, icon: AlertTriangle, color: 'text-orange-400' },
                  { label: 'אזהרות', value: stats.warnings, icon: Info, color: 'text-yellow-300' },
                ].map((stat, i) => (
                  <GlassCard key={i} delay={i * 0.05} hover={false}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-white/10`}>
                        <stat.icon size={20} className={stat.color} />
                      </div>
                      <div>
                        <p className="text-white/50 text-sm">{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}

            {/* Filters */}
            <GlassCard delay={0.2} hover={false} className="mb-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-between w-full text-white"
              >
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-gold-400" />
                  <span className="font-medium">סינון תוצאות</span>
                </div>
                {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {showFilters && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">חומרה</label>
                    <select
                      value={filter.severity || ''}
                      onChange={(e) =>
                        setFilter((f) => ({
                          ...f,
                          severity: e.target.value ? (e.target.value as SystemLogSeverity) : undefined,
                        }))
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="">הכל</option>
                      <option value="CRITICAL">קריטי</option>
                      <option value="ERROR">שגיאה</option>
                      <option value="WARNING">אזהרה</option>
                      <option value="INFO">מידע</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">קטגוריה</label>
                    <select
                      value={filter.category || ''}
                      onChange={(e) =>
                        setFilter((f) => ({
                          ...f,
                          category: e.target.value ? (e.target.value as SystemLogCategory) : undefined,
                        }))
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="">הכל</option>
                      {Object.entries(categoryConfig).map(([key, { label }]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">סטטוס</label>
                    <select
                      value={filter.resolved === undefined ? '' : filter.resolved.toString()}
                      onChange={(e) =>
                        setFilter((f) => ({
                          ...f,
                          resolved: e.target.value === '' ? undefined : e.target.value === 'true',
                        }))
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="">הכל</option>
                      <option value="false">לא טופל</option>
                      <option value="true">טופל</option>
                    </select>
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Logs List */}
            <div className="grid lg:grid-cols-2 gap-6">
              <GlassCard delay={0.3} hover={false} className="h-fit">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="text-gold-400" size={20} />
                  לוגים ({logs.length})
                </h2>

                <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {logs.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
                      <p className="text-white font-medium">אין תקלות פתוחות</p>
                      <p className="text-white/60 text-sm">המערכת תקינה</p>
                    </div>
                  ) : (
                    logs.map((log) => {
                      const severity = severityConfig[log.severity];
                      const category = categoryConfig[log.category];
                      const SeverityIcon = severity.icon;
                      const CategoryIcon = category.icon;

                      return (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={() => setSelectedLog(log)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedLog?.id === log.id
                              ? 'border-gold-400/50 bg-gold-400/10'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${severity.bg}`}>
                              <SeverityIcon size={18} className={severity.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs px-2 py-0.5 rounded ${severity.bg} ${severity.color}`}>
                                  {severity.label}
                                </span>
                                <span className="text-xs text-white/40 flex items-center gap-1">
                                  <CategoryIcon size={12} />
                                  {category.label}
                                </span>
                              </div>
                              <p className="text-white font-medium truncate">{log.title}</p>
                              <p className="text-white/50 text-sm truncate">{log.message}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                                <span>{new Date(log.createdAt).toLocaleString('he-IL')}</span>
                                {log.resolved && (
                                  <span className="text-green-400 flex items-center gap-1">
                                    <CheckCircle size={12} />
                                    טופל
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </GlassCard>

              {/* Selected Log Details */}
              <GlassCard delay={0.4} hover={false} className="h-fit sticky top-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="text-gold-400" size={20} />
                  פרטי הלוג
                </h2>

                {selectedLog ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              severityConfig[selectedLog.severity].bg
                            } ${severityConfig[selectedLog.severity].color}`}
                          >
                            {severityConfig[selectedLog.severity].label}
                          </span>
                          <span className="text-white/40 text-sm">
                            {categoryConfig[selectedLog.category].label}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white">{selectedLog.title}</h3>
                      </div>
                      {!selectedLog.resolved && (
                        <button
                          onClick={() => handleResolve(selectedLog.id)}
                          className="btn-secondary text-sm flex items-center gap-2"
                        >
                          <CheckCircle size={16} />
                          סמן כטופל
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="text-white/60 text-sm">הודעה</label>
                      <p className="text-white mt-1">{selectedLog.message}</p>
                    </div>

                    {selectedLog.details && (
                      <div>
                        <label className="text-white/60 text-sm">פרטים נוספים</label>
                        <pre className="mt-1 p-3 bg-black/30 rounded-lg text-white/80 text-sm overflow-x-auto">
                          {selectedLog.details}
                        </pre>
                      </div>
                    )}

                    {selectedLog.stackTrace && (
                      <div>
                        <label className="text-white/60 text-sm">Stack Trace</label>
                        <pre className="mt-1 p-3 bg-black/30 rounded-lg text-red-400/80 text-xs overflow-x-auto max-h-48">
                          {selectedLog.stackTrace}
                        </pre>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                      <div>
                        <label className="text-white/60 text-sm">Endpoint</label>
                        <p className="text-white font-mono text-sm">{selectedLog.endpoint || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-white/60 text-sm">Response Time</label>
                        <p className="text-white font-mono text-sm">
                          {selectedLog.responseTime ? `${selectedLog.responseTime}ms` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-white/60 text-sm">תאריך יצירה</label>
                        <p className="text-white text-sm">
                          {new Date(selectedLog.createdAt).toLocaleString('he-IL')}
                        </p>
                      </div>
                      <div>
                        <label className="text-white/60 text-sm">ID</label>
                        <p className="text-white font-mono text-xs">{selectedLog.id}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopyToClipboard(selectedLog)}
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      <Copy size={18} />
                      {copiedId === selectedLog.id ? 'הועתק!' : 'העתק ל-Claude'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 mx-auto text-white/20 mb-4" />
                    <p className="text-white/50">בחר לוג מהרשימה לצפייה בפרטים</p>
                  </div>
                )}
              </GlassCard>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
