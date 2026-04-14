'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
  type LucideIcon,
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
  MapPin,
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  Image as ImageIcon,
  Edit3,
  Save,
  X,
  Camera,
} from 'lucide-react';
import Swal from 'sweetalert2';
import Link from 'next/link';
import Image from 'next/image';

type TabType = 'users' | 'invoices' | 'recycle-bin' | 'logs' | 'scan';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  company?: string | null;
  profileImage?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
  activatedAt?: string | null;
  architectProfile?: {
    id: string;
    licenseNumber?: string | null;
    specialties?: string[];
    experience?: number | null;
  } | null;
  supplierProfile?: {
    id: string;
    companyName: string;
    description?: string | null;
    phone?: string | null;
    address?: string | null;
    website?: string | null;
    facebook?: string | null;
    instagram?: string | null;
    linkedin?: string | null;
    businessImages?: string[];
    profileImage?: string | null;
  } | null;
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

const severityConfig: Record<string, { icon: LucideIcon; color: string; bg: string; label: string }> = {
  INFO: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'מידע' },
  WARNING: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'אזהרה' },
  ERROR: { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'שגיאה' },
  CRITICAL: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'קריטי' },
};

const defaultSeverity = { icon: Info, color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'לא ידוע' };

const categoryConfig: Record<string, { icon: LucideIcon; label: string }> = {
  HEALTH_CHECK: { icon: Activity, label: 'בדיקת בריאות' },
  SECURITY: { icon: Shield, label: 'אבטחה' },
  API_TEST: { icon: Server, label: 'בדיקת API' },
  DATABASE: { icon: Database, label: 'מסד נתונים' },
  PERFORMANCE: { icon: Clock, label: 'ביצועים' },
  SCHEDULER: { icon: RefreshCw, label: 'משימות מתוזמנות' },
  SYSTEM: { icon: Server, label: 'מערכת' },
  BACKUP: { icon: Database, label: 'גיבוי' },
  AUTH: { icon: Shield, label: 'הזדהות' },
  INVOICE: { icon: FileText, label: 'חשבוניות' },
};

const defaultCategory = { icon: Activity, label: 'כללי' };

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
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [savingUser, setSavingUser] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<string | null>(null);
  const [restoringInvoice, setRestoringInvoice] = useState<string | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<string | null>(null);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('');

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
        const scan = response as ScanReport;
        // results might come as JSON string from DB
        if (scan.results && typeof scan.results === 'string') {
          try { scan.results = JSON.parse(scan.results); } catch { scan.results = []; }
        }
        if (!Array.isArray(scan.results)) {
          scan.results = [];
        }
        setLatestScan(scan);
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

  // WebSocket listener for real-time updates
  useEffect(() => {
    if (!isReady) return;

    const wsUrl = (process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') || 'ws://localhost:7070') + '/ws';
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let pingInterval: NodeJS.Timeout | null = null;

    const connectWs = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('[Admin WS] Connected');
          pingInterval = setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 30000);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type?.startsWith('invoice:')) {
              fetchInvoices();
              fetchDeletedInvoices();
            }
            if (msg.type === 'user:activated') {
              fetchAllUsers();
            }
          } catch {}
        };

        ws.onclose = () => {
          if (pingInterval) clearInterval(pingInterval);
          reconnectTimeout = setTimeout(connectWs, 5000);
        };

        ws.onerror = () => {};
      } catch {}
    };

    connectWs();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (pingInterval) clearInterval(pingInterval);
      if (ws) ws.close();
    };
  }, [isReady]);

  // Auto-refresh users every 10 seconds for real-time updates
  useEffect(() => {
    if (!isReady || activeTab !== 'users') return;

    const interval = setInterval(() => {
      fetchAllUsers();
    }, 10000);

    return () => clearInterval(interval);
  }, [isReady, activeTab]);

  // Auto-refresh invoices every 15 seconds as fallback
  useEffect(() => {
    if (!isReady || activeTab !== 'invoices') return;

    const interval = setInterval(() => {
      fetchInvoices();
    }, 15000);

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

  // Filter invoices by search and status
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = !invoiceSearch ||
      inv.architect.user.name.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.architect.user.email.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.supplier.companyName?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.supplier.user.name.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.amount.toString().includes(invoiceSearch);
    const matchesStatus = !invoiceStatusFilter || inv.status === invoiceStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group invoices by architect
  const groupedInvoices: ArchitectGroup[] = Object.values(
    filteredInvoices.reduce((acc: Record<string, ArchitectGroup>, invoice) => {
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
      background: '#0f2620',
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
        background: '#0f2620',
        color: '#fff',
      });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      Swal.fire({
        title: 'שגיאה',
        text: 'שגיאה במחיקת החשבונית',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#0f2620',
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
      background: '#0f2620',
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
        background: '#0f2620',
        color: '#fff',
      });
    } catch (error) {
      console.error('Error bulk deleting invoices:', error);
      Swal.fire({
        title: 'שגיאה',
        text: 'שגיאה במחיקת החשבוניות',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#0f2620',
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
        background: '#0f2620',
        color: '#fff',
      });
    } catch (error) {
      console.error('Error restoring invoice:', error);
      Swal.fire({
        title: 'שגיאה',
        text: 'שגיאה בשחזור החשבונית',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#0f2620',
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
      background: '#0f2620',
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
        background: '#0f2620',
        color: '#fff',
      });
    } catch (error) {
      console.error('Error permanently deleting invoice:', error);
      Swal.fire({
        title: 'שגיאה',
        text: 'שגיאה במחיקת החשבונית',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#0f2620',
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
      background: '#0f2620',
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
        background: '#0f2620',
        color: '#fff',
      });
    } catch (error) {
      console.error('Error cleaning up recycle bin:', error);
      Swal.fire({
        title: 'שגיאה',
        text: 'שגיאה בניקוי סל המחזור',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#0f2620',
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
        background: '#0f2620',
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
      background: '#0f2620',
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
        background: '#0f2620',
        color: '#fff',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      Swal.fire({
        title: 'שגיאה',
        text: 'שגיאה במחיקת המשתמש',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#0f2620',
        color: '#fff',
      });
    } finally {
      setDeletingUser(null);
    }
  };

  const handleDeactivateUser = async (userId: string, userName: string) => {
    const result = await Swal.fire({
      title: 'ניתוק משתמש',
      text: `האם לנתק את המשתמש "${userName}"? המשתמש לא יוכל להתחבר עד לאישור מחדש.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'כן, נתק',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#f59e0b',
      background: '#0f2620',
      color: '#fff',
    });
    if (!result.isConfirmed) return;

    setDeactivatingUser(userId);
    try {
      await adminApi.deactivateUser(userId);
      await fetchAllUsers();
      Swal.fire({
        title: 'נותק!',
        text: 'המשתמש נותק בהצלחה',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#0f2620',
        color: '#fff',
      });
    } catch (error) {
      console.error('Error deactivating user:', error);
      Swal.fire({
        title: 'שגיאה',
        text: 'לא ניתן לנתק את המשתמש',
        icon: 'error',
        background: '#0f2620',
        color: '#fff',
      });
    } finally {
      setDeactivatingUser(null);
    }
  };

  const startEditUser = (user: AdminUser) => {
    const sp = user.supplierProfile;
    setEditingUserId(user.id);
    setEditForm({
      name: user.name || '',
      phone: user.phone || '',
      address: user.address || '',
      company: user.company || sp?.companyName || '',
      sp_companyName: sp?.companyName || '',
      sp_description: sp?.description || '',
      sp_phone: sp?.phone || '',
      sp_address: sp?.address || '',
      sp_website: sp?.website || '',
      sp_facebook: sp?.facebook || '',
      sp_instagram: sp?.instagram || '',
      sp_linkedin: sp?.linkedin || '',
    });
  };

  const handleSaveUser = async (userId: string) => {
    setSavingUser(true);
    try {
      const data: any = {
        name: editForm.name,
        phone: editForm.phone,
        address: editForm.address,
        company: editForm.company,
      };

      const user = allUsers.find(u => u.id === userId);
      if (user?.role === 'SUPPLIER') {
        data.supplierProfile = {
          companyName: editForm.sp_companyName,
          description: editForm.sp_description,
          phone: editForm.sp_phone,
          address: editForm.sp_address,
          website: editForm.sp_website,
          facebook: editForm.sp_facebook,
          instagram: editForm.sp_instagram,
          linkedin: editForm.sp_linkedin,
        };
      }

      await adminApi.updateUser(userId, data);
      await fetchAllUsers();
      setEditingUserId(null);
      Swal.fire({
        title: 'נשמר!',
        text: 'פרטי המשתמש עודכנו',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#0f2620',
        color: '#fff',
      });
    } catch (error) {
      console.error('Error saving user:', error);
      Swal.fire({
        title: 'שגיאה',
        text: 'לא ניתן לשמור את הפרטים',
        icon: 'error',
        background: '#0f2620',
        color: '#fff',
      });
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUserImage = async (userId: string, imageUrl: string) => {
    const result = await Swal.fire({
      title: 'מחיקת תמונה',
      text: 'האם למחוק את התמונה?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'מחק',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#ef4444',
      background: '#0f2620',
      color: '#fff',
    });
    if (!result.isConfirmed) return;

    try {
      const user = allUsers.find(u => u.id === userId);
      if (!user?.supplierProfile) return;

      const currentImages = user.supplierProfile.businessImages || [];
      const updatedImages = currentImages.filter(img => img !== imageUrl);

      // Delete image via admin API
      const { fetchWithAuth: fetchAuth, config: apiConfig, getHeaders: getH2 } = await import('@stannel/api-client');
      await fetchAuth(`${apiConfig.baseUrl}/admin/users/${userId}/delete-image`, {
        method: 'POST',
        headers: getH2() as Record<string, string>,
        body: JSON.stringify({ imageUrl }),
      });

      await fetchAllUsers();
      Swal.fire({ title: 'נמחק!', icon: 'success', timer: 1500, showConfirmButton: false, background: '#0f2620', color: '#fff' });
    } catch (err) {
      console.error('Error deleting image:', err);
      Swal.fire({ title: 'שגיאה', text: 'לא ניתן למחוק את התמונה', icon: 'error', background: '#0f2620', color: '#fff' });
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
        background: '#0f2620',
        color: '#fff',
      });
    } catch (error) {
      console.error('Error verifying invoice:', error);
      Swal.fire({
        title: 'שגיאה',
        text: 'שגיאה בעדכון החשבונית',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#0f2620',
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
      <div className="min-h-screen bg-[#0f2620] -mt-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
          <p className="text-white/60">טוען נתוני מערכת...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      <div className="px-3 sm:px-6 pt-20 sm:pt-24 pb-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4 sm:mb-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-3xl font-display font-bold text-white flex items-center gap-2 sm:gap-3">
                <Shield className="text-emerald-400" size={22} />
                פאנל ניהול
              </h1>
              <p className="text-white/60 mt-1 font-medium text-xs sm:text-base">ניהול משתמשים ומעקב אחרי תקלות המערכת</p>
            </div>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors flex items-center gap-1.5 text-sm flex-shrink-0"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">רענון</span>
            </button>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <Link href="/admin/analytics" className="group">
            <div className="p-4 bg-white/5 backdrop-blur border border-white/10 rounded-xl hover:bg-white/10 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <BarChart3 size={20} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium group-hover:text-emerald-400 transition-colors">אנליטיקות</p>
                  <p className="text-white/50 text-xs">דוחות וסטטיסטיקות</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/admin/architects" className="group">
            <div className="p-4 bg-white/5 backdrop-blur border border-white/10 rounded-xl hover:bg-white/10 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Users size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium group-hover:text-emerald-400 transition-colors">אדריכלים</p>
                  <p className="text-white/50 text-xs">ניהול אדריכלים</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/admin/service-providers" className="group">
            <div className="p-4 bg-white/5 backdrop-blur border border-white/10 rounded-xl hover:bg-white/10 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Building2 size={20} className="text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium group-hover:text-emerald-400 transition-colors">ספקי שירות</p>
                  <p className="text-white/50 text-xs">ניהול ספקים</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/admin/goals" className="group">
            <div className="p-4 bg-white/5 backdrop-blur border border-white/10 rounded-xl hover:bg-white/10 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Target size={20} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-white font-medium group-hover:text-emerald-400 transition-colors">יעדים</p>
                  <p className="text-white/50 text-xs">ניהול יעדי אדריכלים</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/admin/contracts" className="group">
            <div className="p-4 bg-white/5 backdrop-blur border border-white/10 rounded-xl hover:bg-white/10 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <FileText size={20} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium group-hover:text-emerald-400 transition-colors">חוזים</p>
                  <p className="text-white/50 text-xs">ניהול חוזי ספקים</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/admin/audit-logs" className="group">
            <div className="p-4 bg-white/5 backdrop-blur border border-white/10 rounded-xl hover:bg-white/10 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Clock size={20} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-white font-medium group-hover:text-emerald-400 transition-colors">יומן פעולות</p>
                  <p className="text-white/50 text-xs">מעקב פעולות מערכת</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/admin/rewards" className="group">
            <div className="p-4 bg-white/5 backdrop-blur border border-white/10 rounded-xl hover:bg-white/10 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Gift size={20} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-white font-medium group-hover:text-emerald-400 transition-colors">חנות הטבות</p>
                  <p className="text-white/50 text-xs">ניהול מוצרים</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/admin/events" className="group">
            <div className="p-4 bg-white/5 backdrop-blur border border-white/10 rounded-xl hover:bg-white/10 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/20">
                  <Calendar size={20} className="text-pink-400" />
                </div>
                <div>
                  <p className="text-white font-medium group-hover:text-emerald-400 transition-colors">אירועים</p>
                  <p className="text-white/50 text-xs">ניהול אירועים</p>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Tabs - Horizontal scroll on mobile */}
        <div className="flex gap-2 mb-6 overflow-x-auto -mx-2 px-2 scrollbar-hide">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'users'
                ? 'bg-emerald-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
            }`}
          >
            <Users size={18} />
            ניהול משתמשים
            {pendingUsers.length > 0 && (
              <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'invoices'
                ? 'bg-emerald-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
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
            type="button"
            onClick={() => setActiveTab('recycle-bin')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'recycle-bin'
                ? 'bg-emerald-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
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
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'scan'
                ? 'bg-emerald-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
            }`}
          >
            <Activity size={18} />
            סריקת מערכת
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'logs'
                ? 'bg-emerald-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
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
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Users className="text-emerald-400" />
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
                    className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 size={18} />
                    אשר נבחרים ({selectedUsers.size})
                  </button>
                )}
              </div>

              {allUsers.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-20 h-20 mx-auto text-white/20 mb-4" />
                  <p className="text-white text-xl font-medium">אין משתמשים במערכת</p>
                </div>
              ) : (
                <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="py-3 px-4 text-right">
                          {pendingUsers.length > 0 && (
                            <input type="checkbox" checked={selectedUsers.size === pendingUsers.length && pendingUsers.length > 0} onChange={selectAllPendingUsers} className="w-4 h-4 rounded bg-white/10 border-white/20 text-emerald-500" />
                          )}
                        </th>
                        <th className="py-3 px-4 text-right text-white/60 font-medium">שם</th>
                        <th className="py-3 px-4 text-right text-white/60 font-medium">אימייל</th>
                        <th className="py-3 px-4 text-right text-white/60 font-medium">טלפון</th>
                        <th className="py-3 px-4 text-right text-white/60 font-medium">תפקיד</th>
                        <th className="py-3 px-4 text-right text-white/60 font-medium">סטטוס</th>
                        <th className="py-3 px-4 text-right text-white/60 font-medium">תאריך הרשמה</th>
                        <th className="py-3 px-4 text-right text-white/60 font-medium">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((user) => {
                        const isExpanded = expandedUserId === user.id;
                        const sp = user.supplierProfile;
                        const ap = user.architectProfile;
                        const allImages = [...(user.profileImage ? [user.profileImage] : []), ...(sp?.businessImages || [])];
                        return (
                          <React.Fragment key={user.id}>
                            <tr className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!user.isActive ? 'bg-yellow-500/5' : ''} ${isExpanded ? 'bg-white/5' : ''}`} onClick={() => setExpandedUserId(isExpanded ? null : user.id)}>
                              <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                                {!user.isActive && <input type="checkbox" checked={selectedUsers.has(user.id)} onChange={() => toggleUserSelection(user.id)} className="w-4 h-4 rounded bg-white/10 border-white/20 text-emerald-500" />}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  {user.profileImage || sp?.profileImage ? (
                                    <div className="w-10 h-10 rounded-full overflow-hidden relative flex-shrink-0"><Image src={user.profileImage || sp?.profileImage || ''} alt={user.name} fill className="object-cover" unoptimized /></div>
                                  ) : (
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${user.isActive ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white' : 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black'}`}>{user.name.charAt(0)}</div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-medium">{user.name}</span>
                                    {isExpanded ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4"><span className="text-white/70 flex items-center gap-2"><Mail size={14} className="text-white/50" />{user.email}</span></td>
                              <td className="py-4 px-4"><span className="text-white/70 flex items-center gap-2"><Phone size={14} className="text-white/50" />{user.phone || '-'}</span></td>
                              <td className="py-4 px-4"><span className={`px-3 py-1 rounded-full text-sm ${user.role === 'ARCHITECT' ? 'bg-blue-500/20 text-blue-400' : user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-400'}`}>{roleLabels[user.role] || user.role}</span></td>
                              <td className="py-4 px-4">
                                {user.isActive ? <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400 flex items-center gap-1 w-fit"><CheckCircle size={14} />מאושר</span> : <span className="px-3 py-1 rounded-full text-sm bg-yellow-500/20 text-yellow-400 flex items-center gap-1 w-fit"><Clock size={14} />ממתין</span>}
                              </td>
                              <td className="py-4 px-4"><span className="text-white/60 flex items-center gap-2"><Calendar size={14} className="text-white/50" />{new Date(user.createdAt).toLocaleDateString('he-IL')}</span></td>
                              <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-2">
                                  {user.isActive && user.role !== 'ADMIN' ? (
                                    <button onClick={() => handleLoginAsUser(user.id)} disabled={loggingInAs === user.id} className="px-3 py-1.5 bg-white/10 border border-white/20 text-white/80 rounded-lg hover:bg-white/20 transition-colors text-sm flex items-center gap-2 disabled:opacity-50">
                                      {loggingInAs === user.id ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}צפה בחשבון
                                    </button>
                                  ) : !user.isActive ? (
                                    <button onClick={() => handleApproveUser(user.id)} disabled={approvingUser === user.id} className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm flex items-center gap-2 disabled:opacity-50">
                                      {approvingUser === user.id ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}אשר
                                    </button>
                                  ) : null}
                                  {user.role !== 'ADMIN' && (
                                    <button onClick={() => handleDeleteUser(user.id, user.name)} disabled={deletingUser === user.id} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50" title="מחק משתמש">
                                      {deletingUser === user.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr><td colSpan={8} className="p-0">
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white/[0.03] border-b border-white/10">
                                  <div className="p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                      <h3 className="text-white font-semibold text-lg">פרטי {user.name}</h3>
                                      {user.role !== 'ADMIN' && (editingUserId === user.id ? (
                                        <div className="flex items-center gap-2">
                                          <button onClick={() => handleSaveUser(user.id)} disabled={savingUser} className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50">{savingUser ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}שמור</button>
                                          <button onClick={() => setEditingUserId(null)} className="px-4 py-2 bg-white/10 border border-white/20 text-white/70 rounded-lg text-sm flex items-center gap-2"><X size={16} />ביטול</button>
                                        </div>
                                      ) : (
                                        <button onClick={() => startEditUser(user)} className="px-4 py-2 bg-white/10 border border-white/20 text-white/70 rounded-lg text-sm flex items-center gap-2"><Edit3 size={16} />עריכה</button>
                                      ))}
                                    </div>
                                    {/* Profile Image Change */}
                                    <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                                      <div className="relative group">
                                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20">
                                          {(user.profileImage || sp?.profileImage) ? (
                                            <Image src={user.profileImage || sp?.profileImage || ''} alt={user.name} fill className="object-cover" unoptimized />
                                          ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xl font-bold">{user.name.charAt(0)}</div>
                                          )}
                                        </div>
                                        <label className="absolute inset-0 rounded-full cursor-pointer flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Camera size={18} className="text-white" />
                                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            try {
                                              const { fetchWithAuth: fetchAuth, getMultipartHeaders: getMH, config: apiConfig } = await import('@stannel/api-client');
                                              const formData = new FormData();
                                              formData.append('file', file);
                                              await fetchAuth(`${apiConfig.baseUrl}/admin/users/${user.id}/update-profile-image`, {
                                                method: 'POST',
                                                headers: getMH() as Record<string, string>,
                                                body: formData,
                                              });
                                              await fetchAllUsers();
                                              Swal.fire({ title: 'עודכן!', icon: 'success', timer: 1500, showConfirmButton: false, background: '#0f2620', color: '#fff' });
                                            } catch { Swal.fire({ title: 'שגיאה', icon: 'error', background: '#0f2620', color: '#fff' }); }
                                          }} />
                                        </label>
                                      </div>
                                      <div>
                                        <p className="text-white font-semibold">{user.name}</p>
                                        <p className="text-white/40 text-xs">העבר עכבר על התמונה להחלפה</p>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-6">
                                      <div className="space-y-4">
                                        <h4 className="text-white font-semibold flex items-center gap-2"><Users size={16} className="text-emerald-400" />פרטי משתמש</h4>
                                        {editingUserId === user.id ? (
                                          <div className="space-y-3">
                                            <div><label className="text-white/40 text-xs mb-1 block">שם</label><input value={editForm.name || ''} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" /></div>
                                            <div><label className="text-white/40 text-xs mb-1 block">טלפון</label><input value={editForm.phone || ''} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" dir="ltr" /></div>
                                            <div><label className="text-white/40 text-xs mb-1 block">כתובת</label><input value={editForm.address || ''} onChange={(e) => setEditForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" /></div>
                                            <div><label className="text-white/40 text-xs mb-1 block">חברה</label><input value={editForm.company || ''} onChange={(e) => setEditForm(f => ({ ...f, company: e.target.value }))} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" /></div>
                                          </div>
                                        ) : (
                                          <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-white/70"><span className="text-white/40 min-w-[60px]">שם:</span><span className="text-white">{user.name}</span></div>
                                            <div className="flex items-center gap-2 text-white/70"><span className="text-white/40 min-w-[60px]">אימייל:</span><span className="text-white" dir="ltr">{user.email}</span></div>
                                            <div className="flex items-center gap-2 text-white/70"><span className="text-white/40 min-w-[60px]">טלפון:</span><span className="text-white" dir="ltr">{user.phone || 'לא צוין'}</span></div>
                                            <div className="flex items-center gap-2 text-white/70"><span className="text-white/40 min-w-[60px]">כתובת:</span><span className="text-white">{user.address || 'לא צוינה'}</span></div>
                                            <div className="flex items-center gap-2 text-white/70"><span className="text-white/40 min-w-[60px]">חברה:</span><span className="text-white">{user.company || sp?.companyName || 'לא צוינה'}</span></div>
                                          </div>
                                        )}
                                      </div>
                                      <div className="space-y-4">
                                        <h4 className="text-white font-semibold flex items-center gap-2"><Calendar size={16} className="text-emerald-400" />תאריכים וסטטוס</h4>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex items-center gap-2 text-white/70"><span className="text-white/40 min-w-[80px]">נרשם:</span><span className="text-white">{new Date(user.createdAt).toLocaleString('he-IL')}</span></div>
                                          {user.activatedAt && <div className="flex items-center gap-2 text-white/70"><span className="text-white/40 min-w-[80px]">אושר:</span><span className="text-white">{new Date(user.activatedAt).toLocaleString('he-IL')}</span></div>}
                                          {user.updatedAt && <div className="flex items-center gap-2 text-white/70"><span className="text-white/40 min-w-[80px]">עודכן:</span><span className="text-white">{new Date(user.updatedAt).toLocaleString('he-IL')}</span></div>}
                                          <div className="flex items-center gap-2 text-white/70"><span className="text-white/40 min-w-[80px]">תפקיד:</span><span className={`px-2 py-0.5 rounded-full text-xs ${user.role === 'ARCHITECT' ? 'bg-blue-500/20 text-blue-400' : user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-400'}`}>{roleLabels[user.role] || user.role}</span></div>
                                          <div className="flex items-center gap-2 text-white/70"><span className="text-white/40 min-w-[80px]">מזהה:</span><span className="text-white/50 text-xs font-mono" dir="ltr">{user.id}</span></div>
                                        </div>
                                      </div>
                                      <div className="space-y-4">
                                        {user.role === 'SUPPLIER' && sp && (
                                          <>
                                            <h4 className="text-white font-semibold flex items-center gap-2"><Building2 size={16} className="text-purple-400" />פרופיל ספק</h4>
                                            {editingUserId === user.id ? (
                                              <div className="space-y-3">
                                                <div><label className="text-white/40 text-xs mb-1 block">שם חברה</label><input value={editForm.sp_companyName || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_companyName: e.target.value }))} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" /></div>
                                                <div><label className="text-white/40 text-xs mb-1 block">תיאור</label><textarea value={editForm.sp_description || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_description: e.target.value }))} rows={2} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 resize-none" /></div>
                                                <div><label className="text-white/40 text-xs mb-1 block">טלפון</label><input value={editForm.sp_phone || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_phone: e.target.value }))} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" dir="ltr" /></div>
                                                <div><label className="text-white/40 text-xs mb-1 block">כתובת</label><input value={editForm.sp_address || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_address: e.target.value }))} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" /></div>
                                                <div><label className="text-white/40 text-xs mb-1 block">אתר</label><input value={editForm.sp_website || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_website: e.target.value }))} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" dir="ltr" /></div>
                                                <div><label className="text-white/40 text-xs mb-1 block">פייסבוק</label><input value={editForm.sp_facebook || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_facebook: e.target.value }))} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" dir="ltr" /></div>
                                                <div><label className="text-white/40 text-xs mb-1 block">אינסטגרם</label><input value={editForm.sp_instagram || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_instagram: e.target.value }))} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" dir="ltr" /></div>
                                                <div><label className="text-white/40 text-xs mb-1 block">לינקדאין</label><input value={editForm.sp_linkedin || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_linkedin: e.target.value }))} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" dir="ltr" /></div>
                                              </div>
                                            ) : (
                                              <div className="space-y-2 text-sm">
                                                {sp.companyName && <div className="flex items-center gap-2 text-white/70"><span className="text-white/40">חברה:</span><span className="text-white">{sp.companyName}</span></div>}
                                                {sp.phone && <div className="flex items-center gap-2 text-white/70"><Phone size={12} className="text-white/40" /><span className="text-white" dir="ltr">{sp.phone}</span></div>}
                                                {sp.address && <div className="flex items-center gap-2 text-white/70"><MapPin size={12} className="text-white/40" /><span className="text-white">{sp.address}</span></div>}
                                                {sp.website && <div className="flex items-center gap-2 text-white/70"><Globe size={12} className="text-white/40" /><a href={sp.website} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline" dir="ltr">{sp.website}</a></div>}
                                                {sp.description && <div className="mt-2"><span className="text-white/40 text-xs">תיאור:</span><p className="text-white/70 mt-1">{sp.description}</p></div>}
                                                <div className="flex items-center gap-3 mt-2">
                                                  {sp.facebook && <a href={sp.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-400"><Facebook size={16} /></a>}
                                                  {sp.instagram && <a href={sp.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-400"><Instagram size={16} /></a>}
                                                  {sp.linkedin && <a href={sp.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-300"><Linkedin size={16} /></a>}
                                                </div>
                                              </div>
                                            )}
                                          </>
                                        )}
                                        {user.role === 'ARCHITECT' && ap && (
                                          <>
                                            <h4 className="text-white font-semibold flex items-center gap-2"><Building2 size={16} className="text-blue-400" />פרופיל אדריכל</h4>
                                            <div className="space-y-2 text-sm">
                                              {ap.licenseNumber && <div className="flex items-center gap-2 text-white/70"><span className="text-white/40">מס׳ רישיון:</span><span className="text-white">{ap.licenseNumber}</span></div>}
                                              {ap.experience && <div className="flex items-center gap-2 text-white/70"><span className="text-white/40">ניסיון:</span><span className="text-white">{ap.experience} שנים</span></div>}
                                              {ap.specialties && ap.specialties.length > 0 && <div><span className="text-white/40 text-xs">התמחויות:</span><div className="flex flex-wrap gap-1 mt-1">{ap.specialties.map((s, i) => <span key={i} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-xs">{s}</span>)}</div></div>}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    {allImages.length > 0 && (
                                      <div className="space-y-3">
                                        <h4 className="text-white font-semibold flex items-center gap-2"><ImageIcon size={16} className="text-emerald-400" />תמונות ({allImages.length})</h4>
                                        <div className="grid grid-cols-6 gap-3">{allImages.map((img, idx) => (
                                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-emerald-500/50 transition-colors group">
                                            <a href={img} target="_blank" rel="noopener noreferrer"><Image src={img} alt={`תמונה ${idx + 1}`} fill className="object-cover group-hover:scale-105 transition-transform" unoptimized /></a>
                                            <button onClick={() => handleDeleteUserImage(user.id, img)} className="absolute top-1 left-1 p-1 bg-red-500/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" title="מחק תמונה"><Trash2 size={12} className="text-white" /></button>
                                          </div>
                                        ))}</div>
                                      </div>
                                    )}
                                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/10">
                                      {user.isActive && user.role !== 'ADMIN' && <button onClick={() => handleLoginAsUser(user.id)} disabled={loggingInAs === user.id} className="px-4 py-2 bg-white/10 border border-white/20 text-white/80 rounded-lg hover:bg-white/20 transition-colors text-sm flex items-center gap-2 disabled:opacity-50">{loggingInAs === user.id ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}כניסה לחשבון</button>}
                                      {!user.isActive && <button onClick={() => handleApproveUser(user.id)} disabled={approvingUser === user.id} className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm flex items-center gap-2 disabled:opacity-50">{approvingUser === user.id ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}אשר משתמש</button>}
                                      {user.isActive && user.role !== 'ADMIN' && <button onClick={() => handleDeactivateUser(user.id, user.name)} disabled={deactivatingUser === user.id} className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors text-sm flex items-center gap-2 disabled:opacity-50">{deactivatingUser === user.id ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}נתק משתמש</button>}
                                      {user.role !== 'ADMIN' && <button onClick={() => handleDeleteUser(user.id, user.name)} disabled={deletingUser === user.id} className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm flex items-center gap-2 disabled:opacity-50">{deletingUser === user.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}מחק משתמש</button>}
                                    </div>
                                  </div>
                                </motion.div>
                              </td></tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {allUsers.map((user) => {
                    const isExpanded = expandedUserId === user.id;
                    const sp = user.supplierProfile;
                    const ap = user.architectProfile;
                    const allImages = [
                      ...(user.profileImage ? [user.profileImage] : []),
                      ...(sp?.profileImage ? [sp.profileImage] : []),
                      ...(sp?.businessImages || []),
                    ];

                    return (
                      <div key={user.id} className={`rounded-xl border transition-colors ${
                        isExpanded ? 'border-emerald-500/30 bg-white/5' : 'border-white/10 bg-white/[0.02]'
                      } ${!user.isActive ? 'border-yellow-500/20' : ''}`}>
                        {/* User Card Header */}
                        <div
                          className="flex items-center gap-3 p-4 cursor-pointer"
                          onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                        >
                          {/* Avatar */}
                          {user.profileImage || sp?.profileImage ? (
                            <div className="w-12 h-12 rounded-full overflow-hidden relative flex-shrink-0">
                              <Image
                                src={user.profileImage || sp?.profileImage || ''}
                                alt={user.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                              user.isActive
                                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
                                : 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black'
                            }`}>
                              {user.name.charAt(0)}
                            </div>
                          )}

                          {/* Name + Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white font-semibold">{user.name}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                user.role === 'ARCHITECT' ? 'bg-blue-500/20 text-blue-400'
                                : user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400'
                                : 'bg-purple-500/20 text-purple-400'
                              }`}>{roleLabels[user.role] || user.role}</span>
                              {user.isActive ? (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 flex items-center gap-1">
                                  <CheckCircle size={10} />
                                  מאושר
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
                                  <Clock size={10} />
                                  ממתין
                                </span>
                              )}
                            </div>
                            <p className="text-white/50 text-sm truncate mt-0.5" dir="ltr">{user.email}</p>
                          </div>

                          {/* Expand Arrow */}
                          <div className="flex-shrink-0">
                            {isExpanded ? <ChevronUp size={20} className="text-emerald-400" /> : <ChevronDown size={20} className="text-white/40" />}
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="border-t border-white/10"
                          >
                            <div className="p-4 space-y-5">
                              {/* Edit toggle */}
                              <div className="flex items-center justify-between">
                                <h3 className="text-white font-semibold">פרטי {user.name}</h3>
                                {user.role !== 'ADMIN' && (
                                  editingUserId === user.id ? (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleSaveUser(user.id)}
                                        disabled={savingUser}
                                        className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm flex items-center gap-1.5 disabled:opacity-50"
                                      >
                                        {savingUser ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                        שמור
                                      </button>
                                      <button
                                        onClick={() => setEditingUserId(null)}
                                        className="px-3 py-1.5 bg-white/10 border border-white/20 text-white/70 rounded-lg text-sm flex items-center gap-1.5"
                                      >
                                        <X size={14} />
                                        ביטול
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => startEditUser(user)}
                                      className="px-3 py-1.5 bg-white/10 border border-white/20 text-white/70 rounded-lg text-sm flex items-center gap-1.5"
                                    >
                                      <Edit3 size={14} />
                                      עריכה
                                    </button>
                                  )
                                )}
                              </div>

                              {/* User Basic Info */}
                              <div className="space-y-4">
                                <h4 className="text-white font-medium flex items-center gap-2 text-sm">
                                  <Users size={14} className="text-emerald-400" />
                                  פרטי משתמש
                                </h4>
                                {editingUserId === user.id ? (
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-white/40 text-xs mb-1 block">שם</label>
                                      <input value={editForm.name || ''} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" />
                                    </div>
                                    <div>
                                      <label className="text-white/40 text-xs mb-1 block">טלפון</label>
                                      <input value={editForm.phone || ''} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" dir="ltr" />
                                    </div>
                                    <div>
                                      <label className="text-white/40 text-xs mb-1 block">כתובת</label>
                                      <input value={editForm.address || ''} onChange={(e) => setEditForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" />
                                    </div>
                                    <div>
                                      <label className="text-white/40 text-xs mb-1 block">חברה</label>
                                      <input value={editForm.company || ''} onChange={(e) => setEditForm(f => ({ ...f, company: e.target.value }))} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-white/40">שם:</span>
                                      <span className="text-white">{user.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-white/40">אימייל:</span>
                                      <span className="text-white text-xs" dir="ltr">{user.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-white/40">טלפון:</span>
                                      <span className="text-white" dir="ltr">{user.phone || 'לא צוין'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-white/40">כתובת:</span>
                                      <span className="text-white">{user.address || 'לא צוינה'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-white/40">חברה:</span>
                                      <span className="text-white">{user.company || sp?.companyName || 'לא צוינה'}</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Dates */}
                              <div className="space-y-2">
                                <h4 className="text-white font-medium flex items-center gap-2 text-sm">
                                  <Calendar size={14} className="text-emerald-400" />
                                  תאריכים וסטטוס
                                </h4>
                                <div className="space-y-1.5 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-white/40">נרשם:</span>
                                    <span className="text-white text-xs">{new Date(user.createdAt).toLocaleString('he-IL')}</span>
                                  </div>
                                  {user.activatedAt && (
                                    <div className="flex justify-between">
                                      <span className="text-white/40">אושר:</span>
                                      <span className="text-white text-xs">{new Date(user.activatedAt).toLocaleString('he-IL')}</span>
                                    </div>
                                  )}
                                  {user.updatedAt && (
                                    <div className="flex justify-between">
                                      <span className="text-white/40">עודכן:</span>
                                      <span className="text-white text-xs">{new Date(user.updatedAt).toLocaleString('he-IL')}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center">
                                    <span className="text-white/40">תפקיד:</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                                      user.role === 'ARCHITECT' ? 'bg-blue-500/20 text-blue-400'
                                      : user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400'
                                      : 'bg-purple-500/20 text-purple-400'
                                    }`}>{roleLabels[user.role] || user.role}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-white/40">מזהה:</span>
                                    <span className="text-white/40 text-[10px] font-mono break-all" dir="ltr">{user.id}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Supplier Profile */}
                              {user.role === 'SUPPLIER' && sp && (
                                <div className="space-y-3">
                                  <h4 className="text-white font-medium flex items-center gap-2 text-sm">
                                    <Building2 size={14} className="text-purple-400" />
                                    פרופיל ספק
                                  </h4>
                                  {editingUserId === user.id ? (
                                    <div className="space-y-3">
                                      <div>
                                        <label className="text-white/40 text-xs mb-1 block">שם חברה</label>
                                        <input value={editForm.sp_companyName || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_companyName: e.target.value }))} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" />
                                      </div>
                                      <div>
                                        <label className="text-white/40 text-xs mb-1 block">תיאור</label>
                                        <textarea value={editForm.sp_description || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_description: e.target.value }))} rows={2} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 resize-none" />
                                      </div>
                                      <div>
                                        <label className="text-white/40 text-xs mb-1 block">טלפון ספק</label>
                                        <input value={editForm.sp_phone || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_phone: e.target.value }))} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" dir="ltr" />
                                      </div>
                                      <div>
                                        <label className="text-white/40 text-xs mb-1 block">כתובת ספק</label>
                                        <input value={editForm.sp_address || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_address: e.target.value }))} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" />
                                      </div>
                                      <div>
                                        <label className="text-white/40 text-xs mb-1 block">אתר</label>
                                        <input value={editForm.sp_website || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_website: e.target.value }))} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" dir="ltr" />
                                      </div>
                                      <div>
                                        <label className="text-white/40 text-xs mb-1 block">פייסבוק</label>
                                        <input value={editForm.sp_facebook || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_facebook: e.target.value }))} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" dir="ltr" />
                                      </div>
                                      <div>
                                        <label className="text-white/40 text-xs mb-1 block">אינסטגרם</label>
                                        <input value={editForm.sp_instagram || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_instagram: e.target.value }))} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" dir="ltr" />
                                      </div>
                                      <div>
                                        <label className="text-white/40 text-xs mb-1 block">לינקדאין</label>
                                        <input value={editForm.sp_linkedin || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_linkedin: e.target.value }))} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500" dir="ltr" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5 text-sm">
                                      {sp.companyName && <div className="flex justify-between"><span className="text-white/40">חברה:</span><span className="text-white">{sp.companyName}</span></div>}
                                      {sp.phone && <div className="flex justify-between"><span className="text-white/40">טלפון:</span><span className="text-white" dir="ltr">{sp.phone}</span></div>}
                                      {sp.address && <div className="flex justify-between"><span className="text-white/40">כתובת:</span><span className="text-white">{sp.address}</span></div>}
                                      {sp.website && <div className="flex justify-between"><span className="text-white/40">אתר:</span><a href={sp.website} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline text-xs" dir="ltr">{sp.website}</a></div>}
                                      {sp.description && <div className="mt-2"><span className="text-white/40 text-xs">תיאור:</span><p className="text-white/70 mt-1 text-xs">{sp.description}</p></div>}
                                      <div className="flex items-center gap-3 mt-2">
                                        {sp.facebook && <a href={sp.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-400"><Facebook size={16} /></a>}
                                        {sp.instagram && <a href={sp.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-400"><Instagram size={16} /></a>}
                                        {sp.linkedin && <a href={sp.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-300"><Linkedin size={16} /></a>}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Architect Profile */}
                              {user.role === 'ARCHITECT' && ap && (
                                <div className="space-y-2">
                                  <h4 className="text-white font-medium flex items-center gap-2 text-sm">
                                    <Building2 size={14} className="text-blue-400" />
                                    פרופיל אדריכל
                                  </h4>
                                  <div className="space-y-1.5 text-sm">
                                    {ap.licenseNumber && <div className="flex justify-between"><span className="text-white/40">מס׳ רישיון:</span><span className="text-white">{ap.licenseNumber}</span></div>}
                                    {ap.experience && <div className="flex justify-between"><span className="text-white/40">ניסיון:</span><span className="text-white">{ap.experience} שנים</span></div>}
                                    {ap.specialties && ap.specialties.length > 0 && (
                                      <div>
                                        <span className="text-white/40 text-xs">התמחויות:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {ap.specialties.map((s, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-xs">{s}</span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Images Gallery */}
                              {allImages.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-white font-medium flex items-center gap-2 text-sm">
                                    <ImageIcon size={14} className="text-emerald-400" />
                                    תמונות ({allImages.length})
                                  </h4>
                                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {allImages.map((img, idx) => (
                                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-emerald-500/50 transition-colors group">
                                        <a href={img} target="_blank" rel="noopener noreferrer">
                                          <Image src={img} alt={`תמונה ${idx + 1}`} fill className="object-cover" unoptimized />
                                        </a>
                                        <button onClick={() => handleDeleteUserImage(user.id, img)} className="absolute top-1 left-1 p-1.5 bg-red-500/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" title="מחק תמונה"><Trash2 size={14} className="text-white" /></button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Quick Actions */}
                              <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
                                {user.isActive && user.role !== 'ADMIN' && (
                                  <button
                                    onClick={() => handleLoginAsUser(user.id)}
                                    disabled={loggingInAs === user.id}
                                    className="flex-1 min-w-[120px] py-2.5 bg-white/10 border border-white/20 text-white/80 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                  >
                                    {loggingInAs === user.id ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                                    כניסה לחשבון
                                  </button>
                                )}
                                {!user.isActive && (
                                  <button
                                    onClick={() => handleApproveUser(user.id)}
                                    disabled={approvingUser === user.id}
                                    className="flex-1 min-w-[120px] py-2.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                  >
                                    {approvingUser === user.id ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                                    אשר משתמש
                                  </button>
                                )}
                                {user.isActive && user.role !== 'ADMIN' && (
                                  <button
                                    onClick={() => handleDeactivateUser(user.id, user.name)}
                                    disabled={deactivatingUser === user.id}
                                    className="flex-1 min-w-[120px] py-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                  >
                                    {deactivatingUser === user.id ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                                    נתק משתמש
                                  </button>
                                )}
                                {user.role !== 'ADMIN' && (
                                  <button
                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                    disabled={deletingUser === user.id}
                                    className="flex-1 min-w-[120px] py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                  >
                                    {deletingUser === user.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    מחק משתמש
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Invoices Tab - Grouped by Architect */}
        {activeTab === 'invoices' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Search & Filter Bar */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    placeholder="חיפוש לפי שם, אימייל, ספק או סכום..."
                    className="w-full pr-10 pl-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-white/40 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <select
                  value={invoiceStatusFilter}
                  onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                  className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#0f2620]">כל הסטטוסים</option>
                  <option value="PENDING_ADMIN" className="bg-[#0f2620]">ממתין לאישור</option>
                  <option value="APPROVED" className="bg-[#0f2620]">מאושר</option>
                  <option value="PENDING_SUPPLIER_PAY" className="bg-[#0f2620]">ממתין לתשלום</option>
                  <option value="PAID" className="bg-[#0f2620]">שולם</option>
                  <option value="REJECTED" className="bg-[#0f2620]">נדחה</option>
                  <option value="OVERDUE" className="bg-[#0f2620]">באיחור</option>
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-white/50">
                <span>סה"כ: {invoices.length} חשבוניות</span>
                {invoiceSearch || invoiceStatusFilter ? <span>מוצגות: {filteredInvoices.length}</span> : null}
                <span>ממתינות: {invoices.filter(inv => inv.status === 'PENDING_ADMIN').length}</span>
                <span>סה"כ מחזור: ₪{invoices.reduce((s, i) => s + i.amount, 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Architects Folders */}
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-3 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <FolderOpen className="text-emerald-400" />
                    חשבוניות לפי אדריכל ({groupedInvoices.length} אדריכלים)
                    {filteredInvoices.filter(inv => inv.status === 'PENDING_ADMIN').length > 0 && (
                      <span className="bg-yellow-500/20 text-yellow-400 text-sm px-2 py-0.5 rounded-full mr-2">
                        {filteredInvoices.filter(inv => inv.status === 'PENDING_ADMIN').length} ממתינות
                      </span>
                    )}
                  </h2>
                </div>

                {groupedInvoices.length === 0 ? (
                  <div className="text-center py-16">
                    <Receipt className="w-20 h-20 mx-auto text-white/20 mb-4" />
                    <p className="text-white text-xl font-medium">אין חשבוניות במערכת</p>
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
                            className={`p-3 sm:p-4 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between ${
                              isExpanded ? 'bg-emerald-500/10 border-b border-white/10' : 'bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`p-2 rounded-lg shrink-0 ${isExpanded ? 'bg-emerald-500/20' : 'bg-white/10'}`}>
                                <FolderOpen size={20} className={isExpanded ? 'text-emerald-400' : 'text-white/60'} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-white font-medium truncate">{group.architectName}</p>
                                <p className="text-white/50 text-xs truncate">{group.architectEmail}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 sm:gap-4 mr-9 sm:mr-0">
                              <div className="text-left">
                                <p className="text-emerald-400 font-bold text-sm sm:text-base">₪{group.totalAmount.toLocaleString()}</p>
                                <p className="text-white/50 text-xs">{group.invoices.length} חשבוניות</p>
                              </div>
                              {pendingCount > 0 && (
                                <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                                  {pendingCount} ממתינות
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBulkDeleteArchitectInvoices(group.architectId, group.architectName, group.invoices.length);
                                }}
                                className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors shrink-0"
                                title="מחק את כל החשבוניות"
                              >
                                <Trash2 size={16} />
                              </button>
                              <ChevronRight
                                size={20}
                                className={`text-white/50 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
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
                                const status = invoiceStatusConfig[invoice.status] || { bg: 'bg-gray-500/20', text: 'text-white/60', label: invoice.status };

                                return (
                                  <div
                                    key={invoice.id}
                                    onClick={() => setSelectedInvoice(invoice)}
                                    className={`p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between ${
                                      selectedInvoice?.id === invoice.id
                                        ? 'border border-emerald-500/50 bg-emerald-500/10'
                                        : 'border border-white/5 bg-white/5 hover:border-white/20'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`p-1.5 rounded-lg ${status.bg}`}>
                                        <Receipt size={14} className={status.text} />
                                      </div>
                                      <div>
                                        <p className="text-white font-medium text-sm">₪{invoice.amount.toLocaleString()}</p>
                                        <p className="text-white/50 text-xs">
                                          {invoice.supplier.companyName || invoice.supplier.user.name}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-left">
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${status.bg} ${status.text}`}>
                                          {status.label}
                                        </span>
                                        <p className="text-white/40 text-xs mt-1">
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
              </div>

              {/* Selected Invoice Details */}
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 h-fit sticky top-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="text-emerald-400" size={20} />
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
                          <p className="text-white font-medium mb-3">קובץ PDF</p>
                          <div className="flex gap-2">
                            <a
                              href={selectedInvoice.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center gap-1.5 text-sm"
                            >
                              <Eye size={14} />
                              פתח
                            </a>
                            <a
                              href={selectedInvoice.imageUrl}
                              download
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 transition-colors flex items-center gap-1.5 text-sm"
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
                        <label className="text-white/60 text-sm">סכום</label>
                        <p className="text-2xl font-bold text-emerald-400">₪{selectedInvoice.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-white/60 text-sm">סטטוס</label>
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

                    {/* AI Mismatch Warning */}
                    {selectedInvoice.aiExtractedAmount && selectedInvoice.aiExtractedAmount > 0 && selectedInvoice.aiStatus !== 'MATCH' && Math.abs(selectedInvoice.amount - selectedInvoice.aiExtractedAmount) > 1 && (
                      <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30">
                        <div className="flex items-start gap-2 mb-2">
                          <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-red-400 font-medium text-sm">שים לב! זוהה סכום אחר בחשבונית</p>
                            <p className="text-white/60 text-xs mt-1">
                              הסכום שהוזן: ₪{selectedInvoice.amount.toLocaleString()} | סכום שזוהה: ₪{selectedInvoice.aiExtractedAmount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              // Update amount first
                              const { getHeaders: getH, fetchWithAuth: fetchAuth, config: apiConfig } = await import('@stannel/api-client');
                              await fetchAuth(`${apiConfig.baseUrl}/admin/invoices/${selectedInvoice.id}/update-amount`, {
                                method: 'PATCH',
                                headers: getH() as Record<string, string>,
                                body: JSON.stringify({ amount: selectedInvoice.aiExtractedAmount }),
                              });
                              // Then approve
                              await adminApi.verifyInvoice(selectedInvoice.id, {
                                status: 'APPROVED',
                                note: `סכום תוקן מ-₪${selectedInvoice.amount} ל-₪${selectedInvoice.aiExtractedAmount} לפי זיהוי AI`,
                              });
                              await fetchInvoices();
                              setSelectedInvoice(null);
                              Swal.fire({ title: 'תוקן!', text: `הסכום עודכן ל-₪${selectedInvoice.aiExtractedAmount?.toLocaleString()} והחשבונית אושרה`, icon: 'success', background: '#0f2620', color: '#fff', timer: 2000, showConfirmButton: false });
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="w-full py-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg text-sm hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                        >
                          <AlertTriangle size={14} />
                          תקן לסכום שזוהה (₪{selectedInvoice.aiExtractedAmount.toLocaleString()}) ואשר
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                      <div>
                        <label className="text-white/60 text-sm">אדריכל</label>
                        <p className="text-white font-medium">{selectedInvoice.architect.user.name}</p>
                        <p className="text-white/50 text-xs">{selectedInvoice.architect.user.email}</p>
                      </div>
                      <div>
                        <label className="text-white/60 text-sm">ספק</label>
                        <p className="text-white font-medium">{selectedInvoice.supplier.companyName || selectedInvoice.supplier.user.name}</p>
                        <p className="text-white/50 text-xs">{selectedInvoice.supplier.user.email}</p>
                      </div>
                    </div>

                    {/* AI Analysis */}
                    <div className={`p-3 rounded-lg ${
                      selectedInvoice.aiStatus === 'MATCH' ? 'bg-green-500/20 border border-green-500/30' :
                      selectedInvoice.aiStatus === 'MISMATCH' ? 'bg-red-500/20 border border-red-500/30' :
                      'bg-yellow-500/20 border border-yellow-500/30'
                    }`}>
                      <p className="text-sm text-white/60 mb-2">ניתוח AI</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-sm">סכום שהוצהר:</span>
                          <span className="text-white font-semibold">₪{selectedInvoice.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-sm">סכום שזוהה:</span>
                          <span className={selectedInvoice.aiStatus === 'MATCH' ? 'text-green-400 font-semibold' : selectedInvoice.aiStatus === 'MISMATCH' ? 'text-red-400 font-semibold' : 'text-yellow-400 font-semibold'}>
                            {selectedInvoice.aiExtractedAmount ? `₪${selectedInvoice.aiExtractedAmount.toLocaleString()}` : 'לא זוהה'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-sm">ביטחון:</span>
                          <span className="text-white/70 text-sm">{Math.round((selectedInvoice.aiConfidence || 0) * 100)}%</span>
                        </div>
                        {selectedInvoice.aiStatus && (
                          <div className="flex items-center justify-between pt-1 border-t border-white/10">
                            <span className="text-white/60 text-sm">סטטוס:</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              selectedInvoice.aiStatus === 'MATCH' ? 'bg-green-500/30 text-green-400' :
                              selectedInvoice.aiStatus === 'MISMATCH' ? 'bg-red-500/30 text-red-400' :
                              'bg-yellow-500/30 text-yellow-400'
                            }`}>
                              {selectedInvoice.aiStatus === 'MATCH' ? 'תואם' : selectedInvoice.aiStatus === 'MISMATCH' ? 'לא תואם' : 'לא ברור'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <label className="text-white/60 text-sm">תאריך העלאה</label>
                      <p className="text-white">{new Date(selectedInvoice.createdAt).toLocaleString('he-IL')}</p>
                    </div>

                    {/* Action Buttons */}
                    {selectedInvoice.status === 'PENDING_ADMIN' && (
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => handleVerifyInvoice(selectedInvoice.id, 'APPROVED')}
                          disabled={processingInvoice === selectedInvoice.id}
                          className="flex-1 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
                              background: '#0f2620',
                              color: '#fff',
                            });
                            if (result.isConfirmed) {
                              handleVerifyInvoice(selectedInvoice.id, 'REJECTED', result.value || undefined);
                            }
                          }}
                          disabled={processingInvoice === selectedInvoice.id}
                          className="flex-1 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
                      className="w-full px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
                        <p className="text-sm text-white/60 mb-1 flex items-center gap-1">
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
                            <label className="text-white/60 text-xs">מספר אסמכתא</label>
                            <p className="text-white font-mono">{selectedInvoice.supplierRef}</p>
                          </div>
                        )}
                        {selectedInvoice.paidAt && (
                          <div className="mb-2">
                            <label className="text-white/60 text-xs">תאריך תשלום</label>
                            <p className="text-white">{new Date(selectedInvoice.paidAt).toLocaleString('he-IL')}</p>
                          </div>
                        )}
                        {selectedInvoice.paymentProofUrl && (
                          <div className="mt-3 pt-3 border-t border-green-500/30">
                            <label className="text-white/60 text-xs block mb-2">מסמך אישור העברה</label>
                            {selectedInvoice.paymentProofUrl.toLowerCase().endsWith('.pdf') ? (
                              <div className="flex gap-2">
                                <a
                                  href={selectedInvoice.paymentProofUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center gap-1.5 text-sm"
                                >
                                  <Eye size={14} />
                                  פתח PDF
                                </a>
                                <a
                                  href={selectedInvoice.paymentProofUrl}
                                  download
                                  className="px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-400 transition-colors flex items-center gap-1.5 text-sm"
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
                    <Receipt className="w-16 h-16 mx-auto text-white/20 mb-4" />
                    <p className="text-white/50">בחר חשבונית מהרשימה לצפייה בפרטים</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Recycle Bin Tab */}
        {activeTab === 'recycle-bin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Trash className="text-red-400" />
                  סל מחזור ({deletedInvoices.length} חשבוניות)
                </h2>
                {deletedInvoices.length > 0 && (
                  <button
                    onClick={handleCleanupRecycleBin}
                    disabled={refreshing}
                    className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors flex items-center gap-2 disabled:opacity-50"
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

              <p className="text-white/50 text-sm mb-6">
                חשבוניות שנמחקו יישמרו כאן למשך 30 יום לפני מחיקה לצמיתות.
              </p>

              {deletedInvoices.length === 0 ? (
                <div className="text-center py-16">
                  <Trash className="w-20 h-20 mx-auto text-white/20 mb-4" />
                  <p className="text-white text-xl font-medium">סל המחזור ריק</p>
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
                            <p className="text-white font-medium">₪{invoice.amount.toLocaleString()}</p>
                            <p className="text-white/70 text-sm">{invoice.architect.user.name}</p>
                            <p className="text-white/50 text-xs">
                              נמחק: {deletedDate.toLocaleDateString('he-IL')} •
                              <span className={daysUntilPermanentDelete <= 7 ? 'text-red-400' : 'text-white/50'}>
                                {' '}{daysUntilPermanentDelete} ימים למחיקה לצמיתות
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRestoreInvoice(invoice.id)}
                            disabled={restoringInvoice === invoice.id}
                            className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-2 disabled:opacity-50"
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
                            className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2 disabled:opacity-50"
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
            </div>
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
                className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors flex items-center gap-2"
              >
                <Search size={18} className={refreshing ? 'animate-spin' : ''} />
                הפעל סריקה
              </button>
              {latestScan?.claudeFormat && (
                <button
                  onClick={handleCopyScanReport}
                  className="px-4 py-2 bg-white/10 border border-white/20 text-white/80 rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2"
                >
                  <Copy size={18} />
                  {copiedId === 'scan' ? 'הועתק!' : 'העתק ל-Claude'}
                </button>
              )}
            </div>

            {latestScan ? (
              <>
                {/* Scan Status Banner */}
                <div
                  className={`mb-6 bg-white/5 backdrop-blur border rounded-2xl p-6 ${
                    latestScan.isHealthy
                      ? 'border-green-500/30'
                      : 'border-red-500/30'
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
                </div>

                {/* Scan Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
                    <div className="text-center">
                      <p className="text-white/50 text-sm">בדיקות</p>
                      <p className="text-3xl font-bold text-white">{latestScan.checksRun}</p>
                    </div>
                  </div>
                  <div className="bg-green-500/10 backdrop-blur border border-green-500/30 rounded-xl p-4">
                    <div className="text-center">
                      <p className="text-green-400/70 text-sm">עברו</p>
                      <p className="text-3xl font-bold text-green-400">{latestScan.checksPassed}</p>
                    </div>
                  </div>
                  <div className="bg-yellow-500/10 backdrop-blur border border-yellow-500/30 rounded-xl p-4">
                    <div className="text-center">
                      <p className="text-yellow-400/70 text-sm">אזהרות</p>
                      <p className="text-3xl font-bold text-yellow-400">{latestScan.checksWarnings}</p>
                    </div>
                  </div>
                  <div className="bg-red-500/10 backdrop-blur border border-red-500/30 rounded-xl p-4">
                    <div className="text-center">
                      <p className="text-red-400/70 text-sm">נכשלו</p>
                      <p className="text-3xl font-bold text-red-400">{latestScan.checksFailed}</p>
                    </div>
                  </div>
                </div>

                {/* Scan Results */}
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">תוצאות הסריקה</h3>
                  <div className="space-y-2">
                    {(Array.isArray(latestScan.results) ? latestScan.results : []).map((result, i) => {
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
                              <span className="text-white/50 text-sm">
                                {result.responseTime}ms
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                <div className="text-center py-16">
                  <Search className="w-16 h-16 mx-auto text-white/20 mb-4" />
                  <p className="text-white/60">אין דוחות סריקה</p>
                  <p className="text-white/50 text-sm mt-2">לחץ על "הפעל סריקה" להפעלת סריקת מערכת</p>
                </div>
              </div>
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
                  <div key={i} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-white/10`}>
                        <stat.icon size={20} className={stat.color} />
                      </div>
                      <div>
                        <p className="text-white/50 text-sm">{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Filters */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 mb-6">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-between w-full text-white"
              >
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-emerald-400" />
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
            </div>

            {/* Logs List */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 h-fit">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="text-emerald-400" size={20} />
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
                      const severity = severityConfig[log.severity] || defaultSeverity;
                      const category = categoryConfig[log.category] || defaultCategory;
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
                              ? 'border-emerald-500/50 bg-emerald-500/10'
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
                                <span className="text-xs text-white/50 flex items-center gap-1">
                                  <CategoryIcon size={12} />
                                  {category.label}
                                </span>
                              </div>
                              <p className="text-white font-medium truncate">{log.title}</p>
                              <p className="text-white/60 text-sm truncate">{log.message}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-white/50">
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
              </div>

              {/* Selected Log Details */}
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 h-fit sticky top-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="text-emerald-400" size={20} />
                  פרטי הלוג
                </h2>

                {selectedLog ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              (severityConfig[selectedLog.severity] || defaultSeverity).bg
                            } ${(severityConfig[selectedLog.severity] || defaultSeverity).color}`}
                          >
                            {(severityConfig[selectedLog.severity] || defaultSeverity).label}
                          </span>
                          <span className="text-white/50 text-sm">
                            {(categoryConfig[selectedLog.category] || defaultCategory).label}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white">{selectedLog.title}</h3>
                      </div>
                      {!selectedLog.resolved && (
                        <button
                          onClick={() => handleResolve(selectedLog.id)}
                          className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm flex items-center gap-2"
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
                        <pre className="mt-1 p-3 bg-black/30 rounded-lg text-white/70 text-sm overflow-x-auto">
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
                      className="w-full px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
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
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
