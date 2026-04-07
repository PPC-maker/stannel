'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { useAuth } from '@/lib/auth-context';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { useWalletBalance, useInvoices } from '@/lib/api-hooks';
import { authApi } from '@stannel/api-client';
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
  CreditCard,
  X,
  Save,
  ChevronLeft,
} from 'lucide-react';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ProfilePage() {
  const { isReady } = useAuthGuard();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { data: balance } = useWalletBalance();
  const { data: invoices } = useInvoices();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [highlightProfile, setHighlightProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    company: '',
    address: '',
  });

  // ALL useEffect hooks must be called before any conditional returns
  // Check URL params for edit mode
  useEffect(() => {
    if (isReady && searchParams.get('edit') === 'true') {
      setIsEditing(true);
    }
    if (isReady && searchParams.get('edit') === 'photo') {
      setShowPhotoModal(true);
    }
  }, [searchParams, isReady]);

  // Initialize edit data from user
  useEffect(() => {
    if (isReady && user) {
      setEditData({
        name: user.name || '',
        phone: user.phone || '',
        company: user.supplierProfile?.companyName || '',
        address: '',
      });
    }
  }, [user, isReady]);

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  // Function to scroll to profile and highlight
  const scrollToEditProfile = () => {
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Activate edit mode
    setIsEditing(true);

    // Highlight animation
    setHighlightProfile(true);
    setTimeout(() => setHighlightProfile(false), 2000);
  };

  const currentUser = {
    id: user?.id || '1',
    name: user?.name || 'משתמש',
    email: user?.email || 'user@example.com',
    phone: user?.phone || '',
    avatar: user?.profileImage || null,
    role: user?.role || 'ARCHITECT',
    company: user?.supplierProfile?.companyName || '',
    address: '',
    joinDate: user?.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
    tier: user?.rank || 'GOLD',
  };

  const stats = {
    currentPoints: balance?.points || 0,
    totalPoints: (balance?.points || 0) + (balance?.totalRedeemed || 0),
    totalTransactions: invoices?.length || 0,
    totalRedeemed: balance?.totalRedeemed || 0,
  };

  // Recent activity from invoices
  const recentActivity = (invoices || []).slice(0, 5).map((inv: any) => ({
    id: inv.id,
    type: 'points',
    description: `חשבונית מ${inv.supplier?.companyName || 'ספק'}`,
    date: inv.createdAt,
    points: inv.pointsEarned || 0,
  }));

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
      case 'GOLD': return '';
      case 'SILVER': return '';
      case 'BRONZE': return '';
      default: return '';
    }
  };

  const handleSaveProfile = async () => {
    // TODO: Implement profile update API call
    setIsEditing(false);
    // Clear URL params
    router.replace('/profile');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('יש להעלות קובץ תמונה בלבד');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('הקובץ גדול מדי. גודל מקסימלי 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      await authApi.uploadProfileImage(file);
      setShowPhotoModal(false);
      // Refresh the page to show new image
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to upload profile image:', error);
      setUploadError(error.message || 'שגיאה בהעלאת התמונה');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative bg-[#F8FAFC] min-h-screen">
      <PageSlider images={sliderImages.profile} />
      <div className="p-6 max-w-6xl mx-auto relative z-10">
        {/* Profile Header */}
        <motion.div
          ref={profileRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            boxShadow: highlightProfile ? '0 0 0 3px #d4af37, 0 0 30px rgba(212, 175, 55, 0.5)' : 'none'
          }}
          transition={{ duration: 0.3 }}
          className={`mb-8 rounded-2xl ${highlightProfile ? 'ring-2 ring-gold-400 ring-offset-2 ring-offset-transparent' : ''}`}
        >
          <GlassCard className={`relative overflow-visible transition-all duration-300 ${highlightProfile ? 'border-gold-400 border-2' : ''}`}>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl overflow-hidden ring-4 ring-gold-400/30 bg-gradient-to-br from-gold-400 to-gold-600">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl font-bold text-primary-900">
                        {currentUser.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="absolute bottom-2 right-2 w-8 h-8 bg-gold-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gold-500"
                >
                  <Camera size={16} className="text-primary-900" />
                </button>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-lg">
                  {getTierEmoji(currentUser.tier)}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-right">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 text-sm mb-1">שם מלא</label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2 text-gray-800 focus:border-[#0066CC] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm mb-1">טלפון</label>
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2 text-gray-800 focus:border-[#0066CC] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm mb-1">חברה</label>
                      <input
                        type="text"
                        value={editData.company}
                        onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                        className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2 text-gray-800 focus:border-[#0066CC] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm mb-1">כתובת</label>
                      <input
                        type="text"
                        value={editData.address}
                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2 text-gray-800 focus:border-[#0066CC] transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                      <h1 className="text-3xl font-display font-bold text-gray-900">{currentUser.name}</h1>
                      <span className={`text-lg font-bold ${getTierColor(currentUser.tier)}`}>
                        {currentUser.tier}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{currentUser.company || 'לא צוין עסק'}</p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Mail size={14} />
                        <span>{currentUser.email}</span>
                      </div>
                      {currentUser.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} />
                          <span>{currentUser.phone}</span>
                        </div>
                      )}
                      {currentUser.address && (
                        <div className="flex items-center gap-2">
                          <MapPin size={14} />
                          <span>{currentUser.address}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Edit Button */}
              {isEditing ? (
                <div className="absolute top-4 left-4 flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      router.replace('/profile');
                    }}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <X size={18} className="text-gray-600" />
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="p-2 rounded-lg bg-gold-400 hover:bg-gold-500 transition-colors"
                  >
                    <Save size={18} className="text-primary-900" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute top-4 left-4 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <Edit3 size={18} className="text-gray-600" />
                </button>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Award, label: 'נקודות נוכחיות', value: stats.currentPoints.toLocaleString(), color: 'text-gold-400' },
            { icon: TrendingUp, label: 'סה"כ נצבר', value: stats.totalPoints.toLocaleString(), color: 'text-green-400' },
            { icon: CreditCard, label: 'חשבוניות', value: stats.totalTransactions.toString(), color: 'text-blue-400' },
            { icon: Calendar, label: 'חבר מאז', value: formatDate(currentUser.joinDate), color: 'text-purple-400' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="text-center">
                <stat.icon size={24} className={`mx-auto mb-2 ${stat.color}`} />
                <p className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</p>
                <p className="text-gray-700 text-sm">{stat.label}</p>
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
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-gold-400" />
                פעילות אחרונה
              </h2>
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity: any) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="text-gray-800">{activity.description}</p>
                        <p className="text-gray-600 text-sm">{formatDate(activity.date)}</p>
                      </div>
                      {activity.points !== 0 && (
                        <span className={`font-bold ${activity.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {activity.points > 0 ? '+' : ''}{activity.points.toLocaleString()} נק׳
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-600">
                    <TrendingUp size={48} className="mx-auto mb-4 opacity-30" />
                    <p>אין פעילות אחרונה להצגה</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* Quick Settings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <GlassCard>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Shield size={20} className="text-gold-400" />
                הגדרות מהירות
              </h2>
              <div className="space-y-2">
                <button
                  onClick={scrollToEditProfile}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <User size={18} />
                    <span>עריכת פרטים אישיים</span>
                  </div>
                  <ChevronLeft size={16} className="text-gray-600" />
                </button>
                <button
                  onClick={() => router.push('/settings#notifications')}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <Bell size={18} />
                    <span>הגדרות התראות</span>
                  </div>
                  <ChevronLeft size={16} className="text-gray-600" />
                </button>
                <button
                  onClick={() => router.push('/settings#security')}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <Shield size={18} />
                    <span>אבטחה ופרטיות</span>
                  </div>
                  <ChevronLeft size={16} className="text-gray-600" />
                </button>
                <button
                  onClick={() => router.push('/wallet')}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard size={18} />
                    <span>הארנק שלי</span>
                  </div>
                  <ChevronLeft size={16} className="text-gray-600" />
                </button>
                <button
                  onClick={() => router.push('/invoices')}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <Building2 size={18} />
                    <span>החשבוניות שלי</span>
                  </div>
                  <ChevronLeft size={16} className="text-gray-600" />
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>

      {/* Photo Upload Modal */}
      <AnimatePresence>
        {showPhotoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPhotoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">עדכון תמונת פרופיל</h3>
                <button onClick={() => setShowPhotoModal(false)} className="text-gray-600 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="text-center">
                <div className="w-32 h-32 mx-auto rounded-2xl overflow-hidden ring-4 ring-gold-400/30 bg-gradient-to-br from-gold-400 to-gold-600 mb-6">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl font-bold text-primary-900">
                        {currentUser.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={isUploading}
                />

                {uploadError && (
                  <div className="mb-3 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                    {uploadError}
                  </div>
                )}

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full btn-gold mb-3 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                      מעלה...
                    </>
                  ) : (
                    <>
                      <Camera size={18} className="inline ml-2" />
                      בחר תמונה
                    </>
                  )}
                </button>

                <p className="text-gray-600 text-sm">
                  JPG, PNG או GIF. מקסימום 5MB.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
