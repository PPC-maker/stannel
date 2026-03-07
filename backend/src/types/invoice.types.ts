// Invoice Types - STANNEL Platform

export enum InvoiceStatus {
  PENDING_ADMIN = 'PENDING_ADMIN',
  CLARIFICATION_NEEDED = 'CLARIFICATION_NEEDED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PENDING_SUPPLIER_PAY = 'PENDING_SUPPLIER_PAY',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export interface Invoice {
  id: string;
  imageUrl: string;
  amount: number;
  status: InvoiceStatus;
  architectId: string;
  supplierId: string;
  slaDeadline: Date;
  slaAlertSent: boolean;
  adminNote?: string;
  supplierRef?: string;
  createdAt: Date;
  approvedAt?: Date;
  paidAt?: Date;
  aiExtractedAmount?: number;
  aiConfidence?: number;
  aiStatus?: 'MATCH' | 'MISMATCH' | 'UNCLEAR';
}

export interface InvoiceStatusHistory {
  id: string;
  invoiceId: string;
  status: InvoiceStatus;
  note?: string;
  changedBy: string;
  createdAt: Date;
}

export interface InvoiceUploadRequest {
  amount: number;
  supplierId: string;
}

export interface InvoiceWithDetails extends Invoice {
  architect: {
    id: string;
    userId: string;
    user: {
      name: string;
      email: string;
    };
  };
  supplier: {
    id: string;
    companyName: string;
    user: {
      name: string;
      email: string;
    };
  };
  statusHistory: InvoiceStatusHistory[];
}

export interface InvoiceStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  paid: number;
  overdue: number;
  approvedThisMonth: number;
  totalAmountThisMonth: number;
}

export interface AIValidationResult {
  extractedAmount: number;
  supplierName: string;
  date: string;
  confidence: number;
  status: 'MATCH' | 'MISMATCH' | 'UNCLEAR';
  notes: string;
}
