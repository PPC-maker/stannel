import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Check } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import StatusBadge from "../components/shared/StatusBadge";
import EmptyState from "../components/shared/EmptyState";

export default function SupplierPayments() {
  const [profile, setProfile] = useState(null);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payDialog, setPayDialog] = useState(null);
  const [payForm, setPayForm] = useState({ payment_method: "bank_transfer", reference_number: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const user = await base44.auth.me();
    const profiles = await base44.entities.SupplierProfile.filter({ user_email: user.email });
    if (profiles.length > 0) {
      setProfile(profiles[0]);
      const invs = await base44.entities.Invoice.filter({ supplier_id: profiles[0].id });
      setPendingInvoices(invs.filter(i => ["approved_pending_supplier_payment", "supplier_overdue"].includes(i.status)));
      const pays = await base44.entities.SupplierPayment.filter({ supplier_id: profiles[0].id }, "-created_date");
      setPayments(pays);
    }
    setLoading(false);
  };

  const handlePay = async () => {
    setSubmitting(true);
    const user = await base44.auth.me();
    const inv = payDialog;

    // Create payment record
    await base44.entities.SupplierPayment.create({
      invoice_id: inv.id,
      supplier_id: profile.id,
      amount: inv.amount,
      status: "completed",
      payment_method: payForm.payment_method,
      reference_number: payForm.reference_number,
      paid_date: new Date().toISOString(),
    });

    // Update invoice status
    await base44.entities.Invoice.update(inv.id, {
      status: "paid",
      paid_date: new Date().toISOString(),
    });

    // Status history
    await base44.entities.InvoiceStatusHistory.create({
      invoice_id: inv.id,
      from_status: inv.status,
      to_status: "paid",
      changed_by: user.email,
      note: `תשלום בוצע: ${payForm.payment_method} - ${payForm.reference_number}`,
      timestamp: new Date().toISOString(),
    });

    // Simulate card credit
    await base44.entities.CardTransaction.create({
      invoice_id: inv.id,
      architect_email: inv.architect_email,
      amount: inv.reward_amount,
      status: "credited",
      processed_date: new Date().toISOString(),
    });

    // Update invoice to card_credited
    await base44.entities.Invoice.update(inv.id, {
      status: "card_credited",
      credit_date: new Date().toISOString(),
    });

    await base44.entities.InvoiceStatusHistory.create({
      invoice_id: inv.id,
      from_status: "paid",
      to_status: "card_credited",
      changed_by: "system",
      note: "כרטיס זוכה אוטומטית",
      timestamp: new Date().toISOString(),
    });

    // Update architect card balance
    const archProfiles = await base44.entities.ArchitectProfile.filter({ user_email: inv.architect_email });
    if (archProfiles.length > 0) {
      await base44.entities.ArchitectProfile.update(archProfiles[0].id, {
        card_balance: (archProfiles[0].card_balance || 0) + (inv.reward_amount || 0),
        total_approved_invoices: (archProfiles[0].total_approved_invoices || 0) + 1,
        monthly_reward_total: (archProfiles[0].monthly_reward_total || 0) + (inv.reward_amount || 0),
      });
    }

    // Update supplier profile
    await base44.entities.SupplierProfile.update(profile.id, {
      total_transactions: (profile.total_transactions || 0) + 1,
      total_paid: (profile.total_paid || 0) + inv.amount,
    });

    // Audit
    await base44.entities.AuditLog.create({
      action: "supplier_payment_completed",
      entity_type: "SupplierPayment",
      entity_id: inv.id,
      performed_by: user.email,
      details: `Payment of ₪${inv.amount} for invoice ${inv.invoice_number}`,
      timestamp: new Date().toISOString(),
    });

    // Process goal bonus (call backend function)
    try {
      await base44.functions.invoke('processGoalBonus', { invoice_id: inv.id });
    } catch (e) {
      console.error('Goal bonus processing failed:', e);
    }

    setPayDialog(null);
    setPayForm({ payment_method: "bank_transfer", reference_number: "" });
    setSubmitting(false);
    loadData();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="תשלומים" subtitle="ניהול תשלומים לחשבוניות מאושרות" />

      {/* Pending payments */}
      {pendingInvoices.length > 0 && (
        <Card className="bg-white border border-gray-100 mb-6">
          <div className="p-5 border-b border-gray-50">
            <h3 className="text-sm font-medium text-amber-700">ממתינים לתשלום ({pendingInvoices.length})</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingInvoices.map(inv => (
              <div key={inv.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{inv.architect_name}</p>
                  <p className="text-xs text-gray-500">{inv.invoice_number} · ₪{inv.amount?.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={inv.status} />
                  <Button size="sm" onClick={() => setPayDialog(inv)} className="bg-gray-900 hover:bg-gray-800 gap-1">
                    <Check className="w-3 h-3" /> שלם
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Payment history */}
      <Card className="bg-white border border-gray-100">
        <div className="p-5 border-b border-gray-50">
          <h3 className="text-sm font-medium">היסטוריית תשלומים</h3>
        </div>
        {payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="אין תשלומים" />
        ) : (
          <div className="divide-y divide-gray-50">
            {payments.map(p => (
              <div key={p.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">₪{p.amount?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{p.reference_number} · {new Date(p.paid_date || p.created_date).toLocaleDateString("he-IL")}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pay dialog */}
      <Dialog open={!!payDialog} onOpenChange={() => setPayDialog(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>ביצוע תשלום</DialogTitle>
          </DialogHeader>
          {payDialog && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">{payDialog.architect_name}</p>
                <p className="text-xs text-gray-500">{payDialog.invoice_number}</p>
                <p className="text-lg font-semibold mt-2">₪{payDialog.amount?.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">אמצעי תשלום</Label>
                <Select value={payForm.payment_method} onValueChange={v => setPayForm({ ...payForm, payment_method: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">העברה בנקאית</SelectItem>
                    <SelectItem value="credit_card">כרטיס אשראי</SelectItem>
                    <SelectItem value="check">צ׳ק</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-600">מספר אסמכתא</Label>
                <Input value={payForm.reference_number} onChange={e => setPayForm({ ...payForm, reference_number: e.target.value })} className="mt-1" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(null)}>ביטול</Button>
            <Button onClick={handlePay} disabled={submitting} className="bg-gray-900 hover:bg-gray-800">
              {submitting ? "מעבד..." : "אשר תשלום"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}