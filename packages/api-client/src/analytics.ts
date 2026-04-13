// Analytics API Client

import { config, getHeaders } from './config';

export interface TrendsSummary {
  totalInvoices: number;
  totalAmount: number;
  approvedCount: number;
}

export interface TopSupplier {
  id: string;
  companyName: string;
  _count: { invoices: number };
  user: { name: string };
  trustScore: number;
}

export interface TopArchitect {
  id: string;
  totalEarned: number;
  _count: { invoices: number };
  user: { name: string };
}

export interface TrendsResponse {
  period: string;
  summary: TrendsSummary;
  topSuppliers: TopSupplier[];
  topArchitects: TopArchitect[];
  aiInsights: string | null;
}

export interface SlaReport {
  period: string;
  total: number;
  compliant: number;
  breached: number;
  complianceRate: number;
  bySupplier: Record<string, { compliant: number; breached: number }>;
}

export interface ArchitectRanking {
  rank: number;
  name: string;
  email: string;
  tier: string;
  totalEarned: number;
  invoiceCount: number;
  pointsBalance: number;
}

export interface SupplierPerformance {
  id: string;
  companyName: string;
  trustScore: number;
  qualityScore: number;
  invoiceCount: number;
  hasActiveContract: boolean;
  contractType?: string;
}

export const analyticsApi = {
  async getTrends(period: 'week' | 'month' | 'quarter' = 'month'): Promise<TrendsResponse> {
    const response = await fetch(`${config.baseUrl}/analytics/trends?period=${period}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בטעינת הנתונים. נסה לרענן את הדף.');
    }

    return response.json();
  },

  async getSlaReport(): Promise<SlaReport> {
    const response = await fetch(`${config.baseUrl}/analytics/sla-report`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בטעינת דוח SLA. נסה לרענן את הדף.');
    }

    return response.json();
  },

  async getTopArchitects(): Promise<ArchitectRanking[]> {
    const response = await fetch(`${config.baseUrl}/analytics/top-architects`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בטעינת הנתונים. נסה לרענן את הדף.');
    }

    return response.json();
  },

  async getSupplierPerformance(): Promise<SupplierPerformance[]> {
    const response = await fetch(`${config.baseUrl}/analytics/supplier-performance`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בטעינת הנתונים. נסה לרענן את הדף.');
    }

    return response.json();
  },
};
