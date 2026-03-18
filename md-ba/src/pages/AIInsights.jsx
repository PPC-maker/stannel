import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertTriangle, DollarSign, Calendar, BarChart3, Sparkles, RefreshCw } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";

export default function AIInsights() {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const u = await base44.auth.me();
    setUser(u);
  };

  const generateInsights = async () => {
    setLoading(true);
    try {
      let filteredInvoices = [];
      let filteredPayments = [];
      let filteredGoals = [];
      let filteredBonuses = [];
      let supplierContext = null;
      let architectContext = null;

      if (user.role === "admin") {
        filteredInvoices = await base44.entities.Invoice.list("-created_date", 100);
        const suppliers = await base44.entities.SupplierProfile.list();
        const architects = await base44.entities.ArchitectProfile.list();
        filteredPayments = await base44.entities.SupplierPayment.list("-created_date", 50);
        filteredGoals = await base44.entities.ArchitectGoal.list();
        filteredBonuses = await base44.entities.BonusTransaction.list("-created_date", 50);
        supplierContext = suppliers.slice(0, 20).map(s => ({ name: s.company_name, trust_score: s.trust_score, total_transactions: s.total_transactions, total_paid: s.total_paid, rating: s.rating }));
        architectContext = architects.slice(0, 20).map(a => ({ total_invoices: a.total_invoices, approved_invoices: a.total_approved_invoices, card_balance: a.card_balance }));
      } else {
        // Non-admin: fetch only OWN data
        const archProfiles = await base44.entities.ArchitectProfile.filter({ user_email: user.email });
        if (archProfiles.length > 0) {
          const arch = archProfiles[0];
          filteredInvoices = await base44.entities.Invoice.filter({ architect_email: user.email }, "-created_date", 100);
          filteredGoals = await base44.entities.ArchitectGoal.filter({ architect_email: user.email });
          filteredBonuses = await base44.entities.BonusTransaction.filter({ architect_email: user.email }, "-created_date", 50);
          architectContext = [{ total_invoices: arch.total_invoices, approved_invoices: arch.total_approved_invoices, card_balance: arch.card_balance, trust_level: arch.trust_level }];
        } else {
          const supProfiles = await base44.entities.SupplierProfile.filter({ user_email: user.email });
          if (supProfiles.length > 0) {
            const sup = supProfiles[0];
            filteredInvoices = await base44.entities.Invoice.filter({ supplier_id: sup.id }, "-created_date", 100);
            filteredPayments = await base44.entities.SupplierPayment.filter({ supplier_id: sup.id }, "-created_date", 50);
            supplierContext = [{ trust_score: sup.trust_score, total_transactions: sup.total_transactions, total_paid: sup.total_paid, rating: sup.rating }];
          }
        }
      }

      const prompt = `
אתה מנתח פיננסי מומחה למערכת ניהול תשלומים בין אדריכלים וספקים.
נתח את הנתונים הבאים וספק תובנות עסקיות ברורות:

**חשבוניות (${filteredInvoices.length}):**
${JSON.stringify(filteredInvoices.slice(0, 30).map(i => ({ amount: i.amount, status: i.status, date: i.created_date, supplier: i.supplier_name })))}

${supplierContext ? `**נתוני ספקים:**\n${JSON.stringify(supplierContext)}` : ""}
${architectContext ? `**נתוני אדריכל:**\n${JSON.stringify(architectContext)}` : ""}

**תשלומים (${filteredPayments.length}):**
${JSON.stringify(filteredPayments.slice(0, 20).map(p => ({ amount: p.amount, status: p.status, date: p.paid_date })))}

**יעדים פעילים:** ${filteredGoals.filter(g => g.is_active).length}
**בונוסים שולמו:** ${filteredBonuses.filter(b => b.status === "credited").length}

ספק תובנות במבנה הבא (בעברית):
1. **מגמות ראשיות** - זהה 3 מגמות עיקריות בנתונים
2. **חיזוי תשלומים** - חזה תזרים מזומנים לחודש הקרוב
3. **זיהוי חריגות** - ביצועים חריגים
4. **המלצות לשיפור** - 3 המלצות ספציפיות
5. **מטריקות מפתח** - ממוצעים וסטטיסטיקות חשובות
      `;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            trends: {
              type: "array",
              items: { type: "string" }
            },
            payment_forecast: {
              type: "object",
              properties: {
                expected_amount: { type: "number" },
                confidence: { type: "string" },
                description: { type: "string" }
              }
            },
            anomalies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  entity: { type: "string" },
                  issue: { type: "string" },
                  severity: { type: "string" }
                }
              }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            },
            key_metrics: {
              type: "object",
              properties: {
                avg_invoice_amount: { type: "number" },
                avg_payment_time_days: { type: "number" },
                approval_rate: { type: "number" },
                top_performing_supplier: { type: "string" },
                top_performing_architect: { type: "string" }
              }
            }
          }
        }
      });

      setInsights(result);
    } catch (error) {
      console.error("Failed to generate insights:", error);
    }
    setLoading(false);
  };

  return (
    <div>
      <PageHeader
        title="תובנות AI"
        subtitle="ניתוח חכם של נתוני החשבוניות והתשלומים"
        actions={
          <Button onClick={generateInsights} disabled={loading} className="gap-2 bg-gray-900 hover:bg-gray-800">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "מנתח..." : "צור תובנות"}
          </Button>
        }
      />

      {!insights && !loading && (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium mb-2">תובנות AI</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            לחץ על "צור תובנות" כדי לקבל ניתוח מעמיק של הנתונים שלך עם המלצות לשיפור
          </p>
          <Button onClick={generateInsights} className="gap-2 bg-gray-900 hover:bg-gray-800">
            <Sparkles className="w-4 h-4" />
            צור תובנות
          </Button>
        </Card>
      )}

      {loading && (
        <Card className="p-12 text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">מנתח נתונים ויוצר תובנות...</p>
        </Card>
      )}

      {insights && !loading && (
        <div className="space-y-6">
          {/* Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5" />
                מגמות ראשיות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.trends?.map((trend, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700 shrink-0">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-gray-700">{trend}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Forecast */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-5 h-5" />
                חיזוי תשלומים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  ₪{insights.payment_forecast?.expected_amount?.toLocaleString() || "0"}
                </p>
                <p className="text-xs text-gray-500 mb-3">סכום צפוי לחודש הקרוב</p>
                <p className="text-sm text-gray-700">{insights.payment_forecast?.description}</p>
                <p className="text-xs text-gray-500 mt-2">רמת ביטחון: {insights.payment_forecast?.confidence}</p>
              </div>
            </CardContent>
          </Card>

          {/* Anomalies */}
          {insights.anomalies && insights.anomalies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  חריגות שזוהו
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {insights.anomalies.map((anomaly, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{anomaly.entity}</p>
                        <p className="text-xs text-gray-600">{anomaly.issue}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                          {anomaly.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="w-5 h-5" />
                המלצות לשיפור תזרים מזומנים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.recommendations?.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-medium text-green-700 shrink-0">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-5 h-5" />
                מטריקות מפתח
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">ממוצע סכום חשבונית</p>
                  <p className="text-xl font-bold">₪{insights.key_metrics?.avg_invoice_amount?.toLocaleString() || "0"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">זמן תשלום ממוצע</p>
                  <p className="text-xl font-bold">{insights.key_metrics?.avg_payment_time_days?.toFixed(1) || "0"} ימים</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">אחוז אישורים</p>
                  <p className="text-xl font-bold">{insights.key_metrics?.approval_rate?.toFixed(1) || "0"}%</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">ספק מוביל</p>
                  <p className="text-sm font-medium">{insights.key_metrics?.top_performing_supplier || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}