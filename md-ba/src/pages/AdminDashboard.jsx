import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card } from "@/components/ui/card";
import { FileText, Users, CreditCard, AlertTriangle, TrendingUp, ArrowLeft, Building2, Ruler } from "lucide-react";
import StatsCard from "../components/shared/StatsCard";
import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ invoices: 0, architects: 0, suppliers: 0, pendingApproval: 0, overdue: 0, totalUserRewards: 0, totalPlatformFees: 0 });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [pendingArchitects, setPendingArchitects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [invoices, architects, suppliers] = await Promise.all([
      base44.entities.Invoice.list("-created_date", 50),
      base44.entities.ArchitectProfile.list("-created_date", 50),
      base44.entities.SupplierProfile.list("-created_date", 50),
    ]);

    const pending = invoices.filter(i => i.status === "pending_club_approval");
    const overdue = invoices.filter(i => i.status === "supplier_overdue");
    const creditedInvoices = invoices.filter(i => i.status === "card_credited");
    const totalUserRewards = creditedInvoices.reduce((sum, i) => sum + (i.reward_amount || i.amount * 0.02 || 0), 0);
    const totalPlatformFees = creditedInvoices.reduce((sum, i) => sum + (i.platform_fee || i.amount * 0.02 || 0), 0);
    const pendingArch = architects.filter(a => a.onboarding_status === "pending_review");

    setStats({
      invoices: invoices.length,
      architects: architects.length,
      suppliers: suppliers.length,
      pendingApproval: pending.length,
      overdue: overdue.length,
      totalUserRewards,
      totalPlatformFees,
    });

    setRecentInvoices(invoices.slice(0, 8));
    setPendingArchitects(pendingArch);
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="דשבורד ניהול" subtitle="סקירה כללית של המערכת" />

      {/* Alerts */}
      {(stats.overdue > 0 || stats.pendingApproval > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {stats.pendingApproval > 0 && (
            <Card className="p-4 bg-blue-50 border-blue-100">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-800">{stats.pendingApproval} חשבוניות ממתינות לאישור</p>
              </div>
            </Card>
          )}
          {stats.overdue > 0 && (
            <Card className="p-4 bg-red-50 border-red-100">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-800">{stats.overdue} ספקים באיחור תשלום</p>
              </div>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        <StatsCard title="חשבוניות" value={stats.invoices} icon={FileText} color="blue" />
        <StatsCard title="אדריכלים" value={stats.architects} icon={Ruler} color="purple" />
        <StatsCard title="ספקים" value={stats.suppliers} icon={Building2} color="green" />
        <StatsCard title="ממתינות" value={stats.pendingApproval} icon={FileText} color="amber" />
        <StatsCard title="באיחור" value={stats.overdue} icon={AlertTriangle} color="red" />
        <StatsCard title="עמלות משתמשים (2%)" value={`₪${stats.totalUserRewards.toLocaleString()}`} icon={CreditCard} color="green" />
        <StatsCard title="עמלות מערכת (2%)" value={`₪${stats.totalPlatformFees.toLocaleString()}`} icon={TrendingUp} color="purple" />
      </div>

      {/* Pending architect verification */}
      {pendingArchitects.length > 0 && (
        <Card className="bg-white border border-gray-100 mb-6">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-medium">אדריכלים ממתינים לאישור</h3>
            <Link to={createPageUrl("AdminArchitects")} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1">
              הצג הכל <ArrowLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingArchitects.map(arch => (
              <div key={arch.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{arch.full_name}</p>
                  <p className="text-xs text-gray-500">ח.פ: {arch.business_id || "לא הוזן"}</p>
                </div>
                <StatusBadge status={arch.onboarding_status} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent invoices */}
      <Card className="bg-white border border-gray-100">
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-medium">חשבוניות אחרונות</h3>
          <Link to={createPageUrl("AdminInvoices")} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1">
            הצג הכל <ArrowLeft className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentInvoices.map(inv => (
            <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{inv.architect_name}</p>
                  <span className="text-xs text-gray-400">→</span>
                  <p className="text-sm text-gray-600">{inv.supplier_name}</p>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{inv.invoice_number} · ₪{inv.amount?.toLocaleString()}</p>
              </div>
              <StatusBadge status={inv.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}