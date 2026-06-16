'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
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
  company?: string;
  role: string;
  rank: string;
  isActive: boolean;
  createdAt: string;
  architectProfile?: {
    id: string;
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
  SILVER: 'text-gray-400',
  GOLD: 'text-[#c99b4a]',
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
        background: '#f7f3f2',
        color: '#2b241d',
        confirmButtonColor: '#c99b4a',
      });
    } catch (error) {
      Swal.fire({
        title: 'שימו לב',
        text: 'לא הצלחנו לעדכן את הסטטוס. נסו שוב',
        icon: 'warning',
        confirmButtonText: 'אישור',
        background: '#f7f3f2',
        color: '#2b241d',
        confirmButtonColor: '#c99b4a',
      });
    }
  };

  const filteredArchitects = architects.filter(a => {
    const matchesSearch = !searchTerm ||
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.company && a.company.toLowerCase().includes(searchTerm.toLowerCase()));
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
    <div className="min-h-screen pt-8 pb-24">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[#8b7c69] hover:text-[#2b241d] mb-4 transition-colors"
          >
            <ArrowRight size={18} />
            חזרה לפאנל ניהול
          </Link>
          <h1 className="text-3xl font-display font-bold text-[#2b241d] flex items-center gap-3">
            <Users className="text-[#c99b4a]" />
            ניהול אדריכלים
          </h1>
          <p className="text-[#8b7c69] mt-1">צפייה וניהול כל האדריכלים במערכת</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-4 sm:p-6">
            <div className="text-center">
              <p className="text-[#a89b8a] text-xs sm:text-sm">סה״כ אדריכלים</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#2b241d]">{stats.total}</p>
            </div>
          </div>
          <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-4 sm:p-6 bg-[#c99b4a]/10">
            <div className="text-center">
              <p className="text-[#c99b4a]/70 text-xs sm:text-sm">פעילים</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#c99b4a]">{stats.active}</p>
            </div>
          </div>
          <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-4 sm:p-6 bg-[#c99b4a]/15">
            <div className="text-center overflow-hidden">
              <p className="text-[#c99b4a]/70 text-xs sm:text-sm">סה״כ נקודות</p>
              <p className={`font-bold text-[#c99b4a] ${String(stats.totalPoints).length > 6 ? 'text-lg sm:text-2xl' : 'text-2xl sm:text-3xl'}`}>{stats.totalPoints.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-4 sm:p-6 bg-blue-50">
            <div className="text-center overflow-hidden">
              <p className="text-blue-400/70 text-xs sm:text-sm">סה״כ הרוויחו</p>
              <p className={`font-bold text-blue-400 ${String(stats.totalEarned).length > 6 ? 'text-lg sm:text-2xl' : 'text-2xl sm:text-3xl'}`}>₪{stats.totalEarned.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89b8a]" size={18} />
                  <input
                    type="text"
                    placeholder="חיפוש לפי שם, אימייל או חברה..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl px-10 py-3 text-[#2b241d] placeholder:text-[#a89b8a]"
                  />
                </div>
              </div>
              <select
                value={filterActive === null ? '' : filterActive.toString()}
                onChange={(e) => setFilterActive(e.target.value === '' ? null : e.target.value === 'true')}
                className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl px-4 py-3 text-[#2b241d]"
              >
                <option value="">כל הסטטוסים</option>
                <option value="true">פעילים בלבד</option>
                <option value="false">לא פעילים בלבד</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Architects List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 mx-auto text-[#c99b4a] animate-spin" />
                <p className="text-[#8b7c69] mt-4">טוען אדריכלים...</p>
              </div>
            ) : filteredArchitects.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-[#a89b8a]/40 mb-4" />
                <p className="text-[#8b7c69]">אין אדריכלים להצגה</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(201,155,74,0.08)]">
                      <th className="py-3 px-4 text-right text-[#8b7c69] font-medium">אדריכל</th>
                      <th className="py-3 px-4 text-right text-[#8b7c69] font-medium">דרגה</th>
                      <th className="py-3 px-4 text-right text-[#8b7c69] font-medium">נקודות</th>
                      <th className="py-3 px-4 text-right text-[#8b7c69] font-medium">סה״כ הרוויח</th>
                      <th className="py-3 px-4 text-right text-[#8b7c69] font-medium">סטטוס</th>
                      <th className="py-3 px-4 text-right text-[#8b7c69] font-medium">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArchitects.map((architect) => (
                      <tr
                        key={architect.id}
                        className="border-b border-[rgba(201,155,74,0.04)] hover:bg-[#f0ebe6] transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-[#2b241d] font-medium">{architect.name}</p>
                            <p className="text-[#a89b8a] text-sm flex items-center gap-1">
                              <Mail size={12} /> {architect.email}
                            </p>
                            {architect.company && (
                              <p className="text-[#a89b8a]/70 text-xs flex items-center gap-1">
                                <Building2 size={10} /> {architect.company}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`flex items-center gap-1 ${RANK_COLORS[architect.rank] || 'text-[#2b241d]'}`}>
                            <Award size={16} />
                            {RANK_LABELS[architect.rank] || architect.rank}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-[#c99b4a] font-bold">
                            {(architect.architectProfile?.pointsBalance || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-[#2b241d] font-medium">
                            ₪{(architect.architectProfile?.totalEarned || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleToggleActive(architect)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                              architect.isActive
                                ? 'bg-[#c99b4a]/20 text-[#c99b4a]'
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
                            className="p-2 rounded-lg hover:bg-[#f0ebe6] text-[#8b7c69] hover:text-[#2b241d] transition-colors"
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
          </div>
        </motion.div>

        {/* Detail Modal */}
        {selectedArchitect && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg"
            >
              <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
                <div className="flex items-start justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#2b241d]">פרטי אדריכל</h2>
                  <button
                    onClick={() => setSelectedArchitect(null)}
                    className="text-[#8b7c69] hover:text-[#2b241d]"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-[#f7f3f2] rounded-xl">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      RANK_COLORS[selectedArchitect.rank]?.replace('text-', 'bg-').replace('400', '500/20') || 'bg-[#f7f3f2]'
                    }`}>
                      <Award className={RANK_COLORS[selectedArchitect.rank]} size={24} />
                    </div>
                    <div>
                      <p className="text-[#2b241d] font-bold text-lg">{selectedArchitect.name}</p>
                      <p className={RANK_COLORS[selectedArchitect.rank]}>
                        {RANK_LABELS[selectedArchitect.rank]}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-[#f7f3f2] rounded-lg">
                      <p className="text-[#a89b8a] text-sm">אימייל</p>
                      <p className="text-[#2b241d]">{selectedArchitect.email}</p>
                    </div>
                    <div className="p-3 bg-[#f7f3f2] rounded-lg">
                      <p className="text-[#a89b8a] text-sm">טלפון</p>
                      <p className="text-[#2b241d]">{selectedArchitect.phone || '-'}</p>
                    </div>
                    <div className="p-3 bg-[#f7f3f2] rounded-lg">
                      <p className="text-[#a89b8a] text-sm">חברה</p>
                      <p className="text-[#2b241d]">{selectedArchitect.company || '-'}</p>
                    </div>
                    <div className="p-3 bg-[#f7f3f2] rounded-lg">
                      <p className="text-[#a89b8a] text-sm">הצטרף</p>
                      <p className="text-[#2b241d]">{new Date(selectedArchitect.createdAt).toLocaleDateString('he-IL')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-[#c99b4a]/15 rounded-lg text-center">
                      <Wallet className="mx-auto text-[#c99b4a] mb-1" size={20} />
                      <p className="text-[#c99b4a]/70 text-xs">נקודות</p>
                      <p className="text-[#c99b4a] font-bold">
                        {(selectedArchitect.architectProfile?.pointsBalance || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-[#c99b4a]/10 rounded-lg text-center">
                      <FileText className="mx-auto text-[#c99b4a] mb-1" size={20} />
                      <p className="text-[#c99b4a]/70 text-xs">סה״כ הרוויח</p>
                      <p className="text-[#c99b4a] font-bold">
                        ₪{(selectedArchitect.architectProfile?.totalEarned || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
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
                    className="w-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] text-[#2b241d] py-3 rounded-xl hover:bg-[#f0ebe6] transition-colors"
                  >
                    סגור
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
