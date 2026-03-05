'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  Edit3,
  Camera,
  Shield,
  Bell,
  CreditCard
} from 'lucide-react';

// Mock user data
const mockUser = {
  id: '1',
  name: 'איציק לוי',
  email: 'itzik@architect.co.il',
  phone: '050-1234567',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  role: 'architect',
  company: 'לוי אדריכלים בע"מ',
  address: 'רחוב הרצל 50, תל אביב',
  joinDate: '2024-03-15',
  tier: 'GOLD',
  totalPoints: 45000,
  currentPoints: 12500,
  totalTransactions: 87,
  totalRedeemed: 32500,
};

const mockActivity = [
  { id: '1', type: 'points', description: 'צברת 500 נקודות מחשבונית', date: '2025-03-01', points: 500 },
  { id: '2', type: 'redeem', description: 'מימוש הטבה - כרטיס מתנה IKEA', date: '2025-02-28', points: -5000 },
  { id: '3', type: 'event', description: 'נרשמת לכנס אדריכלות 2025', date: '2025-02-25', points: 0 },
  { id: '4', type: 'points', description: 'צברת 1200 נקודות מחשבונית', date: '2025-02-20', points: 1200 },
  { id: '5', type: 'tier', description: 'עלית לדרגת GOLD!', date: '2025-02-15', points: 0 },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'GOLD': return 'text-gold-400';
      case 'SILVER': return 'text-gray-300';
      case 'BRONZE': return 'text-amber-600';
      default: return 'text-white';
    }
  };

  const getTierEmoji = (tier: string) => {
    switch (tier) {
      case 'GOLD': return '🥇';
      case 'SILVER': return '🥈';
      case 'BRONZE': return '🥉';
      default: return '⭐';
    }
  };

  return (
    <div className="relative">
      <PageSlider images={sliderImages.profile} />
      <div className="p-6 max-w-6xl mx-auto relative z-10">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <GlassCard className="relative overflow-visible">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl overflow-hidden ring-4 ring-gold-400/30">
                  <Image
                    src={mockUser.avatar}
                    alt={mockUser.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <button className="absolute bottom-2 right-2 w-8 h-8 bg-gold-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={16} className="text-primary-900" />
                </button>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-lg">
                  {getTierEmoji(mockUser.tier)}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-right">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-3xl font-display font-bold text-white">{mockUser.name}</h1>
                  <span className={`text-lg font-bold ${getTierColor(mockUser.tier)}`}>
                    {mockUser.tier}
                  </span>
                </div>
                <p className="text-white/60 mb-4">{mockUser.company}</p>

                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-white/60">
                  <div className="flex items-center gap-2">
                    <Mail size={14} />
                    <span>{mockUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} />
                    <span>{mockUser.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} />
                    <span>{mockUser.address}</span>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="absolute top-4 left-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Edit3 size={18} className="text-white" />
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Award, label: 'נקודות נוכחיות', value: mockUser.currentPoints.toLocaleString(), color: 'text-gold-400' },
            { icon: TrendingUp, label: 'סה"כ נצבר', value: mockUser.totalPoints.toLocaleString(), color: 'text-green-400' },
            { icon: CreditCard, label: 'עסקאות', value: mockUser.totalTransactions.toString(), color: 'text-blue-400' },
            { icon: Calendar, label: 'חבר מאז', value: formatDate(mockUser.joinDate), color: 'text-purple-400' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="text-center">
                <stat.icon size={24} className={`mx-auto mb-2 ${stat.color}`} />
                <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-white/60 text-sm">{stat.label}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-2"
          >
            <GlassCard>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-gold-400" />
                פעילות אחרונה
              </h2>
              <div className="space-y-3">
                {mockActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div>
                      <p className="text-white">{activity.description}</p>
                      <p className="text-white/40 text-sm">{formatDate(activity.date)}</p>
                    </div>
                    {activity.points !== 0 && (
                      <span className={`font-bold ${activity.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {activity.points > 0 ? '+' : ''}{activity.points.toLocaleString()} נק׳
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Quick Settings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <GlassCard>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Shield size={20} className="text-gold-400" />
                הגדרות מהירות
              </h2>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/80 hover:text-white">
                  <User size={18} />
                  <span>עריכת פרטים אישיים</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/80 hover:text-white">
                  <Bell size={18} />
                  <span>הגדרות התראות</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/80 hover:text-white">
                  <Shield size={18} />
                  <span>אבטחה ופרטיות</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/80 hover:text-white">
                  <CreditCard size={18} />
                  <span>אמצעי תשלום</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/80 hover:text-white">
                  <Building2 size={18} />
                  <span>פרטי עסק</span>
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
