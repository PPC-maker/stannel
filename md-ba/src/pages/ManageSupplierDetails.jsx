import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, FileText, Upload, Star, Plus, Check, X } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import { format } from "date-fns";

export default function ManageSupplierDetails() {
  const [profile, setProfile] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCertDialog, setShowCertDialog] = useState(false);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [certForm, setCertForm] = useState({
    certificate_type: "business_license",
    certificate_name: "",
    certificate_url: "",
    issue_date: "",
    expiry_date: ""
  });
  const [contractForm, setContractForm] = useState({
    contract_type: "standard",
    start_date: "",
    end_date: "",
    payment_terms: "",
    commission_rate: "",
    minimum_order_value: "",
    contract_file_url: "",
    notes: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = await base44.auth.me();
    const profiles = await base44.entities.SupplierProfile.filter({ user_email: user.email });
    if (profiles.length > 0) {
      setProfile(profiles[0]);
      const certs = await base44.entities.SupplierCertificate.filter({ supplier_id: profiles[0].id }, "-created_date");
      setCertificates(certs);
      const conts = await base44.entities.SupplierContract.filter({ supplier_id: profiles[0].id }, "-created_date");
      setContracts(conts);
      const revs = await base44.entities.SupplierReview.filter({ supplier_id: profiles[0].id }, "-created_date");
      setReviews(revs);
    }
    setLoading(false);
  };

  const handleCertUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setCertForm(prev => ({ ...prev, certificate_url: file_url }));
  };

  const handleContractUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setContractForm(prev => ({ ...prev, contract_file_url: file_url }));
  };

  const handleCreateCert = async () => {
    await base44.entities.SupplierCertificate.create({
      supplier_id: profile.id,
      ...certForm
    });
    setShowCertDialog(false);
    setCertForm({ certificate_type: "business_license", certificate_name: "", certificate_url: "", issue_date: "", expiry_date: "" });
    loadData();
  };

  const handleCreateContract = async () => {
    const contractNumber = `CNT-${Date.now().toString(36).toUpperCase()}`;
    await base44.entities.SupplierContract.create({
      supplier_id: profile.id,
      contract_number: contractNumber,
      commission_rate: parseFloat(contractForm.commission_rate),
      minimum_order_value: parseFloat(contractForm.minimum_order_value),
      ...contractForm,
      status: "active"
    });
    setShowContractDialog(false);
    setContractForm({ contract_type: "standard", start_date: "", end_date: "", payment_terms: "", commission_rate: "", minimum_order_value: "", contract_file_url: "", notes: "" });
    loadData();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  if (!profile) return <div className="text-center py-20 text-gray-500">לא נמצא פרופיל ספק</div>;

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  return (
    <div>
      <PageHeader title="פרטי הספק שלי" subtitle="ניהול תעודות, חוזים ודירוגים" />

      {/* Rating Summary */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center gap-1 mb-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold">{avgRating}</span>
              </div>
              <p className="text-xs text-gray-500">{reviews.length} ביקורות</p>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">ציון אמון</p>
                <p className="text-lg font-bold">{profile.trust_score}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">זמן תגובה</p>
                <p className="text-lg font-bold">{profile.response_time_hours}ש׳</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">איכות</p>
                <p className="text-lg font-bold">{profile.quality_score}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="certificates" dir="rtl">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="certificates">תעודות והסמכות</TabsTrigger>
          <TabsTrigger value="contracts">חוזים</TabsTrigger>
          <TabsTrigger value="reviews">ביקורות</TabsTrigger>
        </TabsList>

        {/* Certificates */}
        <TabsContent value="certificates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">תעודות והסמכות</CardTitle>
              <Button onClick={() => setShowCertDialog(true)} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                הוסף תעודה
              </Button>
            </CardHeader>
            <CardContent>
              {certificates.length === 0 ? (
                <EmptyState icon={Award} title="אין תעודות" description="הוסף תעודות והסמכות" />
              ) : (
                <div className="space-y-3">
                  {certificates.map(cert => (
                    <div key={cert.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{cert.certificate_name}</p>
                          <p className="text-xs text-gray-500">
                            {cert.issue_date ? format(new Date(cert.issue_date), "dd/MM/yyyy") : ""} - 
                            {cert.expiry_date ? format(new Date(cert.expiry_date), "dd/MM/yyyy") : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {cert.status === "active" && <Check className="w-4 h-4 text-green-600" />}
                        {cert.status === "expired" && <X className="w-4 h-4 text-red-600" />}
                        {cert.certificate_url && (
                          <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">צפה</Button>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts */}
        <TabsContent value="contracts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">חוזים</CardTitle>
              <Button onClick={() => setShowContractDialog(true)} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                חוזה חדש
              </Button>
            </CardHeader>
            <CardContent>
              {contracts.length === 0 ? (
                <EmptyState icon={FileText} title="אין חוזים" description="צור חוזה ראשון" />
              ) : (
                <div className="space-y-3">
                  {contracts.map(contract => (
                    <div key={contract.id} className="p-4 border border-gray-100 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">{contract.contract_number}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          contract.status === "active" ? "bg-green-50 text-green-700" :
                          contract.status === "expired" ? "bg-gray-50 text-gray-700" : "bg-blue-50 text-blue-700"
                        }`}>
                          {contract.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <div>סוג: {contract.contract_type}</div>
                        <div>עמלה: {contract.commission_rate}%</div>
                        <div>מתאריך: {contract.start_date ? format(new Date(contract.start_date), "dd/MM/yyyy") : ""}</div>
                        <div>עד: {contract.end_date ? format(new Date(contract.end_date), "dd/MM/yyyy") : ""}</div>
                      </div>
                      {contract.contract_file_url && (
                        <a href={contract.contract_file_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
                          <Button size="sm" variant="outline">צפה בחוזה</Button>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews */}
        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ביקורות מאדריכלים</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <EmptyState icon={Star} title="אין ביקורות עדיין" />
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className="p-4 border border-gray-100 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">{format(new Date(review.created_date), "dd/MM/yyyy")}</span>
                      </div>
                      {review.comment && <p className="text-sm text-gray-700">{review.comment}</p>}
                      <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                        <div>
                          <span className="text-gray-500">איכות:</span> {review.quality_rating}/5
                        </div>
                        <div>
                          <span className="text-gray-500">משלוח:</span> {review.delivery_rating}/5
                        </div>
                        <div>
                          <span className="text-gray-500">שירות:</span> {review.service_rating}/5
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Certificate Dialog */}
      <Dialog open={showCertDialog} onOpenChange={setShowCertDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>תעודה חדשה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-600">סוג תעודה</Label>
              <Select value={certForm.certificate_type} onValueChange={v => setCertForm({ ...certForm, certificate_type: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business_license">רישיון עסק</SelectItem>
                  <SelectItem value="tax_clearance">אישור ניהול ספרים</SelectItem>
                  <SelectItem value="insurance">ביטוח</SelectItem>
                  <SelectItem value="quality_certification">תו תקן</SelectItem>
                  <SelectItem value="safety_certification">אישור בטיחות</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-600">שם התעודה</Label>
              <Input value={certForm.certificate_name} onChange={e => setCertForm({ ...certForm, certificate_name: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600">תאריך הנפקה</Label>
                <Input type="date" value={certForm.issue_date} onChange={e => setCertForm({ ...certForm, issue_date: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-gray-600">תאריך תפוגה</Label>
                <Input type="date" value={certForm.expiry_date} onChange={e => setCertForm({ ...certForm, expiry_date: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-600">העלאת קובץ</Label>
              <div className="mt-1">
                {certForm.certificate_url ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-700">קובץ הועלה</span>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gray-300">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">העלה קובץ</span>
                    <input type="file" className="hidden" onChange={handleCertUpload} accept=".pdf,.jpg,.jpeg,.png" />
                  </label>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCertDialog(false)}>ביטול</Button>
            <Button onClick={handleCreateCert} disabled={!certForm.certificate_name || !certForm.certificate_url}>שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contract Dialog */}
      <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>חוזה חדש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <Label className="text-xs text-gray-600">סוג חוזה</Label>
              <Select value={contractForm.contract_type} onValueChange={v => setContractForm({ ...contractForm, contract_type: v })}>
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
                <Input type="date" value={contractForm.start_date} onChange={e => setContractForm({ ...contractForm, start_date: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-gray-600">עד תאריך</Label>
                <Input type="date" value={contractForm.end_date} onChange={e => setContractForm({ ...contractForm, end_date: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600">עמלה (%)</Label>
                <Input type="number" value={contractForm.commission_rate} onChange={e => setContractForm({ ...contractForm, commission_rate: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-gray-600">הזמנה מינימלית (₪)</Label>
                <Input type="number" value={contractForm.minimum_order_value} onChange={e => setContractForm({ ...contractForm, minimum_order_value: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-600">תנאי תשלום</Label>
              <Textarea value={contractForm.payment_terms} onChange={e => setContractForm({ ...contractForm, payment_terms: e.target.value })} className="mt-1" rows={3} />
            </div>
            <div>
              <Label className="text-xs text-gray-600">הערות</Label>
              <Textarea value={contractForm.notes} onChange={e => setContractForm({ ...contractForm, notes: e.target.value })} className="mt-1" rows={2} />
            </div>
            <div>
              <Label className="text-xs text-gray-600">קובץ חוזה</Label>
              <div className="mt-1">
                {contractForm.contract_file_url ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-700">קובץ הועלה</span>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gray-300">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">העלה קובץ</span>
                    <input type="file" className="hidden" onChange={handleContractUpload} accept=".pdf" />
                  </label>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContractDialog(false)}>ביטול</Button>
            <Button onClick={handleCreateContract} disabled={!contractForm.start_date || !contractForm.commission_rate}>שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}