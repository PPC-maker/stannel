'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import GlassCard from '@/components/layout/GlassCard';
import { Gift, Star, ShoppingCart, Check } from 'lucide-react';

// Mock data
const mockBalance = { points: 12500 };

const mockProducts = [
  {
    id: '1',
    name: 'כרטיס מתנה IKEA',
    description: 'כרטיס מתנה דיגיטלי לרכישה ברשת IKEA',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
    pointCost: 5000,
    cashCost: 0,
    stock: 10,
  },
  {
    id: '2',
    name: 'Apple AirPods Pro',
    description: 'אוזניות אלחוטיות עם ביטול רעשים',
    imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&q=80',
    pointCost: 15000,
    cashCost: 200,
    stock: 3,
  },
  {
    id: '3',
    name: 'יום ספא יוקרתי',
    description: 'טיפול ספא מלא כולל עיסויים ופינוקים',
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80',
    pointCost: 8000,
    cashCost: 0,
    stock: 5,
  },
  {
    id: '4',
    name: 'ארוחה זוגית במסעדה',
    description: 'ארוחה זוגית במסעדת שף מובילה',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
    pointCost: 6000,
    cashCost: 0,
    stock: 8,
  },
  {
    id: '5',
    name: 'סט כלי עבודה מקצועי',
    description: 'סט כלים איכותי לאדריכלים ומעצבים',
    imageUrl: 'https://images.unsplash.com/photo-1581147036324-c47a03a81d48?w=400&q=80',
    pointCost: 4000,
    cashCost: 0,
    stock: 15,
  },
  {
    id: '6',
    name: 'טאבלט גרפי Wacom',
    description: 'טאבלט מקצועי לעיצוב דיגיטלי',
    imageUrl: 'https://images.unsplash.com/photo-1625895197185-efcec01cffe0?w=400&q=80',
    pointCost: 20000,
    cashCost: 300,
    stock: 2,
  },
];

export default function RewardsPage() {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const canAfford = (product: typeof mockProducts[0]) =>
    mockBalance.points >= product.pointCost;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Balance Banner */}
      <GlassCard gold className="mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <Star size={28} className="text-primary-900" />
            </div>
            <div>
              <p className="text-white/60 text-sm">יתרת נקודות זמינה</p>
              <p className="text-4xl font-bold text-gold-400">
                {mockBalance.points.toLocaleString()} <span className="text-lg">נק׳</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center md:text-left">
              <p className="text-white/60 text-sm">דרגה</p>
              <p className="text-2xl font-semibold text-white">🥇 GOLD</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">חנות ההטבות</h1>
          <p className="text-white/60 mt-1">ממשו את הנקודות שצברתם להטבות מגוונות</p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProducts.map((product, index) => {
          const affordable = canAfford(product);

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <GlassCard
                className={`overflow-hidden group ${
                  selectedProduct === product.id ? 'ring-2 ring-gold-400' : ''
                }`}
                onClick={() => setSelectedProduct(product.id)}
              >
                {/* Product Image */}
                <div className="relative h-48 -mx-6 -mt-6 mb-4 overflow-hidden">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.stock <= 3 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      נשארו {product.stock}!
                    </div>
                  )}
                  {!affordable && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white/80 text-sm">חסרים נקודות</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <h3 className="text-white font-semibold text-lg mb-2">{product.name}</h3>
                <p className="text-white/60 text-sm mb-4 line-clamp-2">{product.description}</p>

                {/* Price & Action */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gold-400 font-bold text-xl">
                      {product.pointCost.toLocaleString()} נק׳
                    </span>
                    {product.cashCost > 0 && (
                      <span className="text-white/50 text-sm mr-2">+ ₪{product.cashCost}</span>
                    )}
                  </div>
                  <button
                    disabled={!affordable}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      affordable
                        ? 'bg-gold-400 text-primary-900 hover:bg-gold-300'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                    }`}
                  >
                    {affordable ? (
                      <>
                        <ShoppingCart size={16} />
                        <span>מימוש</span>
                      </>
                    ) : (
                      <span>חסר</span>
                    )}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {mockProducts.length === 0 && (
        <GlassCard className="text-center py-12">
          <Gift size={48} className="mx-auto text-white/30 mb-4" />
          <p className="text-white/60">אין מוצרים זמינים כרגע</p>
        </GlassCard>
      )}
    </div>
  );
}
