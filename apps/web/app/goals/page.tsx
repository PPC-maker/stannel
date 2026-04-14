'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Target, TrendingUp, Award, CheckCircle } from 'lucide-react';
import { useArchitectGoals, useActiveGoal, useGoalStats, useBonusTransactions } from '@/lib/api-hooks';
import { useAuth } from '@/lib/auth-context';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';

export default function GoalsPage() {
  const { isReady } = useAuthGuard();
  const { user } = useAuth();
  const { data: goalsData, isLoading: goalsLoading } = useArchitectGoals();
  const { data: activeGoal, isLoading: activeGoalLoading } = useActiveGoal();
  const { data: stats, isLoading: statsLoading } = useGoalStats();
  const { data: bonusesData, isLoading: bonusesLoading } = useBonusTransactions();

  const goals = goalsData?.data || [];
  const bonuses = bonusesData?.data || [];
  const isLoading = goalsLoading || activeGoalLoading || statsLoading || bonusesLoading;

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  if (user?.role !== 'ARCHITECT') {
    return (
      <div className="min-h-screen bg-[#0f2620] -mt-16 flex items-center justify-center">
        <div className="text-center">
          <Target size={64} className="mx-auto text-white/30 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">גישה מוגבלת</h1>
          <p className="text-white/60">עמוד זה זמין לאדריכלים בלבד</p>
        </div>
      </div>
    );
  }

  const progressPercent = activeGoal
    ? Math.min((activeGoal.currentPeriodRevenue / activeGoal.targetAmount) * 100, 100)
    : 0;

  const possibleBonus = activeGoal
    ? (activeGoal.targetAmount * activeGoal.bonusPercentage) / 100
    : 0;

  return (
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero Background */}
      <div className="absolute inset-x-0 top-0 h-[40vh]">
        <Image
          src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80"
          alt="Goals"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2620]/30 via-transparent to-[#0f2620]" />
      </div>

      <div className="relative z-10 px-4 sm:px-6 pt-24 sm:pt-28 pb-6 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
            <Target className="text-emerald-400" size={24} />
            יעדים ובונוסים
          </h1>
          <p className="text-white/60 mt-1 text-sm sm:text-base">מעקב אחר הביצועים שלך</p>
        </motion.div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'בונוסים שנצברו', value: `₪${(stats?.totalBonusEarned || 0).toLocaleString()}`, color: 'text-green-400', borderColor: 'border-green-500/30', icon: Award },
            { label: 'יעדים שהושגו', value: stats?.achievedGoals || 0, color: 'text-emerald-400', borderColor: 'border-emerald-500/30', icon: CheckCircle },
            { label: 'אחוז הצלחה', value: `${stats?.achievementRate || 0}%`, color: 'text-blue-400', borderColor: 'border-blue-500/30', icon: TrendingUp },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white/5 backdrop-blur-md border ${stat.borderColor} rounded-2xl p-5`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-sm mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{isLoading ? '...' : stat.value}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/10">
                  <stat.icon size={24} className={stat.color} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Active Goal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          {activeGoalLoading ? (
            <div className="bg-gradient-to-br from-emerald-600/30 to-emerald-800/30 backdrop-blur-md border border-emerald-500/30 rounded-3xl p-6 animate-pulse">
              <div className="h-40 bg-white/10 rounded" />
            </div>
          ) : activeGoal ? (
            <div className="bg-gradient-to-br from-emerald-600/30 to-emerald-800/30 backdrop-blur-md border border-emerald-500/30 rounded-3xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-white/70 text-sm uppercase tracking-wider">
                    יעד {activeGoal.periodType === 'MONTHLY' ? 'חודשי' : activeGoal.periodType === 'QUARTERLY' ? 'רבעוני' : 'שנתי'} פעיל
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    {new Date(activeGoal.startDate).toLocaleDateString('he-IL')} — {new Date(activeGoal.endDate).toLocaleDateString('he-IL')}
                  </p>
                </div>
                {activeGoal.targetMet && (
                  <div className="flex items-center gap-2 bg-green-500/20 border border-green-400/30 px-4 py-2 rounded-lg">
                    <Award className="w-4 h-4 text-green-400" />
                    <span className="text-green-300 text-sm font-medium">הושג!</span>
                  </div>
                )}
              </div>

              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-4xl font-bold text-white">
                    ₪{(activeGoal.currentPeriodRevenue || 0).toLocaleString()}
                  </p>
                  <p className="text-white/40 text-sm mt-1">
                    מתוך ₪{activeGoal.targetAmount?.toLocaleString()}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-white/40 text-xs uppercase tracking-wider">בונוס אפשרי</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">
                    ₪{possibleBonus.toLocaleString()}
                  </p>
                  <p className="text-white/30 text-xs">{activeGoal.bonusPercentage}%</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${activeGoal.targetMet ? 'bg-green-400' : 'bg-emerald-400'}`}
                />
              </div>
              <p className="text-white/40 text-sm mt-2">
                {progressPercent.toFixed(1)}% הושג
              </p>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
              <Target size={48} className="mx-auto text-white/30 mb-4" />
              <p className="text-white/70 text-lg">אין יעד פעיל כרגע</p>
              <p className="text-white/50 text-sm mt-1">פנה למנהל המערכת להגדרת יעד</p>
            </div>
          )}
        </motion.div>

        {/* Bonus History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Award size={20} className="text-emerald-400" />
              היסטוריית בונוסים
            </h2>

            {bonusesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                    <div className="w-10 h-10 bg-white/10 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-white/10 rounded mb-2" />
                      <div className="h-3 w-48 bg-white/5 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : bonuses.length === 0 ? (
              <div className="text-center py-12">
                <Award size={48} className="mx-auto text-white/30 mb-4" />
                <p className="text-white/70">אין בונוסים</p>
                <p className="text-white/50 text-sm mt-1">בונוסים יופיעו כאן כשתשיג יעדים</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {bonuses.map((bonus: any, index: number) => (
                  <motion.div
                    key={bonus.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        bonus.status === 'CREDITED' ? 'bg-green-500/20' : 'bg-amber-500/20'
                      }`}>
                        <Award className={`w-5 h-5 ${
                          bonus.status === 'CREDITED' ? 'text-green-400' : 'text-amber-400'
                        }`} />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          ₪{bonus.amount?.toLocaleString()}
                        </p>
                        <p className="text-white/60 text-sm">
                          {bonus.bonusType === 'goal_achieved' ? 'בונוס השגת יעד' : bonus.bonusType}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        bonus.status === 'CREDITED' ? 'bg-green-500/20 text-green-400' :
                        bonus.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {bonus.status === 'CREDITED' ? 'זוכה' : bonus.status === 'PENDING' ? 'ממתין' : 'נכשל'}
                      </span>
                      {bonus.creditedAt && (
                        <p className="text-white/50 text-xs mt-1">
                          {new Date(bonus.creditedAt).toLocaleDateString('he-IL')}
                        </p>
                      )}
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
