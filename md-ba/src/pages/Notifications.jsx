import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, CheckCheck, Info, AlertTriangle, XCircle, CreditCard, Shield } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";

const TYPE_ICONS = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  success: Check,
  sla_reminder: AlertTriangle,
  payment: CreditCard,
  approval: Shield,
};

const TYPE_COLORS = {
  info: "bg-blue-50 text-blue-600",
  warning: "bg-amber-50 text-amber-600",
  error: "bg-red-50 text-red-600",
  success: "bg-green-50 text-green-600",
  sla_reminder: "bg-orange-50 text-orange-600",
  payment: "bg-purple-50 text-purple-600",
  approval: "bg-indigo-50 text-indigo-600",
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const user = await base44.auth.me();
    const notifs = await base44.entities.Notification.filter({ recipient_email: user.email }, "-created_date");
    setNotifications(notifs);
    setLoading(false);
  };

  const markAsRead = async (notif) => {
    await base44.entities.Notification.update(notif.id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await base44.entities.Notification.update(n.id, { is_read: true });
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" /></div>;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div>
      <PageHeader
        title="התראות"
        subtitle={`${unreadCount} שלא נקראו`}
        actions={
          unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
              <CheckCheck className="w-4 h-4" />
              סמן הכל כנקרא
            </Button>
          )
        }
      />

      <Card className="bg-white border border-gray-100">
        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title="אין התראות" description="התראות חדשות יופיעו כאן" />
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map(notif => {
              const Icon = TYPE_ICONS[notif.type] || Info;
              const colorClass = TYPE_COLORS[notif.type] || TYPE_COLORS.info;
              return (
                <div
                  key={notif.id}
                  className={`p-4 flex items-start gap-3 transition-colors ${!notif.is_read ? "bg-blue-50/30" : "hover:bg-gray-50/50"}`}
                  onClick={() => !notif.is_read && markAsRead(notif)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.is_read ? "font-medium" : ""}`}>{notif.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(notif.created_date).toLocaleString("he-IL")}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}