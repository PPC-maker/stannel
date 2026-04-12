'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
        company: user.company || '',
        address: user.address || '',
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
    company: user?.company || '',
    address: user?.address || '',
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
      case 'GOLD': return 'text-yellow-400';
      case 'SILVER': return 'text-gray-300';
      case 'BRONZE': return 'text-amber-600';
      default: return 'text-white';
    }
  };

  const getTierBg = (tier: string) => {
    switch (tier) {
      case 'GOLD': return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 'SILVER': return 'from-gray-400/20 to-slate-400/20 border-gray-400/30';
      case 'BRONZE': return 'from-amber-600/20 to-orange-600/20 border-amber-600/30';
      default: return 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30';
    }
  };

  const handleSaveProfile = async () => {
    try {
      await authApi.updateProfile({
        name: editData.name,
        phone: editData.phone,
        company: editData.company,
        address: editData.address,
      });
      setIsEditing(false);
      // Clear URL params
      router.replace('/profile');
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
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
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero Background - Gradient */}
      <div className="relative h-72 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f2620] via-[#1a4a3a] to-[#0f2620]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.2),transparent_50%)]" />
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto -mt-32 relative z-10 pb-12">
        {/* Profile Header */}
        <motion.div
          ref={profileRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            boxShadow: highlightProfile ? '0 0 0 3px #10b981, 0 0 30px rgba(16, 185, 129, 0.5)' : 'none'
          }}
          transition={{ duration: 0.3 }}
          className={`mb-8 rounded-2xl ${highlightProfile ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-transparent' : ''}`}
        >
          <div className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-visible transition-all duration-300 ${highlightProfile ? 'border-emerald-400 border-2' : ''}`}>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className={`w-32 h-32 rounded-2xl overflow-hidden ring-4 ring-emerald-500/30 bg-gradient-to-br ${getTierBg(currentUser.tier)}`}>
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600">
                      <span className="text-4xl font-bold text-white">
                        {currentUser.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="absolute bottom-2 right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-600"
                >
                  <Camera size={16} className="text-white" />
                </button>
                <div className={`absolute -top-2 -right-2 px-3 py-1 bg-gradient-to-r ${getTierBg(currentUser.tier)} rounded-full border`}>
                  <span className={`text-xs font-bold ${getTierColor(currentUser.tier)}`}>{currentUser.tier}</span>
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-right">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/60 text-sm mb-1">שם מלא</label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/15 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-1">טלפון</label>
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/15 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-1">חברה</label>
                      <input
                        type="text"
                        value={editData.company}
                        onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/15 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-1">כתובת</label>
                      <input
                        type="text"
                        value={editData.address}
                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:border-emerald-500 focus:bg-white/15 transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-white">{currentUser.name}</h1>
                    </div>
                    <p className="text-white/60 mb-4">{currentUser.company || 'לא צוין עסק'}</p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-white/60">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-emerald-400" />
                        <span>{currentUser.email}</span>
                      </div>
                      {currentUser.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-emerald-400" />
                          <span>{currentUser.phone}</span>
                        </div>
                      )}
                      {currentUser.address && (
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-emerald-400" />
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
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <X size={18} className="text-white/60" />
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 transition-colors"
                  >
                    <Save size={18} className="text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute top-4 left-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Edit3 size={18} className="text-white/60" />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Award, label: 'נקודות נוכחיות', value: stats.currentPoints.toLocaleString(), color: 'text-yellow-400', borderColor: 'border-yellow-500/30' },
            { icon: TrendingUp, label: 'סה"כ נצבר', value: stats.totalPoints.toLocaleString(), color: 'text-emerald-400', borderColor: 'border-emerald-500/30' },
            { icon: CreditCard, label: 'חשבוניות', value: stats.totalTransactions.toString(), color: 'text-blue-400', borderColor: 'border-blue-500/30' },
            { icon: Calendar, label: 'חבר מאז', value: formatDate(currentUser.joinDate), color: 'text-purple-400', borderColor: 'border-purple-500/30' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white/5 backdrop-blur-md border-l-4 ${stat.borderColor} border border-white/10 rounded-2xl p-4 text-center`}
            >
              <stat.icon size={24} className={`mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-white/50 text-sm">{stat.label}</p>
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
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-emerald-400" />
                פעילות אחרונה
              </h2>
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity: any) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                    >
                      <div>
                        <p className="text-white">{activity.description}</p>
                        <p className="text-white/50 text-sm">{formatDate(activity.date)}</p>
                      </div>
                      {activity.points !== 0 && (
                        <span className={`font-bold ${activity.points > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {activity.points > 0 ? '+' : ''}{activity.points.toLocaleString()} נק׳
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-white/50">
                    <TrendingUp size={48} className="mx-auto mb-4 opacity-30" />
                    <p>אין פעילות אחרונה להצגה</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Quick Settings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Shield size={20} className="text-emerald-400" />
                הגדרות מהירות
              </h2>
              <div className="space-y-2">
                <button
                  onClick={scrollToEditProfile}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-emerald-400" />
                    <span>עריכת פרטים אישיים</span>
                  </div>
                  <ChevronLeft size={16} className="text-white/40" />
                </button>
                <button
                  onClick={() => router.push('/settings#notifications')}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <Bell size={18} className="text-emerald-400" />
                    <span>הגדרות התראות</span>
                  </div>
                  <ChevronLeft size={16} className="text-white/40" />
                </button>
                <button
                  onClick={() => router.push('/settings#security')}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <Shield size={18} className="text-emerald-400" />
                    <span>אבטחה ופרטיות</span>
                  </div>
                  <ChevronLeft size={16} className="text-white/40" />
                </button>
                <button
                  onClick={() => router.push('/wallet')}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard size={18} className="text-emerald-400" />
                    <span>הארנק שלי</span>
                  </div>
                  <ChevronLeft size={16} className="text-white/40" />
                </button>
                <button
                  onClick={() => router.push('/invoices')}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <Building2 size={18} className="text-emerald-400" />
                    <span>החשבוניות שלי</span>
                  </div>
                  <ChevronLeft size={16} className="text-white/40" />
                </button>
                {user?.role === 'SUPPLIER' && (
                  <button
                    onClick={() => router.push('/supplier/profile')}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 size={18} className="text-emerald-400" />
                      <span>עריכת פרופיל ספק</span>
                    </div>
                    <ChevronLeft size={16} className="text-white/40" />
                  </button>
                )}
              </div>
            </div>
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
              className="bg-[#0a1f18] border border-white/10 rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">עדכון תמונת פרופיל</h3>
                <button onClick={() => setShowPhotoModal(false)} className="text-white/60 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="text-center">
                <div className="w-32 h-32 mx-auto rounded-2xl overflow-hidden ring-4 ring-emerald-500/30 bg-gradient-to-br from-emerald-500 to-teal-600 mb-6">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">
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
                  <div className="mb-3 p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm">
                    {uploadError}
                  </div>
                )}

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 mb-3"
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

                <p className="text-white/50 text-sm">
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
