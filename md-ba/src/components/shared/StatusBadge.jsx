import React from "react";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  draft: { label: "טיוטה", color: "bg-gray-100 text-gray-700" },
  pending_club_approval: { label: "ממתין לאישור", color: "bg-blue-50 text-blue-700" },
  clarification_required: { label: "דרוש הבהרה", color: "bg-amber-50 text-amber-700" },
  rejected: { label: "נדחה", color: "bg-red-50 text-red-700" },
  approved_pending_supplier_payment: { label: "מאושר - ממתין לתשלום ספק", color: "bg-purple-50 text-purple-700" },
  supplier_overdue: { label: "ספק באיחור", color: "bg-red-100 text-red-800" },
  paid: { label: "שולם", color: "bg-green-50 text-green-700" },
  card_credited: { label: "זוכה בכרטיס", color: "bg-emerald-50 text-emerald-800" },
  credit_failed: { label: "זיכוי נכשל", color: "bg-red-100 text-red-800" },
  // For other entities
  active: { label: "פעיל", color: "bg-green-50 text-green-700" },
  suspended: { label: "מושהה", color: "bg-red-50 text-red-700" },
  inactive: { label: "לא פעיל", color: "bg-gray-100 text-gray-600" },
  limited: { label: "מוגבל", color: "bg-amber-50 text-amber-700" },
  pending_review: { label: "ממתין לבדיקה", color: "bg-blue-50 text-blue-700" },
  approved: { label: "מאושר", color: "bg-green-50 text-green-700" },
  pending: { label: "ממתין", color: "bg-blue-50 text-blue-700" },
  completed: { label: "הושלם", color: "bg-green-50 text-green-700" },
  failed: { label: "נכשל", color: "bg-red-50 text-red-700" },
  credited: { label: "זוכה", color: "bg-emerald-50 text-emerald-800" },
  retry_pending: { label: "ממתין לניסיון חוזר", color: "bg-amber-50 text-amber-700" },
};

export default function StatusBadge({ status, className = "" }) {
  const config = STATUS_CONFIG[status] || { label: status, color: "bg-gray-100 text-gray-700" };
  return (
    <Badge className={`${config.color} border-0 font-medium text-xs ${className}`}>
      {config.label}
    </Badge>
  );
}