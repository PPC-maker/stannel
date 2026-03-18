import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, Building2, DollarSign } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import StatsCard from "../components/shared/StatsCard";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [selectedArchitect, setSelectedArchitect] = useState("all");
  const [invoices, setInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [architects, setArchitects] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const invs = await base44.entities.Invoice.list("-created_date", 500);
    const sups = await base44.entities.SupplierProfile.list();
    const archs = await base44.entities.ArchitectProfile.list();
    const pays = await base44.entities.SupplierPayment.list("-created_date", 500);
    
    setInvoices(invs);
    setSuppliers(sups);
    setArchitects(archs);
    setPayments(pays);
    setLoading(false);
  };

  const getMonthOptions = () => {
    const monthNames = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      months.push({
        value: format(date, "yyyy-MM"),
        label: `${monthNames[monthIndex]} ${year}`
      });
    }
    return months;
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    if (selectedMonth !== "all") {
      filtered = filtered.filter(inv => {
        const invDate = new Date(inv.created_date);
        const monthStart = startOfMonth(new Date(selectedMonth));
        const monthEnd = endOfMonth(new Date(selectedMonth));
        return invDate >= monthStart && invDate <= monthEnd;
      });
    }

    if (selectedSupplier !== "all") {
      filtered = filtered.filter(inv => inv.supplier_id === selectedSupplier);
    }

    if (selectedArchitect !== "all") {
      filtered = filtered.filter(inv => inv.architect_email === selectedArchitect);
    }

    return filtered;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  const filteredInvoices = filterInvoices();
  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalRewards = filteredInvoices.reduce((sum, inv) => sum + (inv.reward_amount || 0), 0);
  const paidInvoices = filteredInvoices.filter(inv => ["paid", "card_credited"].includes(inv.status));
  const pendingInvoices = filteredInvoices.filter(inv => inv.status === "pending_club_approval");

  const topSuppliers = suppliers
    .map(sup => {
      const supInvoices = filteredInvoices.filter(inv => inv.supplier_id === sup.id);
      const total = supInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      return { ...sup, total, count: supInvoices.length };
    })
    .filter(s => s.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const topArchitects = architects
    .map(arch => {
      const archInvoices = filteredInvoices.filter(inv => inv.architect_email === arch.user_email);
      const total = archInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      return { ...arch, total, count: archInvoices.length };
    })
    .filter(a => a.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="אנליטיקה ודוחות"
        subtitle="ניתוח מעמיק של עסקאות במערכת"
      />

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-2">חודש</p>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל החודשים</SelectItem>
                {getMonthOptions().map(month => (
                  <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">ספק</p>
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הספקים</SelectItem>
                {suppliers.map(sup => (
                  <SelectItem key={sup.id} value={sup.id}>{sup.company_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">אדריכל</p>
            <Select value={selectedArchitect} onValueChange={setSelectedArchitect}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל האדריכלים</SelectItem>
                {architects.map(arch => (
                  <SelectItem key={arch.id} value={arch.user_email}>{arch.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="סה״כ מחזור"
          value={`₪${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="חשבוניות"
          value={filteredInvoices.length}
          subtitle={`${paidInvoices.length} שולמו`}
          icon={BarChart3}
          color="blue"
        />
        <StatsCard
          title="סה״כ תגמולים"
          value={`₪${totalRewards.toLocaleString()}`}
          icon={TrendingUp}
          color="purple"
        />
        <StatsCard
          title="ממתינים לאישור"
          value={pendingInvoices.length}
          icon={Users}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Suppliers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              ספקים מובילים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSuppliers.map((sup, idx) => (
                <div key={sup.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{sup.company_name}</p>
                      <p className="text-xs text-gray-500">{sup.count} חשבוניות</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold">₪{sup.total.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Architects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5" />
              אדריכלים מובילים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topArchitects.map((arch, idx) => (
                <div key={arch.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{arch.full_name}</p>
                      <p className="text-xs text-gray-500">{arch.count} חשבוניות</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold">₪{arch.total.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}