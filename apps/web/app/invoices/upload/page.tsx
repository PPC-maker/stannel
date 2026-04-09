'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Upload, FileText, CheckCircle, AlertTriangle, X, ArrowRight, Building2, FileIcon } from 'lucide-react';
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
      <div className="min-h-screen bg-[#0f2620] -mt-16">
        {/* Hero Section */}
        <div className="relative h-80 overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=2000&q=80"
            alt="Finance"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f2620]/60 via-[#0f2620]/70 to-[#0f2620]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_60%)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0f2620] to-transparent" />
        </div>

        <div className="px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto -mt-32 relative z-10 pb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <CheckCircle size={40} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">החשבונית הועלתה בהצלחה!</h1>
              <p className="text-white/60 mb-8">
                החשבונית נשלחה לאישור. נעדכן אותך ברגע שתאושר.
              </p>
              <div className="flex gap-4 justify-center">
                <button onClick={resetForm} className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium">
                  העלאת חשבונית נוספת
                </button>
                <Link href="/invoices" className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-colors font-medium">
                  צפייה בחשבוניות
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show empty state if no suppliers
  const noSuppliers = !suppliersLoading && suppliers.length === 0;

  return (
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero Section */}
      <div className="relative h-80 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=2000&q=80"
          alt="Finance"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2620]/60 via-[#0f2620]/70 to-[#0f2620]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0f2620] to-transparent" />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto -mt-40 relative z-10 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link href="/invoices" className="inline-flex items-center gap-2 text-white/60 hover:text-emerald-400 mb-4 transition-colors font-medium">
            <ArrowRight size={16} />
            חזרה לחשבוניות
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Upload className="text-emerald-400" />
            העלאת חשבונית
          </h1>
          <p className="text-white/60 mt-1">העלו חשבונית לצבירת נקודות</p>
        </motion.div>

        {/* No suppliers warning */}
        {noSuppliers && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center">
              <Building2 size={48} className="mx-auto text-emerald-400 mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">אין ספקים זמינים</h2>
              <p className="text-white/60 mb-4">
                כרגע אין ספקים פעילים במערכת. צור קשר עם מנהל המערכת להוספת ספקים.
              </p>
              <Link href="/invoices" className="inline-block px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium">
                חזרה לחשבוניות
              </Link>
            </div>
          </motion.div>
        )}

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/40"
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-4">תמונת החשבונית</h2>

              <div
                {...getRootProps()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                  isDragActive
                    ? 'border-emerald-400 bg-emerald-400/10'
                    : (preview || isPdf)
                    ? 'border-emerald-400/50 bg-emerald-400/5'
                    : 'border-white/20 hover:border-emerald-400/50 hover:bg-white/5'
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
                        <p className="text-white font-medium">{file?.name}</p>
                        <p className="text-white/60 text-sm mt-1">קובץ PDF</p>
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
                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-white/10 flex items-center justify-center">
                      <Upload size={32} className="text-emerald-400" />
                    </div>
                    <p className="text-white/60 mb-2">
                      {isDragActive ? 'שחררו כאן...' : 'גררו חשבונית לכאן או לחצו לבחירה'}
                    </p>
                    <p className="text-white/40 text-sm">JPG, PNG, PDF עד 10MB</p>
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
                      ? 'bg-emerald-500/20 border border-emerald-500/40'
                      : 'bg-yellow-500/20 border border-yellow-500/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {aiResult.status === 'MATCH' ? (
                      <CheckCircle size={20} className="text-emerald-400" />
                    ) : (
                      <AlertTriangle size={20} className="text-yellow-400" />
                    )}
                    <p className={aiResult.status === 'MATCH' ? 'text-emerald-400' : 'text-yellow-400'}>
                      {aiResult.status === 'MATCH'
                        ? `הסכום תואם (ביטחון: ${Math.round(aiResult.confidence * 100)}%)`
                        : `אי-התאמה: ה-AI זיהה ₪${aiResult.extractedAmount.toLocaleString()}`
                      }
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-4">פרטי העסקה</h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-white/60 text-sm mb-2">ספק</label>
                  {suppliersLoading ? (
                    <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/40 animate-pulse">
                      טוען ספקים...
                    </div>
                  ) : (
                    <select
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-400 transition-all appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-[#0f2620]">בחרו ספק...</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id} className="bg-[#0f2620]">
                          {s.companyName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-2">סכום החשבונית (₪)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xl font-bold focus:border-emerald-400 transition-all"
                    placeholder="0.00"
                    dir="ltr"
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={!file || !amount || !supplierId || uploadMutation.isPending}
                    className="w-full py-4 text-lg bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

                <p className="text-white/40 text-sm text-center">
                  החשבונית תיבדק על ידי מערכת AI ולאחר מכן תאושר על ידי מנהל
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
