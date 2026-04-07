'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { Upload, FileText, CheckCircle, AlertTriangle, X, ArrowLeft, Building2, FileIcon } from 'lucide-react';
import Link from 'next/link';
import { useUploadInvoice, useSuppliers } from '@/lib/api-hooks';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';

export default function InvoiceUploadPage() {
  const router = useRouter();
  const { isReady, user } = useAuthGuard();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [amount, setAmount] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [aiResult, setAiResult] = useState<{ status: string; extractedAmount: number; confidence: number } | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: suppliersData, isLoading: suppliersLoading } = useSuppliers(isReady);
  const suppliers = suppliersData?.data || [];
  const uploadMutation = useUploadInvoice();

  // Only ARCHITECT users can upload invoices - redirect others
  const isArchitect = user?.role === 'ARCHITECT';

  useEffect(() => {
    if (isReady && !isArchitect) {
      router.replace('/invoices');
    }
  }, [isReady, isArchitect, router]);

  // ALL hooks must be called before any conditional returns
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);
      const isFilePdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      setIsPdf(isFilePdf);
      setPreview(isFilePdf ? null : URL.createObjectURL(file));
      setAiResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  // Now we can have early returns
  if (!isReady || !isArchitect) {
    return <AuthGuardLoader />;
  }

  const handleSubmit = async () => {
    if (!file || !amount || !supplierId) return;

    setError(null);

    try {
      const formData = new FormData();
      // Text fields MUST come before the file for Fastify multipart to parse them
      formData.append('amount', amount);
      formData.append('supplierId', supplierId);
      formData.append('image', file);

      const result = await uploadMutation.mutateAsync(formData);

      // Show AI validation result if available
      if (result.aiValidation) {
        setAiResult({
          status: result.aiValidation.status || 'MATCH',
          extractedAmount: result.aiValidation.extractedAmount || parseFloat(amount),
          confidence: result.aiValidation.confidence || 0.9,
        });
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'אירעה שגיאה בהעלאת החשבונית');
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setIsPdf(false);
    setAmount('');
    setSupplierId('');
    setAiResult(null);
    setSuccess(false);
    setError(null);
  };

  if (success) {
    return (
      <div className="relative">
        <PageSlider images={sliderImages.invoiceUpload} />
        <div className="p-6 max-w-2xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GlassCard className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <CheckCircle size={40} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">החשבונית הועלתה בהצלחה!</h1>
              <p className="text-gray-700 mb-8">
                החשבונית נשלחה לאישור. נעדכן אותך ברגע שתאושר.
              </p>
              <div className="flex gap-4 justify-center">
                <button onClick={resetForm} className="btn-primary">
                  העלאת חשבונית נוספת
                </button>
                <Link href="/invoices" className="btn-gold">
                  צפייה בחשבוניות
                </Link>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show empty state if no suppliers
  const noSuppliers = !suppliersLoading && suppliers.length === 0;

  return (
    <div className="relative">
      <PageSlider images={sliderImages.invoiceUpload} />
      <div className="p-6 max-w-4xl mx-auto relative z-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/invoices" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={24} className="text-gray-900" />
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">העלאת חשבונית</h1>
          <p className="text-gray-700 mt-1">העלו חשבונית לצבירת נקודות</p>
        </div>
      </div>

      {/* No suppliers warning */}
      {noSuppliers && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <GlassCard className="text-center py-8">
            <Building2 size={48} className="mx-auto text-gold-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">אין ספקים זמינים</h2>
            <p className="text-gray-700 mb-4">
              כרגע אין ספקים פעילים במערכת. צור קשר עם מנהל המערכת להוספת ספקים.
            </p>
            <Link href="/invoices" className="btn-gold inline-block">
              חזרה לחשבוניות
            </Link>
          </GlassCard>
        </motion.div>
      )}

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/40"
        >
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle size={20} />
            <p>{error}</p>
          </div>
        </motion.div>
      )}

      {!noSuppliers && (
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Zone */}
        <GlassCard>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">תמונת החשבונית</h2>

          <div
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-gold-400 bg-gold-400/10'
                : (preview || isPdf)
                ? 'border-green-400/50 bg-green-400/5'
                : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />

            {preview || isPdf ? (
              <div className="relative">
                {isPdf ? (
                  // PDF Preview
                  <div className="flex flex-col items-center py-4">
                    <div className="w-20 h-24 bg-red-500/20 border-2 border-red-500/50 rounded-lg flex items-center justify-center mb-3">
                      <FileIcon size={40} className="text-red-400" />
                    </div>
                    <p className="text-gray-900 font-medium">{file?.name}</p>
                    <p className="text-gray-700 text-sm mt-1">קובץ PDF</p>
                  </div>
                ) : (
                  // Image Preview
                  <img
                    src={preview!}
                    alt="preview"
                    className="max-h-64 mx-auto rounded-lg object-contain"
                  />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreview(null);
                    setIsPdf(false);
                    setAiResult(null);
                  }}
                  className="absolute top-2 left-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Upload size={32} className="text-gray-600" />
                </div>
                <p className="text-gray-600 mb-2">
                  {isDragActive ? 'שחררו כאן...' : 'גררו חשבונית לכאן או לחצו לבחירה'}
                </p>
                <p className="text-gray-600 text-sm">JPG, PNG, PDF עד 10MB</p>
              </>
            )}
          </div>

          {/* AI Result */}
          {aiResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-4 rounded-lg ${
                aiResult.status === 'MATCH'
                  ? 'bg-green-500/20 border border-green-500/40'
                  : 'bg-yellow-500/20 border border-yellow-500/40'
              }`}
            >
              <div className="flex items-center gap-2">
                {aiResult.status === 'MATCH' ? (
                  <CheckCircle size={20} className="text-green-400" />
                ) : (
                  <AlertTriangle size={20} className="text-yellow-400" />
                )}
                <p className={aiResult.status === 'MATCH' ? 'text-green-400' : 'text-yellow-400'}>
                  {aiResult.status === 'MATCH'
                    ? `הסכום תואם (ביטחון: ${Math.round(aiResult.confidence * 100)}%)`
                    : `אי-התאמה: ה-AI זיהה ₪${aiResult.extractedAmount.toLocaleString()}`
                  }
                </p>
              </div>
            </motion.div>
          )}
        </GlassCard>

        {/* Form */}
        <GlassCard>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטי העסקה</h2>

          <div className="space-y-5">
            <div>
              <label className="block text-gray-600 text-sm mb-2">ספק</label>
              {suppliersLoading ? (
                <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-600 animate-pulse">
                  טוען ספקים...
                </div>
              ) : (
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-gold-400 transition-all appearance-none cursor-pointer"
                >
                  <option value="" className="bg-white">בחרו ספק...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id} className="bg-white">
                      {s.companyName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-gray-600 text-sm mb-2">סכום החשבונית (₪)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-xl font-bold focus:border-gold-400 transition-all"
                placeholder="0.00"
                dir="ltr"
              />
            </div>

            <div className="pt-4">
              <button
                onClick={handleSubmit}
                disabled={!file || !amount || !supplierId || uploadMutation.isPending}
                className="w-full btn-gold py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadMutation.isPending ? (
                  <>
                    <div className="spinner" />
                    <span>מעלה ומנתח...</span>
                  </>
                ) : (
                  <>
                    <FileText size={20} />
                    <span>שליחה לאישור</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-gray-600 text-sm text-center">
              החשבונית תיבדק על ידי מערכת AI ולאחר מכן תאושר על ידי מנהל
            </p>
          </div>
        </GlassCard>
        </div>
      )}
      </div>
    </div>
  );
}
