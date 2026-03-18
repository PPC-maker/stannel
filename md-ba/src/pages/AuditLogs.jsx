import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ClipboardList, Clock } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";

const ACTION_COLORS = {
  invoice_submitted: "bg-blue-50 text-blue-700",
  invoice_approved_pending_supplier_payment: "bg-green-50 text-green-700",
  invoice_rejected: "bg-red-50 text-red-700",
  invoice_clarification_required: "bg-amber-50 text-amber-700",
  supplier_payment_completed: "bg-purple-50 text-purple-700",
  user_onboarded: "bg-indigo-50 text-indigo-700",
  architect_approved: "bg-emerald-50 text-emerald-700",
  architect_rejected: "bg-red-50 text-red-700",
  trust_level_changed: "bg-yellow-50 text-yellow-700",
  supplier_status_changed: "bg-slate-50 text-slate-700",
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const data = await base44.entities.AuditLog.list("-created_date", 100);
    setLogs(data);
    setLoading(false);
  };

  const filtered = logs.filter(log => {
    return !search ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.performed_by?.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="לוג פעולות" subtitle={`${logs.length} רשומות`} />

      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="חיפוש בלוגים..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9" />
      </div>

      <Card className="bg-white border border-gray-100">
        {filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="אין לוגים" />
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(log => (
              <div key={log.id} className="p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] || "bg-gray-50 text-gray-700"}`}>
                      {log.action?.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-gray-400">{log.performed_by}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{log.details}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(log.timestamp || log.created_date).toLocaleString("he-IL")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}