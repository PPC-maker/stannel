import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Check, X, HelpCircle, AlertTriangle, ExternalLink } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import StatusBadge from "../components/shared/StatusBadge";
import EmptyState from "../components/shared/EmptyState";
import AdvancedSearch from "../components/shared/AdvancedSearch";

const VALID_TRANSITIONS = {
  pending_club_approval: ["approved_pending_supplier_payment", "clarification_required", "rejected"],
  clarification_required: ["pending_club_approval", "rejected"],
  approved_pending_supplier_payment: ["supplier_overdue"],
  supplier_overdue: ["paid"],
  paid: ["card_credited", "credit_failed"],
  credit_failed: ["card_credited"],
};

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", status: "all", date_from: "", date_to: "", amount: "" });
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [actionDialog, setActionDialog] = useState(null); // { invoice, action }
  const [actionNote, setActionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const invs = await base44.entities.Invoice.list("-created_date", 100);
    setInvoices(invs);
    setLoading(false);
  };

  const handleAction = async (invoice, newStatus) => {
    setSubmitting(true);
    const user = await base44.auth.me();

    const updateData = { status: newStatus };
    if (newStatus === "approved_pending_supplier_payment") {
      updateData.approved_by = user.email;
      updateData.approved_date = new Date().toISOString();
      // Set payment due date (10 business days)
      const due = new Date();
      due.setDate(due.getDate() + 14);
      updateData.payment_due_date = due.toISOString();
    }
    if (newStatus === "rejected") {
      updateData.rejection_reason = actionNote;
    }
    if (newStatus === "clarification_required") {
      updateData.clarification_note = actionNote;
    }

    await base44.entities.Invoice.update(invoice.id, updateData);

    await base44.entities.InvoiceStatusHistory.create({
      invoice_id: invoice.id,
      from_status: invoice.status,
      to_status: newStatus,
      changed_by: user.email,
      note: actionNote || `Status changed to ${newStatus}`,
      timestamp: new Date().toISOString(),
    });

    await base44.entities.AuditLog.create({
      action: `invoice_${newStatus}`,
      entity_type: "Invoice",
      entity_id: invoice.id,
      performed_by: user.email,
      details: `Invoice ${invoice.invoice_number} moved to ${newStatus}. Note: ${actionNote}`,
      timestamp: new Date().toISOString(),
    });

    // Send notification to architect
    await base44.entities.Notification.create({
      recipient_email: invoice.architect_email,
      title: getNotifTitle(newStatus),
      message: `חשבונית ${invoice.invoice_number} ${getNotifMessage(newStatus)}`,
      type: newStatus === "rejected" ? "error" : newStatus === "clarification_required" ? "warning" : "success",
      related_entity: "Invoice",
      related_id: invoice.id,
    });

    // Send notification to all admins about status change
    const allUsers = await base44.entities.User.list();
    const adminUsers = allUsers.filter(u => u.role === "admin");
    for (const admin of adminUsers) {
      if (admin.email !== user.email) { // Don't notify the admin who made the change
        await base44.entities.Notification.create({
          recipient_email: admin.email,
          title: `חשבונית ${invoice.invoice_number} - ${getNotifTitle(newStatus)}`,
          message: `${user.full_name || user.email} ${newStatus === "approved_pending_supplier_payment" ? "אישר" : newStatus === "rejected" ? "דחה" : "עדכן"} חשבונית של ${invoice.architect_name}`,
          type: "info",
          related_entity: "Invoice",
          related_id: invoice.id,
        });
      }
    }

    setActionDialog(null);
    setActionNote("");
    setSubmitting(false);
    setSelectedInvoice(null);
    loadData();
  };

  const filtered = invoices.filter(inv => {
    const s = filters.search?.toLowerCase() || "";
    const matchSearch = !s ||
      inv.architect_name?.toLowerCase().includes(s) ||
      inv.supplier_name?.toLowerCase().includes(s) ||
      inv.invoice_number?.toLowerCase().includes(s);
    const matchStatus = !filters.status || filters.status === "all" || inv.status === filters.status;
    const matchDateFrom = !filters.date_from || new Date(inv.created_date) >= new Date(filters.date_from);
    const matchDateTo = !filters.date_to || new Date(inv.created_date) <= new Date(filters.date_to + "T23:59:59");
    const matchAmountMin = !filters.amount_min || (inv.amount || 0) >= parseFloat(filters.amount_min);
    const matchAmountMax = !filters.amount_max || (inv.amount || 0) <= parseFloat(filters.amount_max);
    return matchSearch && matchStatus && matchDateFrom && matchDateTo && matchAmountMin && matchAmountMax;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="ניהול חשבוניות" subtitle={`${invoices.length} חשבוניות`} />

      <AdvancedSearch
        page="AdminInvoices"
        filters={filters}
        onFiltersChange={setFilters}
        filterFields={[
          { key: "search", label: "חיפוש חופשי", type: "text" },
          { key: "status", label: "סטטוס", type: "select", options: [
            { value: "pending_club_approval", label: "ממתין לאישור" },
            { value: "clarification_required", label: "דרוש הבהרה" },
            { value: "approved_pending_supplier_payment", label: "ממתין לתשלום ספק" },
            { value: "supplier_overdue", label: "ספק באיחור" },
            { value: "paid", label: "שולם" },
            { value: "card_credited", label: "זוכה" },
            { value: "rejected", label: "נדחה" },
            { value: "credit_failed", label: "זיכוי נכשל" },
          ]},
          { key: "date", label: "טווח תאריכים", type: "date" },
          { key: "date_to", label: "עד תאריך", type: "date" },
          { key: "amount", label: "סכום (₪)", type: "amount" },
        ]}
      />

      <Card className="bg-white border border-gray-100">
        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="אין חשבוניות" />
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(inv => (
              <div
                key={inv.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors cursor-pointer"
                onClick={() => setSelectedInvoice(inv)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{inv.architect_name}</p>
                    <span className="text-xs text-gray-400">→</span>
                    <p className="text-sm text-gray-600">{inv.supplier_name}</p>
                    <span className="text-xs text-gray-400">{inv.invoice_number}</span>
                    {inv.risk_flag && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ₪{inv.amount?.toLocaleString()} · תגמול: ₪{inv.reward_amount?.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={inv.status} />
                  {inv.status === "pending_club_approval" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-green-600" onClick={e => { e.stopPropagation(); handleAction(inv, "approved_pending_supplier_payment"); }}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-amber-600" onClick={e => { e.stopPropagation(); setActionDialog({ invoice: inv, action: "clarification_required" }); }}>
                        <HelpCircle className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-600" onClick={e => { e.stopPropagation(); setActionDialog({ invoice: inv, action: "rejected" }); }}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Invoice detail dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>פרטי חשבונית</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">מספר חשבונית</p>
                  <p className="text-sm font-medium">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">סטטוס</p>
                  <StatusBadge status={selectedInvoice.status} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">אדריכל</p>
                  <p className="text-sm font-medium">{selectedInvoice.architect_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">ספק</p>
                  <p className="text-sm font-medium">{selectedInvoice.supplier_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">סכום</p>
                  <p className="text-sm font-medium">₪{selectedInvoice.amount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">תגמול</p>
                  <p className="text-sm font-medium text-green-600">₪{selectedInvoice.reward_amount?.toLocaleString()}</p>
                </div>
              </div>
              {selectedInvoice.description && (
                <div>
                  <p className="text-xs text-gray-500">תיאור</p>
                  <p className="text-sm">{selectedInvoice.description}</p>
                </div>
              )}
              {selectedInvoice.file_url && (
                <a href={selectedInvoice.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                  <ExternalLink className="w-4 h-4" /> צפה בחשבונית
                </a>
              )}

              {/* Available actions */}
              {VALID_TRANSITIONS[selectedInvoice.status] && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-3">פעולות זמינות</p>
                  <div className="flex flex-wrap gap-2">
                    {VALID_TRANSITIONS[selectedInvoice.status].map(st => (
                      <Button
                        key={st}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (st === "rejected" || st === "clarification_required") {
                            setActionDialog({ invoice: selectedInvoice, action: st });
                          } else {
                            handleAction(selectedInvoice, st);
                          }
                        }}
                      >
                        <StatusBadge status={st} />
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action dialog with note */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "rejected" ? "דחיית חשבונית" : "בקשת הבהרה"}
            </DialogTitle>
          </DialogHeader>
          <div>
            <Label className="text-xs text-gray-600">הערה</Label>
            <Textarea
              value={actionNote}
              onChange={e => setActionNote(e.target.value)}
              className="mt-1"
              rows={3}
              placeholder={actionDialog?.action === "rejected" ? "סיבת הדחייה..." : "מה דרוש להבהיר..."}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>ביטול</Button>
            <Button
              onClick={() => handleAction(actionDialog.invoice, actionDialog.action)}
              disabled={!actionNote || submitting}
              className={actionDialog?.action === "rejected" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"}
            >
              {submitting ? "שומר..." : actionDialog?.action === "rejected" ? "דחה" : "שלח"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getNotifTitle(status) {
  const map = {
    approved_pending_supplier_payment: "חשבונית אושרה",
    clarification_required: "נדרשת הבהרה",
    rejected: "חשבונית נדחתה",
    card_credited: "כרטיס זוכה",
  };
  return map[status] || "עדכון חשבונית";
}

function getNotifMessage(status) {
  const map = {
    approved_pending_supplier_payment: "אושרה וממתינה לתשלום ספק",
    clarification_required: "דורשת הבהרה נוספת",
    rejected: "נדחתה",
    card_credited: "זוכתה בכרטיס STANNEL",
  };
  return map[status] || `עודכנה לסטטוס ${status}`;
}