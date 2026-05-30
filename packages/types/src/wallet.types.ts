// Wallet Types - STANNEL Platform

export interface WalletBalance {
  points: number;
  cash: number;
  totalEarned: number;
  totalRedeemed: number;
}

export interface CardTransaction {
  id: string;
  architectId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  invoiceId?: string;
  createdAt: Date;
}

export interface DigitalCard {
  cardNumber: string;
  holderName: string;
  rank: string;
  pointsBalance: number;
  expiryDate?: Date;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  pointCost: number;
  cashCost: number;
  stock: number;
  isActive: boolean;
  supplierId?: string;
  createdAt: Date;
}

export type RedemptionStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export interface Redemption {
  id: string;
  productId: string;
  architectId: string;
  pointsUsed: number;
  cashPaid: number;
  status: RedemptionStatus;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  product?: Product;
  architect?: {
    id: string;
    user: { name: string; email: string; phone?: string };
  };
}

export interface RedeemRequest {
  productId: string;
  cashAmount?: number;
}
