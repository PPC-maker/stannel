'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAdminGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { useContracts, useCreateContract } from '@/lib/api-hooks';
import { adminApi } from '@stannel/api-client';
import {
  FileText,
  ArrowRight,
  Loader2,
  Plus,
  Building2,
  Calendar,
  Percent,
  CheckCircle,
  XCircle,
  Award,
  Upload,
  Eye,
  X,
  ExternalLink,
  FileUp,
  StickyNote,
} from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';

interface Contract {
  id: string;
  type: 'STANDARD' | 'PREMIUM' | 'EXCLUSIVE';
  feePercent: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  documentUrl?: string;
  notes?: string;
  createdAt: string;
  supplier: {
    id: string;
    companyName?: string;
    user: { name: string };
  };
}

interface Supplier {
  id: string;
  companyName?: string;
  user: { name: string; email: string };
}

const CONTRACT_TYPES = {
  STANDARD: { label: 'סטנדרטי', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  PREMIUM: { label: 'פרימיום', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  EXCLUSIVE: { label: 'בלעדי', color: 'text-[#c99b4a]', bg: 'bg-[#c99b4a]/15' },
};

export default function ManageContractsPage() {
  const { isReady } = useAdminGuard();
  const { data: contracts, isLoading } = useContracts();
  const createContract = useCreateContract();
  const [showForm, setShowForm] = useState(false);
  const [viewContract, setViewContract] = useState<Contract | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docFileName, setDocFileName] = useState('');

  const [formData, setFormData] = useState({
    supplierId: '',
    type: 'STANDARD' as 'STANDARD' | 'PREMIUM' | 'EXCLUSIVE',
    feePercent: 10,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    documentUrl: '',
    notes: '',
  });

  const loadSuppliers = async () => {
    if (suppliers.length > 0) return;
    setLoadingSuppliers(true);
    try {
      const response = await adminApi.getUsers({ role: 'SUPPLIER', pageSize: 100 });
      const supplierUsers = response.data.filter((u: { supplierProfile: unknown }) => u.supplierProfile);
      setSuppliers(supplierUsers.map((u: { supplierProfile: { id: string; companyName?: string }; name: string; email: string }) => ({
        id: u.supplierProfile.id,
        companyName: u.supplierProfile.companyName,
        user: { name: u.name, email: u.email },
      })));
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleOpenForm = () => {
    loadSuppliers();
    setFormData({
      supplierId: '',
      type: 'STANDARD',
      feePercent: 10,
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      documentUrl: '',
      notes: '',
    });
    setDocFileName('');
    setShowForm(true);
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    setDocFileName(file.name);
    try {
      const result = await adminApi.uploadImage(file);
      setFormData(prev => ({ ...prev, documentUrl: result.url }));
      Swal.fire({ title: 'המסמך הועלה!', icon: 'success', timer: 1500, showConfirmButton: false, background: '#f7f3f2', color: '#2b241d' });
    } catch {
      Swal.fire({ title: 'שימו לב', text: 'לא ניתן להעלות את המסמך', icon: 'warning', background: '#f7f3f2', color: '#2b241d' });
      setDocFileName('');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createContract.mutateAsync(formData);
      setShowForm(false);
      Swal.fire({ title: 'החוזה נוצר בהצלחה!', icon: 'success', confirmButtonText: 'אישור', background: '#f7f3f2', color: '#2b241d', confirmButtonColor: '#c99b4a' });
    } catch {
      Swal.fire({ title: 'שימו לב', text: 'לא הצלחנו ליצור את החוזה. נסו שוב', icon: 'warning', confirmButtonText: 'אישור', background: '#f7f3f2', color: '#2b241d', confirmButtonColor: '#c99b4a' });
    }
  };

  const getContractStatus = (contract: Contract): 'active' | 'pending' | 'expired' => {
    const now = new Date();
    if (now < new Date(contract.validFrom)) return 'pending';
    if (now > new Date(contract.validTo)) return 'expired';
    return 'active';
  };
  const isContractActive = (contract: Contract) => getContractStatus(contract) === 'active';

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  return (
    <div className="min-h-screen pt-8 pb-24">

      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-[#8b7c69] hover:text-[#2b241d] mb-4 transition-colors">
            <ArrowRight size={18} />
            חזרה לפאנל ניהול
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold text-[#2b241d] flex items-center gap-3">
              <FileText className="text-[#c99b4a]" />
              ניהול חוזים
            </h1>
            <p className="text-[#8b7c69] mt-1">יצירה, צפייה וניהול חוזים עם ספקים</p>
          </div>
          <button
            onClick={handleOpenForm}
            className="w-[90%] mx-auto mt-4 flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-[#c99b4a] text-white hover:bg-[#9e7746] transition-all font-bold text-base hover:scale-105 active:scale-100"
            style={{ boxShadow: '0 4px 16px rgba(201,155,74,0.35)' }}
          >
            <Plus size={18} />
            חוזה חדש
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6 text-center">
            <p className="text-[#a89b8a] text-sm">סה״כ חוזים</p>
            <p className="text-3xl font-bold text-[#2b241d]">{contracts?.length || 0}</p>
          </div>
          <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6 bg-[#c99b4a]/10 text-center">
            <p className="text-[#c99b4a]/70 text-sm">פעילים</p>
            <p className="text-3xl font-bold text-[#c99b4a]">{contracts?.filter((c: Contract) => isContractActive(c)).length || 0}</p>
          </div>
          <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6 bg-purple-50 text-center">
            <p className="text-purple-600/70 text-sm">פרימיום</p>
            <p className="text-3xl font-bold text-purple-600">{contracts?.filter((c: Contract) => c.type === 'PREMIUM').length || 0}</p>
          </div>
          <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6 bg-[#c99b4a]/10 text-center">
            <p className="text-[#c99b4a]/70 text-sm">בלעדיים</p>
            <p className="text-3xl font-bold text-[#c99b4a]">{contracts?.filter((c: Contract) => c.type === 'EXCLUSIVE').length || 0}</p>
          </div>
        </motion.div>

        {/* Contracts List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-[#2b241d] mb-4 flex items-center gap-2">
              <FileText className="text-[#c99b4a]" size={20} />
              רשימת חוזים
            </h2>

            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 mx-auto text-[#c99b4a] animate-spin" />
                <p className="text-[#8b7c69] mt-4">טוען חוזים...</p>
              </div>
            ) : !contracts || contracts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-[#a89b8a] mb-4" />
                <p className="text-[#8b7c69] mb-4">אין חוזים במערכת</p>
                <button onClick={handleOpenForm} className="bg-[#c99b4a] text-white hover:bg-[#9e7746] px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors">
                  <Plus size={18} />
                  צור חוזה ראשון
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {contracts.map((contract: Contract) => {
                  const typeConfig = CONTRACT_TYPES[contract.type];
                  const active = isContractActive(contract);

                  return (
                    <div
                      key={contract.id}
                      className={`p-4 rounded-xl border cursor-pointer hover:bg-[#f0ebe6] transition-colors ${active ? 'border-[#c99b4a]/20 bg-[#c99b4a]/5' : 'border-[rgba(201,155,74,0.08)] bg-[#f7f3f2]'}`}
                      onClick={() => setViewContract(contract)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${typeConfig.bg}`}>
                            <Award size={24} className={typeConfig.color} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-[#2b241d] font-bold">{contract.supplier.companyName || contract.supplier.user.name}</p>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${typeConfig.bg} ${typeConfig.color}`}>{typeConfig.label}</span>
                              {contract.documentUrl && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 flex items-center gap-1">
                                  <FileUp size={10} />
                                  מסמך
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-[#a89b8a] text-sm">
                              <span className="flex items-center gap-1">{contract.feePercent}% עמלה</span>
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(contract.validFrom).toLocaleDateString('he-IL')} - {new Date(contract.validTo).toLocaleDateString('he-IL')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <div className="flex items-center gap-1 mb-1">
                              {active ? <CheckCircle size={16} className="text-[#c99b4a]" /> : <XCircle size={16} className="text-red-400" />}
                              <span className={active ? 'text-[#c99b4a] text-sm' : getContractStatus(contract) === 'pending' ? 'text-blue-400 text-sm' : 'text-red-400 text-sm'}>{active ? 'פעיל' : getContractStatus(contract) === 'pending' ? 'ממתין להפעלה' : 'לא פעיל'}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setViewContract(contract); }}
                            className="p-2 rounded-lg bg-[#f7f3f2] hover:bg-[#f0ebe6] text-[#8b7c69] hover:text-[#2b241d] transition-colors"
                            title="צפייה בפרטים"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── View Contract Detail Modal ── */}
        <AnimatePresence>
          {viewContract && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewContract(null)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[#2b241d] flex items-center gap-2">
                      <FileText className="text-[#c99b4a]" size={22} />
                      פרטי חוזה
                    </h2>
                    <button onClick={() => setViewContract(null)} className="text-[#8b7c69] hover:text-[#2b241d] p-1">
                      <X size={22} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Supplier */}
                    <div className="flex items-center gap-3 p-3 bg-[#f7f3f2] rounded-xl">
                      <Building2 className="text-[#c99b4a]" size={20} />
                      <div>
                        <p className="text-[#a89b8a] text-xs">ספק</p>
                        <p className="text-[#2b241d] font-bold">{viewContract.supplier.companyName || viewContract.supplier.user.name}</p>
                      </div>
                    </div>

                    {/* Type + Fee */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-[#f7f3f2] rounded-xl">
                        <p className="text-[#a89b8a] text-xs mb-1">סוג חוזה</p>
                        <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${CONTRACT_TYPES[viewContract.type].bg} ${CONTRACT_TYPES[viewContract.type].color}`}>
                          {CONTRACT_TYPES[viewContract.type].label}
                        </span>
                      </div>
                      <div className="p-3 bg-[#f7f3f2] rounded-xl">
                        <p className="text-[#a89b8a] text-xs mb-1">אחוז עמלה</p>
                        <p className="text-[#2b241d] font-bold text-lg">{viewContract.feePercent}%</p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-[#f7f3f2] rounded-xl">
                        <p className="text-[#a89b8a] text-xs mb-1">תחילת תוקף</p>
                        <p className="text-[#2b241d] font-medium">{new Date(viewContract.validFrom).toLocaleDateString('he-IL')}</p>
                      </div>
                      <div className="p-3 bg-[#f7f3f2] rounded-xl">
                        <p className="text-[#a89b8a] text-xs mb-1">סיום תוקף</p>
                        <p className="text-[#2b241d] font-medium">{new Date(viewContract.validTo).toLocaleDateString('he-IL')}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="p-3 bg-[#f7f3f2] rounded-xl flex items-center justify-between">
                      <span className="text-[#a89b8a] text-sm">סטטוס</span>
                      <span className={`flex items-center gap-1.5 font-medium ${isContractActive(viewContract) ? 'text-[#c99b4a]' : 'text-red-400'}`}>
                        {isContractActive(viewContract) ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {getContractStatus(viewContract) === 'active' ? 'פעיל' : getContractStatus(viewContract) === 'pending' ? 'ממתין להפעלה' : 'לא פעיל'}
                      </span>
                    </div>

                    {/* Notes */}
                    {viewContract.notes && (
                      <div className="p-3 bg-[#f7f3f2] rounded-xl">
                        <p className="text-[#a89b8a] text-xs mb-1 flex items-center gap-1"><StickyNote size={12} /> הערות</p>
                        <p className="text-[#2b241d] text-sm">{viewContract.notes}</p>
                      </div>
                    )}

                    {/* Document */}
                    {viewContract.documentUrl ? (
                      <a
                        href={viewContract.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-[#c99b4a]/10 border border-[#c99b4a]/20 rounded-xl hover:bg-[#c99b4a]/20 transition-colors"
                      >
                        <FileUp className="text-[#c99b4a]" size={22} />
                        <div className="flex-1">
                          <p className="text-[#c99b4a] font-bold">צפייה במסמך החוזה</p>
                          <p className="text-[#c99b4a]/60 text-xs">לחץ לפתיחה בחלון חדש</p>
                        </div>
                        <ExternalLink className="text-[#c99b4a]" size={18} />
                      </a>
                    ) : (
                      <div className="p-4 bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl text-center">
                        <FileUp className="mx-auto text-[#a89b8a] mb-2" size={24} />
                        <p className="text-[#a89b8a] text-sm">לא הועלה מסמך לחוזה זה</p>
                      </div>
                    )}

                    {/* Created date */}
                    <p className="text-[#a89b8a] text-xs text-center">נוצר ב-{new Date(viewContract.createdAt).toLocaleDateString('he-IL')}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Create Contract Modal ── */}
        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md">
                <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[#2b241d]">יצירת חוזה חדש</h2>
                    <button onClick={() => setShowForm(false)} className="text-[#8b7c69] hover:text-[#2b241d] p-1"><X size={22} /></button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Supplier */}
                    <div>
                      <label className="text-[#8b7c69] text-sm mb-2 block">ספק *</label>
                      {loadingSuppliers ? (
                        <div className="text-center py-4"><Loader2 className="w-6 h-6 mx-auto text-[#c99b4a] animate-spin" /></div>
                      ) : (
                        <select
                          value={formData.supplierId}
                          onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                          required
                          className="w-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl px-4 py-3 text-[#2b241d]"
                        >
                          <option value="">בחר ספק</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>{s.companyName || s.user.name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Type */}
                    <div>
                      <label className="text-[#8b7c69] text-sm mb-2 block">סוג חוזה</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                        className="w-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl px-4 py-3 text-[#2b241d]"
                      >
                        <option value="STANDARD">סטנדרטי</option>
                        <option value="PREMIUM">פרימיום</option>
                        <option value="EXCLUSIVE">בלעדי</option>
                      </select>
                    </div>

                    {/* Fee */}
                    <div>
                      <label className="text-[#8b7c69] text-sm mb-2 block">אחוז עמלה</label>
                      <input
                        type="number" min="0" max="100"
                        value={formData.feePercent}
                        onChange={(e) => setFormData({ ...formData, feePercent: parseInt(e.target.value) })}
                        required
                        className="w-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl px-4 py-3 text-[#2b241d]"
                      />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[#8b7c69] text-sm mb-2 block">תחילת תוקף *</label>
                        <input
                          type="date" value={formData.validFrom}
                          onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                          required
                          className="w-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl px-4 py-3 text-[#2b241d]"
                        />
                      </div>
                      <div>
                        <label className="text-[#8b7c69] text-sm mb-2 block">סיום תוקף *</label>
                        <input
                          type="date" value={formData.validTo}
                          onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                          required
                          className="w-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl px-4 py-3 text-[#2b241d]"
                        />
                      </div>
                    </div>

                    {/* Document Upload */}
                    <div>
                      <label className="text-[#8b7c69] text-sm mb-2 block">העלאת מסמך חוזה</label>
                      <label className="flex items-center gap-3 p-4 bg-[#f7f3f2] border border-dashed border-[rgba(201,155,74,0.2)] rounded-xl cursor-pointer hover:bg-[#f0ebe6] transition-colors">
                        {uploadingDoc ? (
                          <Loader2 className="text-[#c99b4a] animate-spin" size={20} />
                        ) : (
                          <Upload className="text-[#c99b4a]" size={20} />
                        )}
                        <div className="flex-1">
                          {docFileName ? (
                            <p className="text-[#c99b4a] font-medium text-sm">{docFileName}</p>
                          ) : (
                            <>
                              <p className="text-[#2b241d] text-sm">לחץ להעלאת קובץ</p>
                              <p className="text-[#a89b8a] text-xs">PDF, DOC, JPG, PNG (עד 10MB)</p>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={handleDocUpload}
                          className="hidden"
                        />
                      </label>
                      {formData.documentUrl && (
                        <p className="text-[#c99b4a]/60 text-xs mt-1">✓ מסמך הועלה בהצלחה</p>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-[#8b7c69] text-sm mb-2 block">הערות</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="הערות לחוזה..."
                        className="w-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl px-4 py-3 text-[#2b241d] placeholder:text-[#a89b8a] min-h-[80px] resize-none"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex-1 bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] text-[#2b241d] py-3 rounded-xl hover:bg-[#f0ebe6] transition-colors font-medium"
                      >
                        ביטול
                      </button>
                      <button
                        type="submit"
                        disabled={createContract.isPending || uploadingDoc}
                        className="flex-1 bg-[#c99b4a] text-white hover:bg-[#9e7746] py-3 rounded-xl flex items-center justify-center gap-2 transition-colors font-bold disabled:opacity-50"
                      >
                        {createContract.isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                        צור חוזה
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
