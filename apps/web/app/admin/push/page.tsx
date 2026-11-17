'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { ArrowRight, Bell, Loader2, Send, Smartphone } from 'lucide-react';
import { useAdminGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { pushApi, type PushAudience, type PushCampaign } from '@stannel/api-client';

const AUDIENCES: { value: PushAudience; label: string }[] = [
  { value: 'ALL', label: 'כל המשתמשים' },
  { value: 'ARCHITECT', label: 'אדריכלים' },
  { value: 'DESIGNER', label: 'מעצבים' },
  { value: 'SUPPLIER', label: 'ספקים' },
];

const audienceLabel = (a: string) => AUDIENCES.find((x) => x.value === a)?.label || a;

export default function AdminPushPage() {
  const { isReady } = useAdminGuard();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<PushAudience>('ALL');
  const [alsoInApp, setAlsoInApp] = useState(true);
  const [stats, setStats] = useState<{ devices: number; users: number } | null>(null);
  const [history, setHistory] = useState<PushCampaign[]>([]);
  const [sending, setSending] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const res = await pushApi.getHistory();
      setHistory(res.data || []);
    } catch {
      // history is informational only
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    loadHistory();
  }, [isReady, loadHistory]);

  useEffect(() => {
    if (!isReady) return;
    setStats(null);
    pushApi.getStats(audience).then(setStats).catch(() => setStats(null));
  }, [audience, isReady]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Swal.fire({
        title: 'שימו לב',
        text: 'יש למלא כותרת ותוכן להודעה לפני השליחה.',
        icon: 'warning',
        confirmButtonText: 'אישור',
        confirmButtonColor: '#c99b4a',
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'לשלוח את ההודעה?',
      html: `ההודעה תישלח ל<b>${audienceLabel(audience)}</b>${
        stats ? ` (${stats.devices} מכשירים רשומים)` : ''
      }.<br/>לא ניתן לבטל שליחה.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'שלח עכשיו',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#c99b4a',
    });
    if (!confirm.isConfirmed) return;

    setSending(true);
    try {
      const res = await pushApi.send({ title: title.trim(), body: body.trim(), audience, alsoInApp });
      await Swal.fire({
        title: 'ההודעה נשלחה',
        text:
          res.devices === 0
            ? 'אין עדיין מכשירים רשומים לקבוצה הזו, ולכן לא נשלחה התראה לטלפון.'
            : `נשלחה ל-${res.sent} מכשירים${res.failed ? `, ${res.failed} לא התקבלו` : ''}.`,
        icon: res.devices === 0 ? 'info' : 'success',
        confirmButtonText: 'אישור',
        confirmButtonColor: '#c99b4a',
      });
      setTitle('');
      setBody('');
      loadHistory();
    } catch (error: any) {
      const msg =
        typeof error?.message === 'string' && /[֐-׿]/.test(error.message)
          ? error.message
          : 'שליחת ההודעה נכשלה. נסו שוב בעוד רגע.';
      Swal.fire({
        title: 'שימו לב',
        text: msg,
        icon: 'warning',
        confirmButtonText: 'אישור',
        confirmButtonColor: '#c99b4a',
      });
    } finally {
      setSending(false);
    }
  };

  if (!isReady) return <AuthGuardLoader />;

  return (
    <div className="min-h-screen pt-8 pb-24">
      <div className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[#8b7c69] hover:text-[#2b241d] mb-4 transition-colors"
          >
            <ArrowRight size={18} />
            חזרה לפאנל ניהול
          </Link>
          <h1 className="text-3xl font-display font-bold text-[#2b241d] flex items-center gap-3">
            <Bell className="text-[#c99b4a]" />
            הודעות פוש
          </h1>
          <p className="text-[#8b7c69] mt-1">שליחת התראה לטלפונים של משתמשים שהתקינו את האפליקציה (iOS ואנדרואיד)</p>
        </motion.div>

        <div className="p-5 bg-[#f7f3f2] border border-[rgba(201,155,74,0.15)] rounded-2xl space-y-4">
          <div>
            <label className="block text-sm text-[#8b7c69] mb-1">נמענים</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as PushAudience)}
              className="w-full px-4 py-3 rounded-xl bg-white border border-[rgba(201,155,74,0.2)] text-[#2b241d]"
            >
              {AUDIENCES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#a89b8a] mt-1 flex items-center gap-1">
              <Smartphone size={14} />
              {stats
                ? `${stats.devices} מכשירים רשומים מתוך ${stats.users} משתמשים פעילים`
                : 'טוען מספר מכשירים...'}
            </p>
          </div>

          <div>
            <label className="block text-sm text-[#8b7c69] mb-1">כותרת ({title.length}/80)</label>
            <input
              value={title}
              maxLength={80}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="למשל: אירוע חדש במועדון"
              className="w-full px-4 py-3 rounded-xl bg-white border border-[rgba(201,155,74,0.2)] text-[#2b241d]"
            />
          </div>

          <div>
            <label className="block text-sm text-[#8b7c69] mb-1">תוכן ({body.length}/300)</label>
            <textarea
              value={body}
              maxLength={300}
              rows={4}
              onChange={(e) => setBody(e.target.value)}
              placeholder="תוכן ההודעה שיופיע בטלפון"
              className="w-full px-4 py-3 rounded-xl bg-white border border-[rgba(201,155,74,0.2)] text-[#2b241d]"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[#2b241d]">
            <input type="checkbox" checked={alsoInApp} onChange={(e) => setAlsoInApp(e.target.checked)} />
            להציג את ההודעה גם בפעמון ההתראות בתוך המערכת
          </label>

          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-[#c99b4a] text-white hover:bg-[#9e7746] transition-colors font-bold disabled:opacity-60"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {sending ? 'שולח...' : 'שליחת הודעה'}
          </button>
        </div>

        <h2 className="text-lg font-bold text-[#2b241d] mt-8 mb-3">הודעות שנשלחו</h2>
        {history.length === 0 ? (
          <p className="text-[#a89b8a] text-sm">עדיין לא נשלחו הודעות.</p>
        ) : (
          <div className="space-y-3">
            {history.map((c) => (
              <div key={c.id} className="p-4 bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl">
                <p className="font-medium text-[#2b241d]">{c.title}</p>
                <p className="text-sm text-[#8b7c69] mt-1">{c.body}</p>
                <p className="text-xs text-[#a89b8a] mt-2">
                  {audienceLabel(c.audience)} · נשלחה ל-{c.sentCount}
                  {c.failedCount ? ` · ${c.failedCount} נכשלו` : ''} ·{' '}
                  {new Date(c.createdAt).toLocaleString('he-IL')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
