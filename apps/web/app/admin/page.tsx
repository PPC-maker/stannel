'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  KeyRound,
  ShoppingBag,
  Settings,
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
  DESIGNER: 'מעצב',
  SUPPLIER: 'ספק',
  ADMIN: 'מנהל',
  architect: 'אדריכל',
  designer: 'מעצב',
  supplier: 'ספק',
  admin: 'מנהל',
};

export default function AdminPage() {
  const { isReady } = useAdminGuard();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll tabs carousel every 3 seconds (RTL-aware)
  useEffect(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    const timer = setInterval(() => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      const currentScroll = Math.abs(el.scrollLeft);
      if (currentScroll >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: -120, behavior: 'smooth' });
      }
    }, 3000);
    return () => clearInterval(timer);
  }, []);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState<SystemLogStats | null>(null);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
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
  const [deletedUsers, setDeletedUsers] = useState<AdminUser[]>([]);
  const [restoringUser, setRestoringUser] = useState<string | null>(null);
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

  const fetchDeletedUsers = async () => {
    try {
      const response = await adminApi.getDeletedUsers();
      setDeletedUsers(response.data as AdminUser[]);
    } catch (error) {
      console.error('Error fetching deleted users:', error);
    }
  };

  const handleRestoreUser = async (userId: string, userName: string) => {
    const result = await Swal.fire({
      title: 'שחזור משתמש',
      text: `האם לשחזר את "${userName}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'שחזר',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#c99b4a',
      background: '#f7f3f2',
      color: '#2b241d',
    });
    if (!result.isConfirmed) return;
    setRestoringUser(userId);
    try {
      await adminApi.restoreUser(userId);
      await fetchDeletedUsers();
      await fetchAllUsers();
      Swal.fire({ title: 'שוחזר!', text: `${userName} שוחזר בהצלחה`, icon: 'success', timer: 2000, showConfirmButton: false, background: '#f7f3f2', color: '#2b241d' });
    } catch (error: any) {
      Swal.fire({ title: 'שימו לב', text: error.message, icon: 'warning', background: '#f7f3f2', color: '#2b241d' });
    } finally {
      setRestoringUser(null);
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

  // WebSocket is handled globally by useWebSocket() in client-providers.tsx
  // It already invalidates admin, invoices, and users queries on updates

  // Auto-refresh data every 30 seconds as fallback (WebSocket handles real-time)
  useEffect(() => {
    if (!isReady) return;

    const interval = setInterval(() => {
      if (activeTab === 'users') fetchAllUsers();
      if (activeTab === 'invoices') fetchInvoices();
    }, 30000);

    return () => clearInterval(interval);
  }, [isReady, activeTab]);

  // Auto-refresh recycle bin every 10 seconds
  useEffect(() => {
    if (!isReady || activeTab !== 'recycle-bin') return;

    fetchDeletedUsers();
    const interval = setInterval(() => {
      fetchDeletedInvoices();
      fetchDeletedUsers();
    }, 10000);

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
      background: '#f7f3f2',
      color: '#2b241d',
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
        background: '#f7f3f2',
        color: '#2b241d',
      });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      Swal.fire({
        title: 'שימו לב',
        text: 'לא הצלחנו למחוק את החשבונית. נסו שוב',
        icon: 'warning',
        confirmButtonText: 'אישור',
        background: '#f7f3f2',
        color: '#2b241d',
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
      background: '#f7f3f2',
      color: '#2b241d',
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
        background: '#f7f3f2',
        color: '#2b241d',
      });
    } catch (error) {
      console.error('Error bulk deleting invoices:', error);
      Swal.fire({
        title: 'שימו לב',
        text: 'לא הצלחנו למחוק את החשבוניות. נסו שוב',
        icon: 'warning',
        confirmButtonText: 'אישור',
        background: '#f7f3f2',
        color: '#2b241d',
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
        background: '#f7f3f2',
        color: '#2b241d',
      });
    } catch (error) {
      console.error('Error restoring invoice:', error);
      Swal.fire({
        title: 'שימו לב',
        text: 'לא הצלחנו לשחזר את החשבונית. נסו שוב',
        icon: 'warning',
        confirmButtonText: 'אישור',
        background: '#f7f3f2',
        color: '#2b241d',
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
      background: '#f7f3f2',
      color: '#2b241d',
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
        background: '#f7f3f2',
        color: '#2b241d',
      });
    } catch (error) {
      console.error('Error permanently deleting invoice:', error);
      Swal.fire({
        title: 'שימו לב',
        text: 'לא הצלחנו למחוק את החשבונית. נסו שוב',
        icon: 'warning',
        confirmButtonText: 'אישור',
        background: '#f7f3f2',
        color: '#2b241d',
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
      background: '#f7f3f2',
      color: '#2b241d',
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
        background: '#f7f3f2',
        color: '#2b241d',
      });
    } catch (error) {
      console.error('Error cleaning up recycle bin:', error);
      Swal.fire({
        title: 'שימו לב',
        text: 'לא הצלחנו לנקות את סל המחזור. נסו שוב',
        icon: 'warning',
        confirmButtonText: 'אישור',
        background: '#f7f3f2',
        color: '#2b241d',
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
      router.push('/wallet');
    } catch (error) {
      console.error('Error logging in as user:', error);
      Swal.fire({
        title: 'שימו לב',
        text: 'לא הצלחנו להיכנס לחשבון. נסו שוב',
        icon: 'warning',
        confirmButtonText: 'אישור',
        background: '#f7f3f2',
        color: '#2b241d',
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
      background: '#f7f3f2',
      color: '#2b241d',
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
        background: '#f7f3f2',
        color: '#2b241d',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      Swal.fire({
        title: 'שימו לב',
        text: 'לא הצלחנו למחוק את המשתמש. נסו שוב',
        icon: 'warning',
        confirmButtonText: 'אישור',
        background: '#f7f3f2',
        color: '#2b241d',
      });
    } finally {
      setDeletingUser(null);
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    const { value: newPassword } = await Swal.fire({
      title: `איפוס סיסמה - ${userName}`,
      input: 'text',
      inputLabel: 'הזן סיסמה חדשה',
      inputPlaceholder: 'סיסמה חדשה (מינימום 6 תווים)',
      showCancelButton: true,
      confirmButtonText: 'אפס סיסמה',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#c99b4a',
      background: '#f7f3f2',
      color: '#2b241d',
      inputValidator: (value) => {
        if (!value || value.length < 6) {
          return 'הסיסמה חייבת להכיל לפחות 6 תווים';
        }
        return null;
      },
    });

    if (!newPassword) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7070'}/api/v1/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await import('@stannel/api-client')).getAuthToken()}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'שגיאה באיפוס');
      }

      Swal.fire({
        title: 'הסיסמה אופסה!',
        text: `הסיסמה של ${userName} שונתה בהצלחה`,
        icon: 'success',
        confirmButtonText: 'אישור',
        background: '#f7f3f2',
        color: '#2b241d',
      });
    } catch (error: any) {
      Swal.fire({
        title: 'שימו לב',
        text: error.message || 'לא הצלחנו לאפס את הסיסמה. נסו שוב',
        icon: 'warning',
        background: '#f7f3f2',
        color: '#2b241d',
      });
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
      background: '#f7f3f2',
      color: '#2b241d',
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
        background: '#f7f3f2',
        color: '#2b241d',
      });
    } catch (error) {
      console.error('Error deactivating user:', error);
      Swal.fire({
        title: 'שימו לב',
        text: 'לא ניתן לנתק את המשתמש',
        icon: 'warning',
        background: '#f7f3f2',
        color: '#2b241d',
      });
    } finally {
      setDeactivatingUser(null);
    }
  };

  const startEditUser = (user: AdminUser) => {
    const sp = user.supplierProfile;
    setEditingUserId(user.id);
    setEditForm({
      email: user.email || '',
      newPassword: '',
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

      // Include email if changed
      const user = allUsers.find(u => u.id === userId);
      if (editForm.email && editForm.email !== user?.email) {
        data.email = editForm.email;
      }

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

      // Handle password change separately
      if (editForm.newPassword && editForm.newPassword.length >= 6) {
        const { fetchWithAuth: fetchAuth, config: apiConfig, getHeaders: getH2 } = await import('@stannel/api-client');
        await fetchAuth(`${apiConfig.baseUrl}/admin/users/${userId}/reset-password`, {
          method: 'POST',
          headers: getH2() as Record<string, string>,
          body: JSON.stringify({ newPassword: editForm.newPassword }),
        });
      }

      await fetchAllUsers();
      setEditingUserId(null);
      Swal.fire({
        title: 'נשמר!',
        text: editForm.newPassword ? 'פרטי המשתמש והסיסמה עודכנו' : 'פרטי המשתמש עודכנו',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#f7f3f2',
        color: '#2b241d',
      });
    } catch (error: any) {
      console.error('Error saving user:', error);
      const msg = error?.message || 'לא ניתן לשמור את הפרטים';
      const isDuplicate = msg.includes('כבר קיים') || msg.includes('already');
      Swal.fire({
        title: 'שימו לב',
        text: msg,
        icon: isDuplicate ? 'info' : 'warning',
        background: '#f7f3f2',
        color: '#2b241d',
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
      background: '#f7f3f2',
      color: '#2b241d',
    });
    if (!result.isConfirmed) return;

    try {
      const { fetchWithAuth: fetchAuth, config: apiConfig, getHeaders: getH2 } = await import('@stannel/api-client');
      await fetchAuth(`${apiConfig.baseUrl}/admin/users/${userId}/delete-image`, {
        method: 'POST',
        headers: getH2() as Record<string, string>,
        body: JSON.stringify({ imageUrl }),
      });

      await fetchAllUsers();
      Swal.fire({ title: 'נמחק!', icon: 'success', timer: 1500, showConfirmButton: false, background: '#f7f3f2', color: '#2b241d' });
    } catch (err) {
      console.error('Error deleting image:', err);
      Swal.fire({ title: 'שימו לב', text: 'לא ניתן למחוק את התמונה', icon: 'warning', background: '#f7f3f2', color: '#2b241d' });
    }
  };

  const handleCreateSupplier = async () => {
    // Step 1: Basic info
    const step1 = await Swal.fire({
      title: '',
      html: `
        <div style="text-align: right; direction: rtl;">
          <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 18px;">
            <div style="width: 32px; height: 4px; border-radius: 4px; background: linear-gradient(135deg, #c99b4a, #e8c97d);"></div>
            <div style="width: 32px; height: 4px; border-radius: 4px; background: #e0d5c7;"></div>
            <div style="width: 32px; height: 4px; border-radius: 4px; background: #e0d5c7;"></div>
            <div style="width: 32px; height: 4px; border-radius: 4px; background: #e0d5c7;"></div>
          </div>
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 52px; height: 52px; border-radius: 16px; background: linear-gradient(135deg, rgba(201,155,74,0.15), rgba(201,155,74,0.05)); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c99b4a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: #2b241d; margin: 0;">הוספת משתמש חדש</h2>
            <p style="font-size: 13px; color: #a89b8a; margin: 4px 0 0;">פרטים אישיים ופרטי התחברות</p>
          </div>
          <style>
            .swal-field { margin-bottom: 14px; }
            .swal-field label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #6b5e50; }
            .swal-field label span { color: #c99b4a; font-weight: 400; }
            .swal-field input, .swal-field select { width: 100%; padding: 12px 14px; border: 1.5px solid #e0d5c7; border-radius: 12px; font-size: 15px; background: #fff; color: #2b241d; transition: all 0.2s; outline: none; box-sizing: border-box; }
            .swal-field input:focus, .swal-field select:focus { border-color: #c99b4a; box-shadow: 0 0 0 3px rgba(201,155,74,0.12); }
            .swal-field input::placeholder { color: #c4b9ab; }
            .swal-field .field-status { font-size: 12px; margin-top: 4px; min-height: 16px; }
            .swal-field .field-error { color: #dc3545; }
            .swal-field .field-ok { color: #28a745; }
            .swal-field .field-checking { color: #a89b8a; }
            .swal-field input.input-error { border-color: #dc3545; background: #fff5f5; }
            .swal-field input.input-ok { border-color: #28a745; }
          </style>
          <div class="swal-field">
            <label>אימייל <span>*</span></label>
            <input id="swal-email" type="email" placeholder="email@example.com" style="text-align: left; direction: ltr;" />
            <div id="email-status" class="field-status"></div>
          </div>
          <div class="swal-field">
            <label>סיסמה <span>*</span></label>
            <input id="swal-password" type="text" placeholder="מינימום 6 תווים" style="text-align: left; direction: ltr;" />
          </div>
          <div class="swal-field">
            <label>שם איש קשר <span>*</span></label>
            <input id="swal-name" type="text" placeholder="שם מלא" />
          </div>
          <div class="swal-field">
            <label>טלפון</label>
            <input id="swal-phone" type="text" placeholder="050-0000000" style="text-align: left; direction: ltr;" />
            <div id="phone-status" class="field-status"></div>
          </div>
          <div class="swal-field">
            <label>סוג משתמש <span>*</span></label>
            <select id="swal-role">
              <option value="SUPPLIER">ספק</option>
              <option value="ARCHITECT">אדריכל</option>
              <option value="DESIGNER">מעצב</option>
            </select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'הבא &larr;',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#c99b4a',
      cancelButtonColor: '#9e9286',
      background: '#faf8f5',
      color: '#2b241d',
      width: '440px',
      customClass: { popup: 'swal-premium-popup' },
      didOpen: () => {
        const emailInput = document.getElementById('swal-email') as HTMLInputElement;
        const phoneInput = document.getElementById('swal-phone') as HTMLInputElement;
        const emailStatus = document.getElementById('email-status')!;
        const phoneStatus = document.getElementById('phone-status')!;

        let emailTimer: any = null;
        let phoneTimer: any = null;

        const checkField = async (field: 'email' | 'phone', value: string, statusEl: HTMLElement, inputEl: HTMLInputElement) => {
          if (!value) {
            statusEl.innerHTML = '';
            inputEl.classList.remove('input-error', 'input-ok');
            return;
          }
          statusEl.innerHTML = '<span class="field-checking">בודק...</span>';
          try {
            const { fetchWithAuth: fetchAuth, config: apiConfig, getHeaders: getH2 } = await import('@stannel/api-client');
            const res = await fetchAuth(`${apiConfig.baseUrl}/admin/users/check-exists`, {
              method: 'POST',
              headers: getH2() as Record<string, string>,
              body: JSON.stringify({ [field]: value }),
            });
            const data = await res.json();
            const exists = field === 'email' ? data.emailExists : data.phoneExists;
            const existingUser = field === 'email' ? data.emailUser : data.phoneUser;
            if (exists) {
              const roleLabel = existingUser?.role === 'SUPPLIER' ? 'ספק' : existingUser?.role === 'ARCHITECT' ? 'אדריכל' : existingUser?.role === 'ADMIN' ? 'מנהל' : existingUser?.role || '';
              statusEl.innerHTML = `<span class="field-error">${field === 'email' ? 'אימייל' : 'טלפון'} כבר קיים במערכת (${existingUser?.name || ''} - ${roleLabel})</span>`;
              inputEl.classList.add('input-error');
              inputEl.classList.remove('input-ok');
            } else {
              statusEl.innerHTML = `<span class="field-ok">${field === 'email' ? 'אימייל פנוי' : 'טלפון פנוי'} ✓</span>`;
              inputEl.classList.add('input-ok');
              inputEl.classList.remove('input-error');
            }
          } catch {
            statusEl.innerHTML = '';
            inputEl.classList.remove('input-error', 'input-ok');
          }
        };

        emailInput.addEventListener('input', () => {
          clearTimeout(emailTimer);
          emailTimer = setTimeout(() => {
            const val = emailInput.value.trim();
            if (val && val.includes('@')) checkField('email', val, emailStatus, emailInput);
          }, 500);
        });

        phoneInput.addEventListener('input', () => {
          clearTimeout(phoneTimer);
          phoneTimer = setTimeout(() => {
            const val = phoneInput.value.trim();
            if (val && val.length >= 9) checkField('phone', val, phoneStatus, phoneInput);
          }, 500);
        });
      },
      preConfirm: async () => {
        const email = (document.getElementById('swal-email') as HTMLInputElement)?.value?.trim();
        const password = (document.getElementById('swal-password') as HTMLInputElement)?.value;
        const name = (document.getElementById('swal-name') as HTMLInputElement)?.value?.trim();
        const phone = (document.getElementById('swal-phone') as HTMLInputElement)?.value?.trim();
        const role = (document.getElementById('swal-role') as HTMLSelectElement)?.value || 'SUPPLIER';
        const missing = [];
        if (!email) missing.push('אימייל');
        if (!password) missing.push('סיסמה');
        if (!name) missing.push('שם');
        if (missing.length > 0) {
          Swal.showValidationMessage(`חסר: ${missing.join(', ')}`);
          return false;
        }
        if (password.length < 6) {
          Swal.showValidationMessage('הסיסמה חייבת להכיל לפחות 6 תווים');
          return false;
        }
        // Final server-side check before proceeding
        try {
          const { fetchWithAuth: fetchAuth, config: apiConfig, getHeaders: getH2 } = await import('@stannel/api-client');
          const res = await fetchAuth(`${apiConfig.baseUrl}/admin/users/check-exists`, {
            method: 'POST',
            headers: getH2() as Record<string, string>,
            body: JSON.stringify({ email, phone: phone || undefined }),
          });
          const data = await res.json();
          if (data.emailExists) {
            Swal.showValidationMessage(`אימייל כבר קיים במערכת (${data.emailUser?.name || ''})`);
            return false;
          }
          if (phone && data.phoneExists) {
            Swal.showValidationMessage(`טלפון כבר קיים במערכת (${data.phoneUser?.name || ''})`);
            return false;
          }
        } catch {
          // If check fails, continue anyway - create-supplier will catch it
        }
        return { email, password, name, phone, role };
      },
    });

    if (!step1.isConfirmed || !step1.value) return;

    const isSupplierRole = step1.value.role === 'SUPPLIER';

    // For ARCHITECT/DESIGNER - skip business info and social steps, create directly
    if (!isSupplierRole) {
      try {
        Swal.fire({
          title: 'יוצר משתמש...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
          background: '#f7f3f2',
          color: '#2b241d',
        });

        await adminApi.createSupplier({
          email: step1.value.email,
          password: step1.value.password,
          name: step1.value.name,
          phone: step1.value.phone || undefined,
          role: step1.value.role,
          supplierProfile: {
            companyName: step1.value.name, // placeholder for non-suppliers
          },
        });

        await fetchAllUsers();
        Swal.fire({
          title: 'נוצר בהצלחה!',
          text: `${step1.value.role === 'ARCHITECT' ? 'אדריכל' : 'מעצב'} ${step1.value.name} נוסף למערכת`,
          icon: 'success',
          confirmButtonText: 'סגור',
          confirmButtonColor: '#c99b4a',
          background: '#f7f3f2',
          color: '#2b241d',
        });
      } catch (err: any) {
        Swal.fire({
          title: 'שימו לב',
          text: err?.message || 'משהו השתבש בתהליך היצירה',
          icon: 'warning',
          confirmButtonText: 'סגור',
          background: '#f7f3f2',
          color: '#2b241d',
        });
      }
      return;
    }

    // Step 2: Business info (SUPPLIER only)
    const step2 = await Swal.fire({
      title: '',
      html: `
        <div style="text-align: right; direction: rtl;">
          <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 18px;">
            <div style="width: 32px; height: 4px; border-radius: 4px; background: #c99b4a;"></div>
            <div style="width: 32px; height: 4px; border-radius: 4px; background: linear-gradient(135deg, #c99b4a, #e8c97d);"></div>
            <div style="width: 32px; height: 4px; border-radius: 4px; background: #e0d5c7;"></div>
            <div style="width: 32px; height: 4px; border-radius: 4px; background: #e0d5c7;"></div>
          </div>
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 52px; height: 52px; border-radius: 16px; background: linear-gradient(135deg, rgba(201,155,74,0.15), rgba(201,155,74,0.05)); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c99b4a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: #2b241d; margin: 0;">פרטי עסק</h2>
            <p style="font-size: 13px; color: #a89b8a; margin: 4px 0 0;">מידע על החברה והפעילות</p>
          </div>
          <style>
            .swal-field { margin-bottom: 14px; }
            .swal-field label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #6b5e50; }
            .swal-field label span { color: #c99b4a; font-weight: 400; }
            .swal-field input, .swal-field textarea { width: 100%; padding: 12px 14px; border: 1.5px solid #e0d5c7; border-radius: 12px; font-size: 15px; background: #fff; color: #2b241d; transition: all 0.2s; outline: none; box-sizing: border-box; font-family: inherit; }
            .swal-field input:focus, .swal-field textarea:focus { border-color: #c99b4a; box-shadow: 0 0 0 3px rgba(201,155,74,0.12); }
            .swal-field input::placeholder, .swal-field textarea::placeholder { color: #c4b9ab; }
            .swal-field textarea { min-height: 80px; resize: vertical; }
          </style>
          <div class="swal-field">
            <label>שם חברה <span>*</span></label>
            <input id="swal-companyName" type="text" placeholder="שם החברה" />
          </div>
          <div class="swal-field">
            <label>תיאור</label>
            <textarea id="swal-description" placeholder="תיאור קצר של העסק" style="direction: rtl;"></textarea>
          </div>
          <div class="swal-field">
            <label>כתובת</label>
            <input id="swal-address" type="text" placeholder="כתובת העסק" />
          </div>
          <div class="swal-field">
            <label>אתר אינטרנט</label>
            <input id="swal-website" type="text" placeholder="https://example.com" style="text-align: left; direction: ltr;" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'הבא &larr;',
      cancelButtonText: '&rarr; חזרה',
      confirmButtonColor: '#c99b4a',
      cancelButtonColor: '#9e9286',
      background: '#faf8f5',
      color: '#2b241d',
      width: '440px',
      customClass: { popup: 'swal-premium-popup' },
      preConfirm: () => {
        const companyName = (document.getElementById('swal-companyName') as HTMLInputElement)?.value?.trim();
        const description = (document.getElementById('swal-description') as HTMLTextAreaElement)?.value?.trim();
        const address = (document.getElementById('swal-address') as HTMLInputElement)?.value?.trim();
        const website = (document.getElementById('swal-website') as HTMLInputElement)?.value?.trim();
        if (!companyName) {
          Swal.showValidationMessage('שם חברה הוא שדה חובה');
          return false;
        }
        return { companyName, description, address, website };
      },
    });

    if (!step2.isConfirmed || !step2.value) return;

    // Step 3: Social + Commission
    const step3 = await Swal.fire({
      title: '',
      html: `
        <div style="text-align: right; direction: rtl;">
          <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 18px;">
            <div style="width: 32px; height: 4px; border-radius: 4px; background: #c99b4a;"></div>
            <div style="width: 32px; height: 4px; border-radius: 4px; background: #c99b4a;"></div>
            <div style="width: 32px; height: 4px; border-radius: 4px; background: linear-gradient(135deg, #c99b4a, #e8c97d);"></div>
            <div style="width: 32px; height: 4px; border-radius: 4px; background: #e0d5c7;"></div>
          </div>
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 52px; height: 52px; border-radius: 16px; background: linear-gradient(135deg, rgba(201,155,74,0.15), rgba(201,155,74,0.05)); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c99b4a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: #2b241d; margin: 0;">רשתות חברתיות ועמלה</h2>
            <p style="font-size: 13px; color: #a89b8a; margin: 4px 0 0;">קישורים לרשתות ואחוז עמלה</p>
          </div>
          <style>
            .swal-field { margin-bottom: 14px; }
            .swal-field label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #6b5e50; }
            .swal-field input { width: 100%; padding: 12px 14px; border: 1.5px solid #e0d5c7; border-radius: 12px; font-size: 15px; background: #fff; color: #2b241d; transition: all 0.2s; outline: none; box-sizing: border-box; }
            .swal-field input:focus { border-color: #c99b4a; box-shadow: 0 0 0 3px rgba(201,155,74,0.12); }
            .swal-field input::placeholder { color: #c4b9ab; }
          </style>
          <div class="swal-field">
            <label>Facebook</label>
            <input id="swal-facebook" type="text" placeholder="קישור לפייסבוק" style="text-align: left; direction: ltr;" />
          </div>
          <div class="swal-field">
            <label>Instagram</label>
            <input id="swal-instagram" type="text" placeholder="קישור לאינסטגרם" style="text-align: left; direction: ltr;" />
          </div>
          <div class="swal-field">
            <label>LinkedIn</label>
            <input id="swal-linkedin" type="text" placeholder="קישור ללינקדאין" style="text-align: left; direction: ltr;" />
          </div>
          <div class="swal-field">
            <label>אחוז עמלה</label>
            <input id="swal-commission" type="number" placeholder="4" min="0" max="100" step="0.5" style="text-align: left; direction: ltr;" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'צור משתמש &larr;',
      cancelButtonText: '&rarr; חזרה',
      confirmButtonColor: '#c99b4a',
      cancelButtonColor: '#9e9286',
      background: '#faf8f5',
      color: '#2b241d',
      width: '440px',
      customClass: { popup: 'swal-premium-popup' },
      preConfirm: () => {
        const facebook = (document.getElementById('swal-facebook') as HTMLInputElement)?.value?.trim();
        const instagram = (document.getElementById('swal-instagram') as HTMLInputElement)?.value?.trim();
        const linkedin = (document.getElementById('swal-linkedin') as HTMLInputElement)?.value?.trim();
        const commissionStr = (document.getElementById('swal-commission') as HTMLInputElement)?.value?.trim();
        const commissionRate = commissionStr ? parseFloat(commissionStr) : undefined;
        return { facebook, instagram, linkedin, commissionRate };
      },
    });

    if (!step3.isConfirmed || !step3.value) return;

    try {
      Swal.fire({
        title: 'יוצר ספק...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        background: '#f7f3f2',
        color: '#2b241d',
      });

      const newSupplier = await adminApi.createSupplier({
        email: step1.value.email,
        password: step1.value.password,
        name: step1.value.name,
        phone: step1.value.phone || undefined,
        role: step1.value.role,
        supplierProfile: {
          companyName: step2.value.companyName,
          description: step2.value.description || undefined,
          address: step2.value.address || undefined,
          website: step2.value.website || undefined,
          facebook: step3.value.facebook || undefined,
          instagram: step3.value.instagram || undefined,
          linkedin: step3.value.linkedin || undefined,
          commissionRate: step3.value.commissionRate,
        },
      });

      const supplierId = newSupplier?.id;

      await fetchAllUsers();

      // Step 4: Image upload (optional)
      if (supplierId) {
        const step4 = await Swal.fire({
          title: '',
          html: `
            <div style="text-align: right; direction: rtl;">
              <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 18px;">
                <div style="width: 32px; height: 4px; border-radius: 4px; background: #c99b4a;"></div>
                <div style="width: 32px; height: 4px; border-radius: 4px; background: #c99b4a;"></div>
                <div style="width: 32px; height: 4px; border-radius: 4px; background: #c99b4a;"></div>
                <div style="width: 32px; height: 4px; border-radius: 4px; background: linear-gradient(135deg, #c99b4a, #e8c97d);"></div>
              </div>
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="width: 52px; height: 52px; border-radius: 16px; background: linear-gradient(135deg, rgba(201,155,74,0.15), rgba(201,155,74,0.05)); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c99b4a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <h2 style="font-size: 20px; font-weight: 700; color: #2b241d; margin: 0;">העלאת תמונות</h2>
                <p style="font-size: 13px; color: #a89b8a; margin: 4px 0 0;">תמונת פרופיל ותמונות עסקיות</p>
              </div>
              <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #6b5e50;">תמונת פרופיל / לוגו</label>
                <input id="swal-profile-image" type="file" accept="image/*" style="width: 100%; padding: 12px 14px; border: 2px dashed rgba(201,155,74,0.3); border-radius: 12px; background: rgba(201,155,74,0.04); cursor: pointer; font-size: 13px; color: #8b7c69; box-sizing: border-box;" />
              </div>
              <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #6b5e50;">תמונות עסקיות (עד 10)</label>
                <input id="swal-business-images" type="file" accept="image/*" multiple style="width: 100%; padding: 12px 14px; border: 2px dashed rgba(201,155,74,0.3); border-radius: 12px; background: rgba(201,155,74,0.04); cursor: pointer; font-size: 13px; color: #8b7c69; box-sizing: border-box;" />
              </div>
              <p style="font-size: 12px; color: #a89b8a; margin-top: 8px; text-align: center;">* ניתן לדלג ולהעלות תמונות מאוחר יותר</p>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: 'העלה תמונות',
          cancelButtonText: 'דלג',
          confirmButtonColor: '#c99b4a',
          cancelButtonColor: '#9e9286',
          background: '#faf8f5',
          color: '#2b241d',
          width: '440px',
          customClass: { popup: 'swal-premium-popup' },
          preConfirm: () => {
            const profileInput = document.getElementById('swal-profile-image') as HTMLInputElement;
            const businessInput = document.getElementById('swal-business-images') as HTMLInputElement;
            const profileFile = profileInput?.files?.[0] || null;
            const businessFiles = businessInput?.files ? Array.from(businessInput.files).slice(0, 10) : [];
            if (!profileFile && businessFiles.length === 0) {
              Swal.showValidationMessage('בחרו לפחות תמונה אחת או לחצו על "דלג"');
              return false;
            }
            return { profileFile, businessFiles };
          },
        });

        if (step4.isConfirmed && step4.value) {
          Swal.fire({
            title: 'מעלה תמונות...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            background: '#f7f3f2',
            color: '#2b241d',
          });

          try {
            const { fetchWithAuth: fetchAuth, getMultipartHeaders: getMH, config: apiConfig } = await import('@stannel/api-client');

            // Upload profile image
            if (step4.value.profileFile) {
              const formData = new FormData();
              formData.append('file', step4.value.profileFile);
              await fetchAuth(`${apiConfig.baseUrl}/admin/users/${supplierId}/update-profile-image`, {
                method: 'POST',
                headers: getMH() as Record<string, string>,
                body: formData,
              });
            }

            // Upload business images
            for (const file of step4.value.businessFiles) {
              const formData = new FormData();
              formData.append('file', file);
              await fetchAuth(`${apiConfig.baseUrl}/admin/users/${supplierId}/upload-business-image`, {
                method: 'POST',
                headers: getMH() as Record<string, string>,
                body: formData,
              });
            }

            await fetchAllUsers();
          } catch (imgError) {
            console.error('Error uploading images:', imgError);
          }
        }
      }

      Swal.fire({
        title: 'הספק נוצר בהצלחה!',
        text: `${step2.value.companyName} נוסף למערכת`,
        icon: 'success',
        confirmButtonText: 'אישור',
        confirmButtonColor: '#c99b4a',
        background: '#f7f3f2',
        color: '#2b241d',
      });
    } catch (error: any) {
      console.error('Error creating supplier:', error);
      Swal.fire({
        title: 'שימו לב',
        text: error.message || 'לא הצלחנו ליצור את המשתמש. נסו שוב',
        icon: 'warning',
        confirmButtonText: 'אישור',
        background: '#f7f3f2',
        color: '#2b241d',
      });
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
        background: '#f7f3f2',
        color: '#2b241d',
      });
    } catch (error) {
      console.error('Error verifying invoice:', error);
      Swal.fire({
        title: 'שימו לב',
        text: 'לא הצלחנו לעדכן את החשבונית. נסו שוב',
        icon: 'warning',
        confirmButtonText: 'אישור',
        background: '#f7f3f2',
        color: '#2b241d',
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

  // Filter users by search and status
  const roleSearchTerms: Record<string, string[]> = {
    ADMIN: ['מנהל', 'אדמין', 'admin'],
    ARCHITECT: ['אדריכל', 'architect'],
    DESIGNER: ['מעצב', 'designer'],
    SUPPLIER: ['ספק', 'supplier'],
  };
  const filteredUsers = userSearch.trim()
    ? allUsers.filter(u => {
        const term = userSearch.trim().toLowerCase();
        const matchesRole = roleSearchTerms[u.role]?.some(label => label.includes(term));
        return u.name.toLowerCase().includes(term)
          || u.email.toLowerCase().includes(term)
          || (u.phone && u.phone.includes(term))
          || (u.company && u.company.toLowerCase().includes(term))
          || (u.supplierProfile?.companyName && u.supplierProfile.companyName.toLowerCase().includes(term))
          || matchesRole;
      })
    : allUsers;
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
      <div className="min-h-screen pt-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#c99b4a] animate-spin" />
          <p className="text-[#8b7c69]">טוען נתוני מערכת...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8">
      <div className="px-3 sm:px-6 pt-20 sm:pt-24 pb-24 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4 sm:mb-8 bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-4 sm:p-6"
        >
          <div>
            <h1 className="text-xl sm:text-3xl font-display font-bold text-[#2b241d] flex items-center gap-2 sm:gap-3">
              <Shield className="text-[#c99b4a]" size={22} />
              פאנל ניהול
            </h1>
            <p className="text-[#8b7c69] mt-1 font-medium text-xs sm:text-base">ניהול משתמשים ומעקב אחרי תקלות המערכת</p>
          </div>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="w-[90%] mx-auto mt-4 flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-[#c99b4a]/15 border border-[#c99b4a]/30 text-[#c99b4a] hover:bg-[#c99b4a]/25 transition-colors font-bold text-base"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            רענון
          </button>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <Link href="/admin/analytics" className="group">
            <div className="p-4 bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl hover:bg-[#f0ebe6] transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <BarChart3 size={20} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-[#2b241d] font-medium group-hover:text-[#c99b4a] transition-colors">אנליטיקות</p>
                  <p className="text-[#a89b8a] text-xs">דוחות וסטטיסטיקות</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/admin/architects" className="group">
            <div className="p-4 bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl hover:bg-[#f0ebe6] transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Users size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[#2b241d] font-medium group-hover:text-[#c99b4a] transition-colors">אדריכלים</p>
                  <p className="text-[#a89b8a] text-xs">ניהול אדריכלים</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/admin/orders" className="group">
            <div className="p-4 bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl hover:bg-[#f0ebe6] transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#c99b4a]/20">
                  <ShoppingBag size={20} className="text-[#c99b4a]" />
                </div>
                <div>
                  <p className="text-[#2b241d] font-medium group-hover:text-[#c99b4a] transition-colors">הזמנות הטבות</p>
                  <p className="text-[#a89b8a] text-xs">רכישות מחנות ההטבות</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/admin/service-providers" className="group">
            <div className="p-4 bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl hover:bg-[#f0ebe6] transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#c99b4a]/20">
                  <Building2 size={20} className="text-[#c99b4a]" />
                </div>
                <div>
                  <p className="text-[#2b241d] font-medium group-hover:text-[#c99b4a] transition-colors">ספקי שירות</p>
                  <p className="text-[#a89b8a] text-xs">ניהול ספקים</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/admin/goals" className="group">
            <div className="p-4 bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl hover:bg-[#f0ebe6] transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Target size={20} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-[#2b241d] font-medium group-hover:text-[#c99b4a] transition-colors">יעדים</p>
                  <p className="text-[#a89b8a] text-xs">ניהול יעדי אדריכלים ומעצבים</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/admin/contracts" className="group">
            <div className="p-4 bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl hover:bg-[#f0ebe6] transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <FileText size={20} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-[#2b241d] font-medium group-hover:text-[#c99b4a] transition-colors">חוזים</p>
                  <p className="text-[#a89b8a] text-xs">ניהול חוזי ספקים</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/admin/audit-logs" className="group">
            <div className="p-4 bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl hover:bg-[#f0ebe6] transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Clock size={20} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-[#2b241d] font-medium group-hover:text-[#c99b4a] transition-colors">יומן פעולות</p>
                  <p className="text-[#a89b8a] text-xs">מעקב פעולות מערכת</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/admin/rewards" className="group">
            <div className="p-4 bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl hover:bg-[#f0ebe6] transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Gift size={20} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-[#2b241d] font-medium group-hover:text-[#c99b4a] transition-colors">חנות הטבות</p>
                  <p className="text-[#a89b8a] text-xs">ניהול מוצרים</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/admin/events" className="group">
            <div className="p-4 bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl hover:bg-[#f0ebe6] transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/20">
                  <Calendar size={20} className="text-pink-400" />
                </div>
                <div>
                  <p className="text-[#2b241d] font-medium group-hover:text-[#c99b4a] transition-colors">אירועים</p>
                  <p className="text-[#a89b8a] text-xs">ניהול אירועים</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/admin/settings" className="group">
            <div className="p-4 bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl hover:bg-[#f0ebe6] transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#c99b4a]/20">
                  <Settings size={20} className="text-[#c99b4a]" />
                </div>
                <div>
                  <p className="text-[#2b241d] font-medium group-hover:text-[#c99b4a] transition-colors">הגדרות</p>
                  <p className="text-[#a89b8a] text-xs">וואטסאפ ויצירת קשר</p>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Tabs - Horizontal scroll on mobile */}
        <div ref={tabsScrollRef} className="flex gap-2 mb-6 overflow-x-auto -mx-2 px-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'users'
                ? 'bg-[#c99b4a] text-white'
                : 'bg-[#f7f3f2] text-[#8b7c69] hover:bg-[#f0ebe6] border border-[rgba(201,155,74,0.08)]'
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
                ? 'bg-[#c99b4a] text-white'
                : 'bg-[#f7f3f2] text-[#8b7c69] hover:bg-[#f0ebe6] border border-[rgba(201,155,74,0.08)]'
            }`}
          >
            <Receipt size={18} />
            חשבוניות
            {invoices.filter(inv => ['PENDING_ADMIN', 'PENDING_SUPPLIER_PAY', 'OVERDUE'].includes(inv.status)).length > 0 && (
              <span className="bg-red-500 text-[#2b241d] text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {invoices.filter(inv => ['PENDING_ADMIN', 'PENDING_SUPPLIER_PAY', 'OVERDUE'].includes(inv.status)).length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recycle-bin')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'recycle-bin'
                ? 'bg-[#c99b4a] text-white'
                : 'bg-[#f7f3f2] text-[#8b7c69] hover:bg-[#f0ebe6] border border-[rgba(201,155,74,0.08)]'
            }`}
          >
            <Trash size={18} />
            סל מחזור
            {deletedInvoices.length > 0 && (
              <span className="bg-red-500 text-[#2b241d] text-xs px-2 py-0.5 rounded-full">
                {deletedInvoices.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'scan'
                ? 'bg-[#c99b4a] text-white'
                : 'bg-[#f7f3f2] text-[#8b7c69] hover:bg-[#f0ebe6] border border-[rgba(201,155,74,0.08)]'
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
                ? 'bg-[#c99b4a] text-white'
                : 'bg-[#f7f3f2] text-[#8b7c69] hover:bg-[#f0ebe6] border border-[rgba(201,155,74,0.08)]'
            }`}
          >
            <FileText size={18} />
            לוגים
            {stats && stats.unresolved > 0 && (
              <span className="bg-orange-500 text-[#2b241d] text-xs px-2 py-0.5 rounded-full">
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
            <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-[#2b241d] flex items-center gap-2 mb-3">
                  <Users className="text-[#c99b4a]" />
                  ניהול משתמשים ({allUsers.length})
                  {pendingUsers.length > 0 && (
                    <span className="bg-yellow-500/20 text-yellow-400 text-sm px-2 py-0.5 rounded-full mr-2">
                      {pendingUsers.length} ממתינים
                    </span>
                  )}
                </h2>
                <div className="flex flex-col gap-2">
                  <div className="relative w-[90%] mx-auto">
                    <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89b8a]" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="חיפוש לפי שם, אימייל, טלפון, תפקיד (ספק/אדריכל)..."
                      className="w-full pr-10 pl-4 py-4 bg-white border border-[rgba(201,155,74,0.15)] rounded-xl text-[#2b241d] placeholder-[#a89b8a] focus:outline-none focus:border-[#c99b4a] transition-colors text-sm"
                    />
                  </div>
                  {pendingUsers.length > 0 && selectedUsers.size > 0 && (
                    <button
                      onClick={handleBulkApprove}
                      disabled={refreshing}
                      className="w-[90%] mx-auto px-5 py-4 bg-[#c99b4a]/15 border border-[#c99b4a]/30 text-[#c99b4a] rounded-xl hover:bg-[#c99b4a]/25 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-bold text-base"
                    >
                      <CheckCircle2 size={18} />
                      אשר נבחרים ({selectedUsers.size})
                    </button>
                  )}
                  <button
                    onClick={handleCreateSupplier}
                    className="w-[90%] mx-auto px-5 py-4 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 font-bold text-base"
                  >
                    <Building2 size={18} />
                    + הוספת משתמש חדש
                  </button>
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-20 h-20 mx-auto text-[#a89b8a]/30 mb-4" />
                  <p className="text-[#2b241d] text-xl font-medium">אין משתמשים במערכת</p>
                </div>
              ) : (
                <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(201,155,74,0.08)]">
                        <th className="py-3 px-4 text-right">
                          {pendingUsers.length > 0 && (
                            <input type="checkbox" checked={selectedUsers.size === pendingUsers.length && pendingUsers.length > 0} onChange={selectAllPendingUsers} className="w-4 h-4 rounded bg-[#f7f3f2] border-[rgba(201,155,74,0.12)] text-[#c99b4a]" />
                          )}
                        </th>
                        <th className="py-3 px-4 text-right text-[#8b7c69] font-medium">שם</th>
                        <th className="py-3 px-4 text-right text-[#8b7c69] font-medium">אימייל</th>
                        <th className="py-3 px-4 text-right text-[#8b7c69] font-medium">טלפון</th>
                        <th className="py-3 px-4 text-right text-[#8b7c69] font-medium">תפקיד</th>
                        <th className="py-3 px-4 text-right text-[#8b7c69] font-medium">סטטוס</th>
                        <th className="py-3 px-4 text-right text-[#8b7c69] font-medium">תאריך הרשמה</th>
                        <th className="py-3 px-4 text-right text-[#8b7c69] font-medium">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => {
                        const isExpanded = expandedUserId === user.id;
                        const sp = user.supplierProfile;
                        const ap = user.architectProfile;
                        const allImages = [...(user.profileImage ? [user.profileImage] : []), ...(sp?.businessImages || [])];
                        return (
                          <React.Fragment key={user.id}>
                            <tr className={`border-b border-[rgba(201,155,74,0.08)] hover:bg-[#f0ebe6] transition-colors cursor-pointer ${!user.isActive ? 'bg-yellow-500/5' : ''} ${isExpanded ? 'bg-[#f7f3f2]' : ''}`} onClick={() => setExpandedUserId(isExpanded ? null : user.id)}>
                              <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                                {!user.isActive && <input type="checkbox" checked={selectedUsers.has(user.id)} onChange={() => toggleUserSelection(user.id)} className="w-4 h-4 rounded bg-[#f7f3f2] border-[rgba(201,155,74,0.12)] text-[#c99b4a]" />}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  {user.profileImage || sp?.profileImage ? (
                                    <div className="w-10 h-10 rounded-full overflow-hidden relative flex-shrink-0"><Image src={user.profileImage || sp?.profileImage || ''} alt={user.name} fill className="object-cover" unoptimized /></div>
                                  ) : (
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${user.isActive ? 'bg-gradient-to-br from-[#c99b4a] to-[#9e7746] text-white' : 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black'}`}>{user.name.charAt(0)}</div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <span className="text-[#2b241d] font-medium">{user.name}</span>
                                    {isExpanded ? <ChevronUp size={16} className="text-[#a89b8a]" /> : <ChevronDown size={16} className="text-[#a89b8a]" />}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4"><span className="text-[#8b7c69] flex items-center gap-2"><Mail size={14} className="text-[#a89b8a]" />{user.email}</span></td>
                              <td className="py-4 px-4"><span className="text-[#8b7c69] flex items-center gap-2"><Phone size={14} className="text-[#a89b8a]" />{user.phone || '-'}</span></td>
                              <td className="py-4 px-4"><span className={`px-3 py-1 rounded-full text-sm ${user.role.toUpperCase() === 'ARCHITECT' ? 'bg-blue-500/20 text-blue-400' : user.role.toUpperCase() === 'DESIGNER' ? 'bg-teal-500/20 text-teal-400' : user.role.toUpperCase() === 'ADMIN' ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-400'}`}>{roleLabels[user.role] || roleLabels[user.role.toUpperCase()] || user.role}</span></td>
                              <td className="py-4 px-4">
                                {user.isActive ? <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400 flex items-center gap-1 w-fit"><CheckCircle size={14} />מאושר</span> : <span className="px-3 py-1 rounded-full text-sm bg-yellow-500/20 text-yellow-400 flex items-center gap-1 w-fit"><Clock size={14} />ממתין</span>}
                              </td>
                              <td className="py-4 px-4"><span className="text-[#8b7c69] flex items-center gap-2"><Calendar size={14} className="text-[#a89b8a]" />{new Date(user.createdAt).toLocaleDateString('he-IL')}</span></td>
                              <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-2">
                                  {user.isActive && user.role !== 'ADMIN' ? (
                                    <button onClick={() => handleLoginAsUser(user.id)} disabled={loggingInAs === user.id} className="px-3 py-1.5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] text-[#8b7c69] rounded-lg hover:bg-[#f0ebe6] transition-colors text-sm flex items-center gap-2 disabled:opacity-50">
                                      {loggingInAs === user.id ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}צפה בחשבון
                                    </button>
                                  ) : !user.isActive ? (
                                    <button onClick={() => handleApproveUser(user.id)} disabled={approvingUser === user.id} className="px-3 py-1.5 bg-[#c99b4a]/15 border border-[#c99b4a]/30 text-[#c99b4a] rounded-lg hover:bg-[#c99b4a]/25 transition-colors text-sm flex items-center gap-2 disabled:opacity-50">
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
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-[#f7f3f2]/50 border-b border-[rgba(201,155,74,0.08)]">
                                  <div className="p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                      <h3 className="text-[#2b241d] font-semibold text-lg">פרטי {user.name}</h3>
                                      {user.role !== 'ADMIN' && (editingUserId === user.id ? (
                                        <div className="flex items-center gap-2">
                                          <button onClick={() => handleSaveUser(user.id)} disabled={savingUser} className="px-4 py-2 bg-[#c99b4a]/15 border border-[#c99b4a]/30 text-[#c99b4a] rounded-lg text-sm flex items-center gap-2 disabled:opacity-50">{savingUser ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}שמור</button>
                                          <button onClick={() => setEditingUserId(null)} className="px-4 py-2 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] text-[#8b7c69] rounded-lg text-sm flex items-center gap-2"><X size={16} />ביטול</button>
                                        </div>
                                      ) : (
                                        <button onClick={() => startEditUser(user)} className="px-4 py-2 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] text-[#8b7c69] rounded-lg text-sm flex items-center gap-2"><Edit3 size={16} />עריכה</button>
                                      ))}
                                    </div>
                                    {/* Profile Image Change */}
                                    <div className="flex items-center gap-4 pb-4 border-b border-[rgba(201,155,74,0.08)]">
                                      <div className="relative group">
                                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[rgba(201,155,74,0.12)]">
                                          {(user.profileImage || sp?.profileImage) ? (
                                            <Image src={user.profileImage || sp?.profileImage || ''} alt={user.name} fill className="object-cover" unoptimized />
                                          ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[#c99b4a] to-[#9e7746] flex items-center justify-center text-white text-xl font-bold">{user.name.charAt(0)}</div>
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
                                              Swal.fire({ title: 'עודכן!', icon: 'success', timer: 1500, showConfirmButton: false, background: '#f7f3f2', color: '#2b241d' });
                                            } catch { Swal.fire({ title: 'שימו לב', icon: 'warning', background: '#f7f3f2', color: '#2b241d' }); }
                                          }} />
                                        </label>
                                      </div>
                                      <div>
                                        <p className="text-[#2b241d] font-semibold">{user.name}</p>
                                        <p className="text-[#a89b8a] text-xs">העבר עכבר על התמונה להחלפה</p>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-6">
                                      <div className="space-y-4">
                                        <h4 className="text-[#2b241d] font-semibold flex items-center gap-2"><Users size={16} className="text-[#c99b4a]" />פרטי משתמש</h4>
                                        {editingUserId === user.id ? (
                                          <div className="space-y-3">
                                            <div><label className="text-[#a89b8a] text-xs mb-1 block">שם</label><input value={editForm.name || ''} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" /></div>
                                            <div><label className="text-[#a89b8a] text-xs mb-1 block">אימייל</label><input type="email" value={editForm.email || ''} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" dir="ltr" /></div>
                                            <div><label className="text-[#a89b8a] text-xs mb-1 block">סיסמה חדשה</label><input type="text" value={editForm.newPassword || ''} onChange={(e) => setEditForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="השאר ריק אם אין שינוי" className="w-full px-3 py-2 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a] placeholder:text-[#c4b9ab]" dir="ltr" /></div>
                                            <div><label className="text-[#a89b8a] text-xs mb-1 block">טלפון</label><input value={editForm.phone || ''} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" dir="ltr" /></div>
                                            <div><label className="text-[#a89b8a] text-xs mb-1 block">כתובת</label><input value={editForm.address || ''} onChange={(e) => setEditForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" /></div>
                                            <div><label className="text-[#a89b8a] text-xs mb-1 block">חברה</label><input value={editForm.company || ''} onChange={(e) => setEditForm(f => ({ ...f, company: e.target.value }))} className="w-full px-3 py-2 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" /></div>
                                          </div>
                                        ) : (
                                          <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-[#8b7c69]"><span className="text-[#a89b8a] min-w-[60px]">שם:</span><span className="text-[#2b241d]">{user.name}</span></div>
                                            <div className="flex items-center gap-2 text-[#8b7c69]"><span className="text-[#a89b8a] min-w-[60px]">אימייל:</span><span className="text-[#2b241d]" dir="ltr">{user.email}</span></div>
                                            <div className="flex items-center gap-2 text-[#8b7c69]"><span className="text-[#a89b8a] min-w-[60px]">טלפון:</span><span className="text-[#2b241d]" dir="ltr">{user.phone || 'לא צוין'}</span></div>
                                            <div className="flex items-center gap-2 text-[#8b7c69]"><span className="text-[#a89b8a] min-w-[60px]">כתובת:</span><span className="text-[#2b241d]">{user.address || 'לא צוינה'}</span></div>
                                            <div className="flex items-center gap-2 text-[#8b7c69]"><span className="text-[#a89b8a] min-w-[60px]">חברה:</span><span className="text-[#2b241d]">{user.company || sp?.companyName || 'לא צוינה'}</span></div>
                                          </div>
                                        )}
                                      </div>
                                      <div className="space-y-4">
                                        <h4 className="text-[#2b241d] font-semibold flex items-center gap-2"><Calendar size={16} className="text-[#c99b4a]" />תאריכים וסטטוס</h4>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex items-center gap-2 text-[#8b7c69]"><span className="text-[#a89b8a] min-w-[80px]">נרשם:</span><span className="text-[#2b241d]">{new Date(user.createdAt).toLocaleString('he-IL')}</span></div>
                                          {user.activatedAt && <div className="flex items-center gap-2 text-[#8b7c69]"><span className="text-[#a89b8a] min-w-[80px]">אושר:</span><span className="text-[#2b241d]">{new Date(user.activatedAt).toLocaleString('he-IL')}</span></div>}
                                          {user.updatedAt && <div className="flex items-center gap-2 text-[#8b7c69]"><span className="text-[#a89b8a] min-w-[80px]">עודכן:</span><span className="text-[#2b241d]">{new Date(user.updatedAt).toLocaleString('he-IL')}</span></div>}
                                          <div className="flex items-center gap-2 text-[#8b7c69]"><span className="text-[#a89b8a] min-w-[80px]">תפקיד:</span><span className={`px-2 py-0.5 rounded-full text-xs ${user.role.toUpperCase() === 'ARCHITECT' ? 'bg-blue-500/20 text-blue-400' : user.role.toUpperCase() === 'DESIGNER' ? 'bg-teal-500/20 text-teal-400' : user.role.toUpperCase() === 'ADMIN' ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-400'}`}>{roleLabels[user.role] || roleLabels[user.role.toUpperCase()] || user.role}</span></div>
                                          <div className="flex items-center gap-2 text-[#8b7c69]"><span className="text-[#a89b8a] min-w-[80px]">מזהה:</span><span className="text-[#a89b8a] text-xs font-mono" dir="ltr">{user.id}</span></div>
                                        </div>
                                      </div>
                                      <div className="space-y-4">
                                        {user.role.toUpperCase() === 'SUPPLIER' && sp && (
                                          <>
                                            <h4 className="text-[#2b241d] font-semibold flex items-center gap-2"><Building2 size={16} className="text-purple-400" />פרופיל ספק</h4>
                                            {editingUserId === user.id ? (
                                              <div className="space-y-3">
                                                <div><label className="text-[#a89b8a] text-xs mb-1 block">שם חברה</label><input value={editForm.sp_companyName || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_companyName: e.target.value }))} className="w-full px-3 py-2 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" /></div>
                                                <div><label className="text-[#a89b8a] text-xs mb-1 block">תיאור</label><textarea value={editForm.sp_description || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_description: e.target.value }))} rows={2} className="w-full px-3 py-2 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a] resize-none" /></div>
                                                <div><label className="text-[#a89b8a] text-xs mb-1 block">טלפון</label><input value={editForm.sp_phone || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_phone: e.target.value }))} className="w-full px-3 py-2 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" dir="ltr" /></div>
                                                <div><label className="text-[#a89b8a] text-xs mb-1 block">כתובת</label><input value={editForm.sp_address || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_address: e.target.value }))} className="w-full px-3 py-2 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" /></div>
                                                <div><label className="text-[#a89b8a] text-xs mb-1 block">אתר</label><input value={editForm.sp_website || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_website: e.target.value }))} className="w-full px-3 py-2 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" dir="ltr" /></div>
                                                <div><label className="text-[#a89b8a] text-xs mb-1 block">פייסבוק</label><input value={editForm.sp_facebook || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_facebook: e.target.value }))} className="w-full px-3 py-2 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" dir="ltr" /></div>
                                                <div><label className="text-[#a89b8a] text-xs mb-1 block">אינסטגרם</label><input value={editForm.sp_instagram || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_instagram: e.target.value }))} className="w-full px-3 py-2 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" dir="ltr" /></div>
                                                <div><label className="text-[#a89b8a] text-xs mb-1 block">לינקדאין</label><input value={editForm.sp_linkedin || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_linkedin: e.target.value }))} className="w-full px-3 py-2 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" dir="ltr" /></div>
                                              </div>
                                            ) : (
                                              <div className="space-y-2 text-sm">
                                                {sp.companyName && <div className="flex items-center gap-2 text-[#8b7c69]"><span className="text-[#a89b8a]">חברה:</span><span className="text-[#2b241d]">{sp.companyName}</span></div>}
                                                {sp.phone && <div className="flex items-center gap-2 text-[#8b7c69]"><Phone size={12} className="text-[#a89b8a]" /><span className="text-[#2b241d]" dir="ltr">{sp.phone}</span></div>}
                                                {sp.address && <div className="flex items-center gap-2 text-[#8b7c69]"><MapPin size={12} className="text-[#a89b8a]" /><span className="text-[#2b241d]">{sp.address}</span></div>}
                                                {sp.website && <div className="flex items-center gap-2 text-[#8b7c69]"><Globe size={12} className="text-[#a89b8a]" /><a href={sp.website} target="_blank" rel="noopener noreferrer" className="text-[#c99b4a] hover:underline" dir="ltr">{sp.website}</a></div>}
                                                {sp.description && <div className="mt-2"><span className="text-[#a89b8a] text-xs">תיאור:</span><p className="text-[#8b7c69] mt-1">{sp.description}</p></div>}
                                                <div className="flex items-center gap-3 mt-2">
                                                  {sp.facebook && <a href={sp.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-400"><Facebook size={16} /></a>}
                                                  {sp.instagram && <a href={sp.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-400"><Instagram size={16} /></a>}
                                                  {sp.linkedin && <a href={sp.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-300"><Linkedin size={16} /></a>}
                                                </div>
                                              </div>
                                            )}
                                          </>
                                        )}
                                        {user.role.toUpperCase() === 'ARCHITECT' && ap && (
                                          <>
                                            <h4 className="text-[#2b241d] font-semibold flex items-center gap-2"><Building2 size={16} className="text-blue-400" />פרופיל אדריכל</h4>
                                            <div className="space-y-2 text-sm">
                                              {ap.licenseNumber && <div className="flex items-center gap-2 text-[#8b7c69]"><span className="text-[#a89b8a]">מס׳ רישיון:</span><span className="text-[#2b241d]">{ap.licenseNumber}</span></div>}
                                              {ap.experience && <div className="flex items-center gap-2 text-[#8b7c69]"><span className="text-[#a89b8a]">ניסיון:</span><span className="text-[#2b241d]">{ap.experience} שנים</span></div>}
                                              {ap.specialties && ap.specialties.length > 0 && <div><span className="text-[#a89b8a] text-xs">התמחויות:</span><div className="flex flex-wrap gap-1 mt-1">{ap.specialties.map((s, i) => <span key={i} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-xs">{s}</span>)}</div></div>}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    {allImages.length > 0 && (
                                      <div className="space-y-3">
                                        <h4 className="text-[#2b241d] font-semibold flex items-center gap-2"><ImageIcon size={16} className="text-[#c99b4a]" />תמונות ({allImages.length})</h4>
                                        <div className="grid grid-cols-6 gap-3">{allImages.map((img, idx) => (
                                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-[rgba(201,155,74,0.08)] hover:border-[#c99b4a]/50 transition-colors group">
                                            <a href={img} target="_blank" rel="noopener noreferrer"><Image src={img} alt={`תמונה ${idx + 1}`} fill className="object-cover group-hover:scale-105 transition-transform" unoptimized /></a>
                                            <button onClick={() => handleDeleteUserImage(user.id, img)} className="absolute top-1 left-1 p-1 bg-red-500/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" title="מחק תמונה"><Trash2 size={12} className="text-white" /></button>
                                          </div>
                                        ))}</div>
                                      </div>
                                    )}
                                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[rgba(201,155,74,0.08)]">
                                      {user.isActive && user.role !== 'ADMIN' && <button onClick={() => handleLoginAsUser(user.id)} disabled={loggingInAs === user.id} className="px-4 py-2 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] text-[#8b7c69] rounded-lg hover:bg-[#f0ebe6] transition-colors text-sm flex items-center gap-2 disabled:opacity-50">{loggingInAs === user.id ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}כניסה לחשבון</button>}
                                      {!user.isActive && <button onClick={() => handleApproveUser(user.id)} disabled={approvingUser === user.id} className="px-4 py-2 bg-[#c99b4a]/15 border border-[#c99b4a]/30 text-[#c99b4a] rounded-lg hover:bg-[#c99b4a]/25 transition-colors text-sm flex items-center gap-2 disabled:opacity-50">{approvingUser === user.id ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}אשר משתמש</button>}
                                      {user.isActive && user.role !== 'ADMIN' && <button onClick={() => handleDeactivateUser(user.id, user.name)} disabled={deactivatingUser === user.id} className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors text-sm flex items-center gap-2 disabled:opacity-50">{deactivatingUser === user.id ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}נתק משתמש</button>}
                                      {user.role !== 'ADMIN' && <button onClick={() => handleResetPassword(user.id, user.name)} className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors text-sm flex items-center gap-2"><KeyRound size={16} />איפוס סיסמה</button>}
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
                  {filteredUsers.map((user) => {
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
                        isExpanded ? 'border-[#c99b4a]/30 bg-[#f7f3f2]' : 'border-[rgba(201,155,74,0.08)] bg-[#f7f3f2]'
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
                                ? 'bg-gradient-to-br from-[#c99b4a] to-[#9e7746] text-white'
                                : 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black'
                            }`}>
                              {user.name.charAt(0)}
                            </div>
                          )}

                          {/* Name + Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[#2b241d] font-semibold">{user.name}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                user.role.toUpperCase() === 'ARCHITECT' ? 'bg-blue-500/20 text-blue-400'
                                : user.role.toUpperCase() === 'ADMIN' ? 'bg-red-500/20 text-red-400'
                                : 'bg-purple-500/20 text-purple-400'
                              }`}>{roleLabels[user.role] || roleLabels[user.role.toUpperCase()] || user.role}</span>
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
                            <p className="text-[#a89b8a] text-sm truncate mt-0.5" dir="ltr">{user.email}</p>
                          </div>

                          {/* Expand Arrow */}
                          <div className="flex-shrink-0">
                            {isExpanded ? <ChevronUp size={20} className="text-[#c99b4a]" /> : <ChevronDown size={20} className="text-[#a89b8a]" />}
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="border-t border-[rgba(201,155,74,0.08)]"
                          >
                            <div className="p-4 space-y-5">
                              {/* Edit toggle */}
                              <div className="flex items-center justify-between">
                                <h3 className="text-[#2b241d] font-semibold">פרטי {user.name}</h3>
                                {user.role !== 'ADMIN' && (
                                  editingUserId === user.id ? (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleSaveUser(user.id)}
                                        disabled={savingUser}
                                        className="px-3 py-1.5 bg-[#c99b4a]/15 border border-[#c99b4a]/30 text-[#c99b4a] rounded-lg text-sm flex items-center gap-1.5 disabled:opacity-50"
                                      >
                                        {savingUser ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                        שמור
                                      </button>
                                      <button
                                        onClick={() => setEditingUserId(null)}
                                        className="px-3 py-1.5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] text-[#8b7c69] rounded-lg text-sm flex items-center gap-1.5"
                                      >
                                        <X size={14} />
                                        ביטול
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => startEditUser(user)}
                                      className="px-3 py-1.5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] text-[#8b7c69] rounded-lg text-sm flex items-center gap-1.5"
                                    >
                                      <Edit3 size={14} />
                                      עריכה
                                    </button>
                                  )
                                )}
                              </div>

                              {/* User Basic Info */}
                              <div className="space-y-4">
                                <h4 className="text-[#2b241d] font-medium flex items-center gap-2 text-sm">
                                  <Users size={14} className="text-[#c99b4a]" />
                                  פרטי משתמש
                                </h4>
                                {editingUserId === user.id ? (
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-[#a89b8a] text-xs mb-1 block">שם</label>
                                      <input value={editForm.name || ''} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" />
                                    </div>
                                    <div>
                                      <label className="text-[#a89b8a] text-xs mb-1 block">אימייל</label>
                                      <input type="email" value={editForm.email || ''} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2.5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" dir="ltr" />
                                    </div>
                                    <div>
                                      <label className="text-[#a89b8a] text-xs mb-1 block">סיסמה חדשה</label>
                                      <input type="text" value={editForm.newPassword || ''} onChange={(e) => setEditForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="השאר ריק אם אין שינוי" className="w-full px-3 py-2.5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a] placeholder:text-[#c4b9ab]" dir="ltr" />
                                    </div>
                                    <div>
                                      <label className="text-[#a89b8a] text-xs mb-1 block">טלפון</label>
                                      <input value={editForm.phone || ''} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2.5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" dir="ltr" />
                                    </div>
                                    <div>
                                      <label className="text-[#a89b8a] text-xs mb-1 block">כתובת</label>
                                      <input value={editForm.address || ''} onChange={(e) => setEditForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2.5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" />
                                    </div>
                                    <div>
                                      <label className="text-[#a89b8a] text-xs mb-1 block">חברה</label>
                                      <input value={editForm.company || ''} onChange={(e) => setEditForm(f => ({ ...f, company: e.target.value }))} className="w-full px-3 py-2.5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-[#a89b8a]">שם:</span>
                                      <span className="text-[#2b241d]">{user.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-[#a89b8a]">אימייל:</span>
                                      <span className="text-[#2b241d] text-xs" dir="ltr">{user.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-[#a89b8a]">טלפון:</span>
                                      <span className="text-[#2b241d]" dir="ltr">{user.phone || 'לא צוין'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-[#a89b8a]">כתובת:</span>
                                      <span className="text-[#2b241d]">{user.address || 'לא צוינה'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-[#a89b8a]">חברה:</span>
                                      <span className="text-[#2b241d]">{user.company || sp?.companyName || 'לא צוינה'}</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Dates */}
                              <div className="space-y-2">
                                <h4 className="text-[#2b241d] font-medium flex items-center gap-2 text-sm">
                                  <Calendar size={14} className="text-[#c99b4a]" />
                                  תאריכים וסטטוס
                                </h4>
                                <div className="space-y-1.5 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-[#a89b8a]">נרשם:</span>
                                    <span className="text-[#2b241d] text-xs">{new Date(user.createdAt).toLocaleString('he-IL')}</span>
                                  </div>
                                  {user.activatedAt && (
                                    <div className="flex justify-between">
                                      <span className="text-[#a89b8a]">אושר:</span>
                                      <span className="text-[#2b241d] text-xs">{new Date(user.activatedAt).toLocaleString('he-IL')}</span>
                                    </div>
                                  )}
                                  {user.updatedAt && (
                                    <div className="flex justify-between">
                                      <span className="text-[#a89b8a]">עודכן:</span>
                                      <span className="text-[#2b241d] text-xs">{new Date(user.updatedAt).toLocaleString('he-IL')}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center">
                                    <span className="text-[#a89b8a]">תפקיד:</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                                      user.role.toUpperCase() === 'ARCHITECT' ? 'bg-blue-500/20 text-blue-400'
                                      : user.role.toUpperCase() === 'ADMIN' ? 'bg-red-500/20 text-red-400'
                                      : 'bg-purple-500/20 text-purple-400'
                                    }`}>{roleLabels[user.role] || roleLabels[user.role.toUpperCase()] || user.role}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#a89b8a]">מזהה:</span>
                                    <span className="text-[#a89b8a] text-[10px] font-mono break-all" dir="ltr">{user.id}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Supplier Profile */}
                              {user.role.toUpperCase() === 'SUPPLIER' && sp && (
                                <div className="space-y-3">
                                  <h4 className="text-[#2b241d] font-medium flex items-center gap-2 text-sm">
                                    <Building2 size={14} className="text-purple-400" />
                                    פרופיל ספק
                                  </h4>
                                  {editingUserId === user.id ? (
                                    <div className="space-y-3">
                                      <div>
                                        <label className="text-[#a89b8a] text-xs mb-1 block">שם חברה</label>
                                        <input value={editForm.sp_companyName || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_companyName: e.target.value }))} className="w-full px-3 py-2.5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" />
                                      </div>
                                      <div>
                                        <label className="text-[#a89b8a] text-xs mb-1 block">תיאור</label>
                                        <textarea value={editForm.sp_description || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_description: e.target.value }))} rows={2} className="w-full px-3 py-2.5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a] resize-none" />
                                      </div>
                                      <div>
                                        <label className="text-[#a89b8a] text-xs mb-1 block">טלפון ספק</label>
                                        <input value={editForm.sp_phone || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_phone: e.target.value }))} className="w-full px-3 py-2.5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" dir="ltr" />
                                      </div>
                                      <div>
                                        <label className="text-[#a89b8a] text-xs mb-1 block">כתובת ספק</label>
                                        <input value={editForm.sp_address || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_address: e.target.value }))} className="w-full px-3 py-2.5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" />
                                      </div>
                                      <div>
                                        <label className="text-[#a89b8a] text-xs mb-1 block">אתר</label>
                                        <input value={editForm.sp_website || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_website: e.target.value }))} className="w-full px-3 py-2.5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" dir="ltr" />
                                      </div>
                                      <div>
                                        <label className="text-[#a89b8a] text-xs mb-1 block">פייסבוק</label>
                                        <input value={editForm.sp_facebook || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_facebook: e.target.value }))} className="w-full px-3 py-2.5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" dir="ltr" />
                                      </div>
                                      <div>
                                        <label className="text-[#a89b8a] text-xs mb-1 block">אינסטגרם</label>
                                        <input value={editForm.sp_instagram || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_instagram: e.target.value }))} className="w-full px-3 py-2.5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" dir="ltr" />
                                      </div>
                                      <div>
                                        <label className="text-[#a89b8a] text-xs mb-1 block">לינקדאין</label>
                                        <input value={editForm.sp_linkedin || ''} onChange={(e) => setEditForm(f => ({ ...f, sp_linkedin: e.target.value }))} className="w-full px-3 py-2.5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a]" dir="ltr" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5 text-sm">
                                      {sp.companyName && <div className="flex justify-between"><span className="text-[#a89b8a]">חברה:</span><span className="text-[#2b241d]">{sp.companyName}</span></div>}
                                      {sp.phone && <div className="flex justify-between"><span className="text-[#a89b8a]">טלפון:</span><span className="text-[#2b241d]" dir="ltr">{sp.phone}</span></div>}
                                      {sp.address && <div className="flex justify-between"><span className="text-[#a89b8a]">כתובת:</span><span className="text-[#2b241d]">{sp.address}</span></div>}
                                      {sp.website && <div className="flex justify-between"><span className="text-[#a89b8a]">אתר:</span><a href={sp.website} target="_blank" rel="noopener noreferrer" className="text-[#c99b4a] hover:underline text-xs" dir="ltr">{sp.website}</a></div>}
                                      {sp.description && <div className="mt-2"><span className="text-[#a89b8a] text-xs">תיאור:</span><p className="text-[#8b7c69] mt-1 text-xs">{sp.description}</p></div>}
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
                              {user.role.toUpperCase() === 'ARCHITECT' && ap && (
                                <div className="space-y-2">
                                  <h4 className="text-[#2b241d] font-medium flex items-center gap-2 text-sm">
                                    <Building2 size={14} className="text-blue-400" />
                                    פרופיל אדריכל
                                  </h4>
                                  <div className="space-y-1.5 text-sm">
                                    {ap.licenseNumber && <div className="flex justify-between"><span className="text-[#a89b8a]">מס׳ רישיון:</span><span className="text-[#2b241d]">{ap.licenseNumber}</span></div>}
                                    {ap.experience && <div className="flex justify-between"><span className="text-[#a89b8a]">ניסיון:</span><span className="text-[#2b241d]">{ap.experience} שנים</span></div>}
                                    {ap.specialties && ap.specialties.length > 0 && (
                                      <div>
                                        <span className="text-[#a89b8a] text-xs">התמחויות:</span>
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
                                  <h4 className="text-[#2b241d] font-medium flex items-center gap-2 text-sm">
                                    <ImageIcon size={14} className="text-[#c99b4a]" />
                                    תמונות ({allImages.length})
                                  </h4>
                                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {allImages.map((img, idx) => (
                                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-[rgba(201,155,74,0.08)] hover:border-[#c99b4a]/50 transition-colors group">
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
                              <div className="flex flex-wrap gap-2 pt-3 border-t border-[rgba(201,155,74,0.08)]">
                                {user.isActive && user.role !== 'ADMIN' && (
                                  <button
                                    onClick={() => handleLoginAsUser(user.id)}
                                    disabled={loggingInAs === user.id}
                                    className="flex-1 min-w-[120px] py-2.5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] text-[#8b7c69] rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                  >
                                    {loggingInAs === user.id ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                                    כניסה לחשבון
                                  </button>
                                )}
                                {!user.isActive && (
                                  <button
                                    onClick={() => handleApproveUser(user.id)}
                                    disabled={approvingUser === user.id}
                                    className="flex-1 min-w-[120px] py-2.5 bg-[#c99b4a]/15 border border-[#c99b4a]/30 text-[#c99b4a] rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50"
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
            <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89b8a]" />
                  <input
                    type="text"
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    placeholder="חיפוש לפי שם, אימייל, ספק או סכום..."
                    className="w-full pr-10 pl-4 py-2.5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-xl text-[#2b241d] text-sm placeholder:text-[#a89b8a] focus:outline-none focus:border-[#c99b4a]"
                  />
                </div>
                <select
                  value={invoiceStatusFilter}
                  onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                  className="px-4 py-2.5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-xl text-[#2b241d] text-sm focus:outline-none focus:border-[#c99b4a] appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#f7f3f2]">כל הסטטוסים</option>
                  <option value="PENDING_ADMIN" className="bg-[#f7f3f2]">ממתין לאישור</option>
                  <option value="APPROVED" className="bg-[#f7f3f2]">מאושר</option>
                  <option value="PENDING_SUPPLIER_PAY" className="bg-[#f7f3f2]">ממתין לתשלום</option>
                  <option value="PAID" className="bg-[#f7f3f2]">שולם</option>
                  <option value="REJECTED" className="bg-[#f7f3f2]">נדחה</option>
                  <option value="OVERDUE" className="bg-[#f7f3f2]">באיחור</option>
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-[#a89b8a]">
                <span>סה"כ: {invoices.length} חשבוניות</span>
                {invoiceSearch || invoiceStatusFilter ? <span>מוצגות: {filteredInvoices.length}</span> : null}
                <span>ממתינות: {invoices.filter(inv => inv.status === 'PENDING_ADMIN').length}</span>
                <span>סה"כ מחזור: ₪{invoices.reduce((s, i) => s + i.amount, 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Architects Folders */}
              <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-3 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#2b241d] flex items-center gap-2">
                    <FolderOpen className="text-[#c99b4a]" />
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
                    <Receipt className="w-20 h-20 mx-auto text-[#a89b8a]/30 mb-4" />
                    <p className="text-[#2b241d] text-xl font-medium">אין חשבוניות במערכת</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {groupedInvoices.map((group) => {
                      const isExpanded = expandedArchitects.has(group.architectId);
                      const pendingCount = group.invoices.filter(inv => inv.status === 'PENDING_ADMIN').length;

                      return (
                        <div key={group.architectId} className="border border-[rgba(201,155,74,0.08)] rounded-lg overflow-hidden">
                          {/* Architect Folder Header */}
                          <div
                            onClick={() => toggleArchitectExpand(group.architectId)}
                            className={`p-3 sm:p-4 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between ${
                              isExpanded ? 'bg-[#c99b4a]/10 border-b border-[rgba(201,155,74,0.08)]' : 'bg-[#f7f3f2] hover:bg-[#f0ebe6]'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`p-2 rounded-lg shrink-0 ${isExpanded ? 'bg-[#c99b4a]/15' : 'bg-[#f7f3f2]'}`}>
                                <FolderOpen size={20} className={isExpanded ? 'text-[#c99b4a]' : 'text-[#8b7c69]'} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[#2b241d] font-medium truncate">{group.architectName}</p>
                                <p className="text-[#a89b8a] text-xs truncate">{group.architectEmail}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 sm:gap-4 mr-9 sm:mr-0">
                              <div className="text-left">
                                <p className="text-[#c99b4a] font-bold text-sm sm:text-base">₪{group.totalAmount.toLocaleString()}</p>
                                <p className="text-[#a89b8a] text-xs">{group.invoices.length} חשבוניות</p>
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
                                className={`text-[#a89b8a] transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                              />
                            </div>
                          </div>

                          {/* Invoices List */}
                          {isExpanded && (
                            <div className="p-2 space-y-2 bg-[#f7f3f2]/50">
                              {group.invoices.map((invoice) => {
                                const invoiceStatusConfig: Record<string, { bg: string; text: string; label: string }> = {
                                  PENDING_ADMIN: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'ממתין לאישור' },
                                  APPROVED: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'מאושר' },
                                  REJECTED: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'נדחה' },
                                  PAID: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'שולם' },
                                  PENDING_SUPPLIER_PAY: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'ממתין לתשלום' },
                                  OVERDUE: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'באיחור' },
                                };
                                const status = invoiceStatusConfig[invoice.status] || { bg: 'bg-gray-500/20', text: 'text-[#8b7c69]', label: invoice.status };
                                const hasAmountMismatch = invoice.aiExtractedAmount && invoice.aiExtractedAmount > 0 && invoice.aiStatus !== 'MATCH' && Math.abs(invoice.amount - invoice.aiExtractedAmount) > 1;
                                const isApprovedWithMismatch = hasAmountMismatch && invoice.status !== 'PENDING_ADMIN' && invoice.status !== 'REJECTED';

                                return (
                                  <div
                                    key={invoice.id}
                                    onClick={() => setSelectedInvoice(invoice)}
                                    className={`p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between ${
                                      selectedInvoice?.id === invoice.id
                                        ? 'border border-[#c99b4a]/50 bg-[#c99b4a]/10'
                                        : isApprovedWithMismatch
                                          ? 'border border-red-500/40 bg-red-500/10 hover:border-red-500/60'
                                          : 'border border-[rgba(201,155,74,0.08)] bg-[#f7f3f2] hover:border-[rgba(201,155,74,0.15)]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`p-1.5 rounded-lg ${isApprovedWithMismatch ? 'bg-red-500/20' : status.bg}`}>
                                        <Receipt size={14} className={isApprovedWithMismatch ? 'text-red-400' : status.text} />
                                      </div>
                                      <div>
                                        <p className="text-[#2b241d] font-medium text-sm">₪{invoice.amount.toLocaleString()}</p>
                                        <p className="text-[#a89b8a] text-xs">
                                          {invoice.supplier.companyName || invoice.supplier.user.name}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {isApprovedWithMismatch && (
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            const result = await Swal.fire({
                                              title: 'תיקון סכום',
                                              html: `<p>סכום נוכחי: ₪${invoice.amount.toLocaleString()}</p><p>סכום שזוהה: ₪${invoice.aiExtractedAmount!.toLocaleString()}</p>`,
                                              icon: 'question',
                                              showCancelButton: true,
                                              confirmButtonText: `תקן ל-₪${invoice.aiExtractedAmount!.toLocaleString()}`,
                                              cancelButtonText: 'ביטול',
                                              confirmButtonColor: '#f59e0b',
                                              background: '#f7f3f2',
                                              color: '#2b241d',
                                            });
                                            if (result.isConfirmed) {
                                              try {
                                                const { getHeaders: getH, fetchWithAuth: fetchAuth, config: apiConfig } = await import('@stannel/api-client');
                                                await fetchAuth(`${apiConfig.baseUrl}/admin/invoices/${invoice.id}/update-amount`, {
                                                  method: 'PATCH',
                                                  headers: getH() as Record<string, string>,
                                                  body: JSON.stringify({ amount: invoice.aiExtractedAmount }),
                                                });
                                                await fetchInvoices();
                                                Swal.fire({ title: 'תוקן!', text: `הסכום עודכן ל-₪${invoice.aiExtractedAmount?.toLocaleString()}`, icon: 'success', background: '#f7f3f2', color: '#2b241d', timer: 1500, showConfirmButton: false });
                                              } catch (err) {
                                                console.error(err);
                                                Swal.fire({ title: 'שימו לב', text: 'לא הצלחנו לתקן את הסכום. נסו שוב', icon: 'warning', background: '#f7f3f2', color: '#2b241d' });
                                              }
                                            }
                                          }}
                                          className="px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs hover:bg-red-500/30 transition-colors whitespace-nowrap"
                                          title="תקן סכום"
                                        >
                                          תקן סכום
                                        </button>
                                      )}
                                      <div className="text-left">
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${status.bg} ${status.text}`}>
                                          {status.label}
                                        </span>
                                        <p className="text-[#a89b8a] text-xs mt-1">
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
              <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6 h-fit sticky top-6">
                <h2 className="text-lg font-semibold text-[#2b241d] mb-4 flex items-center gap-2">
                  <FileText className="text-[#c99b4a]" size={20} />
                  פרטי החשבונית
                </h2>

                {selectedInvoice ? (
                  <div className="space-y-4">
                    {/* Invoice Image */}
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-[#f7f3f2]">
                      {selectedInvoice.imageUrl.toLowerCase().endsWith('.pdf') ? (
                        // PDF Display
                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                          <div className="w-16 h-20 bg-red-500/20 border-2 border-red-500/50 rounded-lg flex items-center justify-center mb-3">
                            <FileIcon size={32} className="text-red-400" />
                          </div>
                          <p className="text-[#2b241d] font-medium mb-3">קובץ PDF</p>
                          <div className="flex gap-2">
                            <a
                              href={selectedInvoice.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-[#f7f3f2] text-[#2b241d] hover:bg-[#f0ebe6] transition-colors flex items-center gap-1.5 text-sm"
                            >
                              <Eye size={14} />
                              פתח
                            </a>
                            <a
                              href={selectedInvoice.imageUrl}
                              download
                              className="px-3 py-1.5 rounded-lg bg-[#c99b4a] text-white hover:bg-[#9e7746] transition-colors flex items-center gap-1.5 text-sm"
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
                        <label className="text-[#8b7c69] text-sm">סכום</label>
                        <p className="text-2xl font-bold text-[#c99b4a]">₪{selectedInvoice.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-[#8b7c69] text-sm">סטטוס</label>
                        <p className={`font-medium ${
                          selectedInvoice.status === 'PENDING_ADMIN' ? 'text-yellow-400' :
                          selectedInvoice.status === 'APPROVED' ? 'text-green-400' :
                          selectedInvoice.status === 'REJECTED' ? 'text-red-400' : 'text-[#2b241d]'
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
                            <p className="text-[#8b7c69] text-xs mt-1">
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
                              Swal.fire({ title: 'תוקן!', text: `הסכום עודכן ל-₪${selectedInvoice.aiExtractedAmount?.toLocaleString()} והחשבונית אושרה`, icon: 'success', background: '#f7f3f2', color: '#2b241d', timer: 2000, showConfirmButton: false });
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

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[rgba(201,155,74,0.08)]">
                      <div>
                        <label className="text-[#8b7c69] text-sm">אדריכל</label>
                        <p className="text-[#2b241d] font-medium">{selectedInvoice.architect.user.name}</p>
                        <p className="text-[#a89b8a] text-xs">{selectedInvoice.architect.user.email}</p>
                      </div>
                      <div>
                        <label className="text-[#8b7c69] text-sm">ספק</label>
                        <p className="text-[#2b241d] font-medium">{selectedInvoice.supplier.companyName || selectedInvoice.supplier.user.name}</p>
                        <p className="text-[#a89b8a] text-xs">{selectedInvoice.supplier.user.email}</p>
                      </div>
                    </div>

                    {/* AI Analysis */}
                    <div className={`p-3 rounded-lg ${
                      selectedInvoice.aiStatus === 'MATCH' ? 'bg-[#c99b4a]/20 border border-[#c99b4a]/30' :
                      selectedInvoice.aiStatus === 'MISMATCH' ? 'bg-red-500/20 border border-red-500/30' :
                      'bg-yellow-500/20 border border-yellow-500/30'
                    }`}>
                      <p className="text-sm text-[#8b7c69] mb-2">ניתוח AI</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[#8b7c69] text-sm">סכום שהוצהר:</span>
                          <span className="text-[#2b241d] font-semibold">₪{selectedInvoice.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#8b7c69] text-sm">סכום שזוהה:</span>
                          <span className={selectedInvoice.aiStatus === 'MATCH' ? 'text-[#c99b4a] font-semibold' : selectedInvoice.aiStatus === 'MISMATCH' ? 'text-red-400 font-semibold' : 'text-yellow-400 font-semibold'}>
                            {selectedInvoice.aiExtractedAmount ? `₪${selectedInvoice.aiExtractedAmount.toLocaleString()}` : 'לא זוהה'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#8b7c69] text-sm">ביטחון:</span>
                          <span className="text-[#8b7c69] text-sm">{Math.round((selectedInvoice.aiConfidence || 0) * 100)}%</span>
                        </div>
                        {selectedInvoice.aiStatus && (
                          <div className="flex items-center justify-between pt-1 border-t border-[rgba(201,155,74,0.08)]">
                            <span className="text-[#8b7c69] text-sm">סטטוס:</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              selectedInvoice.aiStatus === 'MATCH' ? 'bg-[#c99b4a]/30 text-[#c99b4a]' :
                              selectedInvoice.aiStatus === 'MISMATCH' ? 'bg-red-500/30 text-red-400' :
                              'bg-yellow-500/30 text-yellow-400'
                            }`}>
                              {selectedInvoice.aiStatus === 'MATCH' ? 'תואם' : selectedInvoice.aiStatus === 'MISMATCH' ? 'לא תואם' : 'לא ברור'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[rgba(201,155,74,0.08)]">
                      <label className="text-[#8b7c69] text-sm">תאריך העלאה</label>
                      <p className="text-[#2b241d]">{new Date(selectedInvoice.createdAt).toLocaleString('he-IL')}</p>
                    </div>

                    {/* Action Buttons */}
                    {selectedInvoice.status === 'PENDING_ADMIN' && (
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={async () => {
                            const hasMismatch = selectedInvoice.aiExtractedAmount && selectedInvoice.aiExtractedAmount > 0 && selectedInvoice.aiStatus !== 'MATCH' && Math.abs(selectedInvoice.amount - selectedInvoice.aiExtractedAmount) > 1;

                            if (hasMismatch) {
                              // Step 1: Alert about approving without fix
                              const step1 = await Swal.fire({
                                title: 'אישור ללא תיקון סכום',
                                html: `<p style="margin-bottom:8px">לחצתם על אישור חשבונית ללא התיקון</p><p style="font-size:14px;opacity:0.7">סכום שהוזן: ₪${selectedInvoice.amount.toLocaleString()} | סכום שזוהה: ₪${selectedInvoice.aiExtractedAmount!.toLocaleString()}</p>`,
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonText: 'תקן סכום חשבונית',
                                cancelButtonText: 'לא',
                                confirmButtonColor: '#f59e0b',
                                cancelButtonColor: '#6b7280',
                                background: '#f7f3f2',
                                color: '#2b241d',
                                reverseButtons: true,
                              });

                              if (step1.isConfirmed) {
                                // Fix amount and approve
                                try {
                                  setProcessingInvoice(selectedInvoice.id);
                                  const { getHeaders: getH, fetchWithAuth: fetchAuth, config: apiConfig } = await import('@stannel/api-client');
                                  await fetchAuth(`${apiConfig.baseUrl}/admin/invoices/${selectedInvoice.id}/update-amount`, {
                                    method: 'PATCH',
                                    headers: getH() as Record<string, string>,
                                    body: JSON.stringify({ amount: selectedInvoice.aiExtractedAmount }),
                                  });
                                  await adminApi.verifyInvoice(selectedInvoice.id, {
                                    status: 'APPROVED',
                                    note: `סכום תוקן מ-₪${selectedInvoice.amount} ל-₪${selectedInvoice.aiExtractedAmount} לפי זיהוי AI`,
                                  });
                                  await fetchInvoices();
                                  setSelectedInvoice(null);
                                  Swal.fire({ title: 'תוקן ואושר!', text: `הסכום עודכן ל-₪${selectedInvoice.aiExtractedAmount?.toLocaleString()} והחשבונית אושרה`, icon: 'success', background: '#f7f3f2', color: '#2b241d', timer: 2000, showConfirmButton: false });
                                } catch (err) {
                                  console.error(err);
                                  Swal.fire({ title: 'שימו לב', text: 'לא הצלחנו לתקן את הסכום. נסו שוב', icon: 'warning', background: '#f7f3f2', color: '#2b241d' });
                                } finally {
                                  setProcessingInvoice(null);
                                }
                              } else if (step1.dismiss === Swal.DismissReason.cancel) {
                                // Step 2: Are you sure you want to approve with different amount?
                                const step2 = await Swal.fire({
                                  title: 'האם אתה בטוח?',
                                  text: 'האם אתה בטוח שאתה רוצה לאשר את החשבונית עם סכום שונה?',
                                  icon: 'question',
                                  showCancelButton: true,
                                  confirmButtonText: 'כן, אשר',
                                  cancelButtonText: 'לא',
                                  confirmButtonColor: '#c99b4a',
                                  cancelButtonColor: '#6b7280',
                                  background: '#f7f3f2',
                                  color: '#2b241d',
                                  reverseButtons: true,
                                });

                                if (step2.isConfirmed) {
                                  // Approve with mismatched amount
                                  handleVerifyInvoice(selectedInvoice.id, 'APPROVED', 'אושר עם סכום שונה מזיהוי AI');
                                }
                                // If cancelled - do nothing, go back
                              }
                            } else {
                              // No mismatch - approve normally
                              handleVerifyInvoice(selectedInvoice.id, 'APPROVED');
                            }
                          }}
                          disabled={processingInvoice === selectedInvoice.id}
                          className="flex-1 px-4 py-2 bg-[#c99b4a]/15 border border-[#c99b4a]/30 text-[#c99b4a] rounded-xl hover:bg-[#c99b4a]/25 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
                              background: '#f7f3f2',
                              color: '#2b241d',
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
                      <div className="p-3 rounded-lg bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)]">
                        <p className="text-sm text-[#8b7c69] mb-1 flex items-center gap-1">
                          <MessageSquare size={14} />
                          הערת מנהל
                        </p>
                        <p className="text-[#2b241d]">{selectedInvoice.adminNote}</p>
                      </div>
                    )}

                    {/* Payment Info - shown for paid invoices */}
                    {(selectedInvoice.status === 'PAID' || selectedInvoice.supplierRef || selectedInvoice.paymentProofUrl) && (
                      <div className="p-4 rounded-lg bg-[#c99b4a]/10 border border-[#c99b4a]/30">
                        <p className="text-sm text-[#c99b4a] mb-3 font-medium flex items-center gap-1">
                          <CheckCircle size={14} />
                          פרטי תשלום
                        </p>
                        {selectedInvoice.supplierRef && (
                          <div className="mb-2">
                            <label className="text-[#8b7c69] text-xs">מספר אסמכתא</label>
                            <p className="text-[#2b241d] font-mono">{selectedInvoice.supplierRef}</p>
                          </div>
                        )}
                        {selectedInvoice.paidAt && (
                          <div className="mb-2">
                            <label className="text-[#8b7c69] text-xs">תאריך תשלום</label>
                            <p className="text-[#2b241d]">{new Date(selectedInvoice.paidAt).toLocaleString('he-IL')}</p>
                          </div>
                        )}
                        {selectedInvoice.paymentProofUrl && (
                          <div className="mt-3 pt-3 border-t border-[#c99b4a]/30">
                            <label className="text-[#8b7c69] text-xs block mb-2">מסמך אישור העברה</label>
                            {selectedInvoice.paymentProofUrl.toLowerCase().endsWith('.pdf') ? (
                              <div className="flex gap-2">
                                <a
                                  href={selectedInvoice.paymentProofUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-lg bg-[#f7f3f2] text-[#2b241d] hover:bg-[#f0ebe6] transition-colors flex items-center gap-1.5 text-sm"
                                >
                                  <Eye size={14} />
                                  פתח PDF
                                </a>
                                <a
                                  href={selectedInvoice.paymentProofUrl}
                                  download
                                  className="px-3 py-1.5 rounded-lg bg-[#c99b4a] text-white hover:bg-[#c99b4a] transition-colors flex items-center gap-1.5 text-sm"
                                >
                                  <Download size={14} />
                                  הורד
                                </a>
                              </div>
                            ) : (
                              <div className="relative rounded-lg overflow-hidden bg-[#f7f3f2]">
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
                    <Receipt className="w-16 h-16 mx-auto text-[#a89b8a]/30 mb-4" />
                    <p className="text-[#a89b8a]">בחר חשבונית מהרשימה לצפייה בפרטים</p>
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
            <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#2b241d] flex items-center gap-2">
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

              <p className="text-[#a89b8a] text-sm mb-6">
                חשבוניות שנמחקו יישמרו כאן למשך 30 יום לפני מחיקה לצמיתות.
              </p>

              {deletedInvoices.length === 0 ? (
                <div className="text-center py-16">
                  <Trash className="w-20 h-20 mx-auto text-[#a89b8a]/30 mb-4" />
                  <p className="text-[#2b241d] text-xl font-medium">סל המחזור ריק</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deletedInvoices.map((invoice) => {
                    const deletedDate = invoice.deletedAt ? new Date(invoice.deletedAt) : new Date();
                    const daysUntilPermanentDelete = Math.max(0, 30 - Math.floor((Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24)));

                    return (
                      <div
                        key={invoice.id}
                        className="p-4 rounded-lg border border-[rgba(201,155,74,0.08)] bg-[#f7f3f2] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-red-500/20">
                            <Receipt size={20} className="text-red-400" />
                          </div>
                          <div>
                            <p className="text-[#2b241d] font-medium">₪{invoice.amount.toLocaleString()}</p>
                            <p className="text-[#8b7c69] text-sm">{invoice.architect.user.name}</p>
                            <p className="text-[#a89b8a] text-xs">
                              נמחק: {deletedDate.toLocaleDateString('he-IL')} •
                              <span className={daysUntilPermanentDelete <= 7 ? 'text-red-400' : 'text-[#a89b8a]'}>
                                {' '}{daysUntilPermanentDelete} ימים למחיקה לצמיתות
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 min-w-[120px]">
                          <button
                            onClick={() => handleRestoreInvoice(invoice.id)}
                            disabled={restoringInvoice === invoice.id}
                            className="w-full px-3 py-2 bg-[#c99b4a]/10 border border-[#c99b4a]/20 text-[#c99b4a] rounded-lg hover:bg-[#c99b4a]/15 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-medium"
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
                            className="w-full px-3 py-2 bg-red-50 border border-red-200 text-red-500 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-medium"
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

              {/* ── Deleted Users Section ── */}
              <div className="mt-8 pt-6 border-t border-[rgba(201,155,74,0.08)]">
                <h2 className="text-xl font-semibold text-[#2b241d] flex items-center gap-2 mb-4">
                  <Users className="text-orange-400" />
                  משתמשים שנמחקו ({deletedUsers.length})
                </h2>
                <p className="text-[#a89b8a] text-sm mb-4">
                  משתמשים שנמחקו נשמרים כאן לצמיתות. ניתן לשחזר בכל עת. החשבוניות שלהם נשמרות במערכת.
                </p>

                {deletedUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-[#a89b8a]/30 mb-2" />
                    <p className="text-[#a89b8a] text-sm">אין משתמשים מחוקים</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deletedUsers.map((user) => {
                      const deletedDate = (user as any).deletedAt ? new Date((user as any).deletedAt) : new Date();
                      return (
                        <div key={user.id} className="p-4 rounded-lg border border-[rgba(201,155,74,0.08)] bg-[#f7f3f2] flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-orange-500/20">
                              {user.role.toUpperCase() === 'SUPPLIER' ? <Building2 size={20} className="text-orange-400" /> : <Users size={20} className="text-orange-400" />}
                            </div>
                            <div>
                              <p className="text-[#2b241d] font-medium">{user.name}</p>
                              <p className="text-[#8b7c69] text-sm">{user.email}</p>
                              <p className="text-[#a89b8a] text-xs">
                                {user.role.toUpperCase() === 'SUPPLIER' ? 'ספק' : user.role.toUpperCase() === 'ARCHITECT' ? 'אדריכל' : user.role} •
                                נמחק: {deletedDate.toLocaleDateString('he-IL')}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRestoreUser(user.id, user.name)}
                            disabled={restoringUser === user.id}
                            className="px-4 py-2 bg-[#c99b4a]/20 border border-[#c99b4a]/30 text-[#c99b4a] rounded-lg hover:bg-[#c99b4a]/30 transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            {restoringUser === user.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <RotateCcw size={16} />
                            )}
                            שחזר
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
                className="px-4 py-2 bg-[#c99b4a]/15 border border-[#c99b4a]/30 text-[#c99b4a] rounded-xl hover:bg-[#c99b4a]/25 transition-colors flex items-center gap-2"
              >
                <Search size={18} className={refreshing ? 'animate-spin' : ''} />
                הפעל סריקה
              </button>
              {latestScan?.claudeFormat && (
                <button
                  onClick={handleCopyScanReport}
                  className="px-4 py-2 bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] text-[#8b7c69] rounded-xl hover:bg-[#f0ebe6] transition-colors flex items-center gap-2"
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
                  className={`mb-6 bg-[#f7f3f2] border rounded-2xl p-6 ${
                    latestScan.isHealthy
                      ? 'border-[#c99b4a]/30'
                      : 'border-red-500/30'
                  }`}
                >
                  <div className="text-center py-4">
                    <div
                      className={`text-4xl mb-2 ${
                        latestScan.isHealthy ? 'text-[#c99b4a]' : 'text-red-400'
                      }`}
                    >
                      {latestScan.isHealthy ? '✅' : '⚠️'}
                    </div>
                    <h2
                      className={`text-2xl font-bold ${
                        latestScan.isHealthy ? 'text-[#c99b4a]' : 'text-red-400'
                      }`}
                    >
                      {latestScan.isHealthy ? 'דוח סטטוס מערכת' : 'התראת מערכת'}
                    </h2>
                    <p className="text-[#8b7c69] mt-2">
                      זמן: {new Date(latestScan.createdAt).toLocaleString('he-IL')}
                    </p>
                  </div>
                </div>

                {/* Scan Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl p-4">
                    <div className="text-center">
                      <p className="text-[#a89b8a] text-sm">בדיקות</p>
                      <p className="text-3xl font-bold text-[#2b241d]">{latestScan.checksRun}</p>
                    </div>
                  </div>
                  <div className="bg-[#c99b4a]/10 backdrop-blur border border-[#c99b4a]/30 rounded-xl p-4">
                    <div className="text-center">
                      <p className="text-[#c99b4a]/70 text-sm">עברו</p>
                      <p className="text-3xl font-bold text-[#c99b4a]">{latestScan.checksPassed}</p>
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
                <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-[#2b241d] mb-4">תוצאות הסריקה</h3>
                  <div className="space-y-2">
                    {(Array.isArray(latestScan.results) ? latestScan.results : []).map((result, i) => {
                      const statusConfig = {
                        ok: { bg: 'bg-[#c99b4a]/20', border: 'border-[#c99b4a]/30', icon: '✅' },
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
                                <p className="text-[#2b241d] font-medium">{result.name}</p>
                                <p className="text-[#8b7c69] text-sm">{result.message}</p>
                              </div>
                            </div>
                            {result.responseTime && (
                              <span className="text-[#a89b8a] text-sm">
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
              <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
                <div className="text-center py-16">
                  <Search className="w-16 h-16 mx-auto text-[#a89b8a]/30 mb-4" />
                  <p className="text-[#8b7c69]">אין דוחות סריקה</p>
                  <p className="text-[#a89b8a] text-sm mt-2">לחץ על "הפעל סריקה" להפעלת סריקת מערכת</p>
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
                  <div key={i} className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-[#f7f3f2]`}>
                        <stat.icon size={20} className={stat.color} />
                      </div>
                      <div>
                        <p className="text-[#a89b8a] text-sm">{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Filters */}
            <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6 mb-6">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-between w-full text-[#2b241d]"
              >
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-[#c99b4a]" />
                  <span className="font-medium">סינון תוצאות</span>
                </div>
                {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {showFilters && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[rgba(201,155,74,0.08)]">
                  <div>
                    <label className="text-[#8b7c69] text-sm mb-2 block">חומרה</label>
                    <select
                      value={filter.severity || ''}
                      onChange={(e) =>
                        setFilter((f) => ({
                          ...f,
                          severity: e.target.value ? (e.target.value as SystemLogSeverity) : undefined,
                        }))
                      }
                      className="w-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg px-4 py-2 text-[#2b241d]"
                    >
                      <option value="">הכל</option>
                      <option value="CRITICAL">קריטי</option>
                      <option value="ERROR">שגיאה</option>
                      <option value="WARNING">אזהרה</option>
                      <option value="INFO">מידע</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[#8b7c69] text-sm mb-2 block">קטגוריה</label>
                    <select
                      value={filter.category || ''}
                      onChange={(e) =>
                        setFilter((f) => ({
                          ...f,
                          category: e.target.value ? (e.target.value as SystemLogCategory) : undefined,
                        }))
                      }
                      className="w-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg px-4 py-2 text-[#2b241d]"
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
                    <label className="text-[#8b7c69] text-sm mb-2 block">סטטוס</label>
                    <select
                      value={filter.resolved === undefined ? '' : filter.resolved.toString()}
                      onChange={(e) =>
                        setFilter((f) => ({
                          ...f,
                          resolved: e.target.value === '' ? undefined : e.target.value === 'true',
                        }))
                      }
                      className="w-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-lg px-4 py-2 text-[#2b241d]"
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
              <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6 h-fit">
                <h2 className="text-lg font-semibold text-[#2b241d] mb-4 flex items-center gap-2">
                  <AlertCircle className="text-[#c99b4a]" size={20} />
                  לוגים ({logs.length})
                </h2>

                <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {logs.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 mx-auto text-[#c99b4a] mb-4" />
                      <p className="text-[#2b241d] font-medium">אין תקלות פתוחות</p>
                      <p className="text-[#8b7c69] text-sm">המערכת תקינה</p>
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
                              ? 'border-[#c99b4a]/50 bg-[#c99b4a]/10'
                              : 'border-[rgba(201,155,74,0.08)] bg-[#f7f3f2] hover:border-[rgba(201,155,74,0.15)]'
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
                                <span className="text-xs text-[#a89b8a] flex items-center gap-1">
                                  <CategoryIcon size={12} />
                                  {category.label}
                                </span>
                              </div>
                              <p className="text-[#2b241d] font-medium truncate">{log.title}</p>
                              <p className="text-[#8b7c69] text-sm truncate">{log.message}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-[#a89b8a]">
                                <span>{new Date(log.createdAt).toLocaleString('he-IL')}</span>
                                {log.resolved && (
                                  <span className="text-[#c99b4a] flex items-center gap-1">
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
              <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6 h-fit sticky top-6">
                <h2 className="text-lg font-semibold text-[#2b241d] mb-4 flex items-center gap-2">
                  <FileText className="text-[#c99b4a]" size={20} />
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
                          <span className="text-[#a89b8a] text-sm">
                            {(categoryConfig[selectedLog.category] || defaultCategory).label}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-[#2b241d]">{selectedLog.title}</h3>
                      </div>
                      {!selectedLog.resolved && (
                        <button
                          onClick={() => handleResolve(selectedLog.id)}
                          className="px-3 py-1.5 bg-[#c99b4a]/20 border border-[#c99b4a]/30 text-[#c99b4a] rounded-lg hover:bg-[#c99b4a]/30 transition-colors text-sm flex items-center gap-2"
                        >
                          <CheckCircle size={16} />
                          סמן כטופל
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="text-[#8b7c69] text-sm">הודעה</label>
                      <p className="text-[#2b241d] mt-1">{selectedLog.message}</p>
                    </div>

                    {selectedLog.details && (
                      <div>
                        <label className="text-[#8b7c69] text-sm">פרטים נוספים</label>
                        <pre className="mt-1 p-3 bg-[#f7f3f2] rounded-lg text-[#8b7c69] text-sm overflow-x-auto">
                          {selectedLog.details}
                        </pre>
                      </div>
                    )}

                    {selectedLog.stackTrace && (
                      <div>
                        <label className="text-[#8b7c69] text-sm">Stack Trace</label>
                        <pre className="mt-1 p-3 bg-[#f7f3f2] rounded-lg text-red-400/80 text-xs overflow-x-auto max-h-48">
                          {selectedLog.stackTrace}
                        </pre>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[rgba(201,155,74,0.08)]">
                      <div>
                        <label className="text-[#8b7c69] text-sm">Endpoint</label>
                        <p className="text-[#2b241d] font-mono text-sm">{selectedLog.endpoint || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-[#8b7c69] text-sm">Response Time</label>
                        <p className="text-[#2b241d] font-mono text-sm">
                          {selectedLog.responseTime ? `${selectedLog.responseTime}ms` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-[#8b7c69] text-sm">תאריך יצירה</label>
                        <p className="text-[#2b241d] text-sm">
                          {new Date(selectedLog.createdAt).toLocaleString('he-IL')}
                        </p>
                      </div>
                      <div>
                        <label className="text-[#8b7c69] text-sm">ID</label>
                        <p className="text-[#2b241d] font-mono text-xs">{selectedLog.id}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopyToClipboard(selectedLog)}
                      className="w-full px-4 py-2 bg-[#c99b4a]/15 border border-[#c99b4a]/30 text-[#c99b4a] rounded-xl hover:bg-[#c99b4a]/25 transition-colors flex items-center justify-center gap-2"
                    >
                      <Copy size={18} />
                      {copiedId === selectedLog.id ? 'הועתק!' : 'העתק ל-Claude'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 mx-auto text-[#a89b8a]/30 mb-4" />
                    <p className="text-[#a89b8a]">בחר לוג מהרשימה לצפייה בפרטים</p>
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
