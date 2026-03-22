'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { ArrowLeft, FileText, Calendar, Building2, User, CheckCircle, Clock, XCircle, AlertTriangle, FileIcon, Download } from 'lucide-react';
import Link from 'next/link';
import { useInvoice } from '@/lib/api-hooks';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_ADMIN: { label: 'ממתין לאישור', color: 'text-yellow-400', icon: Clock },
  APPROVED: { label: 'מאושר', color: 'text-green-400', icon: CheckCircle },
  REJECTED: { label: 'נדחה', color: 'text-red-400', icon: XCircle },
  PENDING_SUPPLIER_PAY: { label: 'ממתין לתשלום', color: 'text-blue-400', icon: Clock },
  PAID: { label: 'שולם', color: 'text-green-400', icon: CheckCircle },
  OVERDUE: { label: 'באיחור', color: 'text-red-400', icon: AlertTriangle },
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
      <div className="relative">
        <PageSlider images={sliderImages.invoices} />
        <div className="p-6 max-w-4xl mx-auto relative z-10">
          <GlassCard className="text-center py-12">
            <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">חשבונית לא נמצאה</h1>
            <p className="text-gray-500 mb-6">החשבונית המבוקשת לא נמצאה או שאין לך הרשאה לצפות בה</p>
            <Link href="/invoices" className="btn-gold inline-block">
              חזרה לחשבוניות
            </Link>
          </GlassCard>
        </div>
      </div>
    );
  }

  const status = statusConfig[invoice.status] || statusConfig.PENDING_ADMIN;
  const StatusIcon = status.icon;

  return (
    <div className="relative">
      <PageSlider images={sliderImages.invoices} />
      <div className="p-6 max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">פרטי חשבונית</h1>
            <p className="text-gray-500 mt-1">#{invoice.id.slice(-8)}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Invoice Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} />
                תמונת החשבונית
              </h2>
              {invoice.imageUrl ? (
                invoice.imageUrl.toLowerCase().endsWith('.pdf') ? (
                  // PDF Display
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-8 flex flex-col items-center">
                      <div className="w-24 h-28 bg-red-500/20 border-2 border-red-500/50 rounded-lg flex items-center justify-center mb-4">
                        <FileIcon size={48} className="text-red-400" />
                      </div>
                      <p className="text-gray-900 font-medium mb-1">קובץ PDF</p>
                      <p className="text-gray-500 text-sm">לחץ למטה לצפייה או הורדה</p>
                    </div>
                    <div className="flex gap-3">
                      <a
                        href={invoice.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 btn-primary flex items-center justify-center gap-2"
                      >
                        <FileText size={18} />
                        פתח PDF
                      </a>
                      <a
                        href={invoice.imageUrl}
                        download
                        className="flex-1 btn-gold flex items-center justify-center gap-2"
                      >
                        <Download size={18} />
                        הורד
                      </a>
                    </div>
                  </div>
                ) : (
                  // Image Display
                  <a
                    href={invoice.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={invoice.imageUrl}
                      alt="חשבונית"
                      className="w-full rounded-lg object-contain max-h-96 hover:opacity-90 transition-opacity cursor-zoom-in"
                    />
                    <p className="text-center text-gray-500 text-sm mt-2">לחץ להגדלה</p>
                  </a>
                )
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">אין תמונה</p>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Invoice Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">פרטי העסקה</h2>

              {/* Status */}
              <div className="mb-6 p-4 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <StatusIcon size={24} className={status.color} />
                  <div>
                    <p className="text-gray-500 text-sm">סטטוס</p>
                    <p className={`text-lg font-semibold ${status.color}`}>{status.label}</p>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="mb-6">
                <p className="text-gray-500 text-sm mb-1">סכום</p>
                <p className="text-3xl font-bold text-gold-500">
                  ₪{invoice.amount?.toLocaleString()}
                </p>
              </div>

              {/* Supplier */}
              <div className="mb-4 flex items-start gap-3">
                <Building2 size={20} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-gray-500 text-sm">ספק</p>
                  <p className="text-gray-900">
                    {invoice.supplier?.companyName || invoice.supplier?.user?.name || 'לא ידוע'}
                  </p>
                </div>
              </div>

              {/* Architect */}
              <div className="mb-4 flex items-start gap-3">
                <User size={20} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-gray-500 text-sm">אדריכל</p>
                  <p className="text-gray-900">
                    {invoice.architect?.user?.name || invoice.architect?.user?.email || 'לא ידוע'}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="mb-6 flex items-start gap-3">
                <Calendar size={20} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-gray-500 text-sm">תאריך העלאה</p>
                  <p className="text-gray-900">
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
                <div className="p-4 rounded-lg bg-gray-50 mb-6">
                  <p className="text-gray-500 text-sm mb-2">בדיקת AI</p>
                  <div className="flex items-center gap-2">
                    {invoice.aiStatus === 'MATCH' ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <AlertTriangle size={16} className="text-yellow-500" />
                    )}
                    <span className={invoice.aiStatus === 'MATCH' ? 'text-green-600' : 'text-yellow-600'}>
                      {invoice.aiStatus === 'MATCH' ? 'הסכום תואם' : 'אי-התאמה'}
                    </span>
                    {invoice.aiConfidence && (
                      <span className="text-gray-500 text-sm">
                        ({Math.round(invoice.aiConfidence * 100)}% ביטחון)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Back Button */}
              <Link href="/invoices" className="btn-gold w-full text-center block">
                חזרה לרשימת החשבוניות
              </Link>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
