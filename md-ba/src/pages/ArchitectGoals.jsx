import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Target, TrendingUp, Award, Plus, Calendar } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import StatsCard from "../components/shared/StatsCard";
import EmptyState from "../components/shared/EmptyState";

export default function ArchitectGoals() {
  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const gs = await base44.entities.ArchitectGoal.filter({ architect_email: u.email }, "-created_date");
    setGoals(gs);
    const bs = await base44.entities.BonusTransaction.filter({ architect_email: u.email }, "-created_date");
    setBonuses(bs);
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" /></div>;

  const activeGoal = goals.find(g => g.is_active);
  const totalBonusesEarned = bonuses.filter(b => b.status === "credited").reduce((sum, b) => sum + (b.amount || 0), 0);
  const pendingBonuses = bonuses.filter(b => b.status === "pending").reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div>
      {/* ── PAGE HEADER ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-px h-6 bg-gray-900" />
          <span className="text-[9px] text-gray-400 tracking-[0.3em] uppercase">Design Community</span>
          <div className="w-1.5 h-1.5 border border-gray-300 rotate-45" />
        </div>
        <h1 className="text-2xl font-light tracking-tight text-gray-900">יעדים ובונוסים</h1>
        <p className="text-[11px] text-gray-400 mt-1.5 tracking-[0.12em] uppercase">מעקב אחר הביצועים שלך</p>
        <div className="mt-4 h-px bg-gray-100" />
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-px bg-gray-100 border border-gray-100 mb-6">
        {[
          { label: "בונוסים שנצברו", value: `₪${totalBonusesEarned.toLocaleString()}` },
          { label: "בונוסים ממתינים", value: `₪${pendingBonuses.toLocaleString()}` },
          { label: "יעדים פעילים", value: goals.filter(g => g.is_active).length },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4">
            <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em] mb-2">{s.label}</p>
            <p className="text-xl font-light text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Active Goal */}
      {activeGoal && (
        <div className="bg-gray-900 text-white p-6 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '16px 16px' }} />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[9px] text-white/40 uppercase tracking-[0.25em]">יעד {activeGoal.period_type === "monthly" ? "חודשי" : "רבעוני"} פעיל</p>
                {activeGoal.current_period_start && (
                  <p className="text-[10px] text-white/25 mt-1">
                    {new Date(activeGoal.current_period_start).toLocaleDateString("he-IL")} — {new Date(activeGoal.current_period_end).toLocaleDateString("he-IL")}
                  </p>
                )}
              </div>
              {activeGoal.target_met && (
                <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-400/30 px-3 py-1">
                  <Award className="w-3 h-3 text-green-400" />
                  <span className="text-[10px] text-green-300 tracking-wider">הושג!</span>
                </div>
              )}
            </div>

            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-3xl font-light">₪{(activeGoal.current_period_revenue || 0).toLocaleString()}</p>
                <p className="text-[10px] text-white/30 mt-1">מתוך ₪{activeGoal.target_amount?.toLocaleString()}</p>
              </div>
              <div className="text-left">
                <p className="text-[9px] text-white/30 uppercase tracking-wider">בונוס אפשרי</p>
                <p className="text-lg font-light text-green-400 mt-0.5">₪{((activeGoal.target_amount || 0) * (activeGoal.bonus_percentage || 0) / 100).toLocaleString()}</p>
                <p className="text-[9px] text-white/25">{activeGoal.bonus_percentage}%</p>
              </div>
            </div>

            <div className="w-full h-px bg-white/10 mb-1">
              <div className="h-px bg-white/60 transition-all duration-700" style={{ width: `${Math.min(((activeGoal.current_period_revenue || 0) / (activeGoal.target_amount || 1)) * 100, 100)}%` }} />
            </div>
            <p className="text-[10px] text-white/30 tabular-nums">
              {Math.min(((activeGoal.current_period_revenue || 0) / (activeGoal.target_amount || 1)) * 100, 100).toFixed(1)}% הושג
            </p>
          </div>
        </div>
      )}

      {!activeGoal && (
        <div className="border border-gray-100 bg-gray-50 p-8 flex items-center justify-center mb-6">
          <p className="text-xs text-gray-400 tracking-wider">אין יעד פעיל כרגע</p>
        </div>
      )}

      {/* Bonus History */}
      <div className="bg-white border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <div className="w-px h-3.5 bg-gray-900" />
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-medium">היסטוריית בונוסים</p>
        </div>
        {bonuses.length === 0 ? (
          <EmptyState icon={Award} title="אין בונוסים" description="בונוסים יופיעו כאן כשתשיג יעדים" />
        ) : (
          <div>
            {bonuses.map(bonus => (
              <div key={bonus.id} className="px-5 py-4 flex items-center justify-between hover:bg-[#fafafa] transition-colors border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-4">
                  <div className={`w-7 h-7 flex items-center justify-center ${bonus.status === "credited" ? "bg-green-50" : "bg-amber-50"}`}>
                    <Award className={`w-3.5 h-3.5 ${bonus.status === "credited" ? "text-green-600" : "text-amber-500"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-light text-gray-900">₪{bonus.amount?.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{bonus.description || "בונוס השגת יעד"}</p>
                    {bonus.period_start && (
                      <p className="text-[9px] text-gray-300 mt-0.5">
                        {new Date(bonus.period_start).toLocaleDateString("he-IL")} — {new Date(bonus.period_end).toLocaleDateString("he-IL")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-left flex flex-col items-end gap-1">
                  <span className={`text-[10px] px-2.5 py-0.5 font-medium tracking-wider uppercase ${
                    bonus.status === "credited" ? "bg-green-50 text-green-700" :
                    bonus.status === "pending"  ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-500"
                  }`}>
                    {bonus.status === "credited" ? "זוכה" : bonus.status === "pending" ? "ממתין" : "בוטל"}
                  </span>
                  {bonus.credited_date && (
                    <p className="text-[9px] text-gray-300">{new Date(bonus.credited_date).toLocaleDateString("he-IL")}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}