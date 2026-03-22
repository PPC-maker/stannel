'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
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
  EXCLUSIVE: { label: 'בלעדי', color: 'text-gold-400', bg: 'bg-gold-500/20' },
};

export default function ManageContractsPage() {
  const { isReady } = useAdminGuard();
  const { data: contracts, isLoading } = useContracts();
  const createContract = useCreateContract();
  const [showForm, setShowForm] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  const [formData, setFormData] = useState({
    supplierId: '',
    type: 'STANDARD' as 'STANDARD' | 'PREMIUM' | 'EXCLUSIVE',
    feePercent: 10,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createContract.mutateAsync(formData);
      setShowForm(false);
      setFormData({
        supplierId: '',
        type: 'STANDARD',
        feePercent: 10,
        validFrom: new Date().toISOString().split('T')[0],
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      Swal.fire({
        title: 'החוזה נוצר בהצלחה!',
        icon: 'success',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } catch (error) {
      Swal.fire({
        title: 'שגיאה',
        text: 'אירעה שגיאה ביצירת החוזה',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    }
  };

  const isContractActive = (contract: Contract) => {
    const now = new Date();
    const validFrom = new Date(contract.validFrom);
    const validTo = new Date(contract.validTo);
    return now >= validFrom && now <= validTo;
  };

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  return (
    <div className="relative min-h-screen">
      <PageSlider images={sliderImages.dashboard}  />
      <div className="p-6 max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowRight size={18} />
            חזרה לפאנל ניהול
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900 flex items-center gap-3">
                <FileText className="text-[#0066CC]" />
                ניהול חוזים
              </h1>
              <p className="text-gray-600 mt-1">יצירה וניהול חוזים עם ספקים</p>
            </div>
            <button
              onClick={handleOpenForm}
              className="btn-gold flex items-center gap-2"
            >
              <Plus size={18} />
              חוזה חדש
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <GlassCard hover={false}>
            <div className="text-center">
              <p className="text-gray-500 text-sm">סה״כ חוזים</p>
              <p className="text-3xl font-bold text-gray-900">{contracts?.length || 0}</p>
            </div>
          </GlassCard>
          <GlassCard hover={false} className="bg-green-500/10">
            <div className="text-center">
              <p className="text-green-400/70 text-sm">חוזים פעילים</p>
              <p className="text-3xl font-bold text-green-400">
                {contracts?.filter((c: Contract) => isContractActive(c)).length || 0}
              </p>
            </div>
          </GlassCard>
          <GlassCard hover={false} className="bg-purple-500/10">
            <div className="text-center">
              <p className="text-purple-400/70 text-sm">פרימיום</p>
              <p className="text-3xl font-bold text-purple-400">
                {contracts?.filter((c: Contract) => c.type === 'PREMIUM').length || 0}
              </p>
            </div>
          </GlassCard>
          <GlassCard hover={false} className="bg-gold-500/10">
            <div className="text-center">
              <p className="text-gold-400/70 text-sm">בלעדיים</p>
              <p className="text-3xl font-bold text-gold-400">
                {contracts?.filter((c: Contract) => c.type === 'EXCLUSIVE').length || 0}
              </p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Contracts List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard hover={false}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="text-[#0066CC]" size={20} />
              רשימת חוזים
            </h2>

            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 mx-auto text-gold-400 animate-spin" />
                <p className="text-gray-600 mt-4">טוען חוזים...</p>
              </div>
            ) : !contracts || contracts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">אין חוזים במערכת</p>
                <button
                  onClick={handleOpenForm}
                  className="btn-gold mt-4 flex items-center gap-2 mx-auto"
                >
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
                      className={`p-4 rounded-lg border ${
                        active ? 'border-green-500/30 bg-green-500/5' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${typeConfig.bg}`}>
                            <Award size={24} className={typeConfig.color} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-gray-900 font-bold">
                                {contract.supplier.companyName || contract.supplier.user.name}
                              </p>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${typeConfig.bg} ${typeConfig.color}`}>
                                {typeConfig.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-gray-500 text-sm">
                              <span className="flex items-center gap-1">
                                <Building2 size={12} />
                                ספק
                              </span>
                              <span className="flex items-center gap-1">
                                <Percent size={12} />
                                {contract.feePercent}% עמלה
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-1 mb-1">
                            {active ? (
                              <CheckCircle size={16} className="text-green-400" />
                            ) : (
                              <XCircle size={16} className="text-red-400" />
                            )}
                            <span className={active ? 'text-green-400' : 'text-red-400'}>
                              {active ? 'פעיל' : 'לא פעיל'}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(contract.validFrom).toLocaleDateString('he-IL')} -{' '}
                            {new Date(contract.validTo).toLocaleDateString('he-IL')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Create Contract Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md"
            >
              <GlassCard hover={false}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">יצירת חוזה חדש</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-gray-600 text-sm mb-2 block">ספק</label>
                    {loadingSuppliers ? (
                      <div className="text-center py-4">
                        <Loader2 className="w-6 h-6 mx-auto text-gold-400 animate-spin" />
                      </div>
                    ) : (
                      <select
                        value={formData.supplierId}
                        onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                        required
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900"
                      >
                        <option value="">בחר ספק</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.companyName || supplier.user.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-600 text-sm mb-2 block">סוג חוזה</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'STANDARD' | 'PREMIUM' | 'EXCLUSIVE' })}
                      className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900"
                    >
                      <option value="STANDARD">סטנדרטי</option>
                      <option value="PREMIUM">פרימיום</option>
                      <option value="EXCLUSIVE">בלעדי</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-600 text-sm mb-2 block">אחוז עמלה</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.feePercent}
                      onChange={(e) => setFormData({ ...formData, feePercent: parseInt(e.target.value) })}
                      required
                      className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-600 text-sm mb-2 block">תחילת תוקף</label>
                      <input
                        type="date"
                        value={formData.validFrom}
                        onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                        required
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="text-gray-600 text-sm mb-2 block">סיום תוקף</label>
                      <input
                        type="date"
                        value={formData.validTo}
                        onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                        required
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 btn-secondary"
                    >
                      ביטול
                    </button>
                    <button
                      type="submit"
                      disabled={createContract.isPending}
                      className="flex-1 btn-gold flex items-center justify-center gap-2"
                    >
                      {createContract.isPending ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Plus size={18} />
                      )}
                      צור חוזה
                    </button>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
