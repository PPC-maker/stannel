import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "../components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Phone, Mail, Globe } from "lucide-react";

const CATEGORY_OPTIONS = [
  { value: "photography", label: "צלמים" },
  { value: "social_media", label: "סושיאל מדיה" },
  { value: "magazine", label: "פרסום במגזין" },
  { value: "tv", label: "השתתפות בטלוויזיה" },
  { value: "branding", label: "ברנדינג" },
  { value: "web_development", label: "פיתוח אתרים" },
  { value: "business_advisor", label: "יועץ עסקי" },
  { value: "mentor", label: "מנטור" },
  { value: "marketing", label: "שיווק" },
  { value: "other", label: "אחר" },
];

const GROUP_OPTIONS = [
  { value: "marketing_advertising", label: "שיווק ופרסום" },
  { value: "business_consulting", label: "ייעוץ עסקי" },
];

const EMPTY_FORM = { name: "", category: "", category_group: "", description: "", phone: "", email: "", website: "", image_url: "", is_active: true };

export default function ManageServiceProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const data = await base44.entities.ServiceProvider.list("name");
    setProviders(data);
    setLoading(false);
  };

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setDialog(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setDialog(true); };

  const handleSave = async () => {
    setSaving(true);
    if (editing) {
      await base44.entities.ServiceProvider.update(editing.id, form);
    } else {
      await base44.entities.ServiceProvider.create(form);
    }
    setDialog(false);
    loadData();
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("למחוק נותן שירות זה?")) return;
    await base44.entities.ServiceProvider.delete(id);
    loadData();
  };

  const CATEGORY_LABELS = Object.fromEntries(CATEGORY_OPTIONS.map(o => [o.value, o.label]));
  const GROUP_LABELS = Object.fromEntries(GROUP_OPTIONS.map(o => [o.value, o.label]));

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader
        title="ניהול נותני שירות"
        subtitle={`${providers.length} נותני שירות`}
        actions={
          <Button onClick={openNew} className="rounded-none bg-gray-900 hover:bg-black gap-1.5 text-xs uppercase tracking-wider h-8 px-4">
            <Plus className="w-3.5 h-3.5" /> הוסף
          </Button>
        }
      />

      <div className="space-y-3">
        {providers.map(p => (
          <div key={p.id} className="bg-white border border-gray-100 p-4 flex items-start justify-between gap-4 hover:border-gray-200 transition-all">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-gray-900">{p.name}</p>
                <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5">{GROUP_LABELS[p.category_group]}</span>
                <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5">{CATEGORY_LABELS[p.category]}</span>
                {!p.is_active && <span className="text-[10px] text-red-400 bg-red-50 px-2 py-0.5">מושבת</span>}
              </div>
              {p.description && <p className="text-xs text-gray-500 mt-1">{p.description}</p>}
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {p.phone && <span className="text-[11px] text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>}
                {p.email && <span className="text-[11px] text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</span>}
                {p.website && <span className="text-[11px] text-gray-400 flex items-center gap-1"><Globe className="w-3 h-3" />{p.website}</span>}
              </div>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <Button size="sm" variant="ghost" onClick={() => openEdit(p)} className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700">
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)} className="h-7 w-7 p-0 text-gray-300 hover:text-red-600">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {providers.length === 0 && (
          <div className="text-center py-16 text-sm text-gray-400">אין נותני שירות — הוסף את הראשון</div>
        )}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? "עריכת נותן שירות" : "נותן שירות חדש"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">שם *</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="שם נותן השירות" className="rounded-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">קבוצה *</label>
                <Select value={form.category_group} onValueChange={v => setForm({ ...form, category_group: v })}>
                  <SelectTrigger className="rounded-none text-xs"><SelectValue placeholder="בחר" /></SelectTrigger>
                  <SelectContent>{GROUP_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">קטגוריה *</label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="rounded-none text-xs"><SelectValue placeholder="בחר" /></SelectTrigger>
                  <SelectContent>{CATEGORY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">תיאור</label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="תיאור קצר" className="rounded-none text-sm h-16" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">טלפון</label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="050-0000000" className="rounded-none" dir="ltr" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">אימייל</label>
                <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" className="rounded-none" dir="ltr" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">אתר</label>
              <Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://..." className="rounded-none" dir="ltr" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">תמונה (URL)</label>
              <Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." className="rounded-none" dir="ltr" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              <label htmlFor="active" className="text-xs text-gray-600">פעיל</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)} className="rounded-none text-xs">ביטול</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.category} className="rounded-none bg-gray-900 text-xs">
              {saving ? "שומר..." : "שמור"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}