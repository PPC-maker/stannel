import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Plus, Upload, AlertTriangle, Calendar } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import { format, differenceInDays, addMonths } from "date-fns";

export default function ManageContracts() {
  const [contracts, setContracts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [form, setForm] = useState({
    supplier_id: "",
    contract_type: "standard",
    start_date: "",
    end_date: "",
    payment_terms: "",
    commission_rate: "",
    minimum_order_value: "",
    contract_file_url: "",
    auto_renewal: false,
    notes: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const conts = await base44.entities.SupplierContract.list("-created_date");
    setContracts(conts);
    const sups = await base44.entities.SupplierProfile.filter({ status: "active" });
    setSuppliers(sups);
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, contract_file_url: file_url }));
  };

  const handleCreate = async () => {
    const user = await base44.auth.me();
    const contractNumber = `CNT-${Date.now().toString(36).toUpperCase()}`;
    
    await base44.entities.SupplierContract.create({
      supplier_id: form.supplier_id,
      contract_number: contractNumber,
      contract_type: form.contract_type,
      start_date: form.start_date,
      end_date: form.end_date,
      payment_terms: form.payment_terms,
      commission_rate: parseFloat(form.commission_rate),
      minimum_order_value: parseFloat(form.minimum_order_value),
      contract_file_url: form.contract_file_url,
      auto_renewal: form.auto_renewal,
      notes: form.notes,
      status: "active"
    });

    await base44.entities.AuditLog.create({
      action: "contract_created",
      entity_type: "SupplierContract",
      performed_by: user.email,
      details: `Created contract ${contractNumber}`,
      timestamp: new Date().toISOString(),
    });

    setShowCreate(false);
    setForm({
      supplier_id: "",
      contract_type: "standard",
      start_date: "",
      end_date: "",
      payment_terms: "",
      commission_rate: "",
      minimum_order_value: "",
      contract_file_url: "",
      auto_renewal: false,
      notes: ""
    });
    loadData();
  };

  const getExpiringContracts = () => {
    const today = new Date();
    return contracts.filter(c => {
      if (c.status !== "active" || !c.end_date) return false;
      const endDate = new Date(c.end_date);
      const daysUntilExpiry = differenceInDays(endDate, today);
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  const expiringContracts = getExpiringContracts();

  return (
    <div>
      <PageHeader
        title="ניהול חוזים"
        subtitle={`${contracts.length} חוזים במערכת`}
        actions={
          <Button onClick={() => setShowCreate(true)} className="gap-2 bg-gray-900 hover:bg-gray-800">
            <Plus className="w-4 h-4" />
            חוזה חדש
          </Button>
        }
      />

      {/* Expiring Contracts Alert */}
      {expiringContracts.length > 0 && (
        <Card className="p-4 mb-6 bg-amber-50 border-amber-100">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                {expiringContracts.length} חוזים עומדים לפוג בחודש הקרוב
              </p>
              <p className="text-xs text-amber-700 mt-1">
                יש לחדש את החוזים לפני תאריך התפוגה
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="bg-white border border-gray-100">
        {contracts.length === 0 ? (
          <EmptyState icon={FileText} title="אין חוזים" description="צור חוזה ראשון" />
        ) : (
          <div className="divide-y divide-gray-50">
            {contracts.map(contract => {
              const supplier = suppliers.find(s => s.id === contract.supplier_id);
              const daysUntilExpiry = contract.end_date 
                ? differenceInDays(new Date(contract.end_date), new Date())
                : null;
              const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;

              return (
                <div
                  key={contract.id}
                  className="p-5 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedContract(contract)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{contract.contract_number}</p>
                        {isExpiringSoon && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            פג בקרוב
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {supplier?.company_name || "ספק לא ידוע"}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>סוג: {contract.contract_type}</span>
                        <span>עמלה: {contract.commission_rate}%</span>
                        {contract.end_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            עד {format(new Date(contract.end_date), "dd/MM/yyyy")}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      contract.status === "active" ? "bg-green-50 text-green-700" :
                      contract.status === "expired" ? "bg-gray-50 text-gray-700" :
                      contract.status === "terminated" ? "bg-red-50 text-red-700" :
                      "bg-blue-50 text-blue-700"
                    }`}>
                      {contract.status === "active" ? "פעיל" :
                       contract.status === "expired" ? "פג" :
                       contract.status === "terminated" ? "בוטל" : "טיוטה"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>חוזה חדש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <Label className="text-xs text-gray-600">ספק</Label>
              <Select value={form.supplier_id} onValueChange={v => setForm({ ...form, supplier_id: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר ספק" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-600">סוג חוזה</Label>
              <Select value={form.contract_type} onValueChange={v => setForm({ ...form, contract_type: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">רגיל</SelectItem>
                  <SelectItem value="premium">פרימיום</SelectItem>
                  <SelectItem value="exclusive">בלעדי</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600">מתאריך</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-gray-600">עד תאריך</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600">עמלה (%)</Label>
                <Input type="number" value={form.commission_rate} onChange={e => setForm({ ...form, commission_rate: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-gray-600">הזמנה מינימלית (₪)</Label>
                <Input type="number" value={form.minimum_order_value} onChange={e => setForm({ ...form, minimum_order_value: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-600">תנאי תשלום</Label>
              <Textarea value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })} className="mt-1" rows={2} />
            </div>
            <div>
              <Label className="text-xs text-gray-600">קובץ חוזה</Label>
              <div className="mt-1">
                {form.contract_file_url ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-700">קובץ הועלה</span>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gray-300">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">העלה קובץ</span>
                    <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf" />
                  </label>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>ביטול</Button>
            <Button onClick={handleCreate} disabled={!form.supplier_id || !form.start_date}>צור חוזה</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>פרטי חוזה</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">מספר חוזה</p>
                  <p className="text-sm font-medium">{selectedContract.contract_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">סטטוס</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    selectedContract.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"
                  }`}>
                    {selectedContract.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">מתאריך</p>
                  <p className="text-sm">{selectedContract.start_date ? format(new Date(selectedContract.start_date), "dd/MM/yyyy") : "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">עד</p>
                  <p className="text-sm">{selectedContract.end_date ? format(new Date(selectedContract.end_date), "dd/MM/yyyy") : "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">עמלה</p>
                  <p className="text-sm font-medium">{selectedContract.commission_rate}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">הזמנה מינימלית</p>
                  <p className="text-sm">₪{selectedContract.minimum_order_value?.toLocaleString()}</p>
                </div>
              </div>
              {selectedContract.payment_terms && (
                <div>
                  <p className="text-xs text-gray-500">תנאי תשלום</p>
                  <p className="text-sm">{selectedContract.payment_terms}</p>
                </div>
              )}
              {selectedContract.contract_file_url && (
                <a href={selectedContract.contract_file_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 ml-2" />
                    צפה בחוזה
                  </Button>
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}