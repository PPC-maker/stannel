import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { CreditCard, FileText, TrendingUp } from "lucide-react";
import StatsCard from "../components/shared/StatsCard";
import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import AdvancedSearch from "../components/shared/AdvancedSearch";

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [cardTxns, setCardTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payFilters, setPayFilters] = useState({ search: "", status: "all", date_from: "", date_to: "", amount: "" });
  const [cardFilters, setCardFilters] = useState({ search: "", status: "all", date_from: "", date_to: "", amount: "" });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [pays, txns] = await Promise.all([
      base44.entities.SupplierPayment.list("-created_date", 50),
      base44.entities.CardTransaction.list("-created_date", 50),
    ]);
    setPayments(pays);
    setCardTxns(txns);
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" /></div>;

  const totalPaid = payments.filter(p => p.status === "completed").reduce((s, p) => s + (p.amount || 0), 0);
  const totalCredited = cardTxns.filter(t => t.status === "credited").reduce((s, t) => s + (t.amount || 0), 0);
  const failedCredits = cardTxns.filter(t => t.status === "failed").length;

  const applyFilters = (list, f) => list.filter(item => {
    const s = f.search?.toLowerCase() || "";
    const matchSearch = !s || JSON.stringify(item).toLowerCase().includes(s);
    const matchStatus = !f.status || f.status === "all" || item.status === f.status;
    const matchDateFrom = !f.date_from || new Date(item.created_date) >= new Date(f.date_from);
    const matchDateTo = !f.date_to || new Date(item.created_date) <= new Date(f.date_to + "T23:59:59");
    const matchAmountMin = !f.amount_min || (item.amount || 0) >= parseFloat(f.amount_min);
    const matchAmountMax = !f.amount_max || (item.amount || 0) <= parseFloat(f.amount_max);
    return matchSearch && matchStatus && matchDateFrom && matchDateTo && matchAmountMin && matchAmountMax;
  });

  const filteredPayments = applyFilters(payments, payFilters);
  const filteredCardTxns = applyFilters(cardTxns, cardFilters);

  return (
    <div>
      <PageHeader title="תשלומים וזיכויים" subtitle="סקירת תשלומי ספקים וזיכויי כרטיסים" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatsCard title="סה״כ תשלומי ספקים" value={`₪${totalPaid.toLocaleString()}`} icon={CreditCard} color="blue" />
        <StatsCard title="סה״כ זוכה בכרטיסים" value={`₪${totalCredited.toLocaleString()}`} icon={TrendingUp} color="green" />
        <StatsCard title="זיכויים שנכשלו" value={failedCredits} icon={FileText} color="red" />
      </div>

      {/* Supplier Payments */}
      <Card className="bg-white border border-gray-100 mb-6">
        <div className="p-5 border-b border-gray-50">
          <h3 className="text-sm font-medium">תשלומי ספקים</h3>
        </div>
        <div className="p-4">
          <AdvancedSearch
            page="AdminPayments_supplier"
            filters={payFilters}
            onFiltersChange={setPayFilters}
            filterFields={[
              { key: "search", label: "חיפוש", type: "text" },
              { key: "status", label: "סטטוס", type: "select", options: [
                { value: "pending", label: "ממתין" },
                { value: "completed", label: "הושלם" },
                { value: "failed", label: "נכשל" },
              ]},
              { key: "date_from", label: "מתאריך", type: "date" },
              { key: "date_to", label: "עד תאריך", type: "date" },
              { key: "amount", label: "סכום (₪)", type: "amount" },
            ]}
          />
        </div>
        {filteredPayments.length === 0 ? (
          <EmptyState icon={CreditCard} title="אין תשלומים" />
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredPayments.map(p => (
              <div key={p.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">₪{p.amount?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{p.payment_method} · {p.reference_number} · {new Date(p.created_date).toLocaleDateString("he-IL")}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Card Transactions */}
      <Card className="bg-white border border-gray-100">
        <div className="p-5 border-b border-gray-50">
          <h3 className="text-sm font-medium">זיכויי כרטיסים</h3>
        </div>
        <div className="p-4">
          <AdvancedSearch
            page="AdminPayments_cards"
            filters={cardFilters}
            onFiltersChange={setCardFilters}
            filterFields={[
              { key: "search", label: "חיפוש", type: "text" },
              { key: "status", label: "סטטוס", type: "select", options: [
                { value: "pending", label: "ממתין" },
                { value: "credited", label: "זוכה" },
                { value: "failed", label: "נכשל" },
                { value: "retry_pending", label: "ממתין לניסיון חוזר" },
              ]},
              { key: "date_from", label: "מתאריך", type: "date" },
              { key: "date_to", label: "עד תאריך", type: "date" },
              { key: "amount", label: "סכום (₪)", type: "amount" },
            ]}
          />
        </div>
        {filteredCardTxns.length === 0 ? (
          <EmptyState icon={CreditCard} title="אין זיכויים" />
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredCardTxns.map(t => (
              <div key={t.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">₪{t.amount?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{t.architect_email} · {new Date(t.created_date).toLocaleDateString("he-IL")}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}