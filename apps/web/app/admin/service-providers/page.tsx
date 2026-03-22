'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { useAdminGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import {
  useAdminServiceProviders,
  useCreateServiceProvider,
  useUpdateServiceProvider,
  useDeleteServiceProvider,
  useServiceProviderCategories,
} from '@/lib/api-hooks';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Globe,
  Loader2,
  ArrowRight,
  Search,
} from 'lucide-react';
import Swal from 'sweetalert2';
import Link from 'next/link';

interface ServiceProvider {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  category: string;
  description?: string;
  website?: string;
  address?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  CONTRACTOR: 'קבלן',
  ELECTRICIAN: 'חשמלאי',
  PLUMBER: 'אינסטלטור',
  PAINTER: 'צבעי',
  CARPENTER: 'נגר',
  LANDSCAPER: 'גנן',
  INTERIOR_DESIGNER: 'מעצב פנים',
  OTHER: 'אחר',
};

export default function ManageServiceProvidersPage() {
  const { isReady } = useAdminGuard();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  const { data: providersData, isLoading } = useAdminServiceProviders();
  const { data: categoriesData } = useServiceProviderCategories();
  const createMutation = useCreateServiceProvider();
  const updateMutation = useUpdateServiceProvider();
  const deleteMutation = useDeleteServiceProvider();

  const providers = (providersData?.data || []) as ServiceProvider[];
  const categories = categoriesData?.categories || [];

  // Filter providers
  const filteredProviders = providers.filter(p => {
    const matchesSearch = !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !filterCategory || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreate = async (formData: FormData) => {
    try {
      await createMutation.mutateAsync({
        name: formData.get('name') as string,
        phone: formData.get('phone') as string || undefined,
        email: formData.get('email') as string || undefined,
        category: formData.get('category') as string,
        description: formData.get('description') as string || undefined,
        website: formData.get('website') as string || undefined,
        address: formData.get('address') as string || undefined,
      });
      setShowAddModal(false);
      Swal.fire({
        title: 'נוצר בהצלחה!',
        text: 'נותן השירות נוסף למערכת',
        icon: 'success',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } catch (error) {
      Swal.fire({
        title: 'שגיאה',
        text: 'אירעה שגיאה ביצירת נותן השירות',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    }
  };

  const handleUpdate = async (id: string, formData: FormData) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          name: formData.get('name') as string,
          phone: formData.get('phone') as string || undefined,
          email: formData.get('email') as string || undefined,
          category: formData.get('category') as string,
          description: formData.get('description') as string || undefined,
          website: formData.get('website') as string || undefined,
          address: formData.get('address') as string || undefined,
        },
      });
      setEditingProvider(null);
      Swal.fire({
        title: 'עודכן בהצלחה!',
        text: 'פרטי נותן השירות עודכנו',
        icon: 'success',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } catch (error) {
      Swal.fire({
        title: 'שגיאה',
        text: 'אירעה שגיאה בעדכון נותן השירות',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    }
  };

  const handleDelete = async (provider: ServiceProvider) => {
    const result = await Swal.fire({
      title: 'מחיקת נותן שירות',
      text: `האם אתה בטוח שברצונך למחוק את "${provider.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'כן, מחק',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#dc2626',
      background: '#1a1a2e',
      color: '#fff',
    });

    if (result.isConfirmed) {
      try {
        await deleteMutation.mutateAsync(provider.id);
        Swal.fire({
          title: 'נמחק!',
          text: 'נותן השירות נמחק בהצלחה',
          icon: 'success',
          confirmButtonText: 'אישור',
          background: '#1a1a2e',
          color: '#fff',
        });
      } catch (error) {
        Swal.fire({
          title: 'שגיאה',
          text: 'אירעה שגיאה במחיקת נותן השירות',
          icon: 'error',
          confirmButtonText: 'אישור',
          background: '#1a1a2e',
          color: '#fff',
        });
      }
    }
  };

  const handleToggleStatus = async (provider: ServiceProvider, field: 'isActive' | 'isVerified') => {
    try {
      await updateMutation.mutateAsync({
        id: provider.id,
        data: { [field]: !provider[field] },
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

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  return (
    <div className="relative min-h-screen">
      <PageSlider images={sliderImages.dashboard} opacity={0.15} />
      <div className="p-6 max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
          >
            <ArrowRight size={18} />
            חזרה לפאנל ניהול
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                <Users className="text-gold-400" />
                ניהול נותני שירות
              </h1>
              <p className="text-white/60 mt-1">הוספה, עריכה ומחיקה של נותני שירות</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-gold flex items-center gap-2"
            >
              <Plus size={18} />
              הוסף נותן שירות
            </button>
          </div>
        </motion.div>

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
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input
                    type="text"
                    placeholder="חיפוש לפי שם או אימייל..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-10 py-2 text-white placeholder:text-white/40"
                  />
                </div>
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
              >
                <option value="">כל הקטגוריות</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <GlassCard hover={false}>
            <div className="text-center">
              <p className="text-white/50 text-sm">סה״כ נותני שירות</p>
              <p className="text-3xl font-bold text-white">{providers.length}</p>
            </div>
          </GlassCard>
          <GlassCard hover={false} className="bg-green-500/10">
            <div className="text-center">
              <p className="text-green-400/70 text-sm">פעילים</p>
              <p className="text-3xl font-bold text-green-400">
                {providers.filter(p => p.isActive).length}
              </p>
            </div>
          </GlassCard>
          <GlassCard hover={false} className="bg-blue-500/10">
            <div className="text-center">
              <p className="text-blue-400/70 text-sm">מאומתים</p>
              <p className="text-3xl font-bold text-blue-400">
                {providers.filter(p => p.isVerified).length}
              </p>
            </div>
          </GlassCard>
          <GlassCard hover={false} className="bg-purple-500/10">
            <div className="text-center">
              <p className="text-purple-400/70 text-sm">קטגוריות</p>
              <p className="text-3xl font-bold text-purple-400">
                {new Set(providers.map(p => p.category)).size}
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Providers List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard hover={false}>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 mx-auto text-gold-400 animate-spin" />
                <p className="text-white/60 mt-4">טוען נותני שירות...</p>
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-white/20 mb-4" />
                <p className="text-white/60">אין נותני שירות להצגה</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-3 px-4 text-right text-white/60 font-medium">שם</th>
                      <th className="py-3 px-4 text-right text-white/60 font-medium">קטגוריה</th>
                      <th className="py-3 px-4 text-right text-white/60 font-medium">פרטי קשר</th>
                      <th className="py-3 px-4 text-right text-white/60 font-medium">סטטוס</th>
                      <th className="py-3 px-4 text-right text-white/60 font-medium">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProviders.map((provider) => (
                      <tr
                        key={provider.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-white font-medium">{provider.name}</p>
                            {provider.description && (
                              <p className="text-white/50 text-sm truncate max-w-xs">{provider.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 rounded-full text-sm bg-white/10 text-white/80">
                            {CATEGORY_LABELS[provider.category] || provider.category}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1 text-sm">
                            {provider.phone && (
                              <p className="flex items-center gap-2 text-white/60">
                                <Phone size={14} /> {provider.phone}
                              </p>
                            )}
                            {provider.email && (
                              <p className="flex items-center gap-2 text-white/60">
                                <Mail size={14} /> {provider.email}
                              </p>
                            )}
                            {provider.website && (
                              <a
                                href={provider.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-gold-400 hover:text-gold-300"
                              >
                                <Globe size={14} /> אתר
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleToggleStatus(provider, 'isActive')}
                              className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                provider.isActive
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {provider.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                              {provider.isActive ? 'פעיל' : 'לא פעיל'}
                            </button>
                            <button
                              onClick={() => handleToggleStatus(provider, 'isVerified')}
                              className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                provider.isVerified
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-white/10 text-white/50'
                              }`}
                            >
                              {provider.isVerified ? <CheckCircle size={12} /> : <XCircle size={12} />}
                              {provider.isVerified ? 'מאומת' : 'לא מאומת'}
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingProvider(provider)}
                              className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                              title="עריכה"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(provider)}
                              className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                              title="מחיקה"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Add/Edit Modal */}
        {(showAddModal || editingProvider) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg"
            >
              <GlassCard hover={false}>
                <h2 className="text-xl font-semibold text-white mb-6">
                  {editingProvider ? 'עריכת נותן שירות' : 'הוספת נותן שירות חדש'}
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    if (editingProvider) {
                      handleUpdate(editingProvider.id, formData);
                    } else {
                      handleCreate(formData);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-white/60 text-sm mb-1">שם *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      defaultValue={editingProvider?.name || ''}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">קטגוריה *</label>
                    <select
                      name="category"
                      required
                      defaultValue={editingProvider?.category || ''}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="">בחר קטגוריה</option>
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/60 text-sm mb-1">טלפון</label>
                      <input
                        type="tel"
                        name="phone"
                        defaultValue={editingProvider?.phone || ''}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-1">אימייל</label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={editingProvider?.email || ''}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">אתר אינטרנט</label>
                    <input
                      type="url"
                      name="website"
                      defaultValue={editingProvider?.website || ''}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">כתובת</label>
                    <input
                      type="text"
                      name="address"
                      defaultValue={editingProvider?.address || ''}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">תיאור</label>
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={editingProvider?.description || ''}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="flex-1 btn-gold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {(createMutation.isPending || updateMutation.isPending) && (
                        <Loader2 size={18} className="animate-spin" />
                      )}
                      {editingProvider ? 'עדכון' : 'הוספה'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingProvider(null);
                      }}
                      className="flex-1 btn-secondary"
                    >
                      ביטול
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
