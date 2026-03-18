import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { createPageUrl } from "../utils";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { id: 1, title: "פרטים בסיסיים" },
  { id: 2, title: "אימות עסקי" },
  { id: 3, title: "סיום" },
];

// Minimal architectural grid lines component
function GridLines() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Horizontal lines */}
      {[15, 30, 50, 70, 85].map(y => (
        <div key={y} className="absolute w-full border-t border-white/5" style={{ top: `${y}%` }} />
      ))}
      {/* Vertical lines */}
      {[10, 25, 50, 75, 90].map(x => (
        <div key={x} className="absolute h-full border-l border-white/5" style={{ left: `${x}%` }} />
      ))}
      {/* Golden ratio rectangle overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[61.8%] h-[61.8%] border border-white/5 rounded-sm" />
    </div>
  );
}

// Architectural blueprint accent
function BlueprintAccent({ className = "" }) {
  return (
    <svg className={`absolute opacity-10 ${className}`} width="200" height="200" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
      <circle cx="100" cy="100" r="50" stroke="white" strokeWidth="0.5" />
      <line x1="20" y1="100" x2="180" y2="100" stroke="white" strokeWidth="0.5" />
      <line x1="100" y1="20" x2="100" y2="180" stroke="white" strokeWidth="0.5" />
      <rect x="60" y="60" width="80" height="80" stroke="white" strokeWidth="0.5" strokeDasharray="3 3" />
      <circle cx="100" cy="100" r="5" stroke="white" strokeWidth="0.5" />
    </svg>
  );
}

export default function Onboarding() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    profession: "",
    company_name: "",
    category: "",
    business_id: "",
    terms_accepted: false,
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      if (u.role === "admin") {
        window.location.href = createPageUrl("AdminDashboard");
        return;
      }
      setForm(prev => ({ ...prev, full_name: u.full_name || "" }));
      const architects = await base44.entities.ArchitectProfile.filter({ user_email: u.email });
      if (architects.length > 0) {
        window.location.href = createPageUrl("ArchitectDashboard");
        return;
      }
      const suppliers = await base44.entities.SupplierProfile.filter({ user_email: u.email });
      if (suppliers.length > 0) {
        window.location.href = createPageUrl("SupplierDashboard");
        return;
      }
    } catch {
      base44.auth.redirectToLogin();
      return;
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    if (role === "architect") {
      await base44.entities.ArchitectProfile.create({
        user_email: user.email,
        full_name: form.full_name,
        phone: form.phone,
        profession: form.profession,
        business_id: form.business_id,
        onboarding_status: form.business_id ? "pending_review" : "limited",
        trust_level: "bronze",
        terms_accepted: form.terms_accepted,
        terms_accepted_date: new Date().toISOString(),
      });
    } else {
      await base44.entities.SupplierProfile.create({
        user_email: user.email,
        company_name: form.company_name,
        contact_name: form.full_name,
        phone: form.phone,
        category: form.category,
        business_id: form.business_id,
        onboarding_status: "pending_review",
        status: "active",
      });
    }
    await base44.entities.AuditLog.create({
      action: "user_onboarded",
      entity_type: role === "architect" ? "ArchitectProfile" : "SupplierProfile",
      performed_by: user.email,
      details: `New ${role} registered: ${form.full_name}`,
      timestamp: new Date().toISOString(),
    });
    setStep(3);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-white/40 text-xs tracking-widest uppercase">STANNEL</span>
        </div>
      </div>
    );
  }

  const isArchitectRole = role === "architect" || !role;

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* LEFT PANEL – decorative architectural side */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0f] flex-col justify-between p-12 overflow-hidden">
        <GridLines />
        <BlueprintAccent className="top-[-60px] right-[-60px] w-[300px] h-[300px]" />
        <BlueprintAccent className="bottom-[-80px] left-[-80px] w-[350px] h-[350px]" />

        {/* Top brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 border border-white/30 flex items-center justify-center">
              <div className="w-3 h-3 bg-white/80" />
            </div>
            <span className="text-white text-sm font-light tracking-[0.3em] uppercase">STANNEL</span>
          </div>
          <p className="text-white/30 text-xs tracking-widest uppercase mr-11">Design & Architecture Platform</p>
        </div>

        {/* Central design element */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1">
          {/* Large architectural blueprint circle */}
          <div className="relative w-72 h-72 mb-10">
            <div className="absolute inset-0 border border-white/10 rounded-full" />
            <div className="absolute inset-6 border border-white/8 rounded-full" />
            <div className="absolute inset-12 border border-white/15 rounded-full" />
            <div className="absolute inset-20 border border-white/20 rounded-full" />
            {/* Cross lines */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
            {/* Diagonal golden angle */}
            <div className="absolute top-1/2 left-1/2 w-24 h-px bg-gradient-to-r from-white/40 to-transparent origin-left rotate-[38deg]" />
            <div className="absolute top-1/2 left-1/2 w-20 h-px bg-gradient-to-r from-white/20 to-transparent origin-left -rotate-[52deg]" />
            {/* Center mark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/60" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-white/20 rotate-45" />
            {/* Measurement marks */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
              <div
                key={deg}
                className="absolute top-1/2 left-1/2 w-3 h-px bg-white/30 origin-left"
                style={{ transform: `translate(0, -50%) rotate(${deg}deg) translateX(120px)` }}
              />
            ))}
          </div>

          <div className="text-center">
            <h2 className="text-white text-2xl font-extralight tracking-widest uppercase mb-3">
              {role === "supplier" ? "Supplier Portal" : "Design Community"}
            </h2>
            <p className="text-white/40 text-xs tracking-wider max-w-xs text-center leading-relaxed">
              {role === "supplier"
                ? "פלטפורמה לניהול תשלומים ומערכות יחסים עם אדריכלים ומעצבים"
                : "מערכת תגמול מתקדמת לאדריכלים ומעצבי פנים המשתפים פעולה עם ספקים מובחרים"}
            </p>
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10 border-r border-white/10 pr-4">
          <p className="text-white/30 text-xs italic leading-relaxed">
            "Architecture is the art of how to waste space with dignity."
          </p>
          <p className="text-white/20 text-[10px] mt-1 tracking-widest uppercase">— Philip Johnson</p>
        </div>
      </div>

      {/* RIGHT PANEL – form */}
      <div className="flex-1 bg-[#fafafa] flex flex-col justify-center items-center p-6 lg:p-12">
        {/* Mobile brand */}
        <div className="lg:hidden mb-8 text-center">
          <h1 className="text-xl font-light tracking-[0.3em] uppercase">STANNEL</h1>
        </div>

        <div className="w-full max-w-md">
          {/* Step indicator */}
          {step < 3 && (
            <div className="flex items-center gap-2 mb-8">
              {STEPS.slice(0, 2).map((s, i) => (
                <React.Fragment key={s.id}>
                  <div className="flex items-center gap-2">
                    <div className={`
                      w-6 h-6 flex items-center justify-center text-[11px] font-medium transition-all
                      ${step >= s.id ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-400"}
                    `}>
                      {step > s.id ? "✓" : s.id}
                    </div>
                    <span className={`text-xs ${step >= s.id ? "text-gray-900" : "text-gray-400"}`}>{s.title}</span>
                  </div>
                  {i < 1 && <div className={`flex-1 h-px ${step > s.id ? "bg-gray-900" : "bg-gray-200"}`} />}
                </React.Fragment>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ─── STEP 1 ─── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                {!role ? (
                  <>
                    <div className="mb-8">
                      <h2 className="text-2xl font-light tracking-tight text-gray-900">ברוכים הבאים</h2>
                      <p className="text-sm text-gray-500 mt-1">בחר את סוג החשבון שלך</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Architect card */}
                      <button
                        onClick={() => setRole("architect")}
                        className="group relative p-6 bg-white border border-gray-200 hover:border-gray-900 transition-all duration-300 text-right overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-right" />
                        {/* Mini blueprint in corner */}
                        <div className="absolute bottom-3 left-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
                            <line x1="5" y1="20" x2="35" y2="20" stroke="currentColor" strokeWidth="0.5" />
                            <line x1="20" y1="5" x2="20" y2="35" stroke="currentColor" strokeWidth="0.5" />
                            <rect x="12" y="12" width="16" height="16" stroke="currentColor" strokeWidth="0.5" />
                          </svg>
                        </div>
                        <div className="w-10 h-10 border border-gray-200 group-hover:border-gray-900 flex items-center justify-center mb-4 transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <polygon points="3 22 21 22 12 2" />
                            <line x1="12" y1="2" x2="12" y2="22" />
                            <line x1="3" y1="14" x2="21" y2="14" />
                          </svg>
                        </div>
                        <p className="font-medium text-sm text-gray-900">אדריכל / מעצב</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">קבלת תגמול מספקים מובחרים</p>
                      </button>

                      {/* Supplier card */}
                      <button
                        onClick={() => setRole("supplier")}
                        className="group relative p-6 bg-white border border-gray-200 hover:border-gray-900 transition-all duration-300 text-right overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-slate-500 to-gray-700 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-right" />
                        <div className="absolute bottom-3 left-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <rect x="5" y="15" width="30" height="20" stroke="currentColor" strokeWidth="0.5" />
                            <rect x="12" y="5" width="16" height="10" stroke="currentColor" strokeWidth="0.5" />
                            <line x1="5" y1="25" x2="35" y2="25" stroke="currentColor" strokeWidth="0.5" />
                          </svg>
                        </div>
                        <div className="w-10 h-10 border border-gray-200 group-hover:border-gray-900 flex items-center justify-center mb-4 transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="2" y="7" width="20" height="14" rx="0" />
                            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                            <line x1="12" y1="12" x2="12" y2="16" />
                            <line x1="10" y1="14" x2="14" y2="14" />
                          </svg>
                        </div>
                        <p className="font-medium text-sm text-gray-900">ספק</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">תשלום תגמולים לאדריכלים</p>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-5">
                    <div className="mb-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-light tracking-tight text-gray-900">פרטים אישיים</h2>
                        <button
                          onClick={() => setRole(null)}
                          className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2"
                        >
                          שנה סוג חשבון
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-1.5 h-1.5 bg-indigo-500" />
                        <p className="text-xs text-gray-500">
                          {role === "architect" ? "אדריכל / מעצב פנים" : "ספק"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500 tracking-wide uppercase">שם מלא</Label>
                      <Input
                        value={form.full_name}
                        onChange={e => setForm({ ...form, full_name: e.target.value })}
                        className="mt-1.5 rounded-none border-gray-200 focus:border-gray-900 focus:ring-0 bg-white"
                        placeholder="השם המלא שלך"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500 tracking-wide uppercase">טלפון</Label>
                      <Input
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        className="mt-1.5 rounded-none border-gray-200 focus:border-gray-900 focus:ring-0 bg-white"
                        type="tel"
                        placeholder="050-0000000"
                      />
                    </div>

                    {role === "architect" && (
                      <div>
                        <Label className="text-xs text-gray-500 tracking-wide uppercase">מקצוע</Label>
                        <Select value={form.profession} onValueChange={v => setForm({ ...form, profession: v })}>
                          <SelectTrigger className="mt-1.5 rounded-none border-gray-200 bg-white">
                            <SelectValue placeholder="בחר מקצוע" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="architect">אדריכל</SelectItem>
                            <SelectItem value="interior_designer">מעצב פנים</SelectItem>
                            <SelectItem value="landscape_architect">אדריכל נוף</SelectItem>
                            <SelectItem value="urban_planner">מתכנן ערים</SelectItem>
                            <SelectItem value="other">אחר</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {role === "supplier" && (
                      <>
                        <div>
                          <Label className="text-xs text-gray-500 tracking-wide uppercase">שם חברה</Label>
                          <Input
                            value={form.company_name}
                            onChange={e => setForm({ ...form, company_name: e.target.value })}
                            className="mt-1.5 rounded-none border-gray-200 focus:border-gray-900 focus:ring-0 bg-white"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500 tracking-wide uppercase">קטגוריה</Label>
                          <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                            <SelectTrigger className="mt-1.5 rounded-none border-gray-200 bg-white">
                              <SelectValue placeholder="בחר קטגוריה" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="furniture">ריהוט</SelectItem>
                              <SelectItem value="lighting">תאורה</SelectItem>
                              <SelectItem value="flooring">ריצוף</SelectItem>
                              <SelectItem value="plumbing">אינסטלציה</SelectItem>
                              <SelectItem value="electrical">חשמל</SelectItem>
                              <SelectItem value="electrical_appliances">מוצרי חשמל</SelectItem>
                              <SelectItem value="paint">צבע</SelectItem>
                              <SelectItem value="kitchen">מטבחים</SelectItem>
                              <SelectItem value="bathroom">חדרי רחצה</SelectItem>
                              <SelectItem value="outdoor">חוץ</SelectItem>
                              <SelectItem value="other">אחר</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    <div className="flex items-start gap-3 pt-2 pb-1">
                      <Checkbox
                        checked={form.terms_accepted}
                        onCheckedChange={v => setForm({ ...form, terms_accepted: v })}
                        className="mt-0.5 rounded-none"
                      />
                      <Label className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                        אני מאשר/ת את תנאי השימוש ומדיניות הפרטיות של STANNEL
                      </Label>
                    </div>

                    <Button
                      onClick={() => setStep(2)}
                      disabled={!form.full_name || !form.terms_accepted || (role === "supplier" && !form.company_name)}
                      className="w-full rounded-none bg-gray-900 hover:bg-black h-11 tracking-wide text-xs uppercase"
                    >
                      המשך לשלב הבא
                      <ArrowLeft className="w-3.5 h-3.5 mr-2" />
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── STEP 2 ─── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-light tracking-tight text-gray-900">אימות עסקי</h2>
                  <p className="text-sm text-gray-500 mt-1">שלב זה אופציונלי אך נדרש לגישה מלאה</p>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 tracking-wide uppercase">ח.פ / עוסק מורשה</Label>
                  <Input
                    value={form.business_id}
                    onChange={e => setForm({ ...form, business_id: e.target.value })}
                    className="mt-1.5 rounded-none border-gray-200 focus:border-gray-900 focus:ring-0 bg-white"
                    placeholder="מספר ח.פ / ע.מ"
                  />
                </div>

                <div className="border-r-2 border-indigo-400 pr-4 bg-indigo-50/50 py-3 pl-3">
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    {role === "architect"
                      ? "ללא אימות עסקי תקבל גישה מוגבלת למערכת. ניתן להשלים זאת בכל עת מאחר."
                      : "החשבון שלך ימתין לאישור אדמין לפני שתוכל להשתמש במערכת."}
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-none h-11 text-xs tracking-wide uppercase"
                  >
                    <ArrowRight className="w-3.5 h-3.5 ml-2" />
                    חזרה
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 rounded-none bg-gray-900 hover:bg-black h-11 text-xs tracking-wide uppercase"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
                        שומר...
                      </span>
                    ) : "סיום הרשמה"}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ─── STEP 3 – DONE ─── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center py-8"
              >
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 border border-gray-200 rotate-45" />
                  <div className="absolute inset-3 border border-gray-300 rotate-45" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-gray-900" />
                  </div>
                </div>
                <h2 className="text-2xl font-light tracking-tight text-gray-900 mb-3">ההרשמה הושלמה</h2>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto mb-8">
                  {role === "architect" && form.business_id
                    ? "הפרטים שלך נשלחו לבדיקה. תקבל הודעה כשהחשבון יאושר."
                    : role === "architect"
                    ? "החשבון שלך פעיל עם גישה מוגבלת. השלם את האימות העסקי לגישה מלאה."
                    : "ההרשמה הושלמה! החשבון ממתין לאישור אדמין."}
                </p>
                <Button
                  onClick={() => window.location.href = "/"}
                  className="rounded-none bg-gray-900 hover:bg-black px-10 h-11 text-xs tracking-widest uppercase"
                >
                  כניסה למערכת
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}