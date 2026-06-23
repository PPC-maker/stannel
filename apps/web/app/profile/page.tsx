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
  const { user, refreshUser } = useAuth();
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
      default: return 'text-[#2b241d]';
    }
  };

  const getTierBg = (tier: string) => {
    switch (tier) {
      case 'GOLD': return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 'SILVER': return 'from-gray-400/20 to-slate-400/20 border-gray-400/30';
      case 'BRONZE': return 'from-amber-600/20 to-orange-600/20 border-amber-600/30';
      default: return 'from-[#c99b4a]/20 to-[#9e7746]/20 border-[#c99b4a]/30';
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
      setShowPhotoModal(false);
      // Refresh user data to show updated info
      await refreshUser();
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
      // Refresh user data to show new image
      await refreshUser();
    } catch (error: any) {
      console.error('Failed to upload profile image:', error);
      setUploadError(error.message || 'שגיאה בהעלאת התמונה');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pt-8 relative z-10 pb-24">
        {/* Profile Header */}
        <motion.div
          ref={profileRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            boxShadow: highlightProfile ? '0 0 0 3px #c99b4a, 0 0 30px rgba(201, 155, 74, 0.5)' : 'none'
          }}
          transition={{ duration: 0.3 }}
          className={`mb-8 rounded-2xl ${highlightProfile ? 'ring-2 ring-[#c99b4a] ring-offset-2 ring-offset-transparent' : ''}`}
        >
          <div className={`bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-4 sm:p-6 relative overflow-visible transition-all duration-300 ${highlightProfile ? 'border-[#c99b4a] border-2' : ''}`}>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden ring-4 ring-[#c99b4a]/30 bg-gradient-to-br ${getTierBg(currentUser.tier)}`}>
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#c99b4a] to-[#9e7746]">
                      <span className="text-4xl font-bold text-white">
                        {currentUser.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="absolute -bottom-3 -left-3 w-8 h-8 bg-[#c99b4a] rounded-full flex items-center justify-center hover:bg-[#9e7746] transition-colors shadow-md z-10"
                >
                  <Camera size={16} className="text-white" />
                </button>
                <div className={`absolute -top-2 -left-2 px-3 py-1 bg-gradient-to-r ${getTierBg(currentUser.tier)} rounded-full border z-10`}>
                  <span className={`text-xs font-bold ${getTierColor(currentUser.tier)}`}>{currentUser.tier}</span>
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-right">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#8b7c69] text-sm mb-1">שם מלא</label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.15)] rounded-xl px-4 py-2 text-[#2b241d] placeholder:text-[#a89b8a] focus:border-[#c99b4a] focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[#8b7c69] text-sm mb-1">טלפון</label>
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        className="w-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.15)] rounded-xl px-4 py-2 text-[#2b241d] placeholder:text-[#a89b8a] focus:border-[#c99b4a] focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[#8b7c69] text-sm mb-1">חברה</label>
                      <input
                        type="text"
                        value={editData.company}
                        onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                        className="w-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.15)] rounded-xl px-4 py-2 text-[#2b241d] placeholder:text-[#a89b8a] focus:border-[#c99b4a] focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[#8b7c69] text-sm mb-1">כתובת</label>
                      <input
                        type="text"
                        value={editData.address}
                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        className="w-full bg-[#f7f3f2] border border-[rgba(201,155,74,0.15)] rounded-xl px-4 py-2 text-[#2b241d] placeholder:text-[#a89b8a] focus:border-[#c99b4a] focus:bg-white transition-all"
                      />
                    </div>
                    <div className="flex gap-2 justify-center md:justify-start pt-2">
                      <button
                        onClick={handleSaveProfile}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#c99b4a] hover:bg-[#9e7746] transition-colors text-white text-sm font-medium"
                      >
                        <Save size={16} />
                        <span>שמור</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          router.replace('/profile');
                        }}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-[rgba(201,155,74,0.2)] bg-white hover:bg-[#f7f3f2] transition-colors text-[#8b7c69] text-sm font-medium"
                      >
                        <X size={16} />
                        <span>ביטול</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                      <h1 className="text-2xl sm:text-3xl font-bold text-[#2b241d]">{currentUser.name}</h1>
                    </div>
                    <p className="text-[#8b7c69] mb-4">{currentUser.company || 'לא צוין עסק'}</p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-[#8b7c69]">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-[#c99b4a]" />
                        <span>{currentUser.email}</span>
                      </div>
                      {currentUser.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-[#c99b4a]" />
                          <span>{currentUser.phone}</span>
                        </div>
                      )}
                      {currentUser.address && (
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-[#c99b4a]" />
                          <span>{currentUser.address}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Edit Button */}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-[#f7f3f2] hover:bg-[#ede6e0] transition-colors"
                >
                  <Edit3 size={18} className="text-[#8b7c69]" />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Award, label: 'נקודות נוכחיות', value: stats.currentPoints.toLocaleString(), color: 'text-yellow-400', borderColor: 'border-yellow-500/30' },
            { icon: TrendingUp, label: 'סה"כ נצבר', value: stats.totalPoints.toLocaleString(), color: 'text-[#c99b4a]', borderColor: 'border-[#c99b4a]/30' },
            { icon: CreditCard, label: 'חשבוניות', value: stats.totalTransactions.toString(), color: 'text-blue-400', borderColor: 'border-blue-500/30' },
            { icon: Calendar, label: 'חבר מאז', value: formatDate(currentUser.joinDate), color: 'text-purple-400', borderColor: 'border-purple-500/30' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-[#f7f3f2] border-l-4 ${stat.borderColor} border border-[rgba(201,155,74,0.08)] rounded-2xl p-4 text-center`}
            >
              <stat.icon size={24} className={`mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold text-[#2b241d] mb-1">{stat.value}</p>
              <p className="text-[#a89b8a] text-sm">{stat.label}</p>
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
            <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-[#2b241d] mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-[#c99b4a]" />
                פעילות אחרונה
              </h2>
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity: any) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#f7f3f2] hover:bg-[#ede6e0] transition-colors border border-[rgba(201,155,74,0.08)]"
                    >
                      <div>
                        <p className="text-[#2b241d]">{activity.description}</p>
                        <p className="text-[#a89b8a] text-sm">{formatDate(activity.date)}</p>
                      </div>
                      {activity.points !== 0 && (
                        <span className={`font-bold ${activity.points > 0 ? 'text-[#c99b4a]' : 'text-red-400'}`}>
                          {activity.points > 0 ? '+' : ''}{activity.points.toLocaleString()} נק׳
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[#a89b8a]">
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
            <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-[#2b241d] mb-4 flex items-center gap-2">
                <Shield size={20} className="text-[#c99b4a]" />
                הגדרות מהירות
              </h2>
              <div className="space-y-2">
                <button
                  onClick={scrollToEditProfile}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-[#f7f3f2] hover:bg-[#ede6e0] transition-colors text-[#8b7c69] hover:text-[#2b241d] border border-[rgba(201,155,74,0.08)]"
                >
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-[#c99b4a]" />
                    <span>עריכת פרטים אישיים</span>
                  </div>
                  <ChevronLeft size={16} className="text-[#a89b8a]" />
                </button>
                <button
                  onClick={() => router.push('/settings#notifications')}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-[#f7f3f2] hover:bg-[#ede6e0] transition-colors text-[#8b7c69] hover:text-[#2b241d] border border-[rgba(201,155,74,0.08)]"
                >
                  <div className="flex items-center gap-3">
                    <Bell size={18} className="text-[#c99b4a]" />
                    <span>הגדרות התראות</span>
                  </div>
                  <ChevronLeft size={16} className="text-[#a89b8a]" />
                </button>
                <button
                  onClick={() => router.push('/settings#security')}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-[#f7f3f2] hover:bg-[#ede6e0] transition-colors text-[#8b7c69] hover:text-[#2b241d] border border-[rgba(201,155,74,0.08)]"
                >
                  <div className="flex items-center gap-3">
                    <Shield size={18} className="text-[#c99b4a]" />
                    <span>אבטחה ופרטיות</span>
                  </div>
                  <ChevronLeft size={16} className="text-[#a89b8a]" />
                </button>
                <button
                  onClick={() => router.push('/wallet')}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-[#f7f3f2] hover:bg-[#ede6e0] transition-colors text-[#8b7c69] hover:text-[#2b241d] border border-[rgba(201,155,74,0.08)]"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard size={18} className="text-[#c99b4a]" />
                    <span>הארנק שלי</span>
                  </div>
                  <ChevronLeft size={16} className="text-[#a89b8a]" />
                </button>
                <button
                  onClick={() => router.push('/invoices')}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-[#f7f3f2] hover:bg-[#ede6e0] transition-colors text-[#8b7c69] hover:text-[#2b241d] border border-[rgba(201,155,74,0.08)]"
                >
                  <div className="flex items-center gap-3">
                    <Building2 size={18} className="text-[#c99b4a]" />
                    <span>החשבוניות שלי</span>
                  </div>
                  <ChevronLeft size={16} className="text-[#a89b8a]" />
                </button>
                {user?.role === 'SUPPLIER' && (
                  <button
                    onClick={() => router.push('/supplier/profile')}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-[#f7f3f2] hover:bg-[#ede6e0] transition-colors text-[#8b7c69] hover:text-[#2b241d] border border-[rgba(201,155,74,0.08)]"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 size={18} className="text-[#c99b4a]" />
                      <span>עריכת פרופיל ספק</span>
                    </div>
                    <ChevronLeft size={16} className="text-[#a89b8a]" />
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
              className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-[#2b241d]">עדכון תמונת פרופיל</h3>
                <button onClick={() => setShowPhotoModal(false)} className="text-[#8b7c69] hover:text-[#2b241d]">
                  <X size={20} />
                </button>
              </div>

              <div className="text-center">
                <div className="w-32 h-32 mx-auto rounded-2xl overflow-hidden ring-4 ring-[#c99b4a]/30 bg-gradient-to-br from-[#c99b4a] to-[#9e7746] mb-6">
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
                  className="w-full bg-gradient-to-r from-[#c99b4a] to-[#9e7746] text-white py-3 px-6 rounded-xl font-semibold hover:from-[#9e7746] hover:to-[#86643a] transition-all disabled:opacity-50 mb-3"
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

                {currentUser.avatar && (
                  <button
                    onClick={async () => {
                      try {
                        await authApi.updateProfile({ profileImage: null });
                        setShowPhotoModal(false);
                        await refreshUser();
                      } catch (error) {
                        console.error('Failed to remove profile image:', error);
                      }
                    }}
                    disabled={isUploading}
                    className="w-full border border-red-300 text-red-500 py-3 px-6 rounded-xl font-semibold hover:bg-red-50 transition-all disabled:opacity-50 mb-3"
                  >
                    <X size={18} className="inline ml-2" />
                    הסר תמונה
                  </button>
                )}

                <p className="text-[#a89b8a] text-sm">
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
