'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { useAdminGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { useAdminGoals, useCreateGoal } from '@/lib/api-hooks';
import { adminApi } from '@stannel/api-client';
import {
  Target,
  Plus,
  CheckCircle,
  Calendar,
  User,
  Loader2,
  ArrowRight,
  Award,
  Percent,
} from 'lucide-react';
import Swal from 'sweetalert2';
import Link from 'next/link';

interface ArchitectGoal {
  id: string;
  architectId: string;
  targetAmount: number;
  currentPeriodRevenue: number;
  bonusPercentage: number;
  periodType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: string;
  endDate: string;
  isActive: boolean;
  targetMet: boolean;
  targetMetAt?: string;
  createdAt: string;
  architect: {
    user: {
      name: string;
      email: string;
    };
  };
}

const PERIOD_LABELS: Record<string, string> = {
  MONTHLY: 'חודשי',
  QUARTERLY: 'רבעוני',
  YEARLY: 'שנתי',
};

export default function ManageGoalsPage() {
  const { isReady } = useAdminGuard();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [architects, setArchitects] = useState<Array<{ id: string; userId: string; user: { name: string; email: string } }>>([]);
  const [loadingArchitects, setLoadingArchitects] = useState(false);

  const { data: goalsData, isLoading, refetch } = useAdminGoals(showActiveOnly);
  const createMutation = useCreateGoal();

  const goals = (goalsData?.data || []) as ArchitectGoal[];

  const loadArchitects = async () => {
    setLoadingArchitects(true);
    try {
      const response = await adminApi.getUsers({ role: 'ARCHITECT', pageSize: 100, isActive: true });
      setArchitects(response.data.filter((u: any) => u.architectProfile).map((u: any) => ({
        id: u.architectProfile.id,
        userId: u.id,
        user: { name: u.name, email: u.email },
      })));
    } catch (error) {
      console.error('Error loading architects:', error);
    } finally {
      setLoadingArchitects(false);
    }
  };

  const handleCreate = async (formData: FormData) => {
    try {
      await createMutation.mutateAsync({
        architectId: formData.get('architectId') as string,
        targetAmount: parseFloat(formData.get('targetAmount') as string),
        bonusPercentage: parseFloat(formData.get('bonusPercentage') as string),
        periodType: formData.get('periodType') as 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
        startDate: formData.get('startDate') as string,
        endDate: formData.get('endDate') as string,
      });
      setShowAddModal(false);
      Swal.fire({
        title: 'נוצר בהצלחה!',
        text: 'היעד נוסף לאדריכל',
        icon: 'success',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
      refetch();
    } catch (error) {
      Swal.fire({
        title: 'שגיאה',
        text: 'אירעה שגיאה ביצירת היעד',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    }
  };

  const getProgressPercentage = (goal: ArchitectGoal) => {
    if (goal.targetAmount === 0) return 0;
    return Math.min(100, Math.round((goal.currentPeriodRevenue / goal.targetAmount) * 100));
  };

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  return (
    <div className="relative min-h-screen">
      <PageSlider images={sliderImages.dashboard}  />
      <div className="p-6 max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowRight size={18} />
            חזרה לפאנל ניהול
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900 flex items-center gap-3">
                <Target className="text-[#0066CC]" />
                ניהול יעדי אדריכלים
              </h1>
              <p className="text-gray-600 mt-1">הגדרת יעדי מכירות ובונוסים לאדריכלים</p>
            </div>
            <button
              onClick={() => {
                loadArchitects();
                setShowAddModal(true);
              }}
              className="btn-gold flex items-center gap-2"
            >
              <Plus size={18} />
              הוסף יעד חדש
            </button>
          </div>
        </motion.div>

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <GlassCard hover={false}>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                  className="w-4 h-4 rounded bg-gray-100 border-gray-200 text-gold-400"
                />
                <span className="text-gray-900">הצג יעדים פעילים בלבד</span>
              </label>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <GlassCard hover={false}>
            <div className="text-center">
              <p className="text-gray-500 text-sm">סה״כ יעדים</p>
              <p className="text-3xl font-bold text-gray-900">{goals.length}</p>
            </div>
          </GlassCard>
          <GlassCard hover={false} className="bg-green-500/10">
            <div className="text-center">
              <p className="text-green-400/70 text-sm">הושגו</p>
              <p className="text-3xl font-bold text-green-400">
                {goals.filter(g => g.targetMet).length}
              </p>
            </div>
          </GlassCard>
          <GlassCard hover={false} className="bg-yellow-500/10">
            <div className="text-center">
              <p className="text-yellow-400/70 text-sm">בתהליך</p>
              <p className="text-3xl font-bold text-yellow-400">
                {goals.filter(g => g.isActive && !g.targetMet).length}
              </p>
            </div>
          </GlassCard>
          <GlassCard hover={false} className="bg-gold-500/10">
            <div className="text-center">
              <p className="text-gold-400/70 text-sm">סה״כ יעדים (₪)</p>
              <p className="text-3xl font-bold text-gold-400">
                {goals.reduce((sum, g) => sum + g.targetAmount, 0).toLocaleString()}
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Goals List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard hover={false}>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 mx-auto text-gold-400 animate-spin" />
                <p className="text-gray-600 mt-4">טוען יעדים...</p>
              </div>
            ) : goals.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">אין יעדים להצגה</p>
                <p className="text-gray-400 text-sm mt-2">לחץ על "הוסף יעד חדש" ליצירת יעד</p>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map((goal) => {
                  const progress = getProgressPercentage(goal);
                  const isCompleted = goal.targetMet;
                  const isExpired = new Date(goal.endDate) < new Date() && !isCompleted;

                  return (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl border ${
                        isCompleted
                          ? 'border-green-500/30 bg-green-500/10'
                          : isExpired
                          ? 'border-red-500/30 bg-red-500/10'
                          : goal.isActive
                          ? 'border-gold-500/30 bg-gold-500/5'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            isCompleted ? 'bg-green-500/20' : isExpired ? 'bg-red-500/20' : 'bg-gold-500/20'
                          }`}>
                            {isCompleted ? (
                              <Award className="text-green-400" size={24} />
                            ) : (
                              <Target className={isExpired ? 'text-red-400' : 'text-gold-400'} size={24} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-gray-400" />
                              <span className="text-gray-900 font-medium">{goal.architect.user.name}</span>
                            </div>
                            <p className="text-gray-500 text-sm">{goal.architect.user.email}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            isCompleted
                              ? 'bg-green-500/20 text-green-400'
                              : isExpired
                              ? 'bg-red-500/20 text-red-400'
                              : goal.isActive
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {isCompleted ? 'הושג' : isExpired ? 'פג תוקף' : goal.isActive ? 'פעיל' : 'לא פעיל'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-gray-400 text-xs">יעד</p>
                          <p className="text-gray-900 font-bold text-lg">₪{goal.targetAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">התקדמות</p>
                          <p className="text-gray-900 font-bold text-lg">₪{goal.currentPeriodRevenue.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">בונוס</p>
                          <p className="text-gold-400 font-bold text-lg flex items-center gap-1">
                            <Percent size={14} />
                            {goal.bonusPercentage}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">תקופה</p>
                          <p className="text-gray-900 font-bold text-lg">{PERIOD_LABELS[goal.periodType]}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isCompleted ? 'bg-green-400' : progress >= 75 ? 'bg-gold-400' : 'bg-blue-400'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-gray-600 text-sm mt-1">{progress}% הושלם</p>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(goal.startDate).toLocaleDateString('he-IL')}
                          </span>
                          <span>עד</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(goal.endDate).toLocaleDateString('he-IL')}
                          </span>
                        </div>
                        {goal.targetMetAt && (
                          <span className="flex items-center gap-1 text-green-400">
                            <CheckCircle size={14} />
                            הושג ב-{new Date(goal.targetMetAt).toLocaleDateString('he-IL')}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg"
            >
              <GlassCard hover={false}>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">הוספת יעד חדש</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleCreate(formData);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-gray-600 text-sm mb-1">אדריכל *</label>
                    {loadingArchitects ? (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Loader2 size={16} className="animate-spin" />
                        טוען אדריכלים...
                      </div>
                    ) : (
                      <select
                        name="architectId"
                        required
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900"
                      >
                        <option value="">בחר אדריכל</option>
                        {architects.map(arch => (
                          <option key={arch.id} value={arch.id}>
                            {arch.user.name} ({arch.user.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 text-sm mb-1">יעד (₪) *</label>
                      <input
                        type="number"
                        name="targetAmount"
                        required
                        min="0"
                        step="1000"
                        placeholder="100000"
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm mb-1">אחוז בונוס *</label>
                      <input
                        type="number"
                        name="bonusPercentage"
                        required
                        min="0"
                        max="100"
                        step="0.5"
                        defaultValue="5"
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm mb-1">סוג תקופה *</label>
                    <select
                      name="periodType"
                      required
                      className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900"
                    >
                      <option value="MONTHLY">חודשי</option>
                      <option value="QUARTERLY">רבעוני</option>
                      <option value="YEARLY">שנתי</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-600 text-sm mb-1">תאריך התחלה *</label>
                      <input
                        type="date"
                        name="startDate"
                        required
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 text-sm mb-1">תאריך סיום *</label>
                      <input
                        type="date"
                        name="endDate"
                        required
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="flex-1 btn-gold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {createMutation.isPending && (
                        <Loader2 size={18} className="animate-spin" />
                      )}
                      הוסף יעד
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
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
