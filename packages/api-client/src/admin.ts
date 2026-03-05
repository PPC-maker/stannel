// Admin API Client

import { config, getHeaders } from './config';
import type { SystemLog, SystemLogStats, SystemLogSeverity, SystemLogCategory, PaginatedResponse } from '@stannel/types';

export interface HealthReport {
  id: string;
  summary: string;
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalInvoices: number;
    pendingInvoices: number;
    overdueInvoices: number;
    totalPoints: number;
    totalRedemptions: number;
    activeEvents: number;
    productsInStock: number;
  };
  issues: string[];
  recommendations: string[];
  generatedAt: string;
  sentTo: string[];
  status: 'success' | 'partial' | 'failed';
}

export interface ScheduledTask {
  name: string;
  enabled: boolean;
  lastRun: string | null;
  nextRun: string;
}

export const adminApi = {
  // Health Reports
  async getHealthReport(): Promise<HealthReport> {
    const res = await fetch(`${config.baseUrl}/admin/health-report`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to get health report' }));
      throw new Error(error.message || 'Failed to get health report');
    }

    return res.json();
  },

  async getHealthReports(): Promise<{ data: HealthReport[] }> {
    const res = await fetch(`${config.baseUrl}/admin/health-reports`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to get health reports' }));
      throw new Error(error.message || 'Failed to get health reports');
    }

    return res.json();
  },

  async sendHealthReport(): Promise<HealthReport> {
    const res = await fetch(`${config.baseUrl}/admin/health-report/send`, {
      method: 'POST',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to send health report' }));
      throw new Error(error.message || 'Failed to send health report');
    }

    return res.json();
  },

  // Scheduled Tasks
  async getScheduledTasks(): Promise<{ data: ScheduledTask[] }> {
    const res = await fetch(`${config.baseUrl}/admin/scheduled-tasks`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to get scheduled tasks' }));
      throw new Error(error.message || 'Failed to get scheduled tasks');
    }

    return res.json();
  },

  async runScheduledTask(name: string): Promise<{ success: boolean; task: string }> {
    const res = await fetch(`${config.baseUrl}/admin/scheduled-tasks/${name}/run`, {
      method: 'POST',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to run task' }));
      throw new Error(error.message || 'Failed to run task');
    }

    return res.json();
  },

  async toggleScheduledTask(name: string, enabled: boolean): Promise<{ success: boolean; task: string; enabled: boolean }> {
    const res = await fetch(`${config.baseUrl}/admin/scheduled-tasks/${name}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ enabled }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to update task' }));
      throw new Error(error.message || 'Failed to update task');
    }

    return res.json();
  },

  // Users Management
  async getUsers(params?: { page?: number; pageSize?: number; role?: string; isActive?: boolean }): Promise<{
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.role) searchParams.set('role', params.role);
    if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());

    const res = await fetch(`${config.baseUrl}/admin/users?${searchParams}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to get users' }));
      throw new Error(error.message || 'Failed to get users');
    }

    return res.json();
  },

  async activateUser(userId: string): Promise<any> {
    const res = await fetch(`${config.baseUrl}/admin/users/${userId}/activate`, {
      method: 'PATCH',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to activate user' }));
      throw new Error(error.message || 'Failed to activate user');
    }

    return res.json();
  },

  async deactivateUser(userId: string): Promise<any> {
    const res = await fetch(`${config.baseUrl}/admin/users/${userId}/deactivate`, {
      method: 'PATCH',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to deactivate user' }));
      throw new Error(error.message || 'Failed to deactivate user');
    }

    return res.json();
  },

  // Invoices (Admin View)
  async getInvoices(params?: { page?: number; pageSize?: number; status?: string }): Promise<{
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.status) searchParams.set('status', params.status);

    const res = await fetch(`${config.baseUrl}/admin/invoices?${searchParams}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to get invoices' }));
      throw new Error(error.message || 'Failed to get invoices');
    }

    return res.json();
  },

  async verifyInvoice(invoiceId: string, data: { status: 'APPROVED' | 'REJECTED' | 'CLARIFICATION_NEEDED'; note?: string }): Promise<any> {
    const res = await fetch(`${config.baseUrl}/admin/invoices/${invoiceId}/verify`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to verify invoice' }));
      throw new Error(error.message || 'Failed to verify invoice');
    }

    return res.json();
  },

  // Audit Logs
  async getAuditLogs(params?: { page?: number; pageSize?: number }): Promise<{
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const res = await fetch(`${config.baseUrl}/admin/audit-logs?${searchParams}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to get audit logs' }));
      throw new Error(error.message || 'Failed to get audit logs');
    }

    return res.json();
  },

  // System Logs
  async getSystemLogs(params?: {
    page?: number;
    pageSize?: number;
    severity?: SystemLogSeverity;
    category?: SystemLogCategory;
    resolved?: boolean;
  }): Promise<PaginatedResponse<SystemLog>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.severity) searchParams.set('severity', params.severity);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.resolved !== undefined) searchParams.set('resolved', params.resolved.toString());

    const res = await fetch(`${config.baseUrl}/admin/logs?${searchParams}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to get system logs' }));
      throw new Error(error.message || 'Failed to get system logs');
    }

    return res.json();
  },

  async getSystemLog(id: string): Promise<SystemLog> {
    const res = await fetch(`${config.baseUrl}/admin/logs/${id}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to get system log' }));
      throw new Error(error.message || 'Failed to get system log');
    }

    return res.json();
  },

  async getSystemLogStats(): Promise<SystemLogStats> {
    const res = await fetch(`${config.baseUrl}/admin/logs/stats`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to get log stats' }));
      throw new Error(error.message || 'Failed to get log stats');
    }

    return res.json();
  },

  async resolveSystemLog(id: string): Promise<SystemLog> {
    const res = await fetch(`${config.baseUrl}/admin/logs/${id}/resolve`, {
      method: 'PATCH',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to resolve log' }));
      throw new Error(error.message || 'Failed to resolve log');
    }

    return res.json();
  },

  async runSystemScan(): Promise<{
    passed: number;
    failed: number;
    warnings: number;
    results: Array<{ name: string; status: string; message: string }>;
  }> {
    const res = await fetch(`${config.baseUrl}/admin/scan`, {
      method: 'POST',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to run system scan' }));
      throw new Error(error.message || 'Failed to run system scan');
    }

    return res.json();
  },
};
