// Admin API Client

import { config, getHeaders, getHeadersNoBody, getMultipartHeaders } from './config';
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

  async getPendingUsers(params?: { page?: number; pageSize?: number }): Promise<{
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const res = await fetch(`${config.baseUrl}/admin/users/pending?${searchParams}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to get pending users' }));
      throw new Error(error.message || 'Failed to get pending users');
    }

    return res.json();
  },

  async activateUser(userId: string, sendEmail: boolean = true): Promise<any> {
    const res = await fetch(`${config.baseUrl}/admin/users/${userId}/activate`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ sendEmail }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to activate user' }));
      throw new Error(error.message || 'Failed to activate user');
    }

    return res.json();
  },

  async bulkActivateUsers(userIds: string[], sendEmail: boolean = true): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: Array<{ userId: string; success: boolean; error?: string }>;
  }> {
    const res = await fetch(`${config.baseUrl}/admin/users/bulk-activate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userIds, sendEmail }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to bulk activate users' }));
      throw new Error(error.message || 'Failed to bulk activate users');
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

  async loginAsUser(userId: string): Promise<{ customToken: string }> {
    const res = await fetch(`${config.baseUrl}/admin/users/${userId}/login-as`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to login as user' }));
      throw new Error(error.message || 'Failed to login as user');
    }

    return res.json();
  },

  async deleteUser(userId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${config.baseUrl}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getHeadersNoBody(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to delete user' }));
      throw new Error(error.message || 'Failed to delete user');
    }

    return res.json();
  },

  // Invoices (Admin View)
  async getInvoices(params?: { page?: number; pageSize?: number; status?: string; includeDeleted?: boolean }): Promise<{
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
    if (params?.includeDeleted) searchParams.set('includeDeleted', 'true');

    const res = await fetch(`${config.baseUrl}/admin/invoices?${searchParams}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to get invoices' }));
      throw new Error(error.message || 'Failed to get invoices');
    }

    return res.json();
  },

  // Get deleted invoices (recycle bin)
  async getDeletedInvoices(params?: { page?: number; pageSize?: number }): Promise<{
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const res = await fetch(`${config.baseUrl}/admin/invoices/deleted?${searchParams}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to get deleted invoices' }));
      throw new Error(error.message || 'Failed to get deleted invoices');
    }

    return res.json();
  },

  // Soft delete invoice (move to recycle bin)
  async deleteInvoice(invoiceId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${config.baseUrl}/admin/invoices/${invoiceId}`, {
      method: 'DELETE',
      headers: getHeadersNoBody(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to delete invoice' }));
      throw new Error(error.message || 'Failed to delete invoice');
    }

    return res.json();
  },

  // Bulk delete all invoices for an architect
  async deleteArchitectInvoices(architectId: string): Promise<{ success: boolean; deletedCount: number }> {
    const res = await fetch(`${config.baseUrl}/admin/invoices/architect/${architectId}`, {
      method: 'DELETE',
      headers: getHeadersNoBody(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to delete invoices' }));
      throw new Error(error.message || 'Failed to delete invoices');
    }

    return res.json();
  },

  // Restore invoice from recycle bin
  async restoreInvoice(invoiceId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${config.baseUrl}/admin/invoices/${invoiceId}/restore`, {
      method: 'PATCH',
      headers: getHeadersNoBody(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to restore invoice' }));
      throw new Error(error.message || 'Failed to restore invoice');
    }

    return res.json();
  },

  // Permanently delete invoice
  async permanentDeleteInvoice(invoiceId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${config.baseUrl}/admin/invoices/${invoiceId}/permanent`, {
      method: 'DELETE',
      headers: getHeadersNoBody(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to permanently delete invoice' }));
      throw new Error(error.message || 'Failed to permanently delete invoice');
    }

    return res.json();
  },

  // Cleanup recycle bin (delete invoices older than 30 days)
  async cleanupRecycleBin(): Promise<{ success: boolean; deletedCount: number }> {
    const res = await fetch(`${config.baseUrl}/admin/invoices/recycle-bin/cleanup`, {
      method: 'DELETE',
      headers: getHeadersNoBody(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to cleanup recycle bin' }));
      throw new Error(error.message || 'Failed to cleanup recycle bin');
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

  async getLatestScanReport(): Promise<{
    id: string;
    isHealthy: boolean;
    checksRun: number;
    checksPassed: number;
    checksFailed: number;
    checksWarnings: number;
    results: Array<{
      name: string;
      category: string;
      status: 'ok' | 'warning' | 'error';
      message: string;
      responseTime?: number;
    }>;
    errorsLast24h: number;
    claudeFormat?: string;
    createdAt: string;
  } | { error: string }> {
    const res = await fetch(`${config.baseUrl}/admin/scan/latest`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      return { error: 'No scan reports found' };
    }

    return res.json();
  },

  async getScanHistory(limit: number = 10): Promise<{ data: any[] }> {
    const res = await fetch(`${config.baseUrl}/admin/scan/history?limit=${limit}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to get scan history' }));
      throw new Error(error.message || 'Failed to get scan history');
    }

    return res.json();
  },

  // Contracts
  async getContracts(): Promise<any[]> {
    const res = await fetch(`${config.baseUrl}/admin/contracts`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to get contracts' }));
      throw new Error(error.message || 'Failed to get contracts');
    }

    return res.json();
  },

  async createContract(data: {
    supplierId: string;
    type: 'STANDARD' | 'PREMIUM' | 'EXCLUSIVE';
    feePercent: number;
    validFrom: string;
    validTo: string;
  }): Promise<any> {
    const res = await fetch(`${config.baseUrl}/admin/contracts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to create contract' }));
      throw new Error(error.message || 'Failed to create contract');
    }

    return res.json();
  },

  // Image Upload
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${config.baseUrl}/admin/upload-image`, {
      method: 'POST',
      headers: getMultipartHeaders(),
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to upload image' }));
      throw new Error(error.message || 'Failed to upload image');
    }

    return res.json();
  },
};
