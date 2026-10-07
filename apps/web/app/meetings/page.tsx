'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Calendar, Clock, Loader2, Phone, FileText, CheckCircle, XCircle, Hourglass, Ban } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { meetingsApi } from '@stannel/api-client';
import Swal from 'sweetalert2';

type Status = 'pending' | 'approved' | 'rejected' | 'cancelled';

const STATUS_META: Record<Status, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: 'ממתינה לאישור', className: 'bg-amber-100 text-amber-700', icon: Hourglass },
  approved: { label: 'אושרה', className: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'נדחתה', className: 'bg-red-100 text-red-600', icon: XCircle },
  cancelled: { label: 'בוטלה', className: 'bg-gray-200 text-gray-600', icon: Ban },
};

const swalTheme = { background: '#f7f3f2', color: '#2b241d', confirmButtonColor: '#c99b4a' };

export default function MeetingsPage() {
  const { isReady } = useAuthGuard();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isSupplier = user?.role === 'SUPPLIER';
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => meetingsApi.getAll(),
    enabled: isReady,
    refetchInterval: 30000,
  });

  const meetings: any[] = data?.data || [];
  // Upcoming/open requests vs. everything that is finished
  const isActive = (m: any) => m.status === 'pending' || (m.status === 'approved' && new Date(m.date).getTime() >= Date.now() - 24 * 3600 * 1000);
  const active = meetings.filter(isActive);
  const history = meetings.filter((m) => !isActive(m)).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const list = tab === 'active' ? active : history;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['meetings'] });

  const handleDecision = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id);
    try {
      await meetingsApi.updateStatus(id, status);
      await refresh();
    } catch (err: any) {
      Swal.fire({ title: 'שגיאה', text: err.message || 'לא ניתן לעדכן את הפגישה', icon: 'error', ...swalTheme });
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (id: string) => {
    const result = await Swal.fire({
      title: 'ביטול פגישה',
      text: 'האם לבטל את בקשת הפגישה?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'בטל פגישה',
      cancelButtonText: 'חזרה',
      ...swalTheme,
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;
    setBusyId(id);
    try {
      await meetingsApi.cancel(id);
      await refresh();
    } catch (err: any) {
      Swal.fire({ title: 'שגיאה', text: err.message || 'לא ניתן לבטל את הפגישה', icon: 'error', ...swalTheme });
    } finally {
      setBusyId(null);
    }
  };

  if (!isReady) return <AuthGuardLoader />;

  return (
    <div className="min-h-screen">
      <div className="px-4 sm:px-6 max-w-3xl mx-auto pt-8 relative z-10 pb-24">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <Link
            href={isSupplier ? '/supplier' : '/wallet'}
            className="inline-flex items-center gap-2 text-[#8b7c69] hover:text-[#c99b4a] mb-4 transition-colors"
          >
            <ArrowRight size={16} />
            חזרה
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2b241d] flex items-center gap-3">
            <Calendar className="text-[#c99b4a]" />
            הפגישות שלי
          </h1>
          <p className="text-[#8b7c69] text-sm mt-1">
            {isSupplier ? 'בקשות פגישה שהתקבלו מאדריכלים ומעצבים' : 'בקשות הפגישה ששלחת לספקים'}
          </p>
        </motion.div>

        <div className="flex gap-2 mb-4">
          {[
            { id: 'active' as const, label: `פעילות (${active.length})` },
            { id: 'history' as const, label: `היסטוריה (${history.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${tab === t.id ? 'bg-[#c99b4a] text-white' : 'bg-[#f7f3f2] text-[#8b7c69]'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-16"><Loader2 className="w-8 h-8 mx-auto animate-spin text-[#c99b4a]" /></div>
        ) : list.length === 0 ? (
          <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-12 text-center">
            <Calendar size={48} className="mx-auto text-[#a89b8a]/40 mb-4" />
            <p className="text-[#8b7c69] text-lg">{tab === 'active' ? 'אין פגישות פעילות' : 'אין היסטוריית פגישות'}</p>
            {!isSupplier && tab === 'active' && (
              <Link href="/suppliers" className="inline-block mt-4 px-5 py-2 bg-[#c99b4a] text-white rounded-xl text-sm">
                קביעת פגישה עם ספק
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((m, i) => {
              const meta = STATUS_META[(m.status as Status)] || STATUS_META.pending;
              const StatusIcon = meta.icon;
              const otherName = isSupplier
                ? m.architect?.user?.name || 'אדריכל'
                : m.supplier?.companyName || m.supplier?.user?.name || 'ספק';
              const busy = busyId === m.id;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.15)] rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-[#2b241d] font-semibold truncate">{m.subject}</p>
                      <p className="text-[#8b7c69] text-sm">
                        {isSupplier ? 'מאת' : 'אל'}: {otherName}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${meta.className}`}>
                      <StatusIcon size={12} />
                      {meta.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#8b7c69]">
                    <span className="inline-flex items-center gap-1"><Calendar size={14} />{new Date(m.date).toLocaleDateString('he-IL')}</span>
                    <span className="inline-flex items-center gap-1"><Clock size={14} />{m.time}</span>
                    {isSupplier && m.architect?.user?.phone && (
                      <a href={`tel:${m.architect.user.phone}`} className="inline-flex items-center gap-1 text-[#c99b4a]"><Phone size={14} />{m.architect.user.phone}</a>
                    )}
                  </div>

                  {m.notes && <p className="text-[#8b7c69] text-sm mt-2 whitespace-pre-line">{m.notes}</p>}
                  {m.documentUrl && (
                    <a href={m.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-500 text-sm mt-2 hover:underline">
                      <FileText size={14} />מסמך מצורף
                    </a>
                  )}
                  <p className="text-[#a89b8a] text-xs mt-2">נשלחה ב-{new Date(m.createdAt).toLocaleDateString('he-IL')}</p>

                  {isSupplier && m.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        disabled={busy}
                        onClick={() => handleDecision(m.id, 'approved')}
                        className="flex-1 py-2 bg-[#c99b4a] text-white rounded-xl text-sm font-medium disabled:opacity-50"
                      >
                        אישור
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => handleDecision(m.id, 'rejected')}
                        className="flex-1 py-2 bg-red-500/15 text-red-500 rounded-xl text-sm font-medium disabled:opacity-50"
                      >
                        דחייה
                      </button>
                    </div>
                  )}
                  {!isSupplier && (m.status === 'pending' || m.status === 'approved') && (
                    <button
                      disabled={busy}
                      onClick={() => handleCancel(m.id)}
                      className="mt-3 px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-sm disabled:opacity-50"
                    >
                      ביטול פגישה
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
