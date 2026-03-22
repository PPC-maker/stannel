'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
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
  GOAL_ACHIEVED: 'bg-gold-400/20 text-gold-400',
  BONUS_RECEIVED: 'bg-gold-400/20 text-gold-400',
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
    <div className="relative">
      <PageSlider images={sliderImages.dashboard} />
      <div className="p-6 max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                <Bell className="text-gold-400" />
                התראות
              </h1>
              <p className="text-white/60 mt-1">
                {unreadCount > 0 ? `${unreadCount} התראות שלא נקראו` : 'אין התראות חדשות'}
              </p>
            </div>
            {unreadCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleMarkAllRead}
                disabled={markAllRead.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/80 transition-colors disabled:opacity-50"
              >
                <CheckCheck size={18} />
                סמן הכל כנקרא
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
          <GlassCard>
            {isLoading ? (
              <div className="space-y-4">
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
                <Bell size={48} className="mx-auto text-white/20 mb-4" />
                <p className="text-white/50 text-lg">אין התראות</p>
                <p className="text-white/30 text-sm mt-1">התראות חדשות יופיעו כאן</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
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
                      className={`p-4 flex items-start gap-4 cursor-pointer transition-colors ${
                        !notif.isRead ? 'bg-white/5 hover:bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-white ${!notif.isRead ? 'font-medium' : ''}`}>
                          {notif.title}
                        </p>
                        <p className="text-white/50 text-sm mt-0.5">{notif.message}</p>
                        <p className="text-white/30 text-xs mt-2">
                          {new Date(notif.createdAt).toLocaleString('he-IL')}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
