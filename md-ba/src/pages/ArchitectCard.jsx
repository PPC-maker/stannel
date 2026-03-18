import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import StatusBadge from "../components/shared/StatusBadge";
import EmptyState from "../components/shared/EmptyState";

export default function ArchitectCard() {
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = await base44.auth.me();
    const profiles = await base44.entities.ArchitectProfile.filter({ user_email: user.email });
    if (profiles.length > 0) setProfile(profiles[0]);
    const txns = await base44.entities.CardTransaction.filter({ architect_email: user.email }, "-created_date");
    setTransactions(txns);
    setLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  return (
    <div>
      {/* ── PAGE HEADER ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-px h-6 bg-gray-900" />
          <span className="text-[9px] text-gray-400 tracking-[0.3em] uppercase">Design Community</span>
          <div className="w-1.5 h-1.5 border border-gray-300 rotate-45" />
        </div>
        <h1 className="text-2xl font-light tracking-tight text-gray-900">כרטיס STANNEL</h1>
        <p className="text-[11px] text-gray-400 mt-1.5 tracking-[0.12em] uppercase">יתרת התגמולים שלך</p>
        <div className="mt-4 h-px bg-gray-100" />
      </div>

      {/* Card visual */}
      <div className="mb-8">
        <div className="relative bg-[#0e0e12] p-6 sm:p-8 text-white max-w-sm overflow-hidden">
          {/* Blueprint grid */}
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
          {/* Corner marks */}
          <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-white/20" />
          <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-white/20" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-white/20" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-white/20" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] tracking-[0.4em] uppercase text-white/40">STANNEL</span>
              <CreditCard className="w-5 h-5 text-white/30" />
            </div>
            <p className="text-4xl font-light tracking-tight">
              ₪{(profile?.card_balance || 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-white/30 mt-1.5 tracking-wider uppercase">יתרה זמינה</p>
            <div className="mt-7 pt-5 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-white/40 font-light">{profile?.full_name}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/25 border border-white/10 px-2 py-0.5">
                {profile?.trust_level || "bronze"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <div className="w-px h-3.5 bg-gray-900" />
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-medium">היסטוריית זיכויים</p>
        </div>
        {transactions.length === 0 ? (
          <EmptyState icon={CreditCard} title="אין עסקאות" description="זיכויים יופיעו כאן לאחר אישור תשלומים" />
        ) : (
          <div>
            {transactions.map(txn => (
              <div key={txn.id} className="px-5 py-4 flex items-center justify-between hover:bg-[#fafafa] transition-colors border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-4">
                  <div className={`w-7 h-7 flex items-center justify-center ${txn.status === "credited" ? "bg-green-50" : "bg-red-50"}`}>
                    {txn.status === "credited"
                      ? <ArrowDownRight className="w-3.5 h-3.5 text-green-600" />
                      : <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-light text-gray-900">₪{txn.amount?.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(txn.created_date).toLocaleDateString("he-IL")}</p>
                  </div>
                </div>
                <StatusBadge status={txn.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}