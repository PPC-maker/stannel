'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
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
        background: '#0a1f18',
        color: '#ffffff',
        confirmButtonColor: '#10b981',
      });
      refetch();
    } catch (error) {
      Swal.fire({
        title: 'שגיאה',
        text: 'אירעה שגיאה ביצירת היעד',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#0a1f18',
        color: '#ffffff',
        confirmButtonColor: '#10b981',
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
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero Section */}
      <div className="relative h-80 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1552664730-d307ca884978"
          alt="Team planning"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2620]/60 via-[#0f2620]/70 to-[#0f2620]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0f2620] to-transparent" />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto -mt-40 relative z-10 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
          >
            <ArrowRight size={18} />
            חזרה לפאנל ניהול
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                <Target className="text-emerald-400" />
                ניהול יעדי אדריכלים
              </h1>
              <p className="text-white/60 mt-1">הגדרת יעדי מכירות ובונוסים לאדריכלים</p>
            </div>
            <button
              onClick={() => {
                loadArchitects();
                setShowAddModal(true);
              }}
              className="bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
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
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                  className="w-4 h-4 rounded bg-white/5 border-white/10 text-emerald-400"
                />
                <span className="text-white">הצג יעדים פעילים בלבד</span>
              </label>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="text-center">
              <p className="text-white/40 text-sm">סה״כ יעדים</p>
              <p className="text-3xl font-bold text-white">{goals.length}</p>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 bg-green-500/10">
            <div className="text-center">
              <p className="text-green-400/70 text-sm">הושגו</p>
              <p className="text-3xl font-bold text-green-400">
                {goals.filter(g => g.targetMet).length}
              </p>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 bg-yellow-500/10">
            <div className="text-center">
              <p className="text-yellow-400/70 text-sm">בתהליך</p>
              <p className="text-3xl font-bold text-yellow-400">
                {goals.filter(g => g.isActive && !g.targetMet).length}
              </p>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 bg-emerald-500/10">
            <div className="text-center">
              <p className="text-emerald-400/70 text-sm">סה״כ יעדים (₪)</p>
              <p className="text-3xl font-bold text-emerald-400">
                {goals.reduce((sum, g) => sum + g.targetAmount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Goals List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 mx-auto text-emerald-400 animate-spin" />
                <p className="text-white/60 mt-4">טוען יעדים...</p>
              </div>
            ) : goals.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-16 h-16 mx-auto text-white/20 mb-4" />
                <p className="text-white/60">אין יעדים להצגה</p>
                <p className="text-white/40 text-sm mt-2">לחץ על "הוסף יעד חדש" ליצירת יעד</p>
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
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            isCompleted ? 'bg-green-500/20' : isExpired ? 'bg-red-500/20' : 'bg-emerald-500/20'
                          }`}>
                            {isCompleted ? (
                              <Award className="text-green-400" size={24} />
                            ) : (
                              <Target className={isExpired ? 'text-red-400' : 'text-emerald-400'} size={24} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-white/40" />
                              <span className="text-white font-medium">{goal.architect.user.name}</span>
                            </div>
                            <p className="text-white/40 text-sm">{goal.architect.user.email}</p>
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
                              : 'bg-white/10 text-white/40'
                          }`}>
                            {isCompleted ? 'הושג' : isExpired ? 'פג תוקף' : goal.isActive ? 'פעיל' : 'לא פעיל'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-white/40 text-xs">יעד</p>
                          <p className="text-white font-bold text-lg">₪{goal.targetAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">התקדמות</p>
                          <p className="text-white font-bold text-lg">₪{goal.currentPeriodRevenue.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">בונוס</p>
                          <p className="text-emerald-400 font-bold text-lg flex items-center gap-1">
                            <Percent size={14} />
                            {goal.bonusPercentage}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">תקופה</p>
                          <p className="text-white font-bold text-lg">{PERIOD_LABELS[goal.periodType]}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isCompleted ? 'bg-green-400' : progress >= 75 ? 'bg-emerald-400' : 'bg-blue-400'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-white/60 text-sm mt-1">{progress}% הושלם</p>
                      </div>

                      <div className="flex items-center justify-between text-sm text-white/40">
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
          </div>
        </motion.div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg"
            >
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6">הוספת יעד חדש</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleCreate(formData);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-white/60 text-sm mb-1">אדריכל *</label>
                    {loadingArchitects ? (
                      <div className="flex items-center gap-2 text-white/60">
                        <Loader2 size={16} className="animate-spin" />
                        טוען אדריכלים...
                      </div>
                    ) : (
                      <select
                        name="architectId"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
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
                      <label className="block text-white/60 text-sm mb-1">יעד (₪) *</label>
                      <input
                        type="number"
                        name="targetAmount"
                        required
                        min="0"
                        step="1000"
                        placeholder="100000"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-1">אחוז בונוס *</label>
                      <input
                        type="number"
                        name="bonusPercentage"
                        required
                        min="0"
                        max="100"
                        step="0.5"
                        defaultValue="5"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">סוג תקופה *</label>
                    <select
                      name="periodType"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                    >
                      <option value="MONTHLY">חודשי</option>
                      <option value="QUARTERLY">רבעוני</option>
                      <option value="YEARLY">שנתי</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/60 text-sm mb-1">תאריך התחלה *</label>
                      <input
                        type="date"
                        name="startDate"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-1">תאריך סיום *</label>
                      <input
                        type="date"
                        name="endDate"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                    >
                      {createMutation.isPending && (
                        <Loader2 size={18} className="animate-spin" />
                      )}
                      הוסף יעד
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 bg-white/10 border border-white/10 text-white py-3 rounded-xl hover:bg-white/20 transition-colors"
                    >
                      ביטול
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
