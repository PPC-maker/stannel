'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  MessageCircle,
  Settings,
  Power,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Activity,
  Lock,
  Send,
  ChevronRight,
} from 'lucide-react';
import Swal from 'sweetalert2';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GuardianStatus {
  active: boolean;
  lastScanAt: string | null;
  scanInterval: number;
  maintenanceMode: boolean;
}

interface GuardianStats {
  totalIssues: number;
  autoFixed: number;
  pendingApproval: number;
}

interface GuardianLog {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  status: 'open' | 'resolved' | 'dismissed' | 'pending';
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  role: 'bot' | 'admin';
  text: string;
  createdAt: string;
}

interface GuardianSettings {
  active: boolean;
  scanInterval: number;
  maintenanceMode: boolean;
  adminEmail: string;
}

type TabType = 'dashboard' | 'chat' | 'settings' | 'logs';

// ─── Constants ───────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.stannelclub.co.il';
const SESSION_KEY = 'guardian_password';
const CHAT_REFRESH_INTERVAL = 5000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'bg-red-600 text-white';
    case 'error': return 'bg-red-500/80 text-white';
    case 'warning': return 'bg-yellow-500/80 text-black';
    case 'info':
    default: return 'bg-blue-500/60 text-white';
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'resolved': return 'bg-green-500/70 text-white';
    case 'dismissed': return 'bg-gray-500/70 text-white';
    case 'pending': return 'bg-yellow-500/70 text-black';
    case 'open':
    default: return 'bg-red-500/60 text-white';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'resolved': return 'טופל';
    case 'dismissed': return 'נדחה';
    case 'pending': return 'ממתין';
    case 'open':
    default: return 'פתוח';
  }
}

function severityLabel(severity: string): string {
  switch (severity) {
    case 'critical': return 'קריטי';
    case 'error': return 'שגיאה';
    case 'warning': return 'אזהרה';
    case 'info':
    default: return 'מידע';
  }
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'עכשיו';
  if (diffMin < 60) return `לפני ${diffMin} דקות`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `לפני ${diffHr} שעות`;
  const diffDay = Math.floor(diffHr / 24);
  return `לפני ${diffDay} ימים`;
}

// ─── API Client ──────────────────────────────────────────────────────────────

function guardianFetch(path: string, password: string, options?: RequestInit) {
  return fetch(`${API_URL}/api/v1/guardian${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-guardian-password': password,
      ...(options?.headers || {}),
    },
  });
}

async function apiGetStatus(pw: string): Promise<GuardianStatus> {
  const res = await guardianFetch('/status', pw);
  if (!res.ok) throw new Error('Failed to fetch status');
  const data = await res.json();
  return data.data || data;
}

async function apiGetStats(pw: string): Promise<GuardianStats> {
  const res = await guardianFetch('/stats', pw);
  if (!res.ok) throw new Error('Failed to fetch stats');
  const data = await res.json();
  return data.data || data;
}

async function apiGetLogs(pw: string, filters?: { severity?: string; status?: string }): Promise<GuardianLog[]> {
  const params = new URLSearchParams();
  if (filters?.severity) params.set('severity', filters.severity);
  if (filters?.status) params.set('status', filters.status);
  const qs = params.toString();
  const res = await guardianFetch(`/logs${qs ? `?${qs}` : ''}`, pw);
  if (!res.ok) throw new Error('Failed to fetch logs');
  const data = await res.json();
  return data.data || data.logs || [];
}

async function apiRunScan(pw: string): Promise<void> {
  const res = await guardianFetch('/scan', pw, { method: 'POST' });
  if (!res.ok) throw new Error('Scan failed');
}

async function apiToggleGuardian(pw: string, active: boolean): Promise<void> {
  const res = await guardianFetch('/toggle', pw, {
    method: 'POST',
    body: JSON.stringify({ active }),
  });
  if (!res.ok) throw new Error('Toggle failed');
}

async function apiGetChat(pw: string, logId?: string): Promise<ChatMessage[]> {
  const path = logId ? `/chat/${logId}` : '/chat';
  const res = await guardianFetch(path, pw);
  if (!res.ok) throw new Error('Failed to fetch chat');
  const data = await res.json();
  return data.data || data.messages || [];
}

async function apiSendChat(pw: string, text: string, logId?: string): Promise<ChatMessage> {
  const path = logId ? `/chat/${logId}` : '/chat';
  const res = await guardianFetch(path, pw, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  const data = await res.json();
  return data.data || data.message || data;
}

async function apiApproveLog(pw: string, logId: string): Promise<void> {
  const res = await guardianFetch(`/logs/${logId}/approve`, pw, { method: 'POST' });
  if (!res.ok) throw new Error('Approve failed');
}

async function apiDismissLog(pw: string, logId: string): Promise<void> {
  const res = await guardianFetch(`/logs/${logId}/dismiss`, pw, { method: 'POST' });
  if (!res.ok) throw new Error('Dismiss failed');
}

async function apiGetSettings(pw: string): Promise<GuardianSettings> {
  const res = await guardianFetch('/settings', pw);
  if (!res.ok) throw new Error('Failed to fetch settings');
  const data = await res.json();
  return data.data || data;
}

async function apiUpdateSettings(pw: string, settings: Partial<GuardianSettings>): Promise<void> {
  const res = await guardianFetch('/settings', pw, {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update settings');
}

async function apiChangePassword(pw: string, newPassword: string): Promise<void> {
  const res = await guardianFetch('/change-password', pw, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  });
  if (!res.ok) throw new Error('Failed to change password');
}

async function apiVerifyPassword(pw: string): Promise<boolean> {
  try {
    const res = await guardianFetch('/status', pw);
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function GuardianPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Auth state
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Dashboard state
  const [status, setStatus] = useState<GuardianStatus | null>(null);
  const [stats, setStats] = useState<GuardianStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<GuardianLog[]>([]);
  const [dashLoading, setDashLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | undefined>(undefined);
  const [activeTicketLog, setActiveTicketLog] = useState<GuardianLog | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null!);
  const chatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Settings state
  const [settings, setSettingsState] = useState<GuardianSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Logs state
  const [allLogs, setAllLogs] = useState<GuardianLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logSeverityFilter, setLogSeverityFilter] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState('');

  // Get stored password
  const getPassword = useCallback((): string => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(SESSION_KEY) || '';
    }
    return '';
  }, []);

  // ─── Auth ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      apiVerifyPassword(stored).then((valid) => {
        if (valid) {
          setAuthenticated(true);
          setPassword(stored);
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
        setAuthLoading(false);
      });
    } else {
      setAuthLoading(false);
    }
  }, []);

  // Handle URL ticket param
  useEffect(() => {
    if (authenticated) {
      const ticketId = searchParams.get('ticket');
      if (ticketId) {
        setActiveTicketId(ticketId);
        setActiveTab('chat');
      }
    }
  }, [authenticated, searchParams]);

  const handleLogin = async () => {
    if (!password.trim()) return;
    setAuthLoading(true);
    setAuthError('');
    const valid = await apiVerifyPassword(password);
    if (valid) {
      sessionStorage.setItem(SESSION_KEY, password);
      setAuthenticated(true);
    } else {
      setAuthError('סיסמה שגויה');
    }
    setAuthLoading(false);
  };

  // ─── Dashboard Data ──────────────────────────────────────────────────────

  const loadDashboard = useCallback(async () => {
    const pw = getPassword();
    if (!pw) return;
    setDashLoading(true);
    try {
      const [st, stats_, logs_] = await Promise.all([
        apiGetStatus(pw),
        apiGetStats(pw),
        apiGetLogs(pw),
      ]);
      setStatus(st);
      setStats(stats_);
      setRecentLogs(logs_.slice(0, 8));
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setDashLoading(false);
    }
  }, [getPassword]);

  useEffect(() => {
    if (authenticated && activeTab === 'dashboard') {
      loadDashboard();
    }
  }, [authenticated, activeTab, loadDashboard]);

  // ─── Chat Data ───────────────────────────────────────────────────────────

  const loadChat = useCallback(async () => {
    const pw = getPassword();
    if (!pw) return;
    setChatLoading(true);
    try {
      const msgs = await apiGetChat(pw, activeTicketId);
      setChatMessages(msgs);
    } catch (err) {
      console.error('Chat load error:', err);
    } finally {
      setChatLoading(false);
    }
  }, [getPassword, activeTicketId]);

  const loadTicketLog = useCallback(async () => {
    if (!activeTicketId) {
      setActiveTicketLog(null);
      return;
    }
    const pw = getPassword();
    if (!pw) return;
    try {
      const logs = await apiGetLogs(pw);
      const found = logs.find((l) => l.id === activeTicketId);
      setActiveTicketLog(found || null);
    } catch {
      // ignore
    }
  }, [getPassword, activeTicketId]);

  useEffect(() => {
    if (authenticated && activeTab === 'chat') {
      loadChat();
      loadTicketLog();
      // Auto-refresh
      chatIntervalRef.current = setInterval(() => {
        loadChat();
      }, CHAT_REFRESH_INTERVAL);
      return () => {
        if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
      };
    }
    return () => {
      if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
    };
  }, [authenticated, activeTab, loadChat, loadTicketLog]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatSending) return;
    const pw = getPassword();
    if (!pw) return;
    setChatSending(true);
    try {
      const newMsg = await apiSendChat(pw, text, activeTicketId);
      setChatMessages((prev) => [...prev, newMsg]);
      setChatInput('');
    } catch (err) {
      console.error('Send error:', err);
      Swal.fire({ icon: 'error', title: 'שגיאה', text: 'שליחת ההודעה נכשלה', background: '#0d1b2a', color: '#fff' });
    } finally {
      setChatSending(false);
    }
  };

  const handleApproveLog = async (logId: string) => {
    const pw = getPassword();
    if (!pw) return;
    const result = await Swal.fire({
      title: 'אישור טיפול',
      text: 'לאשר שהבעיה טופלה?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'אשר',
      cancelButtonText: 'ביטול',
      background: '#0d1b2a',
      color: '#fff',
      confirmButtonColor: '#d4af37',
    });
    if (!result.isConfirmed) return;
    try {
      await apiApproveLog(pw, logId);
      await loadChat();
      await loadTicketLog();
      Swal.fire({ icon: 'success', title: 'אושר', timer: 1500, showConfirmButton: false, background: '#0d1b2a', color: '#fff' });
    } catch {
      Swal.fire({ icon: 'error', title: 'שגיאה', text: 'האישור נכשל', background: '#0d1b2a', color: '#fff' });
    }
  };

  const handleDismissLog = async (logId: string) => {
    const pw = getPassword();
    if (!pw) return;
    const result = await Swal.fire({
      title: 'דחיית התראה',
      text: 'לדחות את ההתראה?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'דחה',
      cancelButtonText: 'ביטול',
      background: '#0d1b2a',
      color: '#fff',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;
    try {
      await apiDismissLog(pw, logId);
      await loadChat();
      await loadTicketLog();
      Swal.fire({ icon: 'success', title: 'נדחה', timer: 1500, showConfirmButton: false, background: '#0d1b2a', color: '#fff' });
    } catch {
      Swal.fire({ icon: 'error', title: 'שגיאה', text: 'הדחייה נכשלה', background: '#0d1b2a', color: '#fff' });
    }
  };

  // ─── Scan ────────────────────────────────────────────────────────────────

  const handleRunScan = async () => {
    const pw = getPassword();
    if (!pw) return;
    setScanLoading(true);
    try {
      await apiRunScan(pw);
      Swal.fire({ icon: 'success', title: 'סריקה הושלמה', timer: 2000, showConfirmButton: false, background: '#0d1b2a', color: '#fff' });
      await loadDashboard();
    } catch {
      Swal.fire({ icon: 'error', title: 'שגיאה', text: 'הסריקה נכשלה', background: '#0d1b2a', color: '#fff' });
    } finally {
      setScanLoading(false);
    }
  };

  // ─── Settings Data ───────────────────────────────────────────────────────

  const loadSettings = useCallback(async () => {
    const pw = getPassword();
    if (!pw) return;
    setSettingsLoading(true);
    try {
      const s = await apiGetSettings(pw);
      setSettingsState(s);
    } catch (err) {
      console.error('Settings load error:', err);
    } finally {
      setSettingsLoading(false);
    }
  }, [getPassword]);

  useEffect(() => {
    if (authenticated && activeTab === 'settings') {
      loadSettings();
    }
  }, [authenticated, activeTab, loadSettings]);

  const handleUpdateSetting = async (key: keyof GuardianSettings, value: unknown) => {
    const pw = getPassword();
    if (!pw) return;
    try {
      await apiUpdateSettings(pw, { [key]: value });
      await loadSettings();
      Swal.fire({ icon: 'success', title: 'עודכן', timer: 1200, showConfirmButton: false, background: '#0d1b2a', color: '#fff' });
    } catch {
      Swal.fire({ icon: 'error', title: 'שגיאה', text: 'העדכון נכשל', background: '#0d1b2a', color: '#fff' });
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Swal.fire({ icon: 'warning', title: 'שגיאה', text: 'סיסמה חייבת להכיל לפחות 6 תווים', background: '#0d1b2a', color: '#fff' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Swal.fire({ icon: 'warning', title: 'שגיאה', text: 'הסיסמאות לא תואמות', background: '#0d1b2a', color: '#fff' });
      return;
    }
    const pw = getPassword();
    if (!pw) return;
    try {
      await apiChangePassword(pw, newPassword);
      sessionStorage.setItem(SESSION_KEY, newPassword);
      setPassword(newPassword);
      setNewPassword('');
      setConfirmNewPassword('');
      Swal.fire({ icon: 'success', title: 'הסיסמה שונתה', timer: 1500, showConfirmButton: false, background: '#0d1b2a', color: '#fff' });
    } catch {
      Swal.fire({ icon: 'error', title: 'שגיאה', text: 'שינוי הסיסמה נכשל', background: '#0d1b2a', color: '#fff' });
    }
  };

  // ─── Logs Data ───────────────────────────────────────────────────────────

  const loadAllLogs = useCallback(async () => {
    const pw = getPassword();
    if (!pw) return;
    setLogsLoading(true);
    try {
      const logs = await apiGetLogs(pw, {
        severity: logSeverityFilter || undefined,
        status: logStatusFilter || undefined,
      });
      setAllLogs(logs);
    } catch (err) {
      console.error('Logs load error:', err);
    } finally {
      setLogsLoading(false);
    }
  }, [getPassword, logSeverityFilter, logStatusFilter]);

  useEffect(() => {
    if (authenticated && activeTab === 'logs') {
      loadAllLogs();
    }
  }, [authenticated, activeTab, loadAllLogs]);

  // ─── Open ticket in chat ─────────────────────────────────────────────────

  const openTicket = (logId: string) => {
    setActiveTicketId(logId);
    setActiveTab('chat');
  };

  const openGeneralChat = () => {
    setActiveTicketId(undefined);
    setActiveTicketLog(null);
    setActiveTab('chat');
  };

  // ─── Toggle Guardian ─────────────────────────────────────────────────────

  const handleToggleGuardian = async () => {
    if (!status) return;
    const pw = getPassword();
    if (!pw) return;
    const newActive = !status.active;
    try {
      await apiToggleGuardian(pw, newActive);
      setStatus((prev) => prev ? { ...prev, active: newActive } : prev);
      Swal.fire({
        icon: 'success',
        title: newActive ? 'Guardian הופעל' : 'Guardian כובה',
        timer: 1500,
        showConfirmButton: false,
        background: '#0d1b2a',
        color: '#fff',
      });
    } catch {
      Swal.fire({ icon: 'error', title: 'שגיאה', background: '#0d1b2a', color: '#fff' });
    }
  };

  // ─── Render: Login Screen ────────────────────────────────────────────────

  if (authLoading && !authenticated) {
    return (
      <div dir="rtl" lang="he" className="min-h-screen flex items-center justify-center" style={{ background: '#060f1f' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Shield className="w-12 h-12 text-[#d4af37]" />
        </motion.div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div dir="rtl" lang="he" className="min-h-screen flex items-center justify-center p-4" style={{ background: '#060f1f' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div
            className="rounded-2xl p-6 backdrop-blur-[20px]"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(212,175,55,0.15)', border: '2px solid #d4af37' }}>
                <Shield className="w-8 h-8 text-[#d4af37]" />
              </div>
              <h1 className="text-xl font-bold text-white">Guardian Bot</h1>
              <p className="text-sm text-gray-400 mt-1">לוח בקרה מאובטח</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="הזן סיסמה"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full pr-11 pl-4 py-3 rounded-xl bg-white/5 text-white placeholder-gray-500 outline-none transition-all focus:ring-2"
                  style={{ border: '1px solid #d4af37' }}
                  autoFocus
                />
              </div>

              {authError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm text-center"
                >
                  {authError}
                </motion.p>
              )}

              <button
                onClick={handleLogin}
                disabled={authLoading}
                className="w-full py-3 rounded-xl font-bold text-black transition-all active:scale-95 disabled:opacity-50"
                style={{ background: '#d4af37' }}
              >
                {authLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'כניסה'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Render: Main App ────────────────────────────────────────────────────

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'ראשי', icon: <Activity className="w-5 h-5" /> },
    { id: 'chat', label: 'צ\'אט', icon: <MessageCircle className="w-5 h-5" /> },
    { id: 'logs', label: 'לוג', icon: <AlertTriangle className="w-5 h-5" /> },
    { id: 'settings', label: 'הגדרות', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div dir="rtl" lang="he" className="min-h-screen flex flex-col" style={{ background: '#060f1f' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-4 py-3 backdrop-blur-[20px] flex items-center justify-between"
        style={{
          background: 'rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#d4af37]" />
          <h1 className="text-lg font-bold text-white">Guardian Bot</h1>
          {status && (
            <span className={`w-2.5 h-2.5 rounded-full ${status.active ? 'bg-green-400' : 'bg-red-400'}`} />
          )}
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem(SESSION_KEY);
            setAuthenticated(false);
            setPassword('');
          }}
          className="text-gray-400 hover:text-white transition-colors text-sm"
        >
          יציאה
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 px-3 pt-3">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <DashboardView
              key="dashboard"
              status={status}
              stats={stats}
              recentLogs={recentLogs}
              loading={dashLoading}
              scanLoading={scanLoading}
              onRunScan={handleRunScan}
              onToggle={handleToggleGuardian}
              onOpenTicket={openTicket}
              onOpenChat={openGeneralChat}
              onRefresh={loadDashboard}
            />
          )}
          {activeTab === 'chat' && (
            <ChatView
              key="chat"
              messages={chatMessages}
              input={chatInput}
              onInputChange={setChatInput}
              onSend={handleSendChat}
              loading={chatLoading}
              sending={chatSending}
              ticketLog={activeTicketLog}
              ticketId={activeTicketId}
              onApprove={handleApproveLog}
              onDismiss={handleDismissLog}
              onBack={() => { setActiveTicketId(undefined); setActiveTicketLog(null); }}
              chatEndRef={chatEndRef}
            />
          )}
          {activeTab === 'logs' && (
            <LogsView
              key="logs"
              logs={allLogs}
              loading={logsLoading}
              severityFilter={logSeverityFilter}
              statusFilter={logStatusFilter}
              onSeverityChange={setLogSeverityFilter}
              onStatusChange={setLogStatusFilter}
              onOpenTicket={openTicket}
              onRefresh={loadAllLogs}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsView
              key="settings"
              settings={settings}
              loading={settingsLoading}
              newPassword={newPassword}
              confirmNewPassword={confirmNewPassword}
              onNewPasswordChange={setNewPassword}
              onConfirmNewPasswordChange={setConfirmNewPassword}
              onChangePassword={handleChangePassword}
              onUpdateSetting={handleUpdateSetting}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Tab Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-around py-2 backdrop-blur-[20px]"
        style={{
          background: 'rgba(6,15,31,0.95)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${
              activeTab === tab.id ? 'text-[#d4af37]' : 'text-gray-500'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─── Glass Card Component ────────────────────────────────────────────────────

function GlassCard({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      onClick={onClick}
      className={`rounded-2xl p-4 backdrop-blur-[20px] ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.15)',
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── Dashboard View ──────────────────────────────────────────────────────────

function DashboardView({
  status,
  stats,
  recentLogs,
  loading,
  scanLoading,
  onRunScan,
  onToggle,
  onOpenTicket,
  onOpenChat,
  onRefresh,
}: {
  status: GuardianStatus | null;
  stats: GuardianStats | null;
  recentLogs: GuardianLog[];
  loading: boolean;
  scanLoading: boolean;
  onRunScan: () => void;
  onToggle: () => void;
  onOpenTicket: (id: string) => void;
  onOpenChat: () => void;
  onRefresh: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-3"
    >
      {/* Status + Toggle */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#d4af37]" />
            <span className="text-white font-bold text-sm">מצב Guardian</span>
          </div>
          <button
            onClick={onToggle}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              status?.active ? 'bg-green-500' : 'bg-gray-600'
            }`}
          >
            <motion.div
              className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow"
              animate={{ right: status?.active ? '2px' : 'auto', left: status?.active ? 'auto' : '2px' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={status?.active ? { right: '2px' } : { left: '2px' }}
            />
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${status?.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {status?.active ? 'פעיל' : 'כבוי'}
          </span>
          {status?.lastScanAt && (
            <span className="text-gray-400 text-xs">
              סריקה אחרונה: {timeAgo(status.lastScanAt)}
            </span>
          )}
        </div>
      </GlassCard>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2">
        <GlassCard className="text-center">
          <div className="text-2xl font-bold text-white">{stats?.totalIssues ?? '-'}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">בעיות סה״כ</div>
        </GlassCard>
        <GlassCard className="text-center">
          <div className="text-2xl font-bold text-green-400">{stats?.autoFixed ?? '-'}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">תוקנו אוטומטית</div>
        </GlassCard>
        <GlassCard className="text-center">
          <div className="text-2xl font-bold text-[#d4af37]">{stats?.pendingApproval ?? '-'}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">ממתינים לאישור</div>
        </GlassCard>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onRunScan}
          disabled={scanLoading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-black transition-all active:scale-95 disabled:opacity-50"
          style={{ background: '#d4af37' }}
        >
          <RefreshCw className={`w-4 h-4 ${scanLoading ? 'animate-spin' : ''}`} />
          <span className="text-sm">סרוק עכשיו</span>
        </button>
        <button
          onClick={onOpenChat}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-[#d4af37] transition-all active:scale-95"
          style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">צ׳אט</span>
        </button>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center justify-center px-3 py-3 rounded-xl text-gray-400 transition-all active:scale-95"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Recent Logs */}
      <div>
        <h3 className="text-sm font-bold text-white mb-2">התראות אחרונות</h3>
        {loading ? (
          <div className="flex justify-center py-6">
            <RefreshCw className="w-6 h-6 text-[#d4af37] animate-spin" />
          </div>
        ) : recentLogs.length === 0 ? (
          <GlassCard>
            <p className="text-gray-400 text-sm text-center">אין התראות</p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <GlassCard key={log.id} onClick={() => onOpenTicket(log.id)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{log.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5 truncate">{log.message}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${severityColor(log.severity)}`}>
                        {severityLabel(log.severity)}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${statusColor(log.status)}`}>
                        {statusLabel(log.status)}
                      </span>
                      <span className="text-gray-500 text-[10px]">{timeAgo(log.createdAt)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0 rotate-180" />
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Chat View ───────────────────────────────────────────────────────────────

function ChatView({
  messages,
  input,
  onInputChange,
  onSend,
  loading,
  sending,
  ticketLog,
  ticketId,
  onApprove,
  onDismiss,
  onBack,
  chatEndRef,
}: {
  messages: ChatMessage[];
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  loading: boolean;
  sending: boolean;
  ticketLog: GuardianLog | null;
  ticketId: string | undefined;
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
  onBack: () => void;
  chatEndRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col"
      style={{ height: 'calc(100vh - 140px)' }}
    >
      {/* Ticket Header */}
      {ticketId && (
        <GlassCard className="mb-2 !p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <button onClick={onBack} className="text-gray-400 hover:text-white">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <p className="text-white text-sm font-bold truncate">
                  {ticketLog?.title || `טיקט #${ticketId.slice(0, 8)}`}
                </p>
              </div>
              {ticketLog && (
                <div className="flex items-center gap-1.5 mt-1 mr-7">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${severityColor(ticketLog.severity)}`}>
                    {severityLabel(ticketLog.severity)}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${statusColor(ticketLog.status)}`}>
                    {statusLabel(ticketLog.status)}
                  </span>
                </div>
              )}
            </div>
            {ticketLog && ticketLog.status !== 'resolved' && ticketLog.status !== 'dismissed' && (
              <div className="flex gap-1.5">
                <button
                  onClick={() => onApprove(ticketId)}
                  className="p-2 rounded-lg bg-green-500/20 text-green-400 active:scale-95 transition-transform"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDismiss(ticketId)}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400 active:scale-95 transition-transform"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {!ticketId && (
        <div className="mb-2 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-[#d4af37]" />
          <span className="text-white font-bold text-sm">צ׳אט כללי עם Guardian</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-2 px-1">
        {loading && messages.length === 0 ? (
          <div className="flex justify-center py-10">
            <RefreshCw className="w-6 h-6 text-[#d4af37] animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <MessageCircle className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">אין הודעות עדיין</p>
            <p className="text-xs mt-1">שלח הודעה כדי להתחיל</p>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'bot' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                  msg.role === 'bot'
                    ? 'rounded-tl-sm'
                    : 'rounded-tr-sm'
                }`}
                style={
                  msg.role === 'bot'
                    ? { background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.3)' }
                    : { background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }
                }
              >
                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${msg.role === 'bot' ? 'text-[#d4af37]/60' : 'text-blue-400/60'}`}>
                  {msg.role === 'bot' ? 'Guardian' : 'אדמין'} · {timeAgo(msg.createdAt)}
                </p>
              </div>
            </motion.div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-2 p-2 rounded-2xl backdrop-blur-[20px]"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
          placeholder="כתוב הודעה..."
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500 px-2"
        />
        <button
          onClick={onSend}
          disabled={!input.trim() || sending}
          className="p-2.5 rounded-xl transition-all active:scale-90 disabled:opacity-30"
          style={{ background: '#d4af37' }}
        >
          {sending ? (
            <RefreshCw className="w-4 h-4 text-black animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-black rotate-180" />
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Logs View ───────────────────────────────────────────────────────────────

function LogsView({
  logs,
  loading,
  severityFilter,
  statusFilter,
  onSeverityChange,
  onStatusChange,
  onOpenTicket,
  onRefresh,
}: {
  logs: GuardianLog[];
  loading: boolean;
  severityFilter: string;
  statusFilter: string;
  onSeverityChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onOpenTicket: (id: string) => void;
  onRefresh: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-3"
    >
      {/* Filters */}
      <GlassCard className="!p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-bold text-sm">סינון לוגים</span>
          <button onClick={onRefresh} disabled={loading} className="text-gray-400 active:scale-90 transition-transform">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex gap-2">
          <select
            value={severityFilter}
            onChange={(e) => onSeverityChange(e.target.value)}
            className="flex-1 bg-white/5 text-white text-xs rounded-lg px-2 py-2 outline-none border border-white/10"
          >
            <option value="" className="bg-[#0d1b2a]">כל החומרות</option>
            <option value="info" className="bg-[#0d1b2a]">מידע</option>
            <option value="warning" className="bg-[#0d1b2a]">אזהרה</option>
            <option value="error" className="bg-[#0d1b2a]">שגיאה</option>
            <option value="critical" className="bg-[#0d1b2a]">קריטי</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="flex-1 bg-white/5 text-white text-xs rounded-lg px-2 py-2 outline-none border border-white/10"
          >
            <option value="" className="bg-[#0d1b2a]">כל הסטטוסים</option>
            <option value="open" className="bg-[#0d1b2a]">פתוח</option>
            <option value="pending" className="bg-[#0d1b2a]">ממתין</option>
            <option value="resolved" className="bg-[#0d1b2a]">טופל</option>
            <option value="dismissed" className="bg-[#0d1b2a]">נדחה</option>
          </select>
        </div>
      </GlassCard>

      {/* Log list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="w-6 h-6 text-[#d4af37] animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <GlassCard>
          <p className="text-gray-400 text-sm text-center py-4">אין לוגים מתאימים</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <GlassCard key={log.id} onClick={() => onOpenTicket(log.id)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{log.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{log.message}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${severityColor(log.severity)}`}>
                      {severityLabel(log.severity)}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${statusColor(log.status)}`}>
                      {statusLabel(log.status)}
                    </span>
                    <span className="text-gray-500 text-[10px]">{timeAgo(log.createdAt)}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0 rotate-180" />
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Settings View ───────────────────────────────────────────────────────────

function SettingsView({
  settings,
  loading,
  newPassword,
  confirmNewPassword,
  onNewPasswordChange,
  onConfirmNewPasswordChange,
  onChangePassword,
  onUpdateSetting,
}: {
  settings: GuardianSettings | null;
  loading: boolean;
  newPassword: string;
  confirmNewPassword: string;
  onNewPasswordChange: (v: string) => void;
  onConfirmNewPasswordChange: (v: string) => void;
  onChangePassword: () => void;
  onUpdateSetting: (key: keyof GuardianSettings, value: unknown) => void;
}) {
  if (loading && !settings) {
    return (
      <div className="flex justify-center py-10">
        <RefreshCw className="w-6 h-6 text-[#d4af37] animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-3"
    >
      {/* Maintenance Mode */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Power className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-white font-bold text-sm">מצב תחזוקה</p>
              <p className="text-gray-400 text-[10px]">חוסם גישה לכל המשתמשים</p>
            </div>
          </div>
          <button
            onClick={() => onUpdateSetting('maintenanceMode', !settings?.maintenanceMode)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              settings?.maintenanceMode ? 'bg-red-500' : 'bg-gray-600'
            }`}
          >
            <div
              className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all"
              style={settings?.maintenanceMode ? { right: '2px' } : { left: '2px' }}
            />
          </button>
        </div>
      </GlassCard>

      {/* Guardian Toggle */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#d4af37]" />
            <div>
              <p className="text-white font-bold text-sm">Guardian Bot</p>
              <p className="text-gray-400 text-[10px]">הפעלה/כיבוי ניטור אוטומטי</p>
            </div>
          </div>
          <button
            onClick={() => onUpdateSetting('active', !settings?.active)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              settings?.active ? 'bg-green-500' : 'bg-gray-600'
            }`}
          >
            <div
              className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all"
              style={settings?.active ? { right: '2px' } : { left: '2px' }}
            />
          </button>
        </div>
      </GlassCard>

      {/* Scan Interval */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="w-5 h-5 text-[#d4af37]" />
          <p className="text-white font-bold text-sm">תדירות סריקה</p>
        </div>
        <div className="flex gap-2">
          {[5, 15, 30, 60].map((mins) => (
            <button
              key={mins}
              onClick={() => onUpdateSetting('scanInterval', mins)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                settings?.scanInterval === mins
                  ? 'bg-[#d4af37] text-black'
                  : 'bg-white/5 text-gray-400 border border-white/10'
              }`}
            >
              {mins} דק׳
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Admin Email */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-[#d4af37]" />
          <p className="text-white font-bold text-sm">אימייל מנהל</p>
        </div>
        <div className="flex gap-2">
          <input
            type="email"
            value={settings?.adminEmail || ''}
            onChange={(e) => onUpdateSetting('adminEmail', e.target.value)}
            placeholder="admin@example.com"
            className="flex-1 bg-white/5 text-white text-sm rounded-lg px-3 py-2 outline-none border border-white/10 placeholder-gray-500"
            dir="ltr"
          />
        </div>
      </GlassCard>

      {/* Change Password */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-5 h-5 text-[#d4af37]" />
          <p className="text-white font-bold text-sm">שינוי סיסמה</p>
        </div>
        <div className="space-y-2">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.target.value)}
            placeholder="סיסמה חדשה"
            className="w-full bg-white/5 text-white text-sm rounded-lg px-3 py-2.5 outline-none border border-white/10 placeholder-gray-500"
          />
          <input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => onConfirmNewPasswordChange(e.target.value)}
            placeholder="אימות סיסמה חדשה"
            className="w-full bg-white/5 text-white text-sm rounded-lg px-3 py-2.5 outline-none border border-white/10 placeholder-gray-500"
          />
          <button
            onClick={onChangePassword}
            disabled={!newPassword || !confirmNewPassword}
            className="w-full py-2.5 rounded-xl font-bold text-black transition-all active:scale-95 disabled:opacity-40"
            style={{ background: '#d4af37' }}
          >
            עדכן סיסמה
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
}