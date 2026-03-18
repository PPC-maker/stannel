import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import StatusBadge from "../components/shared/StatusBadge";
import EmptyState from "../components/shared/EmptyState";

export default function SupplierInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const user = await base44.auth.me();
    const profiles = await base44.entities.SupplierProfile.filter({ user_email: user.email });
    if (profiles.length > 0) {
      const invs = await base44.entities.Invoice.filter({ supplier_id: profiles[0].id }, "-created_date");
      setInvoices(invs);
    }
    setLoading(false);
  };

  const filtered = invoices.filter(inv => {
    const matchSearch = !search || inv.architect_name?.toLowerCase().includes(search.toLowerCase()) || inv.invoice_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="חשבוניות" subtitle={`${invoices.length} חשבוניות`} />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="חיפוש..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48"><SelectValue placeholder="סטטוס" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="approved_pending_supplier_payment">ממתין לתשלום</SelectItem>
            <SelectItem value="supplier_overdue">באיחור</SelectItem>
            <SelectItem value="paid">שולם</SelectItem>
            <SelectItem value="card_credited">זוכה</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-white border border-gray-100">
        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="אין חשבוניות" />
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(inv => (
              <div key={inv.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{inv.architect_name}</p>
                    <span className="text-xs text-gray-400">{inv.invoice_number}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">₪{inv.amount?.toLocaleString()}</p>
                </div>
                <StatusBadge status={inv.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}