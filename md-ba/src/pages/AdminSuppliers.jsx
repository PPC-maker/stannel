import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Building2, Plus, Clock } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import StatusBadge from "../components/shared/StatusBadge";
import EmptyState from "../components/shared/EmptyState";
import AdvancedSearch from "../components/shared/AdvancedSearch";

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", category: "all", status: "all" });
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    user_email: "",
    company_name: "",
    contact_name: "",
    phone: "",
    business_id: "",
    category: "furniture",
    sla_days: "10"
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const sups = await base44.entities.SupplierProfile.list("-created_date", 100);
    setSuppliers(sups);
    setLoading(false);
  };

  const handleStatusChange = async (sup, newStatus) => {
    const user = await base44.auth.me();
    await base44.entities.SupplierProfile.update(sup.id, { status: newStatus });
    await base44.entities.AuditLog.create({
      action: "supplier_status_changed",
      entity_type: "SupplierProfile",
      entity_id: sup.id,
      performed_by: user.email,
      details: `Supplier ${sup.company_name} status: ${sup.status} → ${newStatus}`,
      timestamp: new Date().toISOString(),
    });
    setSelected(null);
    loadData();
  };

  const handleOnboardingStatusChange = async (sup, newStatus) => {
    const user = await base44.auth.me();
    await base44.entities.SupplierProfile.update(sup.id, { onboarding_status: newStatus });
    
    await base44.entities.Notification.create({
      recipient_email: sup.user_email,
      title: newStatus === "approved" ? "החשבון אושר!" : "החשבון נדחה",
      message: newStatus === "approved" 
        ? "החשבון שלך אושר ואתה יכול להתחיל להשתמש במערכת."
        : "החשבון שלך נדחה. נא ליצור קשר עם האדמין למידע נוסף.",
      type: newStatus === "approved" ? "success" : "warning"
    });

    await base44.entities.AuditLog.create({
      action: "supplier_onboarding_status_changed",
      entity_type: "SupplierProfile",
      entity_id: sup.id,
      performed_by: user.email,
      details: `Supplier ${sup.company_name} onboarding: ${sup.onboarding_status} → ${newStatus}`,
      timestamp: new Date().toISOString(),
    });
    
    setSelected(null);
    loadData();
  };

  const handleSlaChange = async (sup, newSla) => {
    const user = await base44.auth.me();
    await base44.entities.SupplierProfile.update(sup.id, {
      sla_days: parseInt(newSla)
    });

    await base44.entities.AuditLog.create({
      action: "supplier_sla_updated",
      entity_type: "SupplierProfile",
      entity_id: sup.id,
      performed_by: user.email,
      details: `Supplier ${sup.company_name} SLA updated to ${newSla} days`,
      timestamp: new Date().toISOString(),
    });

    setSelected(null);
    loadData();
  };

  const handleCreateSupplier = async () => {
    const user = await base44.auth.me();
    
    await base44.entities.SupplierProfile.create({
      ...createForm,
      sla_days: parseInt(createForm.sla_days),
      onboarding_status: "approved",
      status: "active"
    });

    await base44.users.inviteUser(createForm.user_email, "user");

    await base44.entities.AuditLog.create({
      action: "supplier_created_by_admin",
      entity_type: "SupplierProfile",
      performed_by: user.email,
      details: `Created supplier ${createForm.company_name}`,
      timestamp: new Date().toISOString(),
    });

    setShowCreate(false);
    setCreateForm({
      user_email: "",
      company_name: "",
      contact_name: "",
      phone: "",
      business_id: "",
      category: "furniture",
      sla_days: "10"
    });
    loadData();
  };

  const filtered = suppliers.filter(sup => {
    const s = filters.search?.toLowerCase() || "";
    const searchMatch = !s || sup.company_name?.toLowerCase().includes(s) ||
      sup.contact_name?.toLowerCase().includes(s) ||
      sup.user_email?.toLowerCase().includes(s);
    const categoryMatch = !filters.category || filters.category === "all" || sup.category === filters.category;
    const statusMatch = !filters.status || filters.status === "all" || sup.status === filters.status;
    return searchMatch && categoryMatch && statusMatch;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader 
        title="ניהול ספקים" 
        subtitle={`${suppliers.length} ספקים`}
        actions={
          <Button onClick={() => setShowCreate(true)} className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
            <Plus className="w-4 h-4" />
            ספק חדש
          </Button>
        }
      />

      <AdvancedSearch
        page="AdminSuppliers"
        filters={filters}
        onFiltersChange={setFilters}
        filterFields={[
          { key: "search", label: "חיפוש חופשי", type: "text" },
          { key: "category", label: "קטגוריה", type: "select", options: [
            { value: "furniture", label: "רהיטים" },
            { value: "lighting", label: "תאורה" },
            { value: "flooring", label: "ריצוף" },
            { value: "plumbing", label: "אינסטלציה" },
            { value: "electrical", label: "חשמל" },
            { value: "electrical_appliances", label: "מוצרי חשמל" },
            { value: "paint", label: "צבעים" },
            { value: "kitchen", label: "מטבחים" },
            { value: "bathroom", label: "אמבטיות" },
            { value: "outdoor", label: "חוץ" },
            { value: "other", label: "אחר" },
          ]},
          { key: "status", label: "סטטוס פעילות", type: "select", options: [
            { value: "active", label: "פעיל" },
            { value: "suspended", label: "מושהה" },
            { value: "inactive", label: "לא פעיל" },
          ]},
        ]}
      />

      <Card className="bg-white border border-gray-100">
        {filtered.length === 0 ? (
          <EmptyState icon={Building2} title="אין ספקים" />
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(sup => (
              <div key={sup.id} className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={async () => { setSelected(sup); const u = await base44.auth.me(); await base44.entities.ProfileView.create({ viewed_user_email: sup.user_email, viewer_email: u.email, viewer_name: u.full_name, viewer_role: "admin" }); }}>
                <div className="flex-1">
                  <p className="text-sm font-medium">{sup.company_name}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                    <span>{sup.contact_name}</span>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      SLA: {sup.sla_days || 10} ימים
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sup.onboarding_status && <StatusBadge status={sup.onboarding_status} />}
                  <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${(sup.trust_score || 100) >= 80 ? "bg-green-50 text-green-700" : (sup.trust_score || 100) >= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                    {sup.trust_score || 100}
                  </div>
                  <StatusBadge status={sup.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>פרטי ספק</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-500">חברה</p><p className="text-sm font-medium">{selected.company_name}</p></div>
                <div><p className="text-xs text-gray-500">איש קשר</p><p className="text-sm">{selected.contact_name}</p></div>
                <div><p className="text-xs text-gray-500">אימייל</p><p className="text-sm">{selected.user_email}</p></div>
                <div><p className="text-xs text-gray-500">טלפון</p><p className="text-sm">{selected.phone || "—"}</p></div>
                <div><p className="text-xs text-gray-500">ח.פ</p><p className="text-sm">{selected.business_id || "—"}</p></div>
                <div><p className="text-xs text-gray-500">קטגוריה</p><p className="text-sm">{selected.category || "—"}</p></div>
                <div><p className="text-xs text-gray-500">ציון אמון</p><p className="text-sm font-medium">{selected.trust_score || 100}/100</p></div>
                <div><p className="text-xs text-gray-500">עסקאות</p><p className="text-sm">{selected.total_transactions || 0}</p></div>
                <div><p className="text-xs text-gray-500">סה״כ שולם</p><p className="text-sm">₪{(selected.total_paid || 0).toLocaleString()}</p></div>
                <div><p className="text-xs text-gray-500">איחורים</p><p className="text-sm">{selected.overdue_count || 0}</p></div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <Label className="text-xs text-gray-600">SLA תשלום (ימים)</Label>
                <Input
                  type="number"
                  value={selected.sla_days || 10}
                  onChange={(e) => handleSlaChange(selected, e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">מספר ימי עסקים לתשלום</p>
              </div>

              {selected.onboarding_status && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">סטטוס אישור</p>
                  <div className="flex gap-2">
                    {["pending_review", "approved", "rejected"].map(st => (
                      <Button
                        key={st}
                        size="sm"
                        variant={selected.onboarding_status === st ? "default" : "outline"}
                        className={selected.onboarding_status === st ? "bg-gray-900" : ""}
                        onClick={() => handleOnboardingStatusChange(selected, st)}
                      >
                        {st === "pending_review" ? "ממתין" : st === "approved" ? "מאושר" : "נדחה"}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">סטטוס פעילות</p>
                <div className="flex gap-2">
                {["active", "suspended", "inactive"].map(st => (
                  <Button
                    key={st}
                    size="sm"
                    variant={selected.status === st ? "default" : "outline"}
                    className={selected.status === st ? "bg-gray-900" : ""}
                    onClick={() => handleStatusChange(selected, st)}
                  >
                    {st === "active" ? "פעיל" : st === "suspended" ? "מושהה" : "לא פעיל"}
                  </Button>
                ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Supplier Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>ספק חדש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <Label className="text-xs text-gray-600">אימייל</Label>
              <Input
                type="email"
                value={createForm.user_email}
                onChange={e => setCreateForm({ ...createForm, user_email: e.target.value })}
                className="mt-1"
                placeholder="supplier@example.com"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">שם חברה</Label>
              <Input
                value={createForm.company_name}
                onChange={e => setCreateForm({ ...createForm, company_name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">איש קשר</Label>
              <Input
                value={createForm.contact_name}
                onChange={e => setCreateForm({ ...createForm, contact_name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">טלפון</Label>
              <Input
                value={createForm.phone}
                onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">ח.פ / ע.מ</Label>
              <Input
                value={createForm.business_id}
                onChange={e => setCreateForm({ ...createForm, business_id: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">קטגוריה</Label>
              <Select value={createForm.category} onValueChange={v => setCreateForm({ ...createForm, category: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="furniture">רהיטים</SelectItem>
                  <SelectItem value="lighting">תאורה</SelectItem>
                  <SelectItem value="flooring">ריצוף</SelectItem>
                  <SelectItem value="plumbing">אינסטלציה</SelectItem>
                  <SelectItem value="electrical">חשמל</SelectItem>
                  <SelectItem value="electrical_appliances">מוצרי חשמל</SelectItem>
                  <SelectItem value="paint">צבעים</SelectItem>
                  <SelectItem value="kitchen">מטבחים</SelectItem>
                  <SelectItem value="bathroom">אמבטיות</SelectItem>
                  <SelectItem value="outdoor">חוץ</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-600">SLA תשלום (ימים)</Label>
              <Input
                type="number"
                value={createForm.sla_days}
                onChange={e => setCreateForm({ ...createForm, sla_days: e.target.value })}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">מספר ימי עסקים לתשלום</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>ביטול</Button>
            <Button
              onClick={handleCreateSupplier}
              disabled={!createForm.user_email || !createForm.company_name}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              צור ספק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}