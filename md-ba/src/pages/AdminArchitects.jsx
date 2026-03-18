import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Ruler, Check, X, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PageHeader from "../components/shared/PageHeader";
import StatusBadge from "../components/shared/StatusBadge";
import EmptyState from "../components/shared/EmptyState";
import AdvancedSearch from "../components/shared/AdvancedSearch";

const TRUST_COLORS = { bronze: "bg-amber-100 text-amber-800", silver: "bg-slate-100 text-slate-700", gold: "bg-yellow-100 text-yellow-800" };

export default function AdminArchitects() {
  const [architects, setArchitects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", status: "all", trust_level: "all" });
  const [selected, setSelected] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const archs = await base44.entities.ArchitectProfile.list("-created_date", 100);
    setArchitects(archs);
    setLoading(false);
  };

  const recordView = async (arch) => {
    const user = await base44.auth.me();
    // avoid duplicate view in same session
    await base44.entities.ProfileView.create({
      viewed_user_email: arch.user_email,
      viewer_email: user.email,
      viewer_name: user.full_name,
      viewer_role: "admin",
    });
  };

  const handleApprove = async (arch) => {
    const user = await base44.auth.me();
    await base44.entities.ArchitectProfile.update(arch.id, { onboarding_status: "approved" });
    await base44.entities.AuditLog.create({
      action: "architect_approved",
      entity_type: "ArchitectProfile",
      entity_id: arch.id,
      performed_by: user.email,
      details: `Architect ${arch.full_name} approved`,
      timestamp: new Date().toISOString(),
    });
    await base44.entities.Notification.create({
      recipient_email: arch.user_email,
      title: "החשבון אושר!",
      message: "החשבון שלך אושר ויש לך גישה מלאה למערכת.",
      type: "success",
    });
    setSelected(null);
    loadData();
  };

  const handleReject = async (arch) => {
    const user = await base44.auth.me();
    await base44.entities.ArchitectProfile.update(arch.id, { onboarding_status: "rejected" });
    await base44.entities.AuditLog.create({
      action: "architect_rejected",
      entity_type: "ArchitectProfile",
      entity_id: arch.id,
      performed_by: user.email,
      details: `Architect ${arch.full_name} rejected`,
      timestamp: new Date().toISOString(),
    });
    setSelected(null);
    loadData();
  };

  const handleTrustChange = async (arch, newLevel) => {
    const user = await base44.auth.me();
    await base44.entities.ArchitectProfile.update(arch.id, { trust_level: newLevel });
    await base44.entities.AuditLog.create({
      action: "trust_level_changed",
      entity_type: "ArchitectProfile",
      entity_id: arch.id,
      performed_by: user.email,
      details: `Trust level changed from ${arch.trust_level} to ${newLevel}`,
      timestamp: new Date().toISOString(),
    });
    setSelected(null);
    loadData();
  };

  const filtered = architects.filter(a => {
    const s = filters.search?.toLowerCase() || "";
    const matchSearch = !s || a.full_name?.toLowerCase().includes(s) || a.user_email?.toLowerCase().includes(s);
    const matchStatus = !filters.status || filters.status === "all" || a.onboarding_status === filters.status;
    const matchTrust = !filters.trust_level || filters.trust_level === "all" || a.trust_level === filters.trust_level;
    return matchSearch && matchStatus && matchTrust;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="ניהול אדריכלים" subtitle={`${architects.length} אדריכלים`} />

      <AdvancedSearch
        page="AdminArchitects"
        filters={filters}
        onFiltersChange={setFilters}
        filterFields={[
          { key: "search", label: "חיפוש חופשי", type: "text" },
          { key: "status", label: "סטטוס אישור", type: "select", options: [
            { value: "limited", label: "מוגבל" },
            { value: "pending_review", label: "ממתין לבדיקה" },
            { value: "approved", label: "מאושר" },
            { value: "rejected", label: "נדחה" },
          ]},
          { key: "trust_level", label: "רמת אמון", type: "select", options: [
            { value: "bronze", label: "ברונזה" },
            { value: "silver", label: "כסף" },
            { value: "gold", label: "זהב" },
          ]},
        ]}
      />

      <Card className="bg-white border border-gray-100">
        {filtered.length === 0 ? (
          <EmptyState icon={Ruler} title="אין אדריכלים" />
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(arch => (
              <div key={arch.id} className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => { setSelected(arch); recordView(arch); }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{arch.full_name}</p>
                    <Badge className={`text-[10px] px-1.5 py-0 ${TRUST_COLORS[arch.trust_level]}`}>{arch.trust_level}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{arch.user_email} · ח.פ: {arch.business_id || "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={arch.onboarding_status} />
                  {arch.onboarding_status === "pending_review" && (
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-green-600" onClick={e => { e.stopPropagation(); handleApprove(arch); }}>
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>פרטי אדריכל</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-500">שם</p><p className="text-sm font-medium">{selected.full_name}</p></div>
                <div><p className="text-xs text-gray-500">אימייל</p><p className="text-sm">{selected.user_email}</p></div>
                <div><p className="text-xs text-gray-500">טלפון</p><p className="text-sm">{selected.phone || "—"}</p></div>
                <div><p className="text-xs text-gray-500">ח.פ</p><p className="text-sm">{selected.business_id || "—"}</p></div>
                <div><p className="text-xs text-gray-500">סטטוס</p><StatusBadge status={selected.onboarding_status} /></div>
                <div><p className="text-xs text-gray-500">יתרת כרטיס</p><p className="text-sm font-medium">₪{(selected.card_balance || 0).toLocaleString()}</p></div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">רמת אמון</p>
                <div className="flex gap-2">
                  {["bronze", "silver", "gold"].map(level => (
                    <Button
                      key={level}
                      size="sm"
                      variant={selected.trust_level === level ? "default" : "outline"}
                      className={selected.trust_level === level ? "bg-gray-900" : ""}
                      onClick={() => handleTrustChange(selected, level)}
                    >
                      {level === "bronze" ? "ברונזה" : level === "silver" ? "כסף" : "זהב"}
                    </Button>
                  ))}
                </div>
              </div>

              {selected.onboarding_status === "pending_review" && (
                <div className="flex gap-2 pt-3">
                  <Button onClick={() => handleApprove(selected)} className="flex-1 bg-green-600 hover:bg-green-700 gap-1">
                    <Check className="w-4 h-4" /> אשר
                  </Button>
                  <Button onClick={() => handleReject(selected)} variant="outline" className="flex-1 text-red-600 gap-1">
                    <X className="w-4 h-4" /> דחה
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}