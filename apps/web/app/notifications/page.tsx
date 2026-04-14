'use client';

import { useEffect } from 'react';
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
} from 'lucide-react';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/lib/api-hooks';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { useQueryClient } from '@tanstack/react-query';
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

const TYPE_COLORS: Record<string, string> = {
  INVOICE_SUBMITTED: 'bg-blue-500/20 text-blue-400',
  INVOICE_APPROVED: 'bg-green-500/20 text-green-400',
  INVOICE_REJECTED: 'bg-red-500/20 text-red-400',
  INVOICE_CLARIFICATION: 'bg-amber-500/20 text-amber-400',
  INVOICE_PAID: 'bg-purple-500/20 text-purple-400',
  CARD_CREDITED: 'bg-green-500/20 text-green-400',
  GOAL_ACHIEVED: 'bg-emerald-500/20 text-emerald-400',
  BONUS_RECEIVED: 'bg-emerald-500/20 text-emerald-400',
  PROFILE_VIEWED: 'bg-cyan-500/20 text-cyan-400',
  SYSTEM_ALERT: 'bg-orange-500/20 text-orange-400',
  WELCOME: 'bg-indigo-500/20 text-indigo-400',
  MEETING_REQUEST: 'bg-emerald-500/20 text-emerald-400',
};

function extractPhone(message: string): string | null {
  const match = message.match(/טלפון:\s*(\S+)/);
  return match ? match[1] : null;
}

function extractMessage(message: string): string | null {
  const match = message.match(/הודעה:\s*(.*)/s);
  return match ? match[1].trim() : null;
}

export default function NotificationsPage() {
  const { isReady } = useAuthGuard();
  const queryClient = useQueryClient();
  const { data: notificationsData, isLoading } = useNotifications();
  const markAsRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = notificationsData?.data || [];
  const unreadCount = notificationsData?.unreadCount || 0;

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

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  const handleNotificationClick = (notif: any) => {
    // Mark as read
    if (!notif.isRead) {
      markAsRead.mutate(notif.id);
    }

    const phone = extractPhone(notif.message);
    const msg = extractMessage(notif.message);

    if (notif.type === 'MEETING_REQUEST' && phone) {
      // Meeting request - show SweetAlert with actions
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
          </div>
        `,
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: '📞 התקשר',
        denyButtonText: '💬 WhatsApp',
        cancelButtonText: 'סגור',
        confirmButtonColor: '#10b981',
        denyButtonColor: '#25D366',
        background: '#0f2620',
        color: '#fff',
        customClass: { popup: 'rounded-2xl' },
      }).then((result) => {
        if (result.isConfirmed) {
          window.open(`tel:${phone}`, '_self');
        } else if (result.isDenied) {
          const waMessage = encodeURIComponent(`שלום, קיבלתי את בקשת תיאום הפגישה שלך דרך STANNEL CLUB. אשמח לתאם.`);
          window.open(`https://wa.me/${phone.replace(/[-\s]/g, '')}?text=${waMessage}`, '_blank');
        }
      });
    } else {
      // Generic notification
      Swal.fire({
        title: notif.title,
        html: `<p style="color: rgba(255,255,255,0.7); text-align: right;" dir="rtl">${notif.message}</p><p style="color: rgba(255,255,255,0.3); font-size: 12px; margin-top: 12px; text-align: right;">${new Date(notif.createdAt).toLocaleString('he-IL')}</p>`,
        icon: 'info',
        confirmButtonText: 'סגור',
        confirmButtonColor: '#10b981',
        background: '#0f2620',
        color: '#fff',
      });
    }
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  return (
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero Background */}
      <div className="absolute inset-x-0 top-0 h-[35vh]">
        <Image src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&q=80" alt="Notifications" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2620]/30 via-transparent to-[#0f2620]" />
      </div>

      <div className="relative z-10 px-4 sm:px-6 pt-24 sm:pt-28 pb-6 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-4 sm:mb-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <Bell className="text-emerald-400" size={22} />
                התראות
              </h1>
              <p className="text-white/60 mt-1 text-sm sm:text-base">
                {unreadCount > 0 ? `${unreadCount} התראות שלא נקראו` : 'אין התראות חדשות'}
              </p>
            </div>
            {unreadCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleMarkAllRead}
                disabled={markAllRead.isPending}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white text-sm transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <CheckCheck size={16} />
                <span className="hidden sm:inline">סמן הכל כנקרא</span>
                <span className="sm:hidden">נקרא</span>
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Notifications List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
            {isLoading ? (
              <div className="space-y-0 divide-y divide-white/10">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 animate-pulse">
                    <div className="w-10 h-10 bg-white/10 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 w-48 bg-white/10 rounded mb-2" />
                      <div className="h-3 w-64 bg-white/5 rounded" />
                    </div>
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
              <div className="divide-y divide-white/10">
                {notifications.map((notif: any, index: number) => {
                  const Icon = TYPE_ICONS[notif.type] || Info;
                  const colorClass = TYPE_COLORS[notif.type] || 'bg-blue-500/20 text-blue-400';

                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 sm:p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                        !notif.isRead ? 'bg-emerald-500/10 hover:bg-emerald-500/20' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-white text-sm sm:text-base ${!notif.isRead ? 'font-medium' : ''}`}>
                          {notif.title}
                        </p>
                        <p className="text-white/60 text-xs sm:text-sm mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-white/40 text-xs mt-2">
                          {new Date(notif.createdAt).toLocaleString('he-IL')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {notif.type === 'MEETING_REQUEST' && (
                          <Phone size={16} className="text-emerald-400" />
                        )}
                        {!notif.isRead && (
                          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
