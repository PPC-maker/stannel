'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { adminApi, setAuthToken } from '@stannel/api-client';
import { loginWithCustomToken } from '@/lib/firebase';
import { useAdminGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
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
  ChevronRight,
  Search,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Trash2,
  Receipt,
  Eye,
  Ban,
  MessageSquare,
  FolderOpen,
  RotateCcw,
  Trash,
  FileIcon,
  Download,
  BarChart3,
  Target,
  Building2,
  Gift,
} from 'lucide-react';
import Swal from 'sweetalert2';
import Link from 'next/link';

type TabType = 'users' | 'invoices' | 'recycle-bin' | 'logs' | 'scan';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  activatedAt?: string | null;
  architectProfile?: { id: string } | null;
  supplierProfile?: { id: string; companyName: string } | null;
}

interface AdminInvoice {
  id: string;
  imageUrl: string;
  amount: number;
  status: string;
  aiExtractedAmount?: number | null;
  aiConfidence?: number | null;
  aiStatus?: string | null;
  adminNote?: string | null;
  slaDeadline?: string | null;
  supplierRef?: string | null;
  paymentProofUrl?: string | null;
  paidAt?: string | null;
  createdAt: string;
  approvedAt?: string | null;
  deletedAt?: string | null;
  architect: {
    id: string;
    user: { name: string; email: string };
  };
  supplier: {
    id: string;
    companyName?: string;
    user: { name: string; email: string };
  };
}

interface ArchitectGroup {
  architectId: string;
  architectName: string;
  architectEmail: string;
  invoices: AdminInvoice[];
  totalAmount: number;
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
  const { isReady } = useAdminGuard();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState<SystemLogStats | null>(null);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [latestScan, setLatestScan] = useState<ScanReport | null>(null);
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<AdminInvoice | null>(null);
  const [processingInvoice, setProcessingInvoice] = useState<string | null>(null);
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
  const [loggingInAs, setLoggingInAs] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [deletedInvoices, setDeletedInvoices] = useState<AdminInvoice[]>([]);
  const [expandedArchitects, setExpandedArchitects] = useState<Set<string>>(new Set());
  const [deletingInvoice, setDeletingInvoice] = useState<string | null>(null);
  const [restoringInvoice, setRestoringInvoice] = useState<string | null>(null);

  const fetchAllUsers = async () => {
    try {
      const response = await adminApi.getUsers({ pageSize: 100 });
      setAllUsers(response.data as AdminUser[]);
    } catch (error) {
      console.error('Error fetching users:', error);
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

  const fetchInvoices = async () => {
    try {
      const response = await adminApi.getInvoices({ pageSize: 100 });
      setInvoices(response.data as AdminInvoice[]);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchDeletedInvoices = async () => {
    try {
      const response = await adminApi.getDeletedInvoices({ pageSize: 100 });
      setDeletedInvoices(response.data as AdminInvoice[]);
    } catch (error) {
      console.error('Error fetching deleted invoices:', error);
    }
  };

  const fetchData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchAllUsers(), fetchLogs(), fetchLatestScan(), fetchInvoices(), fetchDeletedInvoices()]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ALL useEffect hooks must be called before any conditional returns
  useEffect(() => {
    if (isReady) {
      fetchData();
    }
  }, [isReady]);

  useEffect(() => {
    if (isReady && activeTab === 'logs') {
      fetchLogs();
    }
  }, [filter, isReady]);

  // Auto-refresh users every 10 seconds for real-time updates
  useEffect(() => {
    if (!isReady || activeTab !== 'users') return;

    const interval = setInterval(() => {
      fetchAllUsers();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [isReady, activeTab]);

  // Auto-refresh invoices every 5 seconds
  useEffect(() => {
    if (!isReady || activeTab !== 'invoices') return;

    const interval = setInterval(() => {
      fetchInvoices();
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [isReady, activeTab]);

  // Auto-refresh recycle bin every 10 seconds
  useEffect(() => {
    if (!isReady || activeTab !== 'recycle-bin') return;

    const interval = setInterval(() => {
      fetchDeletedInvoices();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [isReady, activeTab]);

  // Keep selectedInvoice in sync with invoices list (for real-time updates)
  useEffect(() => {
    if (selectedInvoice && invoices.length > 0) {
      const updated = invoices.find(inv => inv.id === selectedInvoice.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedInvoice)) {
        setSelectedInvoice(updated);
      }
    }
  }, [invoices, selectedInvoice]);

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  // Group invoices by architect
  const groupedInvoices: ArchitectGroup[] = Object.values(
    invoices.reduce((acc: Record<string, ArchitectGroup>, invoice) => {
      const architectId = invoice.architect.id;
      if (!acc[architectId]) {
        acc[architectId] = {
          architectId,
          architectName: invoice.architect.user.name,
          architectEmail: invoice.architect.user.email,
          invoices: [],
          totalAmount: 0,
        };
      }
      acc[architectId].invoices.push(invoice);
      acc[architectId].totalAmount += invoice.amount;
      return acc;
    }, {})
  ).sort((a, b) => b.invoices.length - a.invoices.length);

  const toggleArchitectExpand = (architectId: string) => {
    const newExpanded = new Set(expandedArchitects);
    if (newExpanded.has(architectId)) {
      newExpanded.delete(architectId);
    } else {
      newExpanded.add(architectId);
    }
    setExpandedArchitects(newExpanded);
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const result = await Swal.fire({
      title: 'מחיקת חשבונית',
      text: 'האם אתה בטוח? החשבונית תועבר לסל המחזור.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'כן, מחק',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#dc2626',
      background: '#1a1a2e',
      color: '#fff',
    });
    if (!result.isConfirmed) return;

    setDeletingInvoice(invoiceId);
    try {
      await adminApi.deleteInvoice(invoiceId);
      await Promise.all([fetchInvoices(), fetchDeletedInvoices()]);
      setSelectedInvoice(null);
      Swal.fire({
        title: 'נמחק!',
        text: 'החשבונית הועברה לסל המחזור',
        icon: 'success',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      Swal.fire({
        title: 'שגיאה',
        text: 'שגיאה במחיקת החשבונית',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } finally {
      setDeletingInvoice(null);
    }
  };

  const handleBulkDeleteArchitectInvoices = async (architectId: string, architectName: string, count: number) => {
    const result = await Swal.fire({
      title: 'מחיקת כל החשבוניות',
      text: `האם אתה בטוח שברצונך למחוק את כל ${count} החשבוניות של ${architectName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'כן, מחק הכל',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#dc2626',
      background: '#1a1a2e',
      color: '#fff',
    });
    if (!result.isConfirmed) return;

    setRefreshing(true);
    try {
      await adminApi.deleteArchitectInvoices(architectId);
      await Promise.all([fetchInvoices(), fetchDeletedInvoices()]);
      setSelectedInvoice(null);
      Swal.fire({
        title: 'נמחקו!',
        text: `${count} חשבוניות הועברו לסל המחזור`,
        icon: 'success',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } catch (error) {
      console.error('Error bulk deleting invoices:', error);
      Swal.fire({
        title: 'שגיאה',
        text: 'שגיאה במחיקת החשבוניות',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleRestoreInvoice = async (invoiceId: string) => {
    setRestoringInvoice(invoiceId);
    try {
      await adminApi.restoreInvoice(invoiceId);
      await Promise.all([fetchInvoices(), fetchDeletedInvoices()]);
      Swal.fire({
        title: 'שוחזר!',
        text: 'החשבונית שוחזרה בהצלחה',
        icon: 'success',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } catch (error) {
      console.error('Error restoring invoice:', error);
      Swal.fire({
        title: 'שגיאה',
        text: 'שגיאה בשחזור החשבונית',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } finally {
      setRestoringInvoice(null);
    }
  };

  const handlePermanentDelete = async (invoiceId: string) => {
    const result = await Swal.fire({
      title: 'מחיקה לצמיתות',
      text: 'פעולה זו לא ניתנת לביטול! החשבונית תימחק לצמיתות.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'כן, מחק לצמיתות',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#dc2626',
      background: '#1a1a2e',
      color: '#fff',
    });
    if (!result.isConfirmed) return;

    setDeletingInvoice(invoiceId);
    try {
      await adminApi.permanentDeleteInvoice(invoiceId);
      await fetchDeletedInvoices();
      Swal.fire({
        title: 'נמחק לצמיתות!',
        text: 'החשבונית נמחקה לצמיתות',
        icon: 'success',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } catch (error) {
      console.error('Error permanently deleting invoice:', error);
      Swal.fire({
        title: 'שגיאה',
        text: 'שגיאה במחיקת החשבונית',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } finally {
      setDeletingInvoice(null);
    }
  };

  const handleCleanupRecycleBin = async () => {
    const result = await Swal.fire({
      title: 'ניקוי סל מחזור',
      text: 'פעולה זו תמחק לצמיתות את כל החשבוניות שנמחקו לפני יותר מ-30 יום.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'כן, נקה',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#dc2626',
      background: '#1a1a2e',
      color: '#fff',
    });
    if (!result.isConfirmed) return;

    setRefreshing(true);
    try {
      const response = await adminApi.cleanupRecycleBin();
      await fetchDeletedInvoices();
      Swal.fire({
        title: 'נוקה!',
        text: `${response.deletedCount} חשבוניות נמחקו לצמיתות`,
        icon: 'success',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } catch (error) {
      console.error('Error cleaning up recycle bin:', error);
      Swal.fire({
        title: 'שגיאה',
        text: 'שגיאה בניקוי סל המחזור',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    setApprovingUser(userId);
    try {
      await adminApi.activateUser(userId, true);
      await fetchAllUsers();
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
      await fetchAllUsers();
    } catch (error) {
      console.error('Error bulk approving users:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoginAsUser = async (userId: string) => {
    setLoggingInAs(userId);
    try {
      const { customToken } = await adminApi.loginAsUser(userId);
      const { token } = await loginWithCustomToken(customToken);
      setAuthToken(token);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error logging in as user:', error);
      Swal.fire({
        title: 'שגיאה',
        text: 'שגיאה בכניסה לחשבון',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } finally {
      setLoggingInAs(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const result = await Swal.fire({
      title: 'מחיקת משתמש',
      text: `האם אתה בטוח שברצונך למחוק את המשתמש "${userName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'כן, מחק',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#dc2626',
      background: '#1a1a2e',
      color: '#fff',
    });
    if (!result.isConfirmed) {
      return;
    }
    setDeletingUser(userId);
    try {
      await adminApi.deleteUser(userId);
      await fetchAllUsers();
      Swal.fire({
        title: 'נמחק!',
        text: 'המשתמש נמחק בהצלחה',
        icon: 'success',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      Swal.fire({
        title: 'שגיאה',
        text: 'שגיאה במחיקת המשתמש',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } finally {
      setDeletingUser(null);
    }
  };

  const handleVerifyInvoice = async (invoiceId: string, status: 'APPROVED' | 'REJECTED', note?: string) => {
    setProcessingInvoice(invoiceId);
    try {
      await adminApi.verifyInvoice(invoiceId, { status, note });
      await fetchInvoices();
      setSelectedInvoice(null);
      Swal.fire({
        title: status === 'APPROVED' ? 'אושר!' : 'נדחה',
        text: status === 'APPROVED' ? 'החשבונית אושרה בהצלחה' : 'החשבונית נדחתה',
        icon: status === 'APPROVED' ? 'success' : 'info',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } catch (error) {
      console.error('Error verifying invoice:', error);
      Swal.fire({
        title: 'שגיאה',
        text: 'שגיאה בעדכון החשבונית',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } finally {
      setProcessingInvoice(null);
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

  // Filter users by status
  const pendingUsers = allUsers.filter(u => !u.isActive);
  const approvedUsers = allUsers.filter(u => u.isActive);

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const selectAllPendingUsers = () => {
    if (selectedUsers.size === pendingUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(pendingUsers.map((u) => u.id)));
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <PageSlider images={sliderImages.dashboard}  />
        <div className="flex flex-col items-center gap-4 z-10">
          <Loader2 className="w-10 h-10 text-[#0066CC] animate-spin" />
          <p className="text-gray-600">טוען נתוני מערכת...</p>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900 flex items-center gap-3">
                <Shield className="text-[#0066CC]" />
                פאנל ניהול
              </h1>
              <p className="text-gray-600 mt-1 font-medium">ניהול משתמשים ומעקב אחרי תקלות המערכת</p>
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

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
        >
          <Link href="/admin/analytics" className="group">
            <GlassCard hover={true}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <BarChart3 size={20} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-800 font-medium group-hover:text-[#0066CC] transition-colors">אנליטיקות</p>
                  <p className="text-gray-700 text-xs">דוחות וסטטיסטיקות</p>
                </div>
              </div>
            </GlassCard>
          </Link>
          <Link href="/admin/architects" className="group">
            <GlassCard hover={true}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Users size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-800 font-medium group-hover:text-[#0066CC] transition-colors">אדריכלים</p>
                  <p className="text-gray-700 text-xs">ניהול אדריכלים</p>
                </div>
              </div>
            </GlassCard>
          </Link>
          <Link href="/admin/service-providers" className="group">
            <GlassCard hover={true}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Building2 size={20} className="text-green-400" />
                </div>
                <div>
                  <p className="text-gray-800 font-medium group-hover:text-[#0066CC] transition-colors">ספקי שירות</p>
                  <p className="text-gray-700 text-xs">ניהול ספקים</p>
                </div>
              </div>
            </GlassCard>
          </Link>
          <Link href="/admin/goals" className="group">
            <GlassCard hover={true}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gold-500/20">
                  <Target size={20} className="text-[#0066CC]" />
                </div>
                <div>
                  <p className="text-gray-800 font-medium group-hover:text-[#0066CC] transition-colors">יעדים</p>
                  <p className="text-gray-700 text-xs">ניהול יעדי אדריכלים</p>
                </div>
              </div>
            </GlassCard>
          </Link>
          <Link href="/admin/contracts" className="group">
            <GlassCard hover={true}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <FileText size={20} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-gray-800 font-medium group-hover:text-[#0066CC] transition-colors">חוזים</p>
                  <p className="text-gray-700 text-xs">ניהול חוזי ספקים</p>
                </div>
              </div>
            </GlassCard>
          </Link>
          <Link href="/admin/audit-logs" className="group">
            <GlassCard hover={true}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Clock size={20} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-gray-800 font-medium group-hover:text-[#0066CC] transition-colors">יומן פעולות</p>
                  <p className="text-gray-700 text-xs">מעקב פעולות מערכת</p>
                </div>
              </div>
            </GlassCard>
          </Link>
          <Link href="/admin/rewards" className="group">
            <GlassCard hover={true}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gold-500/20">
                  <Gift size={20} className="text-gold-400" />
                </div>
                <div>
                  <p className="text-gray-800 font-medium group-hover:text-[#0066CC] transition-colors">חנות הטבות</p>
                  <p className="text-gray-700 text-xs">ניהול מוצרים</p>
                </div>
              </div>
            </GlassCard>
          </Link>
          <Link href="/admin/events" className="group">
            <GlassCard hover={true}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/20">
                  <Calendar size={20} className="text-pink-400" />
                </div>
                <div>
                  <p className="text-gray-800 font-medium group-hover:text-[#0066CC] transition-colors">אירועים</p>
                  <p className="text-gray-700 text-xs">ניהול אירועים</p>
                </div>
              </div>
            </GlassCard>
          </Link>
        </motion.div>

        {/* Tabs - Horizontal scroll on mobile */}
        <div className="flex gap-2 mb-6 overflow-x-auto -mx-2 px-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'users'
                ? 'bg-gold-400 text-primary-900'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users size={18} />
            ניהול משתמשים
            {pendingUsers.length > 0 && (
              <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'invoices'
                ? 'bg-gold-400 text-primary-900'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Receipt size={18} />
            חשבוניות
            {invoices.filter(inv => ['PENDING_ADMIN', 'PENDING_SUPPLIER_PAY', 'OVERDUE'].includes(inv.status)).length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {invoices.filter(inv => ['PENDING_ADMIN', 'PENDING_SUPPLIER_PAY', 'OVERDUE'].includes(inv.status)).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('recycle-bin')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'recycle-bin'
                ? 'bg-gold-400 text-primary-900'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Trash size={18} />
            סל מחזור
            {deletedInvoices.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {deletedInvoices.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'scan'
                ? 'bg-gold-400 text-primary-900'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Activity size={18} />
            סריקת מערכת
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'logs'
                ? 'bg-gold-400 text-primary-900'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="text-[#0066CC]" />
                  ניהול משתמשים ({allUsers.length})
                  {pendingUsers.length > 0 && (
                    <span className="bg-yellow-500/20 text-yellow-400 text-sm px-2 py-0.5 rounded-full mr-2">
                      {pendingUsers.length} ממתינים
                    </span>
                  )}
                </h2>
                {pendingUsers.length > 0 && selectedUsers.size > 0 && (
                  <button
                    onClick={handleBulkApprove}
                    disabled={refreshing}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 size={18} />
                    אשר נבחרים ({selectedUsers.size})
                  </button>
                )}
              </div>

              {allUsers.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-800 text-xl font-medium">אין משתמשים במערכת</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="py-3 px-4 text-right">
                          {pendingUsers.length > 0 && (
                            <input
                              type="checkbox"
                              checked={selectedUsers.size === pendingUsers.length && pendingUsers.length > 0}
                              onChange={selectAllPendingUsers}
                              className="w-4 h-4 rounded bg-white/10 border-white/20 text-[#0066CC]"
                            />
                          )}
                        </th>
                        <th className="py-3 px-4 text-right text-gray-600 font-medium">שם</th>
                        <th className="py-3 px-4 text-right text-gray-600 font-medium">אימייל</th>
                        <th className="py-3 px-4 text-right text-gray-600 font-medium">טלפון</th>
                        <th className="py-3 px-4 text-right text-gray-600 font-medium">תפקיד</th>
                        <th className="py-3 px-4 text-right text-gray-600 font-medium">סטטוס</th>
                        <th className="py-3 px-4 text-right text-gray-600 font-medium">תאריך הרשמה</th>
                        <th className="py-3 px-4 text-right text-gray-600 font-medium">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((user) => (
                        <tr
                          key={user.id}
                          className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                            user.isActive ? '' : 'bg-yellow-500/5'
                          }`}
                        >
                          <td className="py-4 px-4">
                            {!user.isActive && (
                              <input
                                type="checkbox"
                                checked={selectedUsers.has(user.id)}
                                onChange={() => toggleUserSelection(user.id)}
                                className="w-4 h-4 rounded bg-white/10 border-white/20 text-[#0066CC]"
                              />
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                user.isActive
                                  ? 'bg-gradient-to-br from-green-400 to-green-600 text-white'
                                  : 'bg-gradient-to-br from-gold-400 to-gold-600 text-primary-900'
                              }`}>
                                {user.name.charAt(0)}
                              </div>
                              <span className="text-gray-800 font-medium">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-gray-700 flex items-center gap-2">
                              <Mail size={14} className="text-gray-700" />
                              {user.email}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-gray-700 flex items-center gap-2">
                              <Phone size={14} className="text-gray-700" />
                              {user.phone || '-'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm ${
                                user.role === 'ARCHITECT'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : user.role === 'ADMIN'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-purple-500/20 text-purple-400'
                              }`}
                            >
                              {roleLabels[user.role] || user.role}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {user.isActive ? (
                              <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400 flex items-center gap-1 w-fit">
                                <CheckCircle size={14} />
                                מאושר
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-sm bg-yellow-500/20 text-yellow-400 flex items-center gap-1 w-fit">
                                <Clock size={14} />
                                ממתין
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-gray-600 flex items-center gap-2">
                              <Calendar size={14} className="text-gray-700" />
                              {new Date(user.createdAt).toLocaleDateString('he-IL')}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {user.isActive && user.role !== 'ADMIN' ? (
                                <button
                                  onClick={() => handleLoginAsUser(user.id)}
                                  disabled={loggingInAs === user.id}
                                  className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                  {loggingInAs === user.id ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <ExternalLink size={16} />
                                  )}
                                  צפה בחשבון
                                </button>
                              ) : !user.isActive ? (
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
                              ) : null}
                              {user.role !== 'ADMIN' && (
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.name)}
                                  disabled={deletingUser === user.id}
                                  className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
                                  title="מחק משתמש"
                                >
                                  {deletingUser === user.id ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </button>
                              )}
                            </div>
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

        {/* Invoices Tab - Grouped by Architect */}
        {activeTab === 'invoices' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Architects Folders */}
              <GlassCard hover={false}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <FolderOpen className="text-[#0066CC]" />
                    חשבוניות לפי אדריכל ({groupedInvoices.length} אדריכלים)
                    {invoices.filter(inv => inv.status === 'PENDING_ADMIN').length > 0 && (
                      <span className="bg-yellow-500/20 text-yellow-400 text-sm px-2 py-0.5 rounded-full mr-2">
                        {invoices.filter(inv => inv.status === 'PENDING_ADMIN').length} ממתינות
                      </span>
                    )}
                  </h2>
                </div>

                {groupedInvoices.length === 0 ? (
                  <div className="text-center py-16">
                    <Receipt className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-800 text-xl font-medium">אין חשבוניות במערכת</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {groupedInvoices.map((group) => {
                      const isExpanded = expandedArchitects.has(group.architectId);
                      const pendingCount = group.invoices.filter(inv => inv.status === 'PENDING_ADMIN').length;

                      return (
                        <div key={group.architectId} className="border border-white/10 rounded-lg overflow-hidden">
                          {/* Architect Folder Header */}
                          <div
                            onClick={() => toggleArchitectExpand(group.architectId)}
                            className={`p-4 cursor-pointer transition-all flex items-center justify-between ${
                              isExpanded ? 'bg-gold-400/10 border-b border-white/10' : 'bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${isExpanded ? 'bg-gold-400/20' : 'bg-white/10'}`}>
                                <FolderOpen size={20} className={isExpanded ? 'text-[#0066CC]' : 'text-gray-600'} />
                              </div>
                              <div>
                                <p className="text-gray-800 font-medium">{group.architectName}</p>
                                <p className="text-gray-700 text-xs">{group.architectEmail}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-left">
                                <p className="text-[#0066CC] font-bold">₪{group.totalAmount.toLocaleString()}</p>
                                <p className="text-gray-700 text-xs">{group.invoices.length} חשבוניות</p>
                              </div>
                              {pendingCount > 0 && (
                                <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full">
                                  {pendingCount} ממתינות
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBulkDeleteArchitectInvoices(group.architectId, group.architectName, group.invoices.length);
                                }}
                                className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                title="מחק את כל החשבוניות"
                              >
                                <Trash2 size={16} />
                              </button>
                              <ChevronRight
                                size={20}
                                className={`text-gray-700 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              />
                            </div>
                          </div>

                          {/* Invoices List */}
                          {isExpanded && (
                            <div className="p-2 space-y-2 bg-black/20">
                              {group.invoices.map((invoice) => {
                                const invoiceStatusConfig: Record<string, { bg: string; text: string; label: string }> = {
                                  PENDING_ADMIN: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'ממתין לאישור' },
                                  APPROVED: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'מאושר' },
                                  REJECTED: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'נדחה' },
                                  PAID: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'שולם' },
                                  PENDING_SUPPLIER_PAY: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'ממתין לתשלום' },
                                  OVERDUE: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'באיחור' },
                                };
                                const status = invoiceStatusConfig[invoice.status] || { bg: 'bg-gray-500/20', text: 'text-gray-600', label: invoice.status };

                                return (
                                  <div
                                    key={invoice.id}
                                    onClick={() => setSelectedInvoice(invoice)}
                                    className={`p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between ${
                                      selectedInvoice?.id === invoice.id
                                        ? 'border border-gold-400/50 bg-gold-400/10'
                                        : 'border border-white/5 bg-white/5 hover:border-white/20'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`p-1.5 rounded-lg ${status.bg}`}>
                                        <Receipt size={14} className={status.text} />
                                      </div>
                                      <div>
                                        <p className="text-gray-800 font-medium text-sm">₪{invoice.amount.toLocaleString()}</p>
                                        <p className="text-gray-700 text-xs">
                                          {invoice.supplier.companyName || invoice.supplier.user.name}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-left">
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${status.bg} ${status.text}`}>
                                          {status.label}
                                        </span>
                                        <p className="text-gray-600 text-xs mt-1">
                                          {new Date(invoice.createdAt).toLocaleDateString('he-IL')}
                                        </p>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteInvoice(invoice.id);
                                        }}
                                        disabled={deletingInvoice === invoice.id}
                                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
                                        title="מחק חשבונית"
                                      >
                                        {deletingInvoice === invoice.id ? (
                                          <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                          <Trash2 size={14} />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>

              {/* Selected Invoice Details */}
              <GlassCard hover={false} className="h-fit sticky top-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="text-[#0066CC]" size={20} />
                  פרטי החשבונית
                </h2>

                {selectedInvoice ? (
                  <div className="space-y-4">
                    {/* Invoice Image */}
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black/30">
                      {selectedInvoice.imageUrl.toLowerCase().endsWith('.pdf') ? (
                        // PDF Display
                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                          <div className="w-16 h-20 bg-red-500/20 border-2 border-red-500/50 rounded-lg flex items-center justify-center mb-3">
                            <FileIcon size={32} className="text-red-400" />
                          </div>
                          <p className="text-gray-800 font-medium mb-3">קובץ PDF</p>
                          <div className="flex gap-2">
                            <a
                              href={selectedInvoice.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1.5 text-sm"
                            >
                              <Eye size={14} />
                              פתח
                            </a>
                            <a
                              href={selectedInvoice.imageUrl}
                              download
                              className="px-3 py-1.5 rounded-lg bg-gold-500 text-black hover:bg-gold-400 transition-colors flex items-center gap-1.5 text-sm"
                            >
                              <Download size={14} />
                              הורד
                            </a>
                          </div>
                        </div>
                      ) : (
                        // Image Display
                        <>
                          <img
                            src={selectedInvoice.imageUrl}
                            alt="Invoice"
                            className="w-full h-full object-contain"
                          />
                          <a
                            href={selectedInvoice.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute top-2 left-2 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                          >
                            <Eye size={18} />
                          </a>
                        </>
                      )}
                    </div>

                    {/* Invoice Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-600 text-sm">סכום</label>
                        <p className="text-2xl font-bold text-[#0066CC]">₪{selectedInvoice.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-gray-600 text-sm">סטטוס</label>
                        <p className={`font-medium ${
                          selectedInvoice.status === 'PENDING_ADMIN' ? 'text-yellow-400' :
                          selectedInvoice.status === 'APPROVED' ? 'text-green-400' :
                          selectedInvoice.status === 'REJECTED' ? 'text-red-400' : 'text-white'
                        }`}>
                          {selectedInvoice.status === 'PENDING_ADMIN' ? 'ממתין לאישור' :
                           selectedInvoice.status === 'APPROVED' ? 'מאושר' :
                           selectedInvoice.status === 'REJECTED' ? 'נדחה' :
                           selectedInvoice.status === 'PAID' ? 'שולם' : selectedInvoice.status}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                      <div>
                        <label className="text-gray-600 text-sm">אדריכל</label>
                        <p className="text-gray-800 font-medium">{selectedInvoice.architect.user.name}</p>
                        <p className="text-gray-700 text-xs">{selectedInvoice.architect.user.email}</p>
                      </div>
                      <div>
                        <label className="text-gray-600 text-sm">ספק</label>
                        <p className="text-gray-800 font-medium">{selectedInvoice.supplier.companyName || selectedInvoice.supplier.user.name}</p>
                        <p className="text-gray-700 text-xs">{selectedInvoice.supplier.user.email}</p>
                      </div>
                    </div>

                    {/* AI Analysis */}
                    {selectedInvoice.aiExtractedAmount !== null && selectedInvoice.aiExtractedAmount !== undefined && (
                      <div className={`p-3 rounded-lg ${
                        selectedInvoice.aiStatus === 'MATCH' ? 'bg-green-500/20 border border-green-500/30' :
                        'bg-yellow-500/20 border border-yellow-500/30'
                      }`}>
                        <p className="text-sm text-gray-600 mb-1">ניתוח AI</p>
                        <div className="flex items-center justify-between">
                          <span className={selectedInvoice.aiStatus === 'MATCH' ? 'text-green-400' : 'text-yellow-400'}>
                            סכום שזוהה: ₪{selectedInvoice.aiExtractedAmount.toLocaleString()}
                          </span>
                          <span className="text-gray-600 text-sm">
                            ביטחון: {Math.round((selectedInvoice.aiConfidence || 0) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-white/10">
                      <label className="text-gray-600 text-sm">תאריך העלאה</label>
                      <p className="text-white">{new Date(selectedInvoice.createdAt).toLocaleString('he-IL')}</p>
                    </div>

                    {/* Action Buttons */}
                    {selectedInvoice.status === 'PENDING_ADMIN' && (
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => handleVerifyInvoice(selectedInvoice.id, 'APPROVED')}
                          disabled={processingInvoice === selectedInvoice.id}
                          className="flex-1 btn-gold flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {processingInvoice === selectedInvoice.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <CheckCircle size={18} />
                          )}
                          אשר חשבונית
                        </button>
                        <button
                          onClick={async () => {
                            const result = await Swal.fire({
                              title: 'דחיית חשבונית',
                              text: 'האם אתה בטוח שברצונך לדחות את החשבונית?',
                              input: 'textarea',
                              inputPlaceholder: 'סיבת הדחייה (אופציונלי)',
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonText: 'דחה',
                              cancelButtonText: 'ביטול',
                              confirmButtonColor: '#dc2626',
                              background: '#1a1a2e',
                              color: '#fff',
                            });
                            if (result.isConfirmed) {
                              handleVerifyInvoice(selectedInvoice.id, 'REJECTED', result.value || undefined);
                            }
                          }}
                          disabled={processingInvoice === selectedInvoice.id}
                          className="flex-1 btn-secondary flex items-center justify-center gap-2 text-red-400 border-red-500/30 hover:bg-red-500/20 disabled:opacity-50"
                        >
                          <Ban size={18} />
                          דחה
                        </button>
                      </div>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteInvoice(selectedInvoice.id)}
                      disabled={deletingInvoice === selectedInvoice.id}
                      className="w-full btn-secondary flex items-center justify-center gap-2 text-red-400 border-red-500/30 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      {deletingInvoice === selectedInvoice.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                      מחק חשבונית
                    </button>

                    {selectedInvoice.adminNote && (
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                          <MessageSquare size={14} />
                          הערת מנהל
                        </p>
                        <p className="text-white">{selectedInvoice.adminNote}</p>
                      </div>
                    )}

                    {/* Payment Info - shown for paid invoices */}
                    {(selectedInvoice.status === 'PAID' || selectedInvoice.supplierRef || selectedInvoice.paymentProofUrl) && (
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                        <p className="text-sm text-green-400 mb-3 font-medium flex items-center gap-1">
                          <CheckCircle size={14} />
                          פרטי תשלום
                        </p>
                        {selectedInvoice.supplierRef && (
                          <div className="mb-2">
                            <label className="text-gray-600 text-xs">מספר אסמכתא</label>
                            <p className="text-white font-mono">{selectedInvoice.supplierRef}</p>
                          </div>
                        )}
                        {selectedInvoice.paidAt && (
                          <div className="mb-2">
                            <label className="text-gray-600 text-xs">תאריך תשלום</label>
                            <p className="text-white">{new Date(selectedInvoice.paidAt).toLocaleString('he-IL')}</p>
                          </div>
                        )}
                        {selectedInvoice.paymentProofUrl && (
                          <div className="mt-3 pt-3 border-t border-green-500/30">
                            <label className="text-gray-600 text-xs block mb-2">מסמך אישור העברה</label>
                            {selectedInvoice.paymentProofUrl.toLowerCase().endsWith('.pdf') ? (
                              <div className="flex gap-2">
                                <a
                                  href={selectedInvoice.paymentProofUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1.5 text-sm"
                                >
                                  <Eye size={14} />
                                  פתח PDF
                                </a>
                                <a
                                  href={selectedInvoice.paymentProofUrl}
                                  download
                                  className="px-3 py-1.5 rounded-lg bg-green-500 text-black hover:bg-green-400 transition-colors flex items-center gap-1.5 text-sm"
                                >
                                  <Download size={14} />
                                  הורד
                                </a>
                              </div>
                            ) : (
                              <div className="relative rounded-lg overflow-hidden bg-black/30">
                                <img
                                  src={selectedInvoice.paymentProofUrl}
                                  alt="אישור העברה"
                                  className="w-full h-32 object-contain"
                                />
                                <a
                                  href={selectedInvoice.paymentProofUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                                >
                                  <Eye size={14} />
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Receipt className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-700">בחר חשבונית מהרשימה לצפייה בפרטים</p>
                  </div>
                )}
              </GlassCard>
            </div>
          </motion.div>
        )}

        {/* Recycle Bin Tab */}
        {activeTab === 'recycle-bin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard hover={false}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Trash className="text-red-400" />
                  סל מחזור ({deletedInvoices.length} חשבוניות)
                </h2>
                {deletedInvoices.length > 0 && (
                  <button
                    onClick={handleCleanupRecycleBin}
                    disabled={refreshing}
                    className="btn-secondary flex items-center gap-2 text-red-400 border-red-500/30 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    {refreshing ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                    נקה ישנים (30+ יום)
                  </button>
                )}
              </div>

              <p className="text-gray-700 text-sm mb-6">
                חשבוניות שנמחקו יישמרו כאן למשך 30 יום לפני מחיקה לצמיתות.
              </p>

              {deletedInvoices.length === 0 ? (
                <div className="text-center py-16">
                  <Trash className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-800 text-xl font-medium">סל המחזור ריק</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deletedInvoices.map((invoice) => {
                    const deletedDate = invoice.deletedAt ? new Date(invoice.deletedAt) : new Date();
                    const daysUntilPermanentDelete = Math.max(0, 30 - Math.floor((Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24)));

                    return (
                      <div
                        key={invoice.id}
                        className="p-4 rounded-lg border border-white/10 bg-white/5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-red-500/20">
                            <Receipt size={20} className="text-red-400" />
                          </div>
                          <div>
                            <p className="text-gray-800 font-medium">₪{invoice.amount.toLocaleString()}</p>
                            <p className="text-gray-700 text-sm">{invoice.architect.user.name}</p>
                            <p className="text-gray-600 text-xs">
                              נמחק: {deletedDate.toLocaleDateString('he-IL')} •
                              <span className={daysUntilPermanentDelete <= 7 ? 'text-red-400' : 'text-gray-700'}>
                                {' '}{daysUntilPermanentDelete} ימים למחיקה לצמיתות
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRestoreInvoice(invoice.id)}
                            disabled={restoringInvoice === invoice.id}
                            className="btn-secondary flex items-center gap-2 text-green-400 border-green-500/30 hover:bg-green-500/20 disabled:opacity-50"
                          >
                            {restoringInvoice === invoice.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <RotateCcw size={16} />
                            )}
                            שחזר
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(invoice.id)}
                            disabled={deletingInvoice === invoice.id}
                            className="btn-secondary flex items-center gap-2 text-red-400 border-red-500/30 hover:bg-red-500/20 disabled:opacity-50"
                          >
                            {deletingInvoice === invoice.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <XCircle size={16} />
                            )}
                            מחק לצמיתות
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
                    <p className="text-gray-600 mt-2">
                      זמן: {new Date(latestScan.createdAt).toLocaleString('he-IL')}
                    </p>
                  </div>
                </GlassCard>

                {/* Scan Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <GlassCard hover={false}>
                    <div className="text-center">
                      <p className="text-gray-700 text-sm">בדיקות</p>
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
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">תוצאות הסריקה</h3>
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
                                <p className="text-gray-800 font-medium">{result.name}</p>
                                <p className="text-gray-600 text-sm">{result.message}</p>
                              </div>
                            </div>
                            {result.responseTime && (
                              <span className="text-gray-700 text-sm">
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
                  <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600">אין דוחות סריקה</p>
                  <p className="text-gray-700 text-sm mt-2">לחץ על "הפעל סריקה" להפעלת סריקת מערכת</p>
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
                        <p className="text-gray-700 text-sm">{stat.label}</p>
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
                  <Filter size={18} className="text-[#0066CC]" />
                  <span className="font-medium">סינון תוצאות</span>
                </div>
                {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {showFilters && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <label className="text-gray-600 text-sm mb-2 block">חומרה</label>
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
                    <label className="text-gray-600 text-sm mb-2 block">קטגוריה</label>
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
                    <label className="text-gray-600 text-sm mb-2 block">סטטוס</label>
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
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertCircle className="text-[#0066CC]" size={20} />
                  לוגים ({logs.length})
                </h2>

                <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {logs.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
                      <p className="text-gray-800 font-medium">אין תקלות פתוחות</p>
                      <p className="text-gray-600 text-sm">המערכת תקינה</p>
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
                                <span className="text-xs text-gray-700 flex items-center gap-1">
                                  <CategoryIcon size={12} />
                                  {category.label}
                                </span>
                              </div>
                              <p className="text-gray-800 font-medium truncate">{log.title}</p>
                              <p className="text-gray-700 text-sm truncate">{log.message}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-700">
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
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="text-[#0066CC]" size={20} />
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
                          <span className="text-gray-700 text-sm">
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
                      <label className="text-gray-600 text-sm">הודעה</label>
                      <p className="text-white mt-1">{selectedLog.message}</p>
                    </div>

                    {selectedLog.details && (
                      <div>
                        <label className="text-gray-600 text-sm">פרטים נוספים</label>
                        <pre className="mt-1 p-3 bg-black/30 rounded-lg text-gray-700 text-sm overflow-x-auto">
                          {selectedLog.details}
                        </pre>
                      </div>
                    )}

                    {selectedLog.stackTrace && (
                      <div>
                        <label className="text-gray-600 text-sm">Stack Trace</label>
                        <pre className="mt-1 p-3 bg-black/30 rounded-lg text-red-400/80 text-xs overflow-x-auto max-h-48">
                          {selectedLog.stackTrace}
                        </pre>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                      <div>
                        <label className="text-gray-600 text-sm">Endpoint</label>
                        <p className="text-white font-mono text-sm">{selectedLog.endpoint || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-gray-600 text-sm">Response Time</label>
                        <p className="text-white font-mono text-sm">
                          {selectedLog.responseTime ? `${selectedLog.responseTime}ms` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-gray-600 text-sm">תאריך יצירה</label>
                        <p className="text-white text-sm">
                          {new Date(selectedLog.createdAt).toLocaleString('he-IL')}
                        </p>
                      </div>
                      <div>
                        <label className="text-gray-600 text-sm">ID</label>
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
                    <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-700">בחר לוג מהרשימה לצפייה בפרטים</p>
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
