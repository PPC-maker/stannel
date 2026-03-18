import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import {
  FileText,
  CreditCard,
  TrendingUp,
  Star,
  Clock,
  ChevronLeft,
  Building2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function SupplierDashboard() {
  const [user, setUser] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const suppliers = await base44.entities.SupplierProfile.filter({ user_email: u.email });
      if (suppliers.length > 0) {
        const s = suppliers[0];
        setSupplier(s);
        const invs = await base44.entities.Invoice.filter({ supplier_id: s.id });
        invs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        setInvoices(invs);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-800" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState icon={Building2} title="לא נמצא פרופיל ספק" description="פנה למנהל המערכת" />
      </div>
    );
  }

  const pendingInvoices = invoices.filter(i => i.status === "approved_pending_supplier_payment");
  const paidInvoices = invoices.filter(i => ["paid", "card_credited"].includes(i.status));
  const totalPaid = paidInvoices.reduce((s, i) => s + (i.amount || 0), 0);
  const totalPending = pendingInvoices.reduce((s, i) => s + (i.amount || 0), 0);

  const statusColor = supplier.onboarding_status === "approved" ? "text-green-600" : supplier.onboarding_status === "rejected" ? "text-red-600" : "text-amber-600";

  const stats = [
    { label: "חשבוניות ממתינות לתשלום", value: pendingInvoices.length, sub: `₪${totalPending.toLocaleString()}`, icon: Clock, color: "amber" },
    { label: "חשבוניות ששולמו", value: paidInvoices.length, sub: `₪${totalPaid.toLocaleString()}`, icon: CheckCircle2, color: "green" },
    { label: "דירוג", value: supplier.rating?.toFixed(1) || "—", sub: `${supplier.review_count || 0} ביקורות`, icon: Star, color: "yellow" },
    { label: "ציון אמינות", value: supplier.trust_score || 100, sub: "מתוך 100", icon: TrendingUp, color: "blue" },
  ];

  const colorMap = {
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    green: "bg-green-50 text-green-700 border-green-100",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
  };

  const quickActions = [
    { page: "SupplierInvoices", label: "חשבוניות", icon: FileText },
    { page: "SupplierPayments", label: "תשלומים", icon: CreditCard },
    { page: "ManageSupplierDetails", label: "פרטי הספק", icon: Building2 },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4" dir="rtl">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">פורטל ספק</p>
        <h1 className="text-3xl font-black text-gray-900">{supplier.company_name}</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs font-semibold ${statusColor}`}>
            {supplier.onboarding_status === "approved" ? "✓ מאושר" : supplier.onboarding_status === "rejected" ? "✗ נדחה" : "⏳ ממתין לאישור"}
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-xs text-gray-400">{supplier.category || ""}</span>
        </div>

        {supplier.onboarding_status !== "approved" && (
          <motion.div
            className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800 font-medium">
              {supplier.onboarding_status === "pending_review"
                ? "הפרופיל ממתין לאישור מנהל. זה יכול לקחת עד 48 שעות."
                : "הפרופיל נדחה. פנה למנהל המערכת לפרטים."}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-2 gap-4 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {stats.map((s) => (
          <motion.div
            key={s.label}
            variants={itemVariants}
            className={`rounded-2xl border p-5 ${colorMap[s.color]}`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold opacity-70">{s.label}</p>
              <s.icon className="w-4 h-4 opacity-50" />
            </div>
            <p className="text-3xl font-black">{s.value}</p>
            <p className="text-xs opacity-60 mt-1">{s.sub}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-4 font-semibold">ניווט מהיר</p>
        <div className="grid grid-cols-3 gap-4">
          {quickActions.map((a) => (
            <Link key={a.page} to={createPageUrl(a.page)}>
              <motion.div
                className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all hover:border-gray-200"
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <a.icon className="w-6 h-6 text-gray-600" />
                <span className="text-xs font-semibold text-gray-700">{a.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Invoices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">חשבוניות אחרונות</p>
          <Link to={createPageUrl("SupplierInvoices")} className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-900 transition-colors">
            הכל <ChevronLeft className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          {invoices.length === 0 ? (
            <EmptyState icon={FileText} title="אין חשבוניות עדיין" />
          ) : (
            invoices.slice(0, 6).map((inv, i) => (
              <div
                key={inv.id}
                className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${i < Math.min(invoices.length, 6) - 1 ? "border-b border-gray-50" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{inv.architect_name || "אדריכל"}</p>
                    <p className="text-xs text-gray-400">₪{inv.amount?.toLocaleString()}</p>
                  </div>
                </div>
                <StatusBadge status={inv.status} />
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}