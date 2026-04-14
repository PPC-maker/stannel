'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  MessageSquare,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  Circle,
  Trash2,
  Loader2,
  Calendar,
  User,
  Filter,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { notificationsApi } from '@stannel/api-client';
import Swal from 'sweetalert2';

interface Message {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  relatedEntity?: string;
  relatedId?: string;
}

export default function SupplierMessagesPage() {
  const { isReady } = useAuthGuard();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const fetchMessages = async () => {
    try {
      const data = await notificationsApi.getNotifications({ pageSize: 50 });
      setMessages((data as any)?.data || data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isReady) fetchMessages();
  }, [isReady]);

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
              fetchMessages();
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
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true, readAt: new Date().toISOString() } : m));
      if (selectedMessage?.id === id) {
        setSelectedMessage(prev => prev ? { ...prev, isRead: true } : prev);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'מחיקת הודעה',
      text: 'האם למחוק את ההודעה?',
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
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMessages = messages.filter(m => {
    if (filter === 'unread') return !m.isRead;
    if (filter === 'read') return m.isRead;
    return true;
  });

  const unreadCount = messages.filter(m => !m.isRead).length;

  if (!isReady) return <AuthGuardLoader />;

  return (
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero */}
      <div className="relative h-64 overflow-hidden">
        <Image src="https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&w=2000&q=80" alt="Messages" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2620]/60 via-[#0f2620]/70 to-[#0f2620]" />
      </div>

      <div className="px-4 sm:px-6 max-w-4xl mx-auto -mt-32 relative z-10 pb-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <Link href="/supplier" className="inline-flex items-center gap-2 text-white/60 hover:text-emerald-400 mb-4 transition-colors">
            <ArrowRight size={16} />
            חזרה לדשבורד
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <MessageSquare className="text-emerald-400" />
              הודעות
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-sm px-2.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </h1>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30">
                סמן הכל כנקרא
              </button>
            )}
          </div>
        </motion.div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'all' as const, label: `הכל (${messages.length})` },
            { id: 'unread' as const, label: `לא נקרא (${unreadCount})` },
            { id: 'read' as const, label: `נקרא (${messages.length - unreadCount})` },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-colors ${filter === f.id ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-8 h-8 mx-auto animate-spin text-emerald-400" /></div>
        ) : filteredMessages.length === 0 ? (
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-12 text-center">
            <MessageSquare size={48} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/60 text-lg">{filter === 'unread' ? 'אין הודעות חדשות' : 'אין הודעות'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div
                  onClick={() => {
                    setSelectedMessage(msg);
                    if (!msg.isRead) handleMarkAsRead(msg.id);
                  }}
                  className={`bg-white/5 backdrop-blur border rounded-xl p-4 cursor-pointer transition-all hover:bg-white/10 ${
                    !msg.isRead ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10'
                  } ${selectedMessage?.id === msg.id ? 'ring-2 ring-emerald-500/50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Status dot */}
                    <div className="mt-1 flex-shrink-0">
                      {!msg.isRead ? (
                        <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                      ) : (
                        <div className="w-3 h-3 bg-white/20 rounded-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className={`font-medium text-sm truncate ${!msg.isRead ? 'text-white' : 'text-white/70'}`}>
                          {msg.title}
                        </h3>
                        <span className="text-white/40 text-xs whitespace-nowrap flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(msg.createdAt).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                      <p className="text-white/50 text-sm line-clamp-2 whitespace-pre-wrap">{msg.message}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!msg.isRead && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMarkAsRead(msg.id); }}
                          className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                          title="סמן כנקרא"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                        title="מחק"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Message */}
                {selectedMessage?.id === msg.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white/[0.03] border border-white/10 border-t-0 rounded-b-xl p-4 -mt-1"
                  >
                    <div className="space-y-3">
                      <div>
                        <p className="text-white/40 text-xs mb-1">הודעה מלאה:</p>
                        <p className="text-white whitespace-pre-wrap text-sm">{msg.message}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span className="flex items-center gap-1"><Calendar size={12} />{new Date(msg.createdAt).toLocaleString('he-IL')}</span>
                        {msg.isRead && msg.readAt && <span className="flex items-center gap-1"><CheckCircle size={12} />נקרא: {new Date(msg.readAt).toLocaleString('he-IL')}</span>}
                      </div>
                      {msg.type === 'MEETING_REQUEST' && msg.message.includes('טלפון:') && (
                        <a
                          href={`tel:${msg.message.split('טלפון: ')[1]?.split('\n')[0]}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30 transition-colors"
                        >
                          <Phone size={14} />
                          התקשר עכשיו
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
