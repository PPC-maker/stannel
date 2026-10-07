'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Calendar, Clock, Loader2, Phone, RefreshCw, Search, FileText } from 'lucide-react';
import { useAdminGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { adminApi } from '@stannel/api-client';

type Status = 'pending' | 'approved' | 'rejected' | 'cancelled';

const STATUS_META: Record<Status, { label: string; className: string }> = {
  pending: { label: 'ממתינה', className: 'bg-amber-100 text-amber-700' },
  approved: { label: 'אושרה', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'נדחתה', className: 'bg-red-100 text-red-600' },
  cancelled: { label: 'בוטלה', className: 'bg-gray-200 text-gray-600' },
};

const FILTERS: { id: 'all' | Status; label: string }[] = [
  { id: 'all', label: 'הכל' },
  { id: 'pending', label: 'ממתינות' },
  { id: 'approved', label: 'אושרו' },
  { id: 'rejected', label: 'נדחו' },
  { id: 'cancelled', label: 'בוטלו' },
];

export default function AdminMeetingsPage() {
  const { isReady, loading: authLoading } = useAdminGuard();
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-meetings'],
    queryFn: () => adminApi.getMeetings(),
    enabled: isReady,
    refetchInterval: 60000,
  });

  if (authLoading) return <AuthGuardLoader />;
  if (!isReady) return null;

  const meetings: any[] = data?.data || [];
  const counts = data?.counts || {};
  const term = search.trim().toLowerCase();

  const rows = meetings.filter((m) => {
    if (filter !== 'all' && m.status !== filter) return false;
    if (!term) return true;
    return [
      m.subject,
      m.architect?.user?.name,
      m.architect?.user?.email,
      m.supplier?.companyName,
      m.supplier?.user?.name,
    ].some((v) => v && String(v).toLowerCase().includes(term));
  });

  const fmt = (d: string) => new Date(d).toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' });

  return (
    <div className="min-h-screen">
      <div className="px-4 sm:px-6 max-w-5xl mx-auto pt-8 relative z-10 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-[#8b7c69] hover:text-[#c99b4a] mb-3 transition-colors">
              <ArrowRight size={16} />
              חזרה לניהול
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2b241d] flex items-center gap-3">
              <Calendar className="text-[#c99b4a]" />
              פגישות
            </h1>
            <p className="text-[#8b7c69] text-sm mt-1">מי קבע פגישה עם מי, והסטטוס של כל פגישה</p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg bg-[#f7f3f2] text-[#8b7c69] hover:text-[#c99b4a]"
            aria-label="רענון"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {(Object.keys(STATUS_META) as Status[]).map((s) => (
            <div key={s} className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.15)] rounded-xl p-4">
              <p className="text-[#8b7c69] text-xs mb-1">{STATUS_META[s].label}</p>
              <p className="text-2xl font-bold text-[#2b241d]">{counts[s] || 0}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89b8a]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי משתמש, ספק או נושא"
              className="w-full pr-9 pl-3 py-2.5 bg-white border border-[rgba(201,155,74,0.15)] rounded-xl text-sm text-[#2b241d] outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${filter === f.id ? 'bg-[#c99b4a] text-white' : 'bg-[#f7f3f2] text-[#8b7c69]'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16"><Loader2 className="w-8 h-8 mx-auto animate-spin text-[#c99b4a]" /></div>
        ) : rows.length === 0 ? (
          <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-12 text-center">
            <Calendar size={48} className="mx-auto text-[#a89b8a]/40 mb-4" />
            <p className="text-[#8b7c69] text-lg">לא נמצאו פגישות</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((m, i) => {
              const meta = STATUS_META[m.status as Status] || STATUS_META.pending;
              const who = m.architect?.user;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 10) * 0.02 }}
                  className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.15)] rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-[#2b241d] font-semibold truncate">{m.subject}</p>
                      <p className="text-[#2b241d] text-sm mt-0.5">
                        <span className="text-[#8b7c69]">{who?.role === 'DESIGNER' ? 'מעצב' : 'אדריכל'}:</span> {who?.name || '—'}
                        <span className="text-[#c99b4a] mx-2">←</span>
                        <span className="text-[#8b7c69]">ספק:</span> {m.supplier?.companyName || m.supplier?.user?.name || '—'}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${meta.className}`}>{meta.label}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#8b7c69]">
                    <span className="inline-flex items-center gap-1"><Calendar size={14} />{fmt(m.date)}</span>
                    <span className="inline-flex items-center gap-1"><Clock size={14} />{m.time}</span>
                    {who?.phone && <span className="inline-flex items-center gap-1" dir="ltr"><Phone size={14} />{who.phone}</span>}
                    {who?.email && <span dir="ltr">{who.email}</span>}
                  </div>

                  {m.notes && <p className="text-[#8b7c69] text-sm mt-2 whitespace-pre-line">{m.notes}</p>}
                  {m.documentUrl && (
                    <a href={m.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-500 text-sm mt-2 hover:underline">
                      <FileText size={14} />מסמך מצורף
                    </a>
                  )}
                  <p className="text-[#a89b8a] text-xs mt-2">
                    נשלחה ב-{fmt(m.createdAt)}
                    {m.updatedAt && m.updatedAt !== m.createdAt && ` · עודכנה ב-${fmt(m.updatedAt)}`}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
