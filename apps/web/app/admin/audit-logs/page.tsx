'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { useAdminGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { adminApi } from '@stannel/api-client';
import {
  FileText,
  ArrowRight,
  Loader2,
  Search,
  User,
  Shield,
  Receipt,
  UserCheck,
  Trash2,
  RefreshCw,
  Eye,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';

interface AuditLog {
  id: string;
  action: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

const ACTION_CONFIG: Record<string, { icon: typeof User; color: string; label: string }> = {
  USER_ACTIVATED: { icon: UserCheck, color: 'text-green-400', label: 'הפעלת משתמש' },
  USER_DEACTIVATED: { icon: User, color: 'text-yellow-400', label: 'השבתת משתמש' },
  USER_DELETED: { icon: Trash2, color: 'text-red-400', label: 'מחיקת משתמש' },
  ADMIN_LOGIN_AS_USER: { icon: Eye, color: 'text-blue-400', label: 'כניסה כמשתמש' },
  INVOICE_APPROVED: { icon: Receipt, color: 'text-green-400', label: 'אישור חשבונית' },
  INVOICE_REJECTED: { icon: Receipt, color: 'text-red-400', label: 'דחיית חשבונית' },
  INVOICE_DELETED: { icon: Trash2, color: 'text-red-400', label: 'מחיקת חשבונית' },
  INVOICE_RESTORED: { icon: RefreshCw, color: 'text-blue-400', label: 'שחזור חשבונית' },
  INVOICE_PERMANENTLY_DELETED: { icon: Trash2, color: 'text-red-500', label: 'מחיקה לצמיתות' },
  INVOICES_BULK_DELETED: { icon: Trash2, color: 'text-red-400', label: 'מחיקה מרובה' },
  RECYCLE_BIN_CLEANUP: { icon: Trash2, color: 'text-orange-400', label: 'ניקוי סל מחזור' },
  CONTRACT_CREATED: { icon: FileText, color: 'text-purple-400', label: 'יצירת חוזה' },
  SYSTEM_LOG_RESOLVED: { icon: Shield, color: 'text-green-400', label: 'טיפול בשגיאה' },
  SYSTEM_SCAN_RUN: { icon: Shield, color: 'text-blue-400', label: 'סריקת מערכת' },
  HEALTH_REPORT_SENT: { icon: FileText, color: 'text-purple-400', label: 'שליחת דוח בריאות' },
  SCHEDULED_TASK_RUN: { icon: RefreshCw, color: 'text-blue-400', label: 'הפעלת משימה' },
};

export default function AuditLogsPage() {
  const { isReady } = useAdminGuard();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (isReady) {
      loadLogs();
    }
  }, [isReady, page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAuditLogs({ page, pageSize: 50 });
      setLogs(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = !filterAction || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  const uniqueActions = [...new Set(logs.map(l => l.action))];

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  return (
    <div className="relative min-h-screen">
      <PageSlider images={sliderImages.dashboard}  />
      <div className="p-6 max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowRight size={18} />
            חזרה לפאנל ניהול
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900 flex items-center gap-3">
                <FileText className="text-gold-400" />
                יומן פעולות
              </h1>
              <p className="text-gray-600 mt-1">מעקב אחרי כל הפעולות במערכת</p>
            </div>
            <button
              onClick={loadLogs}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              רענון
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <GlassCard hover={false}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-between w-full text-gray-900"
            >
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-[#0066CC]" />
                <span className="font-medium">סינון וחיפוש</span>
              </div>
              {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="text-gray-600 text-sm mb-2 block">חיפוש</label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="חיפוש לפי שם, אימייל או פעולה..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-10 py-2 text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-gray-600 text-sm mb-2 block">סוג פעולה</label>
                  <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900"
                  >
                    <option value="">כל הפעולות</option>
                    {uniqueActions.map(action => (
                      <option key={action} value={action}>
                        {ACTION_CONFIG[action]?.label || action}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Logs List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard hover={false}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="text-[#0066CC]" size={20} />
                פעולות אחרונות ({filteredLogs.length})
              </h2>

              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-10 h-10 mx-auto text-[#0066CC] animate-spin" />
                  <p className="text-gray-600 mt-4">טוען יומן פעולות...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600">אין פעולות להצגה</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {filteredLogs.map((log) => {
                    const config = ACTION_CONFIG[log.action] || {
                      icon: FileText,
                      color: 'text-gray-500',
                      label: log.action,
                    };
                    const Icon = config.icon;

                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => setSelectedLog(log)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedLog?.id === log.id
                            ? 'border-[#0066CC] bg-[#0066CC]/10'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-gray-100`}>
                            <Icon size={18} className={config.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 font-medium">{config.label}</p>
                            {log.user && (
                              <p className="text-gray-600 text-sm">
                                על ידי: {log.user.name}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <Calendar size={12} />
                              <span>{new Date(log.createdAt).toLocaleString('he-IL')}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                  >
                    הקודם
                  </button>
                  <span className="px-3 py-1 text-gray-600">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                  >
                    הבא
                  </button>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Selected Log Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard hover={false} className="h-fit sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="text-[#0066CC]" size={20} />
                פרטי הפעולה
              </h2>

              {selectedLog ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    {(() => {
                      const config = ACTION_CONFIG[selectedLog.action] || {
                        icon: FileText,
                        color: 'text-gray-500',
                        label: selectedLog.action,
                      };
                      const Icon = config.icon;
                      return (
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-lg bg-gray-100`}>
                            <Icon size={24} className={config.color} />
                          </div>
                          <div>
                            <p className="text-gray-900 font-bold text-lg">{config.label}</p>
                            <p className="text-gray-500 text-sm">{selectedLog.action}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-sm">תאריך ושעה</p>
                      <p className="text-gray-900">
                        {new Date(selectedLog.createdAt).toLocaleString('he-IL')}
                      </p>
                    </div>
                    {selectedLog.user && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-sm">בוצע על ידי</p>
                        <p className="text-gray-900">{selectedLog.user.name}</p>
                        <p className="text-gray-500 text-xs">{selectedLog.user.email}</p>
                      </div>
                    )}
                  </div>

                  {selectedLog.entityId && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-sm">מזהה ישות</p>
                      <p className="text-gray-900 font-mono text-sm">{selectedLog.entityId}</p>
                    </div>
                  )}

                  {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-sm mb-2">נתונים נוספים</p>
                      <pre className="text-gray-700 text-xs bg-gray-100 rounded-lg p-3 overflow-x-auto">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-sm">מזהה לוג</p>
                    <p className="text-gray-900 font-mono text-xs">{selectedLog.id}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">בחר פעולה מהרשימה לצפייה בפרטים</p>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
