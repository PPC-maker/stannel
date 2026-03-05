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
} from 'lucide-react';

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

export default function AdminPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState<SystemLogStats | null>(null);
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

  const fetchData = async () => {
    try {
      setRefreshing(true);
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
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleResolve = async (logId: string) => {
    try {
      await adminApi.resolveSystemLog(logId);
      // Refresh the data
      fetchData();
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

  const runScan = async () => {
    try {
      setRefreshing(true);
      await adminApi.runSystemScan();
      await fetchData();
    } catch (error) {
      console.error('Error running scan:', error);
    } finally {
      setRefreshing(false);
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
              <p className="text-white/60 mt-1">מעקב אחרי תקלות ובריאות המערכת</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={runScan}
                disabled={refreshing}
                className="btn-secondary flex items-center gap-2"
              >
                <Search size={18} />
                סריקת מערכת
              </button>
              <button
                onClick={fetchData}
                disabled={refreshing}
                className="btn-primary flex items-center gap-2"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                רענון
              </button>
            </div>
          </div>
        </motion.div>

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
          {/* Logs List */}
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
                {/* Header */}
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

                {/* Message */}
                <div>
                  <label className="text-white/60 text-sm">הודעה</label>
                  <p className="text-white mt-1">{selectedLog.message}</p>
                </div>

                {/* Details */}
                {selectedLog.details && (
                  <div>
                    <label className="text-white/60 text-sm">פרטים נוספים</label>
                    <pre className="mt-1 p-3 bg-black/30 rounded-lg text-white/80 text-sm overflow-x-auto">
                      {selectedLog.details}
                    </pre>
                  </div>
                )}

                {/* Stack Trace */}
                {selectedLog.stackTrace && (
                  <div>
                    <label className="text-white/60 text-sm">Stack Trace</label>
                    <pre className="mt-1 p-3 bg-black/30 rounded-lg text-red-400/80 text-xs overflow-x-auto max-h-48">
                      {selectedLog.stackTrace}
                    </pre>
                  </div>
                )}

                {/* Metadata */}
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

                {/* Copy to Claude Button */}
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
      </div>
    </div>
  );
}
