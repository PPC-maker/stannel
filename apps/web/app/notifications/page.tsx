'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  AlertTriangle,
  XCircle,
  CreditCard,
  Shield,
  FileText,
  Award,
  Eye,
  Zap,
  MessageSquare,
  Phone,
  Clock,
  Trash2,
} from 'lucide-react';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/lib/api-hooks';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@stannel/api-client';
import Swal from 'sweetalert2';

const TYPE_ICONS: Record<string, any> = {
  INVOICE_SUBMITTED: FileText,
  INVOICE_APPROVED: Check,
  INVOICE_REJECTED: XCircle,
  INVOICE_CLARIFICATION: AlertTriangle,
  INVOICE_PAID: CreditCard,
  CARD_CREDITED: CreditCard,
  GOAL_ACHIEVED: Award,
  BONUS_RECEIVED: Award,
  PROFILE_VIEWED: Eye,
  SYSTEM_ALERT: Zap,
  WELCOME: Shield,
  MEETING_REQUEST: MessageSquare,
};

// Notification status: 'new' (red), 'pending' (yellow), 'handled' (green)
type NotifStatus = 'new' | 'pending' | 'handled';

function getStoredStatuses(): Record<string, NotifStatus> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('notif_statuses') || '{}');
  } catch { return {}; }
}

function setStoredStatus(id: string, status: NotifStatus) {
  const statuses = getStoredStatuses();
  statuses[id] = status;
  localStorage.setItem('notif_statuses', JSON.stringify(statuses));
}

function extractPhone(message: string): string | null {
  const match = message.match(/טלפון:\s*(\S+)/);
  return match ? match[1] : null;
}

function extractMessage(message: string): string | null {
  const match = message.match(/הודעה:\s*(.*)/s);
  return match ? match[1].trim() : null;
}

const statusConfig = {
  new: { bg: 'bg-red-500/15 border-red-500/30', dot: 'bg-red-500', label: 'חדש' },
  pending: { bg: 'bg-yellow-500/15 border-yellow-500/30', dot: 'bg-yellow-500', label: 'יטופל' },
  handled: { bg: 'bg-emerald-500/15 border-emerald-500/30', dot: 'bg-emerald-500', label: 'טופל' },
};

export default function NotificationsPage() {
  const { isReady } = useAuthGuard();
  const queryClient = useQueryClient();
  const { data: notificationsData, isLoading } = useNotifications();
  const markAsRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [localStatuses, setLocalStatuses] = useState<Record<string, NotifStatus>>({});

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  // Load stored statuses
  useEffect(() => {
    setLocalStatuses(getStoredStatuses());
  }, []);

  // WebSocket for real-time notifications
  useEffect(() => {
    const wsUrl = (process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') || 'ws://localhost:7070') + '/ws';
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'notification:new') {
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
            }
          } catch {}
        };
        ws.onclose = () => { reconnectTimeout = setTimeout(connect, 5000); };
      } catch {}
    };
    connect();
    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [queryClient]);

  if (!isReady) return <AuthGuardLoader />;

  const getNotifStatus = (notif: any): NotifStatus => {
    if (localStatuses[notif.id]) return localStatuses[notif.id];
    if (!notif.isRead) return 'new';
    return 'handled';
  };

  const updateStatus = (id: string, status: NotifStatus) => {
    setStoredStatus(id, status);
    setLocalStatuses(prev => ({ ...prev, [id]: status }));
    if (status !== 'new') {
      markAsRead.mutate(id);
    }
  };

  const handleNotificationClick = (notif: any) => {
    const phone = extractPhone(notif.message);
    const msg = extractMessage(notif.message);
    const currentStatus = getNotifStatus(notif);

    if (notif.type === 'MEETING_REQUEST' && phone) {
      Swal.fire({
        title: notif.title,
        html: `
          <div dir="rtl" style="text-align: right;">
            <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: rgba(255,255,255,0.5); font-size: 14px;">טלפון:</span>
                <span style="color: #10b981; font-weight: bold; font-size: 16px;" dir="ltr">${phone}</span>
              </div>
              ${msg ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);"><span style="color: rgba(255,255,255,0.5); font-size: 14px;">הודעה:</span><p style="color: white; margin-top: 4px; font-size: 14px;">${msg}</p></div>` : ''}
            </div>
            <p style="color: rgba(255,255,255,0.4); font-size: 12px;">${new Date(notif.createdAt).toLocaleString('he-IL')}</p>
            <div style="display: flex; gap: 8px; margin-top: 16px;">
              <button id="swal-call" style="flex: 1; padding: 12px; background: #10b981; color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer;">📞 התקשר</button>
              <button id="swal-whatsapp" style="flex: 1; padding: 12px; background: #25D366; color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer;">💬 WhatsApp</button>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <button id="swal-handled" style="flex: 1; padding: 10px; background: rgba(16,185,129,0.2); border: 1px solid rgba(16,185,129,0.4); color: #10b981; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;">✅ טופל</button>
              <button id="swal-pending" style="flex: 1; padding: 10px; background: rgba(234,179,8,0.2); border: 1px solid rgba(234,179,8,0.4); color: #eab308; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;">⏳ יטופל בהמשך</button>
            </div>
            <button id="swal-delete" style="width: 100%; padding: 10px; margin-top: 8px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;">🗑️ מחק הודעה</button>
          </div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'סגור',
        background: '#0f2620',
        color: '#fff',
        customClass: { popup: 'rounded-2xl' },
        didOpen: () => {
          document.getElementById('swal-call')?.addEventListener('click', () => {
            updateStatus(notif.id, 'handled');
            window.open(`tel:${phone}`, '_self');
            Swal.close();
          });
          document.getElementById('swal-whatsapp')?.addEventListener('click', () => {
            const waMsg = encodeURIComponent('שלום, קיבלתי את בקשת תיאום הפגישה שלך דרך STANNEL CLUB. אשמח לתאם.');
            window.open(`https://wa.me/${phone.replace(/[-\s]/g, '')}?text=${waMsg}`, '_blank');
            updateStatus(notif.id, 'handled');
            Swal.close();
          });
          document.getElementById('swal-handled')?.addEventListener('click', () => {
            updateStatus(notif.id, 'handled');
            Swal.close();
          });
          document.getElementById('swal-pending')?.addEventListener('click', () => {
            updateStatus(notif.id, 'pending');
            Swal.close();
          });
          document.getElementById('swal-delete')?.addEventListener('click', async () => {
            try {
              await notificationsApi.deleteNotification(notif.id);
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
            } catch {}
            Swal.close();
          });
        },
      });
    } else {
      // Generic notification
      Swal.fire({
        title: notif.title,
        html: `
          <div dir="rtl" style="text-align: right;">
            <p style="color: rgba(255,255,255,0.7);">${notif.message}</p>
            <p style="color: rgba(255,255,255,0.3); font-size: 12px; margin-top: 12px;">${new Date(notif.createdAt).toLocaleString('he-IL')}</p>
            <div style="display: flex; gap: 8px; margin-top: 16px;">
              <button id="swal-handled" style="flex: 1; padding: 10px; background: rgba(16,185,129,0.2); border: 1px solid rgba(16,185,129,0.4); color: #10b981; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;">✅ טופל</button>
              <button id="swal-pending" style="flex: 1; padding: 10px; background: rgba(234,179,8,0.2); border: 1px solid rgba(234,179,8,0.4); color: #eab308; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;">⏳ יטופל בהמשך</button>
            </div>
            <button id="swal-delete" style="width: 100%; padding: 10px; margin-top: 8px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;">🗑️ מחק הודעה</button>
          </div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'סגור',
        background: '#0f2620',
        color: '#fff',
        didOpen: () => {
          document.getElementById('swal-handled')?.addEventListener('click', () => {
            updateStatus(notif.id, 'handled');
            Swal.close();
          });
          document.getElementById('swal-pending')?.addEventListener('click', () => {
            updateStatus(notif.id, 'pending');
            Swal.close();
          });
          document.getElementById('swal-delete')?.addEventListener('click', async () => {
            try {
              await notificationsApi.deleteNotification(notif.id);
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
            } catch {}
            Swal.close();
          });
        },
      });
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: 'מחיקת הודעה',
      text: 'האם למחוק?',
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
      await notificationsApi.deleteNotification(id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      <div className="absolute inset-x-0 top-0 h-[35vh]">
        <Image src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&q=80" alt="Notifications" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2620]/30 via-transparent to-[#0f2620]" />
      </div>

      <div className="relative z-10 px-4 sm:px-6 pt-24 sm:pt-28 pb-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                <Bell className="text-emerald-400" size={22} />
                התראות
              </h1>
              <p className="text-white/60 mt-1 text-sm">
                {unreadCount > 0 ? `${unreadCount} התראות שלא נקראו` : 'אין התראות חדשות'}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="space-y-0 divide-y divide-white/10">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-4 p-4 animate-pulse">
                  <div className="w-10 h-10 bg-white/10 rounded-full" />
                  <div className="flex-1"><div className="h-4 w-48 bg-white/10 rounded mb-2" /><div className="h-3 w-64 bg-white/5 rounded" /></div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell size={48} className="mx-auto text-white/30 mb-4" />
              <p className="text-white/70 text-lg">אין התראות</p>
              <p className="text-white/50 text-sm mt-1">התראות חדשות יופיעו כאן</p>
            </div>
          ) : (
            <div className="space-y-3 p-3">
              {notifications.map((notif: any, index: number) => {
                const Icon = TYPE_ICONS[notif.type] || Info;
                const status = getNotifStatus(notif);
                const config = statusConfig[status];

                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 sm:p-4 flex items-start gap-3 cursor-pointer transition-all border-r-4 rounded-xl ${config.bg}`}
                    style={{ borderRightColor: status === 'new' ? '#ef4444' : status === 'pending' ? '#eab308' : '#10b981' }}
                  >
                    {/* Status dot */}
                    <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${config.dot} ${status === 'new' ? 'animate-pulse' : ''}`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Icon size={14} className={status === 'new' ? 'text-red-400' : status === 'pending' ? 'text-yellow-400' : 'text-emerald-400'} />
                        <p className={`text-sm font-medium ${status === 'new' ? 'text-white' : 'text-white/70'}`}>
                          {notif.title}
                        </p>
                      </div>
                      <p className="text-white/50 text-xs line-clamp-1">{notif.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white/30 text-[10px]">{new Date(notif.createdAt).toLocaleString('he-IL')}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${status === 'new' ? 'bg-red-500/20 text-red-400' : status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {config.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => handleDelete(e, notif.id)}
                        className="p-1 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
