'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAdminGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import {
  useAdminServiceProviders,
  useCreateServiceProvider,
  useUpdateServiceProvider,
  useDeleteServiceProvider,
  useSuppliersDirectory,
} from '@/lib/api-hooks';
import Swal from 'sweetalert2';
import {
  Building2,
  Mail,
  Phone,
  Loader2,
  ArrowRight,
  Search,
  CheckCircle,
  XCircle,
  Plus,
  Pencil,
  Trash2,
  Globe,
  MapPin,
  Tag,
} from 'lucide-react';
import Link from 'next/link';

const categoryLabels: Record<string, string> = {
  CONTRACTOR: 'קבלן',
  ELECTRICIAN: 'חשמלאי',
  PLUMBER: 'אינסטלטור',
  PAINTER: 'צבעי',
  CARPENTER: 'נגר',
  LANDSCAPER: 'גנן',
  INTERIOR_DESIGNER: 'מעצב פנים',
  OTHER: 'אחר',
};

const categoryOptions = Object.entries(categoryLabels).map(([value, label]) => ({ value, label }));

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

export default function ManageServiceProvidersPage() {
  const { isReady } = useAdminGuard();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Load from both sources: ServiceProvider table + Suppliers (registered supplier users)
  const { data: providersData, isLoading: spLoading } = useAdminServiceProviders();
  const { data: suppliersData, isLoading: suppLoading } = useSuppliersDirectory({ pageSize: 100 });
  const createMutation = useCreateServiceProvider();
  const updateMutation = useUpdateServiceProvider();
  const deleteMutation = useDeleteServiceProvider();

  const isLoading = spLoading || suppLoading;

  // Merge: service providers + suppliers (mapped to same interface)
  const serviceProviders = (providersData?.data || []) as ServiceProvider[];
  const suppliers = ((suppliersData as any)?.data || []).map((s: any) => ({
    id: `supplier-${s.id}`,
    name: s.companyName || s.user?.name || 'ספק',
    phone: s.phone || s.user?.phone || '',
    email: s.user?.email || '',
    category: 'OTHER',
    description: s.description || '',
    website: s.website || '',
    address: s.address || '',
    isActive: true,
    isVerified: true,
    createdAt: s.createdAt || new Date().toISOString(),
    _isSupplier: true,
    _profileImage: s.profileImage,
  }));
  const providers = [...suppliers, ...serviceProviders];

  const filteredProviders = providers.filter(p => {
    const matchesSearch = !searchTerm ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.phone && p.phone.includes(searchTerm));
    const matchesCategory = !filterCategory || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const activeCount = providers.filter(p => p.isActive).length;

  // ── Add new provider ──
  const handleAdd = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'הוספת נותן שירות',
      html: `
        <div style="text-align:right; display:flex; flex-direction:column; gap:10px;">
          <input id="swal-name" class="swal2-input" placeholder="שם *" style="margin:0; text-align:right;">
          <input id="swal-phone" class="swal2-input" placeholder="טלפון" style="margin:0; text-align:right;" dir="ltr">
          <input id="swal-email" class="swal2-input" placeholder="אימייל" style="margin:0; text-align:right;" dir="ltr">
          <select id="swal-category" class="swal2-input" style="margin:0; text-align:right;">
            ${categoryOptions.map(c => `<option value="${c.value}">${c.label}</option>`).join('')}
          </select>
          <textarea id="swal-desc" class="swal2-textarea" placeholder="תיאור" style="margin:0; text-align:right; min-height:60px;"></textarea>
          <input id="swal-website" class="swal2-input" placeholder="אתר אינטרנט" style="margin:0; text-align:right;" dir="ltr">
          <input id="swal-address" class="swal2-input" placeholder="כתובת" style="margin:0; text-align:right;">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'הוספה',
      cancelButtonText: 'ביטול',
      background: '#f7f3f2',
      color: '#2b241d',
      confirmButtonColor: '#c99b4a',
      width: 500,
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement).value.trim();
        if (!name) {
          Swal.showValidationMessage('שם הוא שדה חובה');
          return false;
        }
        return {
          name,
          phone: (document.getElementById('swal-phone') as HTMLInputElement).value.trim() || undefined,
          email: (document.getElementById('swal-email') as HTMLInputElement).value.trim() || undefined,
          category: (document.getElementById('swal-category') as HTMLSelectElement).value,
          description: (document.getElementById('swal-desc') as HTMLTextAreaElement).value.trim() || undefined,
          website: (document.getElementById('swal-website') as HTMLInputElement).value.trim() || undefined,
          address: (document.getElementById('swal-address') as HTMLInputElement).value.trim() || undefined,
        };
      },
    });

    if (formValues) {
      try {
        await createMutation.mutateAsync(formValues);
        Swal.fire({ title: 'נוסף!', text: `${formValues.name} נוסף בהצלחה`, icon: 'success', timer: 2000, showConfirmButton: false, background: '#f7f3f2', color: '#2b241d' });
      } catch {
        Swal.fire({ title: 'שגיאה', text: 'לא ניתן להוסיף', icon: 'error', background: '#f7f3f2', color: '#2b241d' });
      }
    }
  };

  // ── Edit provider ──
  const handleEdit = async (provider: ServiceProvider) => {
    const { value: formValues } = await Swal.fire({
      title: `עריכת ${provider.name}`,
      html: `
        <div style="text-align:right; display:flex; flex-direction:column; gap:10px;">
          <input id="swal-name" class="swal2-input" placeholder="שם *" value="${provider.name || ''}" style="margin:0; text-align:right;">
          <input id="swal-phone" class="swal2-input" placeholder="טלפון" value="${provider.phone || ''}" style="margin:0; text-align:right;" dir="ltr">
          <input id="swal-email" class="swal2-input" placeholder="אימייל" value="${provider.email || ''}" style="margin:0; text-align:right;" dir="ltr">
          <select id="swal-category" class="swal2-input" style="margin:0; text-align:right;">
            ${categoryOptions.map(c => `<option value="${c.value}" ${c.value === provider.category ? 'selected' : ''}>${c.label}</option>`).join('')}
          </select>
          <textarea id="swal-desc" class="swal2-textarea" placeholder="תיאור" style="margin:0; text-align:right; min-height:60px;">${provider.description || ''}</textarea>
          <input id="swal-website" class="swal2-input" placeholder="אתר אינטרנט" value="${provider.website || ''}" style="margin:0; text-align:right;" dir="ltr">
          <input id="swal-address" class="swal2-input" placeholder="כתובת" value="${provider.address || ''}" style="margin:0; text-align:right;">
          <label style="display:flex; align-items:center; gap:8px; color:#2b241d; font-size:14px;">
            <input type="checkbox" id="swal-active" ${provider.isActive ? 'checked' : ''}>
            פעיל
          </label>
          <label style="display:flex; align-items:center; gap:8px; color:#2b241d; font-size:14px;">
            <input type="checkbox" id="swal-verified" ${provider.isVerified ? 'checked' : ''}>
            מאומת
          </label>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'עדכון',
      cancelButtonText: 'ביטול',
      background: '#f7f3f2',
      color: '#2b241d',
      confirmButtonColor: '#c99b4a',
      width: 500,
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement).value.trim();
        if (!name) {
          Swal.showValidationMessage('שם הוא שדה חובה');
          return false;
        }
        return {
          name,
          phone: (document.getElementById('swal-phone') as HTMLInputElement).value.trim(),
          email: (document.getElementById('swal-email') as HTMLInputElement).value.trim(),
          category: (document.getElementById('swal-category') as HTMLSelectElement).value,
          description: (document.getElementById('swal-desc') as HTMLTextAreaElement).value.trim(),
          website: (document.getElementById('swal-website') as HTMLInputElement).value.trim(),
          address: (document.getElementById('swal-address') as HTMLInputElement).value.trim(),
          isActive: (document.getElementById('swal-active') as HTMLInputElement).checked,
          isVerified: (document.getElementById('swal-verified') as HTMLInputElement).checked,
        };
      },
    });

    if (formValues) {
      try {
        await updateMutation.mutateAsync({ id: provider.id, data: formValues });
        Swal.fire({ title: 'עודכן!', text: `${formValues.name} עודכן בהצלחה`, icon: 'success', timer: 2000, showConfirmButton: false, background: '#f7f3f2', color: '#2b241d' });
      } catch {
        Swal.fire({ title: 'שגיאה', text: 'לא ניתן לעדכן', icon: 'error', background: '#f7f3f2', color: '#2b241d' });
      }
    }
  };

  // ── Delete provider ──
  const handleDelete = async (provider: ServiceProvider) => {
    const result = await Swal.fire({
      title: 'מחיקת נותן שירות',
      text: `האם למחוק את ${provider.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'מחק',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#EF4444',
      background: '#f7f3f2',
      color: '#2b241d',
    });

    if (result.isConfirmed) {
      try {
        await deleteMutation.mutateAsync(provider.id);
        Swal.fire({ title: 'נמחק!', text: `${provider.name} נמחק`, icon: 'success', timer: 2000, showConfirmButton: false, background: '#f7f3f2', color: '#2b241d' });
      } catch {
        Swal.fire({ title: 'שגיאה', text: 'לא ניתן למחוק', icon: 'error', background: '#f7f3f2', color: '#2b241d' });
      }
    }
  };

  // ── Toggle active ──
  const handleToggleActive = async (provider: ServiceProvider) => {
    try {
      await updateMutation.mutateAsync({ id: provider.id, data: { isActive: !provider.isActive } });
    } catch {
      Swal.fire({ title: 'שגיאה', text: 'לא ניתן לעדכן סטטוס', icon: 'error', background: '#f7f3f2', color: '#2b241d' });
    }
  };

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
              <Building2 className="text-[#c99b4a]" />
              ניהול נותני שירות
            </h1>
            <p className="text-[#8b7c69] mt-1">הוספה, עריכה ומחיקה של נותני שירות במערכת</p>
          </div>
          <button
            onClick={handleAdd}
            className="w-[90%] mx-auto mt-4 flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-[#c99b4a] hover:bg-[#9e7746] text-white font-bold text-base transition-all hover:scale-[1.02] active:scale-100"
            style={{ boxShadow: '0 4px 16px rgba(201,155,74,0.35)' }}
          >
            <Plus size={20} />
            הוספת נותן שירות
          </button>
        </motion.div>

        {/* Search & Filter */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="bg-white border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89b8a]" size={18} />
                  <input
                    type="text"
                    placeholder="חיפוש לפי שם, אימייל או טלפון..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl px-10 py-3 text-[#2b241d] placeholder:text-[#a89b8a]"
                  />
                </div>
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl px-4 py-3 text-[#2b241d] min-w-[160px]"
              >
                <option value="">כל הקטגוריות</option>
                {categoryOptions.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-[rgba(201,155,74,0.08)] rounded-2xl p-5">
            <p className="text-[#a89b8a] text-sm">סה״כ</p>
            <p className="text-3xl font-bold text-[#2b241d]">{providers.length}</p>
          </div>
          <div className="bg-green-50 border border-[rgba(201,155,74,0.08)] rounded-2xl p-5">
            <p className="text-green-600/70 text-sm">פעילים</p>
            <p className="text-3xl font-bold text-green-600">{activeCount}</p>
          </div>
          <div className="bg-blue-50 border border-[rgba(201,155,74,0.08)] rounded-2xl p-5">
            <p className="text-blue-600/70 text-sm">תוצאות</p>
            <p className="text-3xl font-bold text-blue-600">{filteredProviders.length}</p>
          </div>
        </div>

        {/* Providers List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="bg-white border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 mx-auto text-[#c99b4a] animate-spin" />
                <p className="text-[#8b7c69] mt-4">טוען נותני שירות...</p>
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 mx-auto text-[#a89b8a]/40 mb-4" />
                <p className="text-[#8b7c69] mb-4">אין נותני שירות להצגה</p>
                <button onClick={handleAdd} className="text-[#c99b4a] hover:text-[#9e7746] font-medium transition-colors">
                  + הוסף נותן שירות ראשון
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProviders.map((provider, index) => (
                  <motion.div
                    key={provider.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-white border border-[rgba(201,155,74,0.08)] rounded-2xl overflow-hidden hover:shadow-lg transition-all"
                    style={{ boxShadow: '0 4px 16px rgba(64,38,18,0.06)' }}
                  >
                    {/* Image / Logo area - 3/4 width */}
                    <div className="relative w-full h-44 bg-gradient-to-br from-[#f7f3f2] to-[#ede6e0] flex items-center justify-center">
                      {(provider as any)._profileImage ? (
                        <img src={(provider as any)._profileImage} alt={provider.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-[#c99b4a]/15 flex items-center justify-center">
                          <Building2 size={36} className="text-[#c99b4a]" />
                        </div>
                      )}
                      {/* Action buttons overlay */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        {!(provider as any)._isSupplier && (
                          <>
                            <button
                              onClick={() => handleEdit(provider)}
                              className="p-2 rounded-lg bg-white/90 hover:bg-white text-[#8b7c69] hover:text-[#2b241d] transition-colors shadow-sm"
                              title="עריכה"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(provider)}
                              className="p-2 rounded-lg bg-white/90 hover:bg-red-50 text-[#8b7c69] hover:text-red-500 transition-colors shadow-sm"
                              title="מחיקה"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {/* Name */}
                      <h3 className="font-bold text-[#2b241d] text-lg mb-3">{provider.name}</h3>

                      {/* Badges row - equal size */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <span className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#f7f3f2] text-[#8b7c69] border border-[rgba(201,155,74,0.08)]">
                          <Tag size={12} />
                          {categoryLabels[provider.category] || provider.category}
                        </span>
                        {(provider as any)._isSupplier ? (
                          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                            <Building2 size={12} />
                            ספק רשום
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleActive(provider)}
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                              provider.isActive
                                ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'
                                : 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100'
                            }`}
                          >
                            {provider.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                            {provider.isActive ? 'פעיל' : 'לא פעיל'}
                          </button>
                        )}
                        {provider.isVerified ? (
                          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#c99b4a]/10 text-[#c99b4a] border border-[#c99b4a]/20">
                            <CheckCircle size={12} />
                            מאומת
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#f7f3f2] text-[#a89b8a] border border-[rgba(201,155,74,0.08)]">
                            <XCircle size={12} />
                            לא מאומת
                          </span>
                        )}
                      </div>

                      {/* Details - stacked */}
                      <div className="space-y-2 text-sm">
                        {provider.phone && (
                          <div className="flex items-center gap-2 text-[#2b241d]">
                            <Phone size={14} className="text-[#c99b4a] flex-shrink-0" />
                            <span dir="ltr">{provider.phone}</span>
                          </div>
                        )}
                        {provider.email && (
                          <div className="flex items-center gap-2 text-[#2b241d]">
                            <Mail size={14} className="text-[#c99b4a] flex-shrink-0" />
                            <span className="truncate">{provider.email}</span>
                          </div>
                        )}
                        {provider.website && (
                          <a href={provider.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#c99b4a] hover:text-[#9e7746] transition-colors">
                            <Globe size={14} className="flex-shrink-0" />
                            <span>אתר אינטרנט</span>
                          </a>
                        )}
                        {provider.address && (
                          <div className="flex items-center gap-2 text-[#2b241d]">
                            <MapPin size={14} className="text-[#c99b4a] flex-shrink-0" />
                            <span>{provider.address}</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {provider.description && (
                        <p className="text-[#8b7c69] text-sm mt-3 line-clamp-2">{provider.description}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
