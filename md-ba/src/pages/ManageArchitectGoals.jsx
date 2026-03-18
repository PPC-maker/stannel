import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Target, Plus, Trash2, Eye } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import { format, addMonths, addDays } from "date-fns";

export default function ManageArchitectGoals() {
  const [goals, setGoals] = useState([]);
  const [architects, setArchitects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [form, setForm] = useState({
    architect_email: "",
    period_type: "monthly",
    target_amount: "",
    bonus_percentage: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allGoals = await base44.entities.ArchitectGoal.list("-created_date");
    setGoals(allGoals);
    const allArchitects = await base44.entities.ArchitectProfile.filter({ onboarding_status: "approved" });
    setArchitects(allArchitects);
    setLoading(false);
  };

  const handleCreate = async () => {
    const user = await base44.auth.me();
    const now = new Date();
    const periodStart = format(now, "yyyy-MM-dd");
    const periodEnd = form.period_type === "monthly" 
      ? format(addMonths(now, 1), "yyyy-MM-dd")
      : format(addMonths(now, 3), "yyyy-MM-dd");

    await base44.entities.ArchitectGoal.create({
      architect_email: form.architect_email,
      created_by: user.email,
      period_type: form.period_type,
      target_amount: parseFloat(form.target_amount),
      bonus_percentage: parseFloat(form.bonus_percentage),
      current_period_start: periodStart,
      current_period_end: periodEnd,
      is_active: true
    });

    // Notify architect
    const architect = architects.find(a => a.user_email === form.architect_email);
    await base44.entities.Notification.create({
      recipient_email: form.architect_email,
      title: "יעד חדש נקבע עבורך",
      message: `נקבע עבורך יעד ${form.period_type === "monthly" ? "חודשי" : "רבעוני"} של ₪${parseFloat(form.target_amount).toLocaleString()} עם בונוס של ${form.bonus_percentage}%`,
      type: "info",
      related_entity: "ArchitectGoal"
    });

    setShowCreate(false);
    setForm({ architect_email: "", period_type: "monthly", target_amount: "", bonus_percentage: "" });
    loadData();
  };

  const handleDelete = async (goalId) => {
    await base44.entities.ArchitectGoal.update(goalId, { is_active: false });
    loadData();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  return (
    <div>
      <PageHeader
        title="ניהול יעדים לאדריכלים"
        subtitle={`${goals.filter(g => g.is_active).length} יעדים פעילים`}
        actions={
          <Button onClick={() => setShowCreate(true)} className="gap-2 bg-gray-900 hover:bg-gray-800">
            <Plus className="w-4 h-4" />
            יעד חדש
          </Button>
        }
      />

      <Card className="bg-white border border-gray-100">
        {goals.length === 0 ? (
          <EmptyState icon={Target} title="אין יעדים" description="צור יעד ראשון לאדריכל" />
        ) : (
          <div className="divide-y divide-gray-50">
            {goals.map(goal => {
              const architect = architects.find(a => a.user_email === goal.architect_email);
              const progress = (goal.current_period_revenue / goal.target_amount) * 100;
              
              return (
                <div key={goal.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium">{architect?.full_name || goal.architect_email}</p>
                      <p className="text-xs text-gray-500">
                        {goal.period_type === "monthly" ? "חודשי" : "רבעוני"} · 
                        {format(new Date(goal.current_period_start), "dd/MM/yyyy")} - {format(new Date(goal.current_period_end), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!goal.is_active && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">לא פעיל</span>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedGoal(goal)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {goal.is_active && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(goal.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">יעד: ₪{goal.target_amount?.toLocaleString()}</span>
                      <span className="font-medium">
                        ₪{goal.current_period_revenue?.toLocaleString()} ({progress.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          progress >= 100 ? "bg-green-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      בונוס: {goal.bonus_percentage}% 
                      {goal.target_met && <span className="text-green-600 mr-2">✓ יעד הושג</span>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>יעד חדש לאדריכל</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-600">אדריכל</Label>
              <Select value={form.architect_email} onValueChange={v => setForm({ ...form, architect_email: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר אדריכל" />
                </SelectTrigger>
                <SelectContent>
                  {architects.map(a => (
                    <SelectItem key={a.id} value={a.user_email}>{a.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-600">תקופה</Label>
              <Select value={form.period_type} onValueChange={v => setForm({ ...form, period_type: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">חודשי</SelectItem>
                  <SelectItem value="quarterly">רבעוני</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-600">סכום יעד (₪)</Label>
              <Input
                type="number"
                value={form.target_amount}
                onChange={e => setForm({ ...form, target_amount: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">אחוז בונוס (%)</Label>
              <Input
                type="number"
                value={form.bonus_percentage}
                onChange={e => setForm({ ...form, bonus_percentage: e.target.value })}
                className="mt-1"
              />
              {form.target_amount && form.bonus_percentage && (
                <p className="text-xs text-green-600 mt-1">
                  בונוס פוטנציאלי: ₪{(parseFloat(form.target_amount || 0) * parseFloat(form.bonus_percentage || 0) / 100).toFixed(2)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>ביטול</Button>
            <Button
              onClick={handleCreate}
              disabled={!form.architect_email || !form.target_amount || !form.bonus_percentage}
              className="bg-gray-900 hover:bg-gray-800"
            >
              צור יעד
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Goal Detail Dialog */}
      <Dialog open={!!selectedGoal} onOpenChange={() => setSelectedGoal(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>פרטי יעד</DialogTitle>
          </DialogHeader>
          {selectedGoal && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">אדריכל</p>
                  <p className="text-sm font-medium">
                    {architects.find(a => a.user_email === selectedGoal.architect_email)?.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">תקופה</p>
                  <p className="text-sm font-medium">
                    {selectedGoal.period_type === "monthly" ? "חודשי" : "רבעוני"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">יעד</p>
                  <p className="text-sm font-medium">₪{selectedGoal.target_amount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">הושג</p>
                  <p className="text-sm font-medium">₪{selectedGoal.current_period_revenue?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">בונוס</p>
                  <p className="text-sm font-medium">{selectedGoal.bonus_percentage}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">סטטוס</p>
                  <p className="text-sm font-medium">
                    {selectedGoal.target_met ? "הושג ✓" : selectedGoal.is_active ? "פעיל" : "לא פעיל"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}