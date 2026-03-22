'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { useAdminGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { adminApi } from '@stannel/api-client';
import {
  Users,
  Search,
  Mail,
  Phone,
  Building2,
  Wallet,
  FileText,
  ArrowRight,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  Award,
} from 'lucide-react';
import Swal from 'sweetalert2';
import Link from 'next/link';

interface Architect {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  rank: string;
  isActive: boolean;
  createdAt: string;
  architectProfile?: {
    id: string;
    company?: string;
    pointsBalance: number;
    cashBalance: number;
    totalEarned: number;
    _count?: {
      invoices: number;
    };
  };
}

const RANK_LABELS: Record<string, string> = {
  BRONZE: 'ברונזה',
  SILVER: 'כסף',
  GOLD: 'זהב',
  PLATINUM: 'פלטינה',
  DIAMOND: 'יהלום',
};

const RANK_COLORS: Record<string, string> = {
  BRONZE: 'text-amber-600',
  SILVER: 'text-gray-600',
  GOLD: 'text-gold-400',
  PLATINUM: 'text-cyan-400',
  DIAMOND: 'text-purple-400',
};

export default function AdminArchitectsPage() {
  const { isReady } = useAdminGuard();
  const [architects, setArchitects] = useState<Architect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [selectedArchitect, setSelectedArchitect] = useState<Architect | null>(null);

  useEffect(() => {
    loadArchitects();
  }, []);

  const loadArchitects = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getUsers({ role: 'ARCHITECT', pageSize: 100 });
      setArchitects(response.data as Architect[]);
    } catch (error) {
      console.error('Error loading architects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (architect: Architect) => {
    try {
      if (architect.isActive) {
        await adminApi.deactivateUser(architect.id);
      } else {
        await adminApi.activateUser(architect.id, false);
      }
      loadArchitects();
      Swal.fire({
        title: architect.isActive ? 'המשתמש הושבת' : 'המשתמש הופעל',
        icon: 'success',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } catch (error) {
      Swal.fire({
        title: 'שגיאה',
        text: 'אירעה שגיאה בעדכון הסטטוס',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    }
  };

  const filteredArchitects = architects.filter(a => {
    const matchesSearch = !searchTerm ||
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.architectProfile?.company && a.architectProfile.company.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesActive = filterActive === null || a.isActive === filterActive;
    return matchesSearch && matchesActive;
  });

  const stats = {
    total: architects.length,
    active: architects.filter(a => a.isActive).length,
    totalPoints: architects.reduce((sum, a) => sum + (a.architectProfile?.pointsBalance || 0), 0),
    totalEarned: architects.reduce((sum, a) => sum + (a.architectProfile?.totalEarned || 0), 0),
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
          <h1 className="text-3xl font-display font-bold text-gray-900 flex items-center gap-3">
            <Users className="text-[#0066CC]" />
            ניהול אדריכלים
          </h1>
          <p className="text-gray-600 mt-1">צפייה וניהול כל האדריכלים במערכת</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <GlassCard hover={false}>
            <div className="text-center">
              <p className="text-gray-500 text-sm">סה״כ אדריכלים</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </GlassCard>
          <GlassCard hover={false} className="bg-green-500/10">
            <div className="text-center">
              <p className="text-green-400/70 text-sm">פעילים</p>
              <p className="text-3xl font-bold text-green-400">{stats.active}</p>
            </div>
          </GlassCard>
          <GlassCard hover={false} className="bg-gold-500/10">
            <div className="text-center">
              <p className="text-gold-400/70 text-sm">סה״כ נקודות</p>
              <p className="text-3xl font-bold text-gold-400">{stats.totalPoints.toLocaleString()}</p>
            </div>
          </GlassCard>
          <GlassCard hover={false} className="bg-blue-500/10">
            <div className="text-center">
              <p className="text-blue-400/70 text-sm">סה״כ הרוויחו</p>
              <p className="text-3xl font-bold text-blue-400">₪{stats.totalEarned.toLocaleString()}</p>
            </div>
          </GlassCard>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <GlassCard hover={false}>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="חיפוש לפי שם, אימייל או חברה..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-100 border border-gray-200 rounded-lg px-10 py-2 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
              <select
                value={filterActive === null ? '' : filterActive.toString()}
                onChange={(e) => setFilterActive(e.target.value === '' ? null : e.target.value === 'true')}
                className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900"
              >
                <option value="">כל הסטטוסים</option>
                <option value="true">פעילים בלבד</option>
                <option value="false">לא פעילים בלבד</option>
              </select>
            </div>
          </GlassCard>
        </motion.div>

        {/* Architects List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard hover={false}>
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 mx-auto text-gold-400 animate-spin" />
                <p className="text-gray-600 mt-4">טוען אדריכלים...</p>
              </div>
            ) : filteredArchitects.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">אין אדריכלים להצגה</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 text-right text-gray-600 font-medium">אדריכל</th>
                      <th className="py-3 px-4 text-right text-gray-600 font-medium">דרגה</th>
                      <th className="py-3 px-4 text-right text-gray-600 font-medium">נקודות</th>
                      <th className="py-3 px-4 text-right text-gray-600 font-medium">סה״כ הרוויח</th>
                      <th className="py-3 px-4 text-right text-gray-600 font-medium">סטטוס</th>
                      <th className="py-3 px-4 text-right text-gray-600 font-medium">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArchitects.map((architect) => (
                      <tr
                        key={architect.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-gray-900 font-medium">{architect.name}</p>
                            <p className="text-gray-500 text-sm flex items-center gap-1">
                              <Mail size={12} /> {architect.email}
                            </p>
                            {architect.architectProfile?.company && (
                              <p className="text-gray-400 text-xs flex items-center gap-1">
                                <Building2 size={10} /> {architect.architectProfile.company}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`flex items-center gap-1 ${RANK_COLORS[architect.rank] || 'text-gray-900'}`}>
                            <Award size={16} />
                            {RANK_LABELS[architect.rank] || architect.rank}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gold-400 font-bold">
                            {(architect.architectProfile?.pointsBalance || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-900 font-medium">
                            ₪{(architect.architectProfile?.totalEarned || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleToggleActive(architect)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                              architect.isActive
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {architect.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            {architect.isActive ? 'פעיל' : 'מושבת'}
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => setSelectedArchitect(architect)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                            title="צפייה בפרטים"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Detail Modal */}
        {selectedArchitect && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg"
            >
              <GlassCard hover={false}>
                <div className="flex items-start justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">פרטי אדריכל</h2>
                  <button
                    onClick={() => setSelectedArchitect(null)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      RANK_COLORS[selectedArchitect.rank]?.replace('text-', 'bg-').replace('400', '500/20') || 'bg-gray-100'
                    }`}>
                      <Award className={RANK_COLORS[selectedArchitect.rank]} size={24} />
                    </div>
                    <div>
                      <p className="text-gray-900 font-bold text-lg">{selectedArchitect.name}</p>
                      <p className={RANK_COLORS[selectedArchitect.rank]}>
                        {RANK_LABELS[selectedArchitect.rank]}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-sm">אימייל</p>
                      <p className="text-gray-900">{selectedArchitect.email}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-sm">טלפון</p>
                      <p className="text-gray-900">{selectedArchitect.phone || '-'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-sm">חברה</p>
                      <p className="text-gray-900">{selectedArchitect.architectProfile?.company || '-'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-sm">הצטרף</p>
                      <p className="text-gray-900">{new Date(selectedArchitect.createdAt).toLocaleDateString('he-IL')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-gold-500/10 rounded-lg text-center">
                      <Wallet className="mx-auto text-gold-400 mb-1" size={20} />
                      <p className="text-gold-400/70 text-xs">נקודות</p>
                      <p className="text-gold-400 font-bold">
                        {(selectedArchitect.architectProfile?.pointsBalance || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg text-center">
                      <FileText className="mx-auto text-green-400 mb-1" size={20} />
                      <p className="text-green-400/70 text-xs">סה״כ הרוויח</p>
                      <p className="text-green-400 font-bold">
                        ₪{(selectedArchitect.architectProfile?.totalEarned || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg text-center">
                      <Wallet className="mx-auto text-blue-400 mb-1" size={20} />
                      <p className="text-blue-400/70 text-xs">יתרת מזומן</p>
                      <p className="text-blue-400 font-bold">
                        ₪{(selectedArchitect.architectProfile?.cashBalance || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setSelectedArchitect(null)}
                    className="w-full btn-secondary"
                  >
                    סגור
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
