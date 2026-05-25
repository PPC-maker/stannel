'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, FileText, Calendar, Building2, User, CheckCircle, Clock, XCircle, AlertTriangle, FileIcon, Download } from 'lucide-react';
import Link from 'next/link';
import { useInvoice } from '@/lib/api-hooks';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING_ADMIN: { label: 'ממתין לאישור', color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30', icon: Clock },
  APPROVED: { label: 'מאושר', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30', icon: CheckCircle },
  REJECTED: { label: 'נדחה', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30', icon: XCircle },
  PENDING_SUPPLIER_PAY: { label: 'ממתין לתשלום', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30', icon: Clock },
  PAID: { label: 'שולם', color: 'text-[#c99b4a]', bg: 'bg-[#c99b4a]/20 border-[#c99b4a]/30', icon: CheckCircle },
  OVERDUE: { label: 'באיחור', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30', icon: AlertTriangle },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isReady } = useAuthGuard();
  const invoiceId = params.id as string;

  const { data: invoice, isLoading, error } = useInvoice(invoiceId);

  if (!isReady || isLoading) {
    return <AuthGuardLoader />;
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen">
        <div className="px-4 max-w-4xl mx-auto pt-8 relative z-10 pb-24">
          <div className="bg-white border border-[rgba(201,155,74,0.08)] rounded-2xl p-8 text-center">
            <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
            <h1 className="text-2xl font-bold text-[#2b241d] mb-2">חשבונית לא נמצאה</h1>
            <p className="text-[#8b7c69] mb-6">החשבונית המבוקשת לא נמצאה או שאין לך הרשאה לצפות בה</p>
            <Link href="/invoices" className="inline-block px-6 py-3 bg-[#c99b4a] text-white rounded-xl hover:bg-[#9e7746] transition-colors">
              חזרה לחשבוניות
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const status = statusConfig[invoice.status] || statusConfig.PENDING_ADMIN;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen">
      <div className="px-4 sm:px-6 max-w-5xl mx-auto pt-8 relative z-10 pb-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-[#8b7c69] hover:text-[#c99b4a] mb-4 transition-colors font-medium">
            <ArrowRight size={16} />
            חזרה לחשבוניות
          </button>
          <h1 className="text-3xl font-display font-bold text-[#2b241d] flex items-center gap-3">
            <FileText className="text-[#c99b4a]" />
            פרטי חשבונית
          </h1>
          <p className="text-[#a89b8a] mt-1 font-mono text-sm">#{invoice.id.slice(-8)}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Invoice Image */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-[#2b241d] mb-4 flex items-center gap-2">
                <FileText size={20} className="text-[#c99b4a]" />
                תמונת החשבונית
              </h2>
              {invoice.imageUrl ? (
                invoice.imageUrl.toLowerCase().endsWith('.pdf') ? (
                  <div className="space-y-4">
                    <div className="bg-[#f7f3f2] rounded-xl p-8 flex flex-col items-center border border-[rgba(201,155,74,0.08)]">
                      <div className="w-24 h-28 bg-red-500/20 border-2 border-red-500/40 rounded-lg flex items-center justify-center mb-4">
                        <FileIcon size={48} className="text-red-400" />
                      </div>
                      <p className="text-[#2b241d] font-medium mb-1">קובץ PDF</p>
                      <p className="text-[#a89b8a] text-sm">לחץ למטה לצפייה או הורדה</p>
                    </div>
                    <div className="flex gap-3">
                      <a href={invoice.imageUrl} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 bg-[#c99b4a]/10 border border-[#c99b4a]/30 text-[#c99b4a] rounded-xl flex items-center justify-center gap-2 hover:bg-[#c99b4a]/20 transition-colors">
                        <FileText size={18} />
                        פתח PDF
                      </a>
                      <a href={invoice.imageUrl} download className="flex-1 py-3 bg-white/90 border border-[rgba(201,155,74,0.12)] text-[#2b241d] rounded-xl flex items-center justify-center gap-2 hover:bg-[#f7f3f2] transition-colors">
                        <Download size={18} />
                        הורד
                      </a>
                    </div>
                  </div>
                ) : (
                  <a href={invoice.imageUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <img
                      src={invoice.imageUrl}
                      alt="חשבונית"
                      className="w-full rounded-xl object-contain max-h-96 hover:opacity-90 transition-opacity cursor-zoom-in border border-[rgba(201,155,74,0.08)]"
                    />
                    <p className="text-center text-[#a89b8a] text-sm mt-2">לחץ להגדלה</p>
                  </a>
                )
              ) : (
                <div className="h-64 flex items-center justify-center bg-[#f7f3f2] rounded-xl border border-[rgba(201,155,74,0.08)]">
                  <p className="text-[#a89b8a]">אין תמונה</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Invoice Details */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="bg-white border border-[rgba(201,155,74,0.08)] rounded-2xl p-6 space-y-6">
              <h2 className="text-lg font-semibold text-[#2b241d]">פרטי העסקה</h2>

              {/* Status */}
              <div className={`p-4 rounded-xl border ${status.bg}`}>
                <div className="flex items-center gap-3">
                  <StatusIcon size={24} className={status.color} />
                  <div>
                    <p className="text-[#a89b8a] text-sm">סטטוס</p>
                    <p className={`text-lg font-semibold ${status.color}`}>{status.label}</p>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div>
                <p className="text-[#a89b8a] text-sm mb-1">סכום</p>
                <p className="text-3xl font-bold text-[#c99b4a]">
                  ₪{invoice.amount?.toLocaleString()}
                </p>
              </div>

              {/* Supplier */}
              <div className="flex items-start gap-3">
                <Building2 size={20} className="text-[#c99b4a]/70 mt-1" />
                <div>
                  <p className="text-[#a89b8a] text-sm">ספק</p>
                  <p className="text-[#2b241d] font-medium">
                    {invoice.supplier?.companyName || invoice.supplier?.user?.name || 'לא ידוע'}
                  </p>
                </div>
              </div>

              {/* Architect */}
              <div className="flex items-start gap-3">
                <User size={20} className="text-[#c99b4a]/70 mt-1" />
                <div>
                  <p className="text-[#a89b8a] text-sm">אדריכל</p>
                  <p className="text-[#2b241d] font-medium">
                    {invoice.architect?.user?.name || invoice.architect?.user?.email || 'לא ידוע'}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-start gap-3">
                <Calendar size={20} className="text-[#c99b4a]/70 mt-1" />
                <div>
                  <p className="text-[#a89b8a] text-sm">תאריך העלאה</p>
                  <p className="text-[#2b241d]">
                    {new Date(invoice.createdAt).toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* AI Validation */}
              {invoice.aiStatus && (
                <div className={`p-4 rounded-xl border ${
                  invoice.aiStatus === 'MATCH' ? 'bg-[#c99b4a]/10 border-[#c99b4a]/30' :
                  invoice.aiStatus === 'MISMATCH' ? 'bg-red-500/10 border-red-500/30' :
                  'bg-yellow-500/10 border-yellow-500/30'
                }`}>
                  <p className="text-[#a89b8a] text-sm mb-2">בדיקת AI</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8b7c69] text-sm">סכום שהוצהר:</span>
                      <span className="text-[#2b241d] font-semibold">₪{invoice.amount?.toLocaleString()}</span>
                    </div>
                    {invoice.aiExtractedAmount !== undefined && invoice.aiExtractedAmount !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#8b7c69] text-sm">סכום שזוהה:</span>
                        <span className={`font-semibold ${invoice.aiStatus === 'MATCH' ? 'text-[#c99b4a]' : 'text-red-400'}`}>
                          ₪{invoice.aiExtractedAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[#8b7c69] text-sm">סטטוס:</span>
                      <div className="flex items-center gap-1.5">
                        {invoice.aiStatus === 'MATCH' ? <CheckCircle size={14} className="text-[#c99b4a]" /> : <AlertTriangle size={14} className="text-yellow-400" />}
                        <span className={invoice.aiStatus === 'MATCH' ? 'text-[#c99b4a] text-sm' : 'text-yellow-400 text-sm'}>
                          {invoice.aiStatus === 'MATCH' ? 'תואם' : invoice.aiStatus === 'MISMATCH' ? 'לא תואם' : 'לא ברור'}
                        </span>
                      </div>
                    </div>
                    {invoice.aiConfidence !== undefined && invoice.aiConfidence !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#8b7c69] text-sm">ביטחון:</span>
                        <span className="text-[#8b7c69] text-sm">{Math.round(invoice.aiConfidence * 100)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Back Button */}
              <Link href="/invoices" className="block w-full py-3 bg-gradient-to-r from-[#c99b4a] to-[#9e7746] text-white text-center rounded-xl font-semibold hover:from-[#9e7746] hover:to-[#8a6a3d] transition-colors">
                חזרה לרשימת החשבוניות
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
