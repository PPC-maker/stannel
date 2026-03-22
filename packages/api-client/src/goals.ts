// Goals API Client (Architect Goals)

import { config, getHeaders } from './config';

export interface ArchitectGoal {
  id: string;
  architectId: string;
  targetAmount: number;
  currentPeriodRevenue: number;
  bonusPercentage: number;
  periodType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: string;
  endDate: string;
  isActive: boolean;
  targetMet: boolean;
  targetMetAt?: string;
  createdAt: string;
  bonusTransactions?: BonusTransaction[];
}

export interface BonusTransaction {
  id: string;
  architectId: string;
  goalId: string;
  bonusType: string;
  amount: number;
  status: 'PENDING' | 'CREDITED' | 'FAILED';
  creditedAt?: string;
  createdAt: string;
}

export interface GoalStats {
  totalGoals: number;
  achievedGoals: number;
  totalBonusEarned: number;
  achievementRate: number;
}

export const goalsApi = {
  async getAll(): Promise<{ data: ArchitectGoal[] }> {
    const response = await fetch(`${config.baseUrl}/goals`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get goals');
    }

    return response.json();
  },

  async getActive(): Promise<ArchitectGoal | null> {
    const response = await fetch(`${config.baseUrl}/goals/active`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get active goal');
    }

    return response.json();
  },

  async getBonuses(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<{
    data: BonusTransaction[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));

    const response = await fetch(`${config.baseUrl}/goals/bonuses?${searchParams}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get bonuses');
    }

    return response.json();
  },

  async getStats(): Promise<GoalStats> {
    const response = await fetch(`${config.baseUrl}/goals/stats`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get stats');
    }

    return response.json();
  },

  // Admin methods
  admin: {
    async createGoal(data: {
      architectId: string;
      targetAmount: number;
      bonusPercentage: number;
      periodType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
      startDate: string;
      endDate: string;
    }): Promise<ArchitectGoal> {
      const response = await fetch(`${config.baseUrl}/goals/admin/create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create goal');
      }

      return response.json();
    },

    async getAll(params?: {
      page?: number;
      pageSize?: number;
      activeOnly?: boolean;
    }): Promise<{
      data: ArchitectGoal[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }> {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
      if (params?.activeOnly) searchParams.set('activeOnly', 'true');

      const response = await fetch(`${config.baseUrl}/goals/admin/all?${searchParams}`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get all goals');
      }

      return response.json();
    },

    async updateProgress(id: string, addAmount: number): Promise<ArchitectGoal> {
      const response = await fetch(`${config.baseUrl}/goals/admin/${id}/progress`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ addAmount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update progress');
      }

      return response.json();
    },
  },
};
