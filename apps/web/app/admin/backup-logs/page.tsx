'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAdminGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { adminApi } from '@stannel/api-client';
import {
  Database,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowRight,
  Loader2,
  Clock,
  HardDrive,
  Table2,
  FileJson,
  AlertTriangle,
  Play,
} from 'lucide-react';
import Link from 'next/link';

interface BackupLog {
  id: string;
  status: 'SUCCESS' | 'FAILED';
  filename: string;
  storage: string;
  tables: number;
  records: number;
  sizeBytes: number;
  durationMs: number;
  error?: string;
  createdAt: string;
}

interface BackupSummary {
  total: number;
  lastSuccessAt: string | null;
  lastFailedAt: string | null;
  hoursSinceLastBackup: number | null;
}

export default function BackupLogsPage() {
  const { isReady, loading: authLoading } = useAdminGuard();
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [summary, setSummary] = useState<BackupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/backup-logs');
      setLogs(res.data.logs);
      setSummary(res.data.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runBackup = async () => {
    setRunning(true);
    setMessage('');
    try {
      await adminApi.post('/force-backup');
      setMessage('הגיבוי הושלם בהצלחה!');
      await fetchLogs();
    } catch (e) {
      setMessage('הגיבוי נכשל');
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (isReady) fetchLogs();
  }, [isReady]);

  if (authLoading) return <AuthGuardLoader />;
  if (!isReady) return null;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });

  const statusColor = summary?.hoursSinceLastBackup != null
    ? summary.hoursSinceLastBackup > 30 ? 'text-red-400' : 'text-green-400'
    : 'text-yellow-400';

  return (
    <div className="min-h-screen bg-[#060f1f] text-white p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <Database className="w-6 h-6 text-[#d4af37]" />
        <h1 className="text-2xl font-bold">יומן גיבויים</h1>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="text-gray-400 text-xs mb-1">סה"כ גיבויים</div>
            <div className="text-2xl font-bold text-white">{summary.total}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="text-gray-400 text-xs mb-1">שעות מהגיבוי האחרון</div>
            <div className={`text-2xl font-bold ${statusColor}`}>
              {summary.hoursSinceLastBackup != null ? `${summary.hoursSinceLastBackup}h` : 'אין'}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="text-gray-400 text-xs mb-1">גיבוי אחרון מוצלח</div>
            <div className="text-sm text-green-400 font-medium">
              {summary.lastSuccessAt ? formatDate(summary.lastSuccessAt) : 'אין'}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="text-gray-400 text-xs mb-1">כשל אחרון</div>
            <div className="text-sm text-red-400 font-medium">
              {summary.lastFailedAt ? formatDate(summary.lastFailedAt) : 'אין'}
            </div>
          </motion.div>
        </div>
      )}

      {/* Alert if backup is stale */}
      {summary?.hoursSinceLastBackup != null && summary.hoursSinceLastBackup > 30 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-red-300 text-sm">
            לא בוצע גיבוי מזה <strong>{summary.hoursSinceLastBackup} שעות</strong> — מומלץ להריץ גיבוי עכשיו
          </span>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={runBackup}
          disabled={running}
          className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#b8963e] text-black font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? 'מגבה...' : 'הרץ גיבוי עכשיו'}
        </button>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 border border-white/20 hover:border-white/40 text-white px-4 py-2.5 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          רענן
        </button>

        {message && (
          <span className={`text-sm ${message.includes('נכשל') ? 'text-red-400' : 'text-green-400'}`}>
            {message}
          </span>
        )}
      </div>

      {/* Logs table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>אין רשומות גיבוי עדיין</p>
          <p className="text-sm mt-1">הרץ גיבוי ראשון כדי להתחיל</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-xs">
                <th className="text-right p-3">תאריך</th>
                <th className="text-right p-3">סטטוס</th>
                <th className="text-right p-3 hidden md:table-cell">אחסון</th>
                <th className="text-right p-3 hidden md:table-cell">טבלאות</th>
                <th className="text-right p-3 hidden md:table-cell">רשומות</th>
                <th className="text-right p-3 hidden md:table-cell">גודל</th>
                <th className="text-right p-3">משך</th>
                <th className="text-right p-3">פרטים</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-3 text-gray-300 whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="p-3">
                    {log.status === 'SUCCESS' ? (
                      <span className="flex items-center gap-1.5 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        הצלחה
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-400">
                        <XCircle className="w-4 h-4" />
                        כשל
                      </span>
                    )}
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      {log.storage === 'gcs' ? (
                        <><FileJson className="w-3 h-3" /> GCS</>
                      ) : (
                        <><HardDrive className="w-3 h-3" /> מקומי</>
                      )}
                    </span>
                  </td>
                  <td className="p-3 hidden md:table-cell text-gray-300">
                    <span className="flex items-center gap-1.5">
                      <Table2 className="w-3 h-3 text-gray-500" />
                      {log.tables}
                    </span>
                  </td>
                  <td className="p-3 hidden md:table-cell text-gray-300">
                    {log.records.toLocaleString()}
                  </td>
                  <td className="p-3 hidden md:table-cell text-gray-300">
                    {formatBytes(log.sizeBytes)}
                  </td>
                  <td className="p-3 text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {(log.durationMs / 1000).toFixed(1)}s
                    </span>
                  </td>
                  <td className="p-3 text-gray-500 text-xs max-w-[160px] truncate">
                    {log.error ? (
                      <span className="text-red-400">{log.error}</span>
                    ) : (
                      <span className="text-gray-600">{log.filename}</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
