'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { useAdminGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { adminApi } from '@stannel/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import {
  Gift,
  Plus,
  ArrowRight,
  Loader2,
  Edit2,
  Trash2,
  Package,
  X,
  Upload,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  pointCost: number;
  cashCost: number;
  stock: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminRewardsPage() {
  const { isReady } = useAdminGuard();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    pointCost: 0,
    cashCost: 0,
    stock: 10,
    imageUrl: '',
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => adminApi.getProducts(),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => adminApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      setShowModal(false);
      resetForm();
      Swal.fire({
        title: 'המוצר נוצר בהצלחה!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
    },
    onError: (error: any) => {
      Swal.fire({
        title: 'שגיאה',
        text: error.message,
        icon: 'error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      Swal.fire({
        title: 'המוצר עודכן בהצלחה!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      Swal.fire({
        title: 'המוצר נמחק!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
    },
  });

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      pointCost: 0,
      cashCost: 0,
      stock: 10,
      imageUrl: '',
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      pointCost: product.pointCost,
      cashCost: product.cashCost,
      stock: product.stock,
      imageUrl: product.imageUrl || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (product: Product) => {
    const result = await Swal.fire({
      title: 'למחוק את המוצר?',
      text: product.name,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'כן, מחק',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#dc2626',
    });

    if (result.isConfirmed) {
      deleteMutation.mutate(product.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await adminApi.uploadImage(file);
      setForm({ ...form, imageUrl: result.url });
    } catch (error: any) {
      Swal.fire({
        title: 'שגיאה בהעלאת תמונה',
        text: error.message,
        icon: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  const products = productsData?.data || [];

  return (
    <div className="relative min-h-screen bg-[#F8FAFC]">
      <PageSlider images={sliderImages.rewards} />
      <div className="p-6 max-w-6xl mx-auto relative z-10 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowRight size={16} />
            חזרה לניהול
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900 flex items-center gap-3">
                <Gift className="text-gold-400" />
                ניהול מוצרים - חנות ההטבות
              </h1>
              <p className="text-gray-600 mt-1">הוסף ונהל מוצרים לחנות ההטבות של האדריכלים</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setEditingProduct(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0055AA] transition-colors"
            >
              <Plus size={20} />
              הוסף מוצר
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <GlassCard hover={false}>
            <div className="text-center">
              <Package className="mx-auto text-[#0066CC] mb-2" size={24} />
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              <p className="text-gray-600 text-sm">סה"כ מוצרים</p>
            </div>
          </GlassCard>
          <GlassCard hover={false}>
            <div className="text-center">
              <Gift className="mx-auto text-green-500 mb-2" size={24} />
              <p className="text-2xl font-bold text-gray-900">
                {products.filter((p: Product) => p.isActive && p.stock > 0).length}
              </p>
              <p className="text-gray-600 text-sm">פעילים</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Products Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 mx-auto text-[#0066CC] animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <GlassCard className="text-center py-12">
              <Gift size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">אין מוצרים עדיין</p>
              <p className="text-gray-500 text-sm mt-1">לחץ על "הוסף מוצר" כדי להתחיל</p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: Product) => (
                <GlassCard key={product.id} className="overflow-hidden">
                  {/* Product Image */}
                  <div className="relative h-40 -mx-6 -mt-6 mb-4 bg-gray-100">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gift size={48} className="text-gray-300" />
                      </div>
                    )}
                    {!product.isActive && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-sm">לא פעיל</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <h3 className="text-gray-900 font-semibold text-lg mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-gold-500 font-bold text-lg">
                        {product.pointCost.toLocaleString()} נק׳
                      </span>
                      {product.cashCost > 0 && (
                        <span className="text-gray-600 text-sm mr-2">+ ₪{product.cashCost}</span>
                      )}
                    </div>
                    <span className={`text-sm px-2 py-1 rounded ${
                      product.stock > 5 ? 'bg-green-100 text-green-700' :
                      product.stock > 0 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      מלאי: {product.stock}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Edit2 size={16} />
                      עריכה
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProduct ? 'עריכת מוצר' : 'הוספת מוצר חדש'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingProduct(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">תמונה</label>
                <div className="flex items-center gap-4">
                  {form.imageUrl ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                      <Image src={form.imageUrl} alt="Preview" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, imageUrl: '' })}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#0066CC] transition-colors">
                      {uploading ? (
                        <Loader2 size={24} className="animate-spin text-gray-400" />
                      ) : (
                        <>
                          <Upload size={24} className="text-gray-400" />
                          <span className="text-xs text-gray-500 mt-1">העלה</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <div className="mt-2">
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                    placeholder="או הדבק קישור לתמונה..."
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">שם המוצר *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                  placeholder="למשל: שובר מתנה לאיקאה"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">תיאור</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                  placeholder="תיאור קצר של המוצר"
                />
              </div>

              {/* Point Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">עלות בנקודות *</label>
                  <input
                    type="number"
                    value={form.pointCost}
                    onChange={(e) => setForm({ ...form, pointCost: parseInt(e.target.value) || 0 })}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">עלות במזומן (₪)</label>
                  <input
                    type="number"
                    value={form.cashCost}
                    onChange={(e) => setForm({ ...form, cashCost: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">כמות במלאי *</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0055AA] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {editingProduct ? 'עדכון' : 'הוספה'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
