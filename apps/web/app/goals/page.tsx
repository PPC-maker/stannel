'use client';

import { motion } from 'framer-motion';
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
      <div className="min-h-screen -mt-16 flex items-center justify-center">
        <div className="text-center">
          <Target size={64} className="mx-auto text-[#a89b8a] mb-4" />
          <h1 className="text-2xl font-bold text-[#2b241d] mb-2">גישה מוגבלת</h1>
          <p className="text-[#8b7c69]">עמוד זה זמין לאדריכלים בלבד</p>
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
    <div className="min-h-screen">
      <div className="relative z-10 px-4 sm:px-6 pt-8 pb-24 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2b241d] flex items-center gap-2 sm:gap-3">
            <Target className="text-[#c99b4a]" size={24} />
            יעדים ובונוסים
          </h1>
          <p className="text-[#8b7c69] mt-1 text-sm sm:text-base">מעקב אחר הביצועים שלך</p>
        </motion.div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'בונוסים שנצברו', value: `₪${(stats?.totalBonusEarned || 0).toLocaleString()}`, color: 'text-[#c99b4a]', borderColor: 'border-[#c99b4a]/20', icon: Award },
            { label: 'יעדים שהושגו', value: stats?.achievedGoals || 0, color: 'text-[#c99b4a]', borderColor: 'border-[rgba(201,155,74,0.2)]', icon: CheckCircle },
            { label: 'אחוז הצלחה', value: `${stats?.achievementRate || 0}%`, color: 'text-blue-500', borderColor: 'border-blue-200', icon: TrendingUp },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-[#f7f3f2] border ${stat.borderColor} rounded-2xl p-5`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#8b7c69] text-sm mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{isLoading ? '...' : stat.value}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#f7f3f2]">
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
            <div className="bg-gradient-to-br from-[#c99b4a]/10 to-[#c99b4a]/5 border border-[rgba(201,155,74,0.2)] rounded-3xl p-6 animate-pulse">
              <div className="h-40 bg-[#f7f3f2] rounded" />
            </div>
          ) : activeGoal ? (
            <div className="bg-gradient-to-br from-[#c99b4a]/10 to-[#c99b4a]/5 border border-[rgba(201,155,74,0.2)] rounded-3xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-[#8b7c69] text-sm uppercase tracking-wider">
                    יעד {activeGoal.periodType === 'MONTHLY' ? 'חודשי' : activeGoal.periodType === 'QUARTERLY' ? 'רבעוני' : 'שנתי'} פעיל
                  </p>
                  <p className="text-[#a89b8a] text-xs mt-1">
                    {new Date(activeGoal.startDate).toLocaleDateString('he-IL')} — {new Date(activeGoal.endDate).toLocaleDateString('he-IL')}
                  </p>
                </div>
                {activeGoal.targetMet && (
                  <div className="flex items-center gap-2 bg-[#c99b4a]/10 border border-[#c99b4a]/20 px-4 py-2 rounded-lg">
                    <Award className="w-4 h-4 text-[#c99b4a]" />
                    <span className="text-[#c99b4a] text-sm font-medium">הושג!</span>
                  </div>
                )}
              </div>

              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-4xl font-bold text-[#2b241d]">
                    ₪{(activeGoal.currentPeriodRevenue || 0).toLocaleString()}
                  </p>
                  <p className="text-[#a89b8a] text-sm mt-1">
                    מתוך ₪{activeGoal.targetAmount?.toLocaleString()}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-[#a89b8a] text-xs uppercase tracking-wider">בונוס אפשרי</p>
                  <p className="text-2xl font-bold text-[#c99b4a] mt-1">
                    ₪{possibleBonus.toLocaleString()}
                  </p>
                  <p className="text-[#a89b8a] text-xs">{activeGoal.bonusPercentage}%</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-[#f0ebe6] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${activeGoal.targetMet ? 'bg-[#c99b4a]' : 'bg-[#c99b4a]'}`}
                />
              </div>
              <p className="text-[#a89b8a] text-sm mt-2">
                {progressPercent.toFixed(1)}% הושג
              </p>
            </div>
          ) : (
            <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-12 text-center">
              <Target size={48} className="mx-auto text-[#a89b8a] mb-4" />
              <p className="text-[#8b7c69] text-lg">אין יעד פעיל כרגע</p>
              <p className="text-[#a89b8a] text-sm mt-1">פנה למנהל המערכת להגדרת יעד</p>
            </div>
          )}
        </motion.div>

        {/* Bonus History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-[#2b241d] mb-6 flex items-center gap-2">
              <Award size={20} className="text-[#c99b4a]" />
              היסטוריית בונוסים
            </h2>

            {bonusesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                    <div className="w-10 h-10 bg-[#f0ebe6] rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-[#f0ebe6] rounded mb-2" />
                      <div className="h-3 w-48 bg-[#f7f3f2] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : bonuses.length === 0 ? (
              <div className="text-center py-12">
                <Award size={48} className="mx-auto text-[#a89b8a] mb-4" />
                <p className="text-[#8b7c69]">אין בונוסים</p>
                <p className="text-[#a89b8a] text-sm mt-1">בונוסים יופיעו כאן כשתשיג יעדים</p>
              </div>
            ) : (
              <div className="divide-y divide-[rgba(201,155,74,0.08)]">
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
                        bonus.status === 'CREDITED' ? 'bg-[#c99b4a]/20' : 'bg-amber-500/20'
                      }`}>
                        <Award className={`w-5 h-5 ${
                          bonus.status === 'CREDITED' ? 'text-[#c99b4a]' : 'text-amber-400'
                        }`} />
                      </div>
                      <div>
                        <p className="text-[#2b241d] font-medium">
                          ₪{bonus.amount?.toLocaleString()}
                        </p>
                        <p className="text-[#8b7c69] text-sm">
                          {bonus.bonusType === 'goal_achieved' ? 'בונוס השגת יעד' : bonus.bonusType}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        bonus.status === 'CREDITED' ? 'bg-[#c99b4a]/20 text-[#c99b4a]' :
                        bonus.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {bonus.status === 'CREDITED' ? 'זוכה' : bonus.status === 'PENDING' ? 'ממתין' : 'נכשל'}
                      </span>
                      {bonus.creditedAt && (
                        <p className="text-[#a89b8a] text-xs mt-1">
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
