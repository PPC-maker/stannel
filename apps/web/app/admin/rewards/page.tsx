'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Eye,
  Calendar,
  Coins,
  Banknote,
  BoxIcon,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  pointCost: number;
  pointsPerShekel: number;
  stock: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminRewardsPage() {
  const { isReady } = useAdminGuard();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    pointCost: 0,
    pointsPerShekel: 100,
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
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      if (data.deactivated) {
        Swal.fire({
          title: 'המוצר הושבת',
          text: data.message || 'המוצר הושבת כי יש לו מימושים',
          icon: 'info',
          timer: 3000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          title: 'המוצר נמחק!',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      }
    },
    onError: (error: any) => {
      Swal.fire({
        title: 'שגיאה במחיקת המוצר',
        text: error.message,
        icon: 'error',
      });
    },
  });

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      pointCost: 0,
      pointsPerShekel: 100,
      stock: 10,
      imageUrl: '',
    });
  };

  const handleView = (product: Product) => {
    setViewingProduct(product);
    setShowDetailModal(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      pointCost: product.pointCost,
      pointsPerShekel: product.pointsPerShekel || 100,
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
                <GlassCard key={product.id} className="overflow-hidden group">
                  {/* Product Image - Click to view */}
                  <div
                    className="relative h-48 -mx-6 -mt-6 mb-4 bg-gradient-to-br from-gray-100 to-gray-50 cursor-pointer"
                    onClick={() => handleView(product)}
                  >
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gift size={48} className="text-gray-300" />
                      </div>
                    )}
                    {!product.isActive && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-sm font-medium px-3 py-1 bg-red-500 rounded-full">לא פעיל</span>
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Eye className="text-white drop-shadow-lg" size={32} />
                    </div>
                  </div>

                  {/* Product Info */}
                  <h3 className="text-gray-900 font-semibold text-lg mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-amber-600 font-bold text-lg">
                        {product.pointCost.toLocaleString()} נק׳
                      </span>
                      <span className="text-gray-500 text-xs mr-2 block">
                        ({product.pointsPerShekel || 100} נק׳ = ₪1)
                      </span>
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
                      onClick={() => handleView(product)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Edit2 size={16} />
                      עריכה
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      disabled={deleteMutation.isPending}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {deleteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">נקודות לשקל</label>
                  <input
                    type="number"
                    value={form.pointsPerShekel}
                    onChange={(e) => setForm({ ...form, pointsPerShekel: parseInt(e.target.value) || 100 })}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">כמה נקודות שוות ₪1 להשלמה</p>
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

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && viewingProduct && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
            >
              {/* Image Header */}
              <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-50">
                {viewingProduct.imageUrl ? (
                  <Image
                    src={viewingProduct.imageUrl}
                    alt={viewingProduct.name}
                    fill
                    className="object-contain p-4"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gift size={80} className="text-gray-300" />
                  </div>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="absolute top-4 left-4 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white transition-colors shadow-lg"
                >
                  <X size={20} />
                </button>
                {!viewingProduct.isActive && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
                    לא פעיל
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{viewingProduct.name}</h2>

                {viewingProduct.description && (
                  <p className="text-gray-600 mb-6 leading-relaxed">{viewingProduct.description}</p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-amber-50 rounded-xl p-4 text-center">
                    <Coins className="mx-auto text-amber-600 mb-2" size={24} />
                    <p className="text-2xl font-bold text-amber-600">{viewingProduct.pointCost.toLocaleString()}</p>
                    <p className="text-amber-700 text-sm">נקודות</p>
                  </div>

                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <Banknote className="mx-auto text-green-600 mb-2" size={24} />
                    <p className="text-2xl font-bold text-green-600">{viewingProduct.pointsPerShekel || 100}</p>
                    <p className="text-green-700 text-sm">נקודות = ₪1</p>
                  </div>

                  <div className={`rounded-xl p-4 text-center ${
                    viewingProduct.stock > 5 ? 'bg-blue-50' :
                    viewingProduct.stock > 0 ? 'bg-yellow-50' : 'bg-red-50'
                  }`}>
                    <BoxIcon className={`mx-auto mb-2 ${
                      viewingProduct.stock > 5 ? 'text-blue-600' :
                      viewingProduct.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                    }`} size={24} />
                    <p className={`text-2xl font-bold ${
                      viewingProduct.stock > 5 ? 'text-blue-600' :
                      viewingProduct.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                    }`}>{viewingProduct.stock}</p>
                    <p className={`text-sm ${
                      viewingProduct.stock > 5 ? 'text-blue-700' :
                      viewingProduct.stock > 0 ? 'text-yellow-700' : 'text-red-700'
                    }`}>במלאי</p>
                  </div>

                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <Calendar className="mx-auto text-purple-600 mb-2" size={24} />
                    <p className="text-sm font-bold text-purple-600">
                      {new Date(viewingProduct.createdAt).toLocaleDateString('he-IL')}
                    </p>
                    <p className="text-purple-700 text-sm">תאריך הוספה</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleEdit(viewingProduct);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0066CC] text-white rounded-xl hover:bg-[#0055AA] transition-colors font-medium"
                  >
                    <Edit2 size={18} />
                    עריכה
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleDelete(viewingProduct);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium"
                  >
                    <Trash2 size={18} />
                    מחיקה
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
