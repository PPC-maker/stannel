'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import { Upload, FileText, CheckCircle, AlertTriangle, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Mock suppliers
const suppliers = [
  { id: '1', name: 'אבני ירושלים בע״מ' },
  { id: '2', name: 'קרמיקה מודרנית' },
  { id: '3', name: 'עץ ואבן' },
  { id: '4', name: 'זכוכית בע״מ' },
  { id: '5', name: 'מתכות פרימיום' },
];

export default function InvoiceUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [aiResult, setAiResult] = useState<{ status: string; extractedAmount: number; confidence: number } | null>(null);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
      setAiResult(null);
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

  const handleSubmit = async () => {
    if (!file || !amount || !supplierId) return;

    setUploading(true);

    // Simulate upload and AI validation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock AI result
    const mockAiResult = {
      status: 'MATCH',
      extractedAmount: parseFloat(amount),
      confidence: 0.94,
    };

    setAiResult(mockAiResult);
    setUploading(false);

    // If match, show success
    if (mockAiResult.status === 'MATCH') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setAmount('');
    setSupplierId('');
    setAiResult(null);
    setSuccess(false);
  };

  if (success) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <GlassCard className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <CheckCircle size={40} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">החשבונית הועלתה בהצלחה!</h1>
            <p className="text-white/60 mb-8">
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
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/invoices" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <ArrowLeft size={24} className="text-white" />
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold text-white">העלאת חשבונית</h1>
          <p className="text-white/60 mt-1">העלו חשבונית לצבירת נקודות</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Zone */}
        <GlassCard>
          <h2 className="text-lg font-semibold text-white mb-4">תמונת החשבונית</h2>

          <div
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-gold-400 bg-gold-400/10'
                : preview
                ? 'border-green-400/50 bg-green-400/5'
                : 'border-white/20 hover:border-white/40 hover:bg-white/5'
            }`}
          >
            <input {...getInputProps()} />

            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="preview"
                  className="max-h-64 mx-auto rounded-lg object-contain"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreview(null);
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
                  <Upload size={32} className="text-white/60" />
                </div>
                <p className="text-white/70 mb-2">
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
          <h2 className="text-lg font-semibold text-white mb-4">פרטי העסקה</h2>

          <div className="space-y-5">
            <div>
              <label className="block text-white/70 text-sm mb-2">ספק</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-gold-400 transition-all appearance-none cursor-pointer"
              >
                <option value="" className="bg-primary-900">בחרו ספק...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id} className="bg-primary-900">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">סכום החשבונית (₪)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-xl font-bold focus:border-gold-400 transition-all"
                placeholder="0.00"
                dir="ltr"
              />
            </div>

            <div className="pt-4">
              <button
                onClick={handleSubmit}
                disabled={!file || !amount || !supplierId || uploading}
                className="w-full btn-gold py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
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

            <p className="text-white/40 text-sm text-center">
              החשבונית תיבדק על ידי מערכת AI ולאחר מכן תאושר על ידי מנהל
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
