// Analytics API Client

import { config, getHeaders, fetchWithAuth } from './config';

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

export interface ActivityRoleCounts {
  total: number;
  activeToday: number;
  active7d: number;
  active30d: number;
  neverSeen: number;
}

export interface ActivityDailyRow {
  day: string;
  role: string;
  users: number;
}

export interface ActivityUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string | null;
  lastLoginAt: string;
  lastSeenAt: string;
  loginCount: number;
  platform: string | null;
}

export interface ActivityPageRow {
  path: string;
  total: number;
  architects: number;
  suppliers: number;
  admins: number;
}

export interface ActivityReport {
  trackingReady: boolean;
  byRole: Record<string, ActivityRoleCounts>;
  daily: ActivityDailyRow[];
  recentUsers: ActivityUserRow[];
  topPages: ActivityPageRow[];
}

export const analyticsApi = {
  // Fire-and-forget page view report. Never throws, never blocks the UI.
  // Returns false when not sent (e.g. auth token not ready yet) so the caller may retry once.
  trackPageView(path: string, platform: 'web' | 'mobile'): boolean {
    try {
      if (!getHeaders()['Authorization' as keyof HeadersInit]) return false;
      fetch(`${config.baseUrl}/activity/pageview`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ path, platform }),
        keepalive: true,
      }).catch(() => {});
      return true;
    } catch {
      // ignore - tracking must never affect the app
      return false;
    }
  },

  async getActivity(days: number = 7): Promise<ActivityReport> {
    const response = await fetchWithAuth(`${config.baseUrl}/analytics/activity?days=${days}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'שגיאה בטעינת נתוני הפעילות. נסה לרענן את הדף.');
    }

    return response.json();
  },

  async getTrends(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<TrendsResponse> {
    const response = await fetchWithAuth(`${config.baseUrl}/analytics/trends?period=${period}`, {
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
    const response = await fetchWithAuth(`${config.baseUrl}/analytics/sla-report`, {
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
    const response = await fetchWithAuth(`${config.baseUrl}/analytics/top-architects`, {
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
    const response = await fetchWithAuth(`${config.baseUrl}/analytics/supplier-performance`, {
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
