import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Upload, FileText, Search } from "lucide-react";
import { createPageUrl } from "../utils";
import PageHeader from "../components/shared/PageHeader";
import StatusBadge from "../components/shared/StatusBadge";
import EmptyState from "../components/shared/EmptyState";

export default function ArchitectInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState({
    supplier_id: "",
    amount: "",
    description: "",
    file_url: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = await base44.auth.me();
    const invs = await base44.entities.Invoice.filter({ architect_email: user.email }, "-created_date");
    setInvoices(invs);
    const sups = await base44.entities.SupplierProfile.filter({ status: "active" });
    setSuppliers(sups);
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, file_url }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const user = await base44.auth.me();
    const supplier = suppliers.find(s => s.id === form.supplier_id);

    const rewardAmount = parseFloat(form.amount) * 0.02; // 2% reward to architect
    const platformFee = parseFloat(form.amount) * 0.02; // 2% platform commission

    const invoice = await base44.entities.Invoice.create({
      invoice_number: `INV-${Date.now().toString(36).toUpperCase()}`,
      architect_email: user.email,
      architect_name: user.full_name,
      supplier_id: form.supplier_id,
      supplier_name: supplier?.company_name || "",
      amount: parseFloat(form.amount),
      reward_amount: rewardAmount,
      platform_fee: platformFee,
      description: form.description,
      file_url: form.file_url,
      status: "pending_club_approval",
    });

    // Log status history
    await base44.entities.InvoiceStatusHistory.create({
      invoice_id: invoice.id,
      from_status: "draft",
      to_status: "pending_club_approval",
      changed_by: user.email,
      note: "חשבונית הוגשה לאישור",
      timestamp: new Date().toISOString(),
    });

    // Audit log
    await base44.entities.AuditLog.create({
      action: "invoice_submitted",
      entity_type: "Invoice",
      entity_id: invoice.id,
      performed_by: user.email,
      details: `Invoice ${invoice.invoice_number} submitted for ₪${form.amount}`,
      timestamp: new Date().toISOString(),
    });

    // Update architect profile
    const profiles = await base44.entities.ArchitectProfile.filter({ user_email: user.email });
    if (profiles.length > 0) {
      await base44.entities.ArchitectProfile.update(profiles[0].id, {
        total_invoices: (profiles[0].total_invoices || 0) + 1,
      });
    }

    // Send notification to all admins
    const allUsers = await base44.entities.User.list();
    const adminUsers = allUsers.filter(u => u.role === "admin");
    for (const admin of adminUsers) {
      await base44.entities.Notification.create({
        recipient_email: admin.email,
        title: "חשבונית חדשה ממתינה לאישור",
        message: `${user.full_name} הגיש חשבונית ${invoice.invoice_number} על סך ₪${form.amount} מספק ${supplier?.company_name}`,
        type: "info",
        related_entity: "Invoice",
        related_id: invoice.id,
      });
    }

    setShowCreate(false);
    setForm({ supplier_id: "", amount: "", description: "", file_url: "" });
    setSubmitting(false);
    loadData();
  };

  const filtered = invoices.filter(inv => {
    const matchSearch = !search || inv.supplier_name?.toLowerCase().includes(search.toLowerCase()) || inv.invoice_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

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
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-light tracking-tight text-gray-900">החשבוניות שלי</h1>
            <p className="text-[11px] text-gray-400 mt-1.5 tracking-[0.12em] uppercase">{invoices.length} חשבוניות</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="rounded-none bg-gray-900 hover:bg-black gap-1.5 text-[11px] tracking-widest uppercase h-8 px-4">
            <Plus className="w-3 h-3" /> חשבונית חדשה
          </Button>
        </div>
        <div className="mt-4 h-px bg-gray-100" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
          <Input
            placeholder="חיפוש לפי ספק או מספר..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9 rounded-none border-gray-200 text-sm h-9 focus:border-gray-400"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44 rounded-none border-gray-200 text-sm h-9">
            <SelectValue placeholder="סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="pending_club_approval">ממתין לאישור</SelectItem>
            <SelectItem value="approved_pending_supplier_payment">ממתין לתשלום</SelectItem>
            <SelectItem value="paid">שולם</SelectItem>
            <SelectItem value="card_credited">זוכה</SelectItem>
            <SelectItem value="rejected">נדחה</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice list */}
      <div className="bg-white border border-gray-100">
        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="אין חשבוניות" description="הגש חשבונית ראשונה" />
        ) : (
          <div>
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-[9px] text-gray-400 uppercase tracking-[0.2em]">ספק / מספר</span>
              <span className="text-[9px] text-gray-400 uppercase tracking-[0.2em]">סכום</span>
              <span className="text-[9px] text-gray-400 uppercase tracking-[0.2em]">תגמול</span>
              <span className="text-[9px] text-gray-400 uppercase tracking-[0.2em]">סטטוס</span>
            </div>
            {filtered.map((inv, i) => (
              <div key={inv.id} className="px-5 py-4 flex flex-col sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:items-center gap-2 sm:gap-4 hover:bg-[#fafafa] transition-colors border-b border-gray-50 last:border-0 group">
                <div>
                  <p className="text-sm text-gray-800 font-light">{inv.supplier_name || "ספק"}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{inv.invoice_number}</p>
                </div>
                <p className="text-sm text-gray-700 tabular-nums">₪{inv.amount?.toLocaleString()}</p>
                <p className="text-sm text-indigo-600 tabular-nums">₪{inv.reward_amount?.toLocaleString()}</p>
                <div className="flex items-center gap-2">
                  <StatusBadge status={inv.status} />
                  {inv.status === "card_credited" && (
                    <a href={`${createPageUrl("RateSupplier")}?invoice=${inv.id}`}>
                      <Button size="sm" variant="outline" className="text-[10px] h-6 px-2 rounded-none border-gray-200">דרג</Button>
                    </a>
                  )}
                  {inv.file_url && (
                    <a href={inv.file_url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-gray-600 transition-colors">
                      <FileText className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>חשבונית חדשה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-600">ספק</Label>
              <Select value={form.supplier_id} onValueChange={v => setForm({ ...form, supplier_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="בחר ספק" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-600">סכום (₪)</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className="mt-1"
              />
              {form.amount && (
                <p className="text-xs text-green-600 mt-1">תגמול משוער לכרטיס: ₪{(parseFloat(form.amount || 0) * 0.02).toFixed(2)} (2%)</p>
              )}
            </div>
            <div>
              <Label className="text-xs text-gray-600">תיאור</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">העלאת חשבונית</Label>
              <div className="mt-1">
                {form.file_url ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-700">קובץ הועלה בהצלחה</span>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">העלה קובץ</span>
                    <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" />
                  </label>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>ביטול</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.supplier_id || !form.amount || submitting}
              className="bg-gray-900 hover:bg-gray-800"
            >
              {submitting ? "שולח..." : "הגש חשבונית"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}