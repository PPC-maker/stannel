'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { Target, TrendingUp, Award, Calendar, CheckCircle } from 'lucide-react';
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

  // Only architects can access goals
  if (user?.role !== 'ARCHITECT') {
    return (
      <div className="relative">
        <PageSlider images={sliderImages.dashboard} />
        <div className="p-6 max-w-4xl mx-auto relative z-10 text-center py-20">
          <Target size={64} className="mx-auto text-white/20 mb-4" />
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
    <div className="relative">
      <PageSlider images={sliderImages.dashboard} />
      <div className="p-6 max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Target className="text-gold-400" />
            יעדים ובונוסים
          </h1>
          <p className="text-white/60 mt-1">מעקב אחר הביצועים שלך</p>
        </motion.div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: 'בונוסים שנצברו',
              value: `₪${(stats?.totalBonusEarned || 0).toLocaleString()}`,
              color: 'text-green-400',
              icon: Award,
            },
            {
              label: 'יעדים שהושגו',
              value: stats?.achievedGoals || 0,
              color: 'text-gold-400',
              icon: CheckCircle,
            },
            {
              label: 'אחוז הצלחה',
              value: `${stats?.achievementRate || 0}%`,
              color: 'text-blue-400',
              icon: TrendingUp,
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard className="h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/60 text-sm mb-1">{stat.label}</p>
                    <p className={`text-3xl font-bold ${stat.color}`}>{isLoading ? '...' : stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-white/10`}>
                    <stat.icon size={24} className={stat.color} />
                  </div>
                </div>
              </GlassCard>
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
            <GlassCard gold className="animate-pulse">
              <div className="h-40 bg-white/10 rounded" />
            </GlassCard>
          ) : activeGoal ? (
            <GlassCard gold>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-white/60 text-sm uppercase tracking-wider">
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
                  className={`h-full rounded-full ${activeGoal.targetMet ? 'bg-green-400' : 'bg-gold-400'}`}
                />
              </div>
              <p className="text-white/40 text-sm mt-2">
                {progressPercent.toFixed(1)}% הושג
              </p>
            </GlassCard>
          ) : (
            <GlassCard>
              <div className="text-center py-12">
                <Target size={48} className="mx-auto text-white/20 mb-4" />
                <p className="text-white/50 text-lg">אין יעד פעיל כרגע</p>
                <p className="text-white/30 text-sm mt-1">פנה למנהל המערכת להגדרת יעד</p>
              </div>
            </GlassCard>
          )}
        </motion.div>

        {/* Bonus History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard>
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Award size={20} className="text-gold-400" />
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
                <Award size={48} className="mx-auto text-white/20 mb-4" />
                <p className="text-white/50">אין בונוסים</p>
                <p className="text-white/30 text-sm mt-1">בונוסים יופיעו כאן כשתשיג יעדים</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
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
                        <p className="text-white/50 text-sm">
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
                        <p className="text-white/30 text-xs mt-1">
                          {new Date(bonus.creditedAt).toLocaleDateString('he-IL')}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
