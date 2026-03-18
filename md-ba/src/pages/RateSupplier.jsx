import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ArrowLeft } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function RateSupplier() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const invoiceId = searchParams.get("invoice");
  const [invoice, setInvoice] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ratings, setRatings] = useState({
    overall: 0,
    quality: 0,
    delivery: 0,
    service: 0
  });
  const [comment, setComment] = useState("");

  useEffect(() => {
    loadData();
  }, [invoiceId]);

  const loadData = async () => {
    if (!invoiceId) return;
    const inv = await base44.entities.Invoice.list();
    const foundInv = inv.find(i => i.id === invoiceId);
    setInvoice(foundInv);
    
    if (foundInv) {
      const sup = await base44.entities.SupplierProfile.list();
      const foundSup = sup.find(s => s.id === foundInv.supplier_id);
      setSupplier(foundSup);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (ratings.overall === 0 || ratings.quality === 0 || ratings.delivery === 0 || ratings.service === 0) {
      alert("נא לדרג את כל ההיבטים");
      return;
    }

    setSubmitting(true);
    const user = await base44.auth.me();

    // Create review
    await base44.entities.SupplierReview.create({
      supplier_id: supplier.id,
      architect_email: user.email,
      invoice_id: invoiceId,
      rating: ratings.overall,
      quality_rating: ratings.quality,
      delivery_rating: ratings.delivery,
      service_rating: ratings.service,
      comment: comment,
      is_verified_purchase: true
    });

    // Update supplier ratings
    const reviews = await base44.entities.SupplierReview.filter({ supplier_id: supplier.id });
    const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) + ratings.overall) / (reviews.length + 1);
    const avgQuality = (reviews.reduce((sum, r) => sum + r.quality_rating, 0) + ratings.quality) / (reviews.length + 1);
    const qualityScore = (avgQuality / 5) * 100;

    await base44.entities.SupplierProfile.update(supplier.id, {
      rating: parseFloat(avgRating.toFixed(1)),
      review_count: reviews.length + 1,
      quality_score: parseFloat(qualityScore.toFixed(0))
    });

    // Notify supplier
    await base44.entities.Notification.create({
      recipient_email: supplier.user_email,
      title: "קיבלת ביקורת חדשה",
      message: `${user.full_name} דירג אותך ${ratings.overall}/5 כוכבים`,
      type: "info",
      related_entity: "SupplierReview"
    });

    setSubmitting(false);
    navigate(createPageUrl("ArchitectInvoices"));
  };

  const StarRating = ({ value, onChange, label }) => (
    <div>
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  if (loading || !invoice || !supplier) {
    return <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="דרג את הספק"
        subtitle={supplier.company_name}
      />

      <Card className="p-6">
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">חשבונית</p>
            <p className="text-sm font-medium">{invoice.invoice_number}</p>
            <p className="text-xs text-gray-500 mt-1">₪{invoice.amount?.toLocaleString()}</p>
          </div>

          <StarRating
            label="דירוג כללי"
            value={ratings.overall}
            onChange={v => setRatings({ ...ratings, overall: v })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <StarRating
              label="איכות מוצר"
              value={ratings.quality}
              onChange={v => setRatings({ ...ratings, quality: v })}
            />
            <StarRating
              label="מהירות אספקה"
              value={ratings.delivery}
              onChange={v => setRatings({ ...ratings, delivery: v })}
            />
            <StarRating
              label="שירות לקוחות"
              value={ratings.service}
              onChange={v => setRatings({ ...ratings, service: v })}
            />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">הערות (אופציונלי)</p>
            <Textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              placeholder="שתף את החוויה שלך..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("ArchitectInvoices"))}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              ביטול
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-gray-900 hover:bg-gray-800"
            >
              {submitting ? "שולח..." : "שלח דירוג"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}