'use client';

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
} from 'lucide-react';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/lib/api-hooks';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';

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
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  success: Check,
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
};

export default function NotificationsPage() {
  const { isReady } = useAuthGuard();
  const { data: notificationsData, isLoading } = useNotifications();
  const markAsRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = notificationsData?.data || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  return (
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero Background */}
      <div className="absolute inset-x-0 top-0 h-[35vh]">
        <Image
          src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&q=80"
          alt="Notifications"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2620]/30 via-transparent to-[#0f2620]" />
      </div>

      <div className="relative z-10 px-4 sm:px-6 pt-24 sm:pt-28 pb-6 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4 sm:mb-8"
        >
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
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
                      onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
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
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                      )}
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
