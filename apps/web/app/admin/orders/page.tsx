'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAdminGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { useAdminRedemptions } from '@/lib/api-hooks';
import {
  ShoppingBag,
  ArrowRight,
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
  Banknote,
  Star,
  Package,
  Search,
} from 'lucide-react';
import Link from 'next/link';

interface Redemption {
  id: string;
  pointsUsed: number;
  cashPaid: number;
  createdAt: string;
  product: {
    name: string;
    pointCost: number;
    imageUrl?: string;
  };
  architect: {
    id: string;
    user: {
      name: string;
      email: string;
      phone?: string;
    };
  };
}

export default function AdminOrdersPage() {
  const { isReady } = useAdminGuard();
  const { data: redemptions, isLoading } = useAdminRedemptions();
  const [searchTerm, setSearchTerm] = useState('');

  const orders = (redemptions || []) as Redemption[];

  const filtered = orders.filter(o => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      o.product.name.toLowerCase().includes(q) ||
      o.architect.user.name.toLowerCase().includes(q) ||
      o.architect.user.email.toLowerCase().includes(q)
    );
  });

  const totalPointsUsed = orders.reduce((sum, o) => sum + o.pointsUsed, 0);
  const totalCashPaid = orders.reduce((sum, o) => sum + o.cashPaid, 0);

  if (!isReady) return <AuthGuardLoader />;

  return (
    <div className="min-h-screen -mt-16 pt-8 pb-24">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-[#8b7c69] hover:text-[#2b241d] mb-4 transition-colors">
            <ArrowRight size={18} />
            חזרה לפאנל ניהול
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold text-[#2b241d] flex items-center gap-3">
              <ShoppingBag className="text-[#c99b4a]" />
              הזמנות מחנות ההטבות
            </h1>
            <p className="text-[#8b7c69] mt-1">כל הרכישות והמימושים שבוצעו דרך חנות ההטבות</p>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          <div className="bg-white border border-[rgba(201,155,74,0.08)] rounded-2xl p-3 sm:p-5 text-center overflow-hidden">
            <p className="text-[#a89b8a] text-xs sm:text-sm">סה״כ הזמנות</p>
            <p className="text-xl sm:text-3xl font-bold text-[#2b241d]">{orders.length}</p>
          </div>
          <div className="bg-[#c99b4a]/10 border border-[#c99b4a]/20 rounded-2xl p-3 sm:p-5 text-center overflow-hidden">
            <p className="text-[#c99b4a]/70 text-xs sm:text-sm">נקודות שמומשו</p>
            <p className="text-lg sm:text-3xl font-bold text-[#c99b4a]">{totalPointsUsed.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-3 sm:p-5 text-center overflow-hidden">
            <p className="text-green-600/70 text-xs sm:text-sm">תשלומים במזומן</p>
            <p className="text-lg sm:text-3xl font-bold text-green-600">₪{totalCashPaid.toLocaleString()}</p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
          <div className="bg-white border border-[rgba(201,155,74,0.08)] rounded-2xl p-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89b8a]" size={18} />
              <input
                type="text"
                placeholder="חיפוש לפי שם מוצר, שם משתמש או אימייל..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.12)] rounded-xl px-10 py-3 text-[#2b241d] placeholder:text-[#a89b8a]"
              />
            </div>
          </div>
        </motion.div>

        {/* Orders List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="bg-white border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-[#2b241d] mb-4 flex items-center gap-2">
              <Package className="text-[#c99b4a]" size={20} />
              רשימת הזמנות ({filtered.length})
            </h2>

            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 mx-auto text-[#c99b4a] animate-spin" />
                <p className="text-[#8b7c69] mt-4">טוען הזמנות...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 mx-auto text-[#a89b8a]/30 mb-4" />
                <p className="text-[#8b7c69]">{searchTerm ? 'לא נמצאו הזמנות' : 'אין הזמנות עדיין'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-xl p-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* Product image */}
                      <div className="w-16 h-16 rounded-xl bg-white border border-[rgba(201,155,74,0.08)] flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {order.product.imageUrl ? (
                          <img src={order.product.imageUrl} alt={order.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={24} className="text-[#c99b4a]" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#2b241d] text-base mb-1">{order.product.name}</h3>

                        {/* User info */}
                        <div className="space-y-1 text-sm mb-2">
                          <div className="flex items-center gap-2 text-[#2b241d]">
                            <User size={13} className="text-[#c99b4a] flex-shrink-0" />
                            <span>{order.architect.user.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[#8b7c69]">
                            <Mail size={13} className="text-[#c99b4a] flex-shrink-0" />
                            <span className="truncate">{order.architect.user.email}</span>
                          </div>
                          {order.architect.user.phone && (
                            <div className="flex items-center gap-2 text-[#8b7c69]">
                              <Phone size={13} className="text-[#c99b4a] flex-shrink-0" />
                              <span dir="ltr">{order.architect.user.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Payment info */}
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#c99b4a]/10 text-[#c99b4a]">
                            <Star size={12} />
                            {order.pointsUsed.toLocaleString()} נק׳
                          </span>
                          {order.cashPaid > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-600">
                              <Banknote size={12} />
                              ₪{order.cashPaid.toLocaleString()}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#f7f3f2] text-[#8b7c69]">
                            <Calendar size={12} />
                            {new Date(order.createdAt).toLocaleDateString('he-IL')} {new Date(order.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
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
