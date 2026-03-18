import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, CreditCard, TrendingUp, Plus, Clock, Star, Wrench, Bell, ChevronLeft, ArrowUpRight, Zap } from "lucide-react";
import StatusBadge from "../components/shared/StatusBadge";
import EmptyState from "../components/shared/EmptyState";
import { motion } from "framer-motion";
import ProfileViewers from "../components/shared/ProfileViewers";

const TRUST_LEVEL_CONFIG = {
  bronze: { label: "Bronze", gradient: "from-amber-500 to-amber-700", light: "from-amber-50 to-orange-50", darkText: "text-amber-600" },
  silver: { label: "Silver", gradient: "from-slate-400 to-slate-600", light: "from-slate-50 to-gray-50", darkText: "text-slate-600" },
  gold:   { label: "Gold",   gradient: "from-yellow-400 to-yellow-600", light: "from-yellow-50 to-amber-50", darkText: "text-yellow-600" },
};

const QUICK_ACTIONS = [
  { label: "חשבונית חדשה", icon: FileText,  page: "ArchitectInvoices", bg: "bg-indigo-50",  iconColor: "text-indigo-600", bgGradient: "from-indigo-500/10 to-indigo-600/5" },
  { label: "הכרטיס שלי",   icon: CreditCard, page: "ArchitectCard",    bg: "bg-emerald-50", iconColor: "text-emerald-600", bgGradient: "from-emerald-500/10 to-emerald-600/5" },
  { label: "יעדים",        icon: TrendingUp, page: "ArchitectGoals",   bg: "bg-violet-50",  iconColor: "text-violet-600", bgGradient: "from-violet-500/10 to-violet-600/5" },
  { label: "כלים",         icon: Wrench,     page: "ArchitectTools",   bg: "bg-amber-50",   iconColor: "text-amber-600", bgGradient: "from-amber-500/10 to-amber-600/5"  },
  { label: "התראות",       icon: Bell,       page: "Notifications",    bg: "bg-red-50",     iconColor: "text-red-500", bgGradient: "from-red-500/10 to-red-600/5"    },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.6, type: "spring", stiffness: 100 } 
  }
};

const floatingVariants = {
  animate: {
    y: [0, -8, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
  }
};

export default function ArchitectDashboard() {
  const [architect, setArchitect] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [activeGoal, setActiveGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myEmail, setMyEmail] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const u = await base44.auth.me();
    setMyEmail(u.email);
    const archs = await base44.entities.ArchitectProfile.filter({ user_email: u.email });
    if (archs.length > 0) setArchitect(archs[0]);
    const invs = await base44.entities.Invoice.filter({ architect_email: u.email }, "-created_date", 50);
    setInvoices(invs);
    const goals = await base44.entities.ArchitectGoal.filter({ architect_email: u.email, is_active: true });
    if (goals.length > 0) setActiveGoal(goals[0]);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-xs uppercase tracking-widest">טוען...</p>
        </div>
      </div>
    );
  }

  if (!architect) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-6">לא נמצא פרופיל אדריכל.</p>
          <Link to={createPageUrl("Onboarding")}>
            <button className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-8 py-3 text-sm rounded-xl font-medium hover:shadow-lg transition-all">
              השלם הרשמה
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const trustCfg = TRUST_LEVEL_CONFIG[architect.trust_level] || TRUST_LEVEL_CONFIG.bronze;
  const TRUST_LIMITS = { bronze: 5000, silver: 15000, gold: 50000 };
  const monthlyLimit = TRUST_LIMITS[architect.trust_level] || 5000;
  const monthlyUsage = architect.monthly_reward_total || 0;
  const usagePercent = Math.min((monthlyUsage / monthlyLimit) * 100, 100);
  const pendingInvoices = invoices.filter(i => ["pending_club_approval", "clarification_required"].includes(i.status));
  const cardBalance = architect.card_balance || 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : "ערב טוב";

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900" 
      dir="rtl" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.5 }}
    >
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-40 left-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        />
      </div>

      {/* Hero Banner */}
      <motion.div 
        className="relative h-80 overflow-hidden"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.1 }}
      >
        <img 
          src="https://images.unsplash.com/photo-1559333086-b0a38235dae4?w=1400&q=90&fit=crop" 
          alt="hero" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-slate-900/90" />
        <motion.div 
          className="absolute inset-0 flex flex-col justify-end p-8 pb-10"
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <motion.p className="text-white/70 text-sm mb-3 font-light uppercase tracking-widest">{greeting}</motion.p>
          <motion.h1 
            className="text-white text-5xl font-black leading-tight mb-4"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {architect.full_name}
          </motion.h1>
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <motion.div 
              className={`bg-gradient-to-r ${trustCfg.gradient} text-white text-xs font-black uppercase px-4 py-2 rounded-full backdrop-blur-sm shadow-xl`}
              whileHover={{ scale: 1.08, boxShadow: "0 0 30px rgba(255,255,255,0.3)" }}
              whileTap={{ scale: 0.95 }}
            >
              ✨ {trustCfg.label} member
            </motion.div>
            <span className="text-white/50 text-xs font-semibold">Stannel Design Club</span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 px-4 lg:px-8 pb-12">
        {/* Card Balance Card */}
        <motion.div 
          className="-mt-16 relative z-20 mb-8"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
          variants={floatingVariants}
          whileInView="animate"
        >
          <motion.div className={`bg-gradient-to-br ${trustCfg.gradient} rounded-3xl p-8 shadow-2xl text-white overflow-hidden relative border border-white/20 backdrop-blur-sm`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-52 h-52 bg-white/10 rounded-full -ml-20 -mb-20 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            
            <div className="relative">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-white/70 text-xs mb-2 uppercase tracking-wider font-semibold">יתרת כרטיס STANNEL</p>
                  <motion.p className="text-4xl font-bold" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>₪{cardBalance.toLocaleString()}</motion.p>
                </div>
                <motion.div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3" whileHover={{ scale: 1.1 }}>
                  <CreditCard className="w-6 h-6 text-white" />
                </motion.div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[11px] text-white/70 mb-2">
                    <span className="font-semibold">שימוש חודשי</span>
                    <span>₪{monthlyUsage.toLocaleString()} / ₪{monthlyLimit.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-white rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${usagePercent}%` }}
                      transition={{ delay: 0.6, duration: 0.8 }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
                  <motion.div whileHover={{ scale: 1.05 }} className="text-center">
                    <p className="text-white/60 text-[10px] uppercase font-semibold mb-1">חשבוניות</p>
                    <p className="text-white font-bold text-lg">{architect.total_invoices || 0}</p>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} className="text-center">
                    <p className="text-white/60 text-[10px] uppercase font-semibold mb-1">מאושרות</p>
                    <p className="text-white font-bold text-lg">{architect.total_approved_invoices || 0}</p>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} className="text-center">
                    <p className="text-white/60 text-[10px] uppercase font-semibold mb-1">ממתינות</p>
                    <p className="text-white font-bold text-lg">{pendingInvoices.length}</p>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Alert Banner */}
        {architect.onboarding_status !== "approved" && (
          <motion.div 
            className={`mb-6 border-l-4 rounded-xl px-5 py-4 flex items-start gap-4 bg-gradient-to-r ${
              architect.onboarding_status === "limited" 
                ? "from-amber-50 to-orange-50 border-amber-400 text-amber-800" 
                : "from-blue-50 to-cyan-50 border-blue-400 text-blue-800"
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">
              {architect.onboarding_status === "limited" && "החשבון בגישה מוגבלת — השלם את האימות העסקי כדי לפתוח גישה מלאה"}
              {architect.onboarding_status === "pending_review" && "החשבון ממתין לאישור מנהל — זה יכול לקחת עד 48 שעות"}
            </p>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div 
          className="mb-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.p 
            className="text-xs text-white/60 uppercase tracking-widest mb-5 font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            פעולות מהירות
          </motion.p>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {QUICK_ACTIONS.map((a, idx) => (
              <motion.div
                key={a.page}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to={createPageUrl(a.page)} className="flex flex-col items-center gap-4 group h-full">
                  <motion.div 
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-3xl transition-all bg-gradient-to-br ${a.bgGradient} border border-white/20 backdrop-blur-sm`}
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <a.icon className={`w-8 h-8 ${a.iconColor}`} />
                  </motion.div>
                  <span className="text-[11px] text-white/80 text-center font-bold leading-tight group-hover:text-white transition-colors">{a.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Active Goal */}
        {activeGoal && (
          <motion.div 
            className="mb-10"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, type: "spring" }}
          >
            <motion.p 
              className="text-xs text-white/60 uppercase tracking-widest mb-5 font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
            >
              יעד פעיל
            </motion.p>
            <motion.div 
              className="relative overflow-hidden rounded-3xl border border-yellow-400/30 backdrop-blur-sm"
              whileHover={{ boxShadow: "0 0 40px rgba(250,204,21,0.2)" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-yellow-900/30 to-gray-900" />
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-yellow-400/30 via-orange-400/10 to-transparent rounded-full -mr-40 -mt-40 blur-3xl animate-pulse" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-full -ml-30 -mb-30 blur-3xl" />
              
              <div className="relative p-6 text-white">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <motion.div className="bg-yellow-400/20 backdrop-blur-sm rounded-full p-2" whileHover={{ scale: 1.1 }}>
                      <Zap className="w-5 h-5 text-yellow-400" />
                    </motion.div>
                    <p className="text-sm font-bold">יעד {activeGoal.period_type === "monthly" ? "חודשי" : "רבעוני"}</p>
                  </div>
                  <Link to={createPageUrl("ArchitectGoals")}>
                    <motion.span className="text-[11px] text-white/50 flex items-center gap-1 hover:text-white transition-colors" whileHover={{ gap: 6 }}>
                      פרטים
                      <ChevronLeft className="w-3 h-3" />
                    </motion.span>
                  </Link>
                </div>

                <motion.p 
                  className="text-5xl font-black mb-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  ₪{(activeGoal.current_period_revenue || 0).toLocaleString()}
                </motion.p>
                <p className="text-white/50 text-xs mb-4">מתוך יעד ₪{activeGoal.target_amount?.toLocaleString()}</p>

                <div className="mb-5">
                  <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(((activeGoal.current_period_revenue || 0) / (activeGoal.target_amount || 1)) * 100, 100)}%` }}
                      transition={{ delay: 0.7, duration: 1 }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                  <ArrowUpRight className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-bold">בונוס פוטנציאלי: ₪{((activeGoal.target_amount || 0) * (activeGoal.bonus_percentage || 0) / 100).toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

                {/* Profile Viewers */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <ProfileViewers userEmail={myEmail} />
        </motion.div>

        {/* Recent Invoices */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, type: "spring" }}
        >
          <div className="flex items-center justify-between mb-5">
            <motion.p 
              className="text-xs text-white/60 uppercase tracking-widest font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85 }}
            >
              חשבוניות אחרונות
            </motion.p>
            <Link to={createPageUrl("ArchitectInvoices")} className="text-[11px] text-indigo-300 font-bold flex items-center gap-1 hover:gap-3 transition-all hover:text-indigo-200">
              הכל
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>

          <motion.div 
            className="bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/20"
            whileHover={{ boxShadow: "0 0 60px rgba(255,255,255,0.1)" }}
          >
            {invoices.length === 0 ? (
              <EmptyState 
                icon={FileText} 
                title="אין חשבוניות עדיין" 
                description="הגש חשבונית ראשונה לקבל תגמול" 
              />
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {invoices.slice(0, 5).map((inv, i) => (
                  <motion.div 
                    key={inv.id}
                    variants={itemVariants}
                    className={`px-6 py-5 flex items-center justify-between hover:bg-white/10 transition-all ${i < Math.min(invoices.length, 5) - 1 ? "border-b border-white/10" : ""}`}
                    whileHover={{ x: -4, backgroundColor: "rgba(255,255,255,0.05)" }}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <motion.div className="w-12 h-12 bg-gradient-to-br from-indigo-400/30 to-indigo-600/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-indigo-400/30" whileHover={{ scale: 1.15 }}>
                        <FileText className="w-6 h-6 text-indigo-300" />
                      </motion.div>
                      <div className="min-w-0">
                        <p className="text-sm text-white font-semibold truncate">{inv.supplier_name || "ספק"}</p>
                        <p className="text-[11px] text-white/60 mt-1">₪{inv.amount?.toLocaleString()}</p>
                      </div>
                    </div>
                    <StatusBadge status={inv.status} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>

          <Link to={createPageUrl("ArchitectInvoices")}>
            <motion.div 
              className="mt-6 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white rounded-2xl py-5 flex items-center justify-center gap-3 shadow-2xl font-bold hover:shadow-3xl transition-all border border-indigo-400/30"
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ y: 0, scale: 0.98 }}
            >
              <Plus className="w-6 h-6" />
              הגש חשבונית חדשה
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}