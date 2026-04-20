// Admin API Client

import { config, getHeaders, getHeadersNoBody, getMultipartHeaders, fetchWithAuth } from './config';
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
    const res = await fetchWithAuth(`${config.baseUrl}/admin/health-report`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בטעינת דוח הבריאות. נסה לרענן את הדף.' }));
      throw new Error(error.message || 'שגיאה בטעינת דוח הבריאות. נסה לרענן את הדף.');
    }

    return res.json();
  },

  async getHealthReports(): Promise<{ data: HealthReport[] }> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/health-reports`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בטעינת דוחות הבריאות. נסה לרענן את הדף.' }));
      throw new Error(error.message || 'שגיאה בטעינת דוחות הבריאות. נסה לרענן את הדף.');
    }

    return res.json();
  },

  async sendHealthReport(): Promise<HealthReport> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/health-report/send`, {
      method: 'POST',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בשליחת דוח הבריאות. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה בשליחת דוח הבריאות. נסה שוב.');
    }

    return res.json();
  },

  // Scheduled Tasks
  async getScheduledTasks(): Promise<{ data: ScheduledTask[] }> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/scheduled-tasks`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בטעינת המשימות. נסה לרענן את הדף.' }));
      throw new Error(error.message || 'שגיאה בטעינת המשימות. נסה לרענן את הדף.');
    }

    return res.json();
  },

  async runScheduledTask(name: string): Promise<{ success: boolean; task: string }> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/scheduled-tasks/${name}/run`, {
      method: 'POST',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בהפעלת המשימה. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה בהפעלת המשימה. נסה שוב.');
    }

    return res.json();
  },

  async toggleScheduledTask(name: string, enabled: boolean): Promise<{ success: boolean; task: string; enabled: boolean }> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/scheduled-tasks/${name}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ enabled }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בעדכון המשימה. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה בעדכון המשימה. נסה שוב.');
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

    const res = await fetchWithAuth(`${config.baseUrl}/admin/users?${searchParams}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בטעינת המשתמשים. נסה לרענן את הדף.' }));
      throw new Error(error.message || 'שגיאה בטעינת המשתמשים. נסה לרענן את הדף.');
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

    const res = await fetchWithAuth(`${config.baseUrl}/admin/users/pending?${searchParams}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בטעינת המשתמשים הממתינים. נסה לרענן את הדף.' }));
      throw new Error(error.message || 'שגיאה בטעינת המשתמשים הממתינים. נסה לרענן את הדף.');
    }

    return res.json();
  },

  async activateUser(userId: string, sendEmail: boolean = true): Promise<any> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/users/${userId}/activate`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ sendEmail }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בהפעלת המשתמש. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה בהפעלת המשתמש. נסה שוב.');
    }

    return res.json();
  },

  async bulkActivateUsers(userIds: string[], sendEmail: boolean = true): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: Array<{ userId: string; success: boolean; error?: string }>;
  }> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/users/bulk-activate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userIds, sendEmail }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בהפעלת המשתמשים. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה בהפעלת המשתמשים. נסה שוב.');
    }

    return res.json();
  },

  async deactivateUser(userId: string): Promise<any> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/users/${userId}/deactivate`, {
      method: 'PATCH',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בהשבתת המשתמש. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה בהשבתת המשתמש. נסה שוב.');
    }

    return res.json();
  },

  async loginAsUser(userId: string): Promise<{ customToken: string }> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/users/${userId}/login-as`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בהתחברות כמשתמש. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה בהתחברות כמשתמש. נסה שוב.');
    }

    return res.json();
  },

  async deleteUser(userId: string): Promise<{ success: boolean }> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getHeadersNoBody(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה במחיקת המשתמש. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה במחיקת המשתמש. נסה שוב.');
    }

    return res.json();
  },

  async updateUser(userId: string, data: {
    name?: string;
    phone?: string;
    address?: string;
    company?: string;
    supplierProfile?: {
      companyName?: string;
      description?: string;
      phone?: string;
      address?: string;
      website?: string;
      facebook?: string;
      instagram?: string;
      linkedin?: string;
      commissionRate?: number;
    };
  }): Promise<any> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/users/${userId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בעדכון המשתמש. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה בעדכון המשתמש. נסה שוב.');
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

    const res = await fetchWithAuth(`${config.baseUrl}/admin/invoices?${searchParams}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בטעינת החשבוניות. נסה לרענן את הדף.' }));
      throw new Error(error.message || 'שגיאה בטעינת החשבוניות. נסה לרענן את הדף.');
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

    const res = await fetchWithAuth(`${config.baseUrl}/admin/invoices/deleted?${searchParams}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בטעינת החשבוניות שנמחקו. נסה לרענן את הדף.' }));
      throw new Error(error.message || 'שגיאה בטעינת החשבוניות שנמחקו. נסה לרענן את הדף.');
    }

    return res.json();
  },

  // Soft delete invoice (move to recycle bin)
  async deleteInvoice(invoiceId: string): Promise<{ success: boolean }> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/invoices/${invoiceId}`, {
      method: 'DELETE',
      headers: getHeadersNoBody(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה במחיקת החשבונית. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה במחיקת החשבונית. נסה שוב.');
    }

    return res.json();
  },

  // Bulk delete all invoices for an architect
  async deleteArchitectInvoices(architectId: string): Promise<{ success: boolean; deletedCount: number }> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/invoices/architect/${architectId}`, {
      method: 'DELETE',
      headers: getHeadersNoBody(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה במחיקת החשבוניות. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה במחיקת החשבוניות. נסה שוב.');
    }

    return res.json();
  },

  // Restore invoice from recycle bin
  async restoreInvoice(invoiceId: string): Promise<{ success: boolean }> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/invoices/${invoiceId}/restore`, {
      method: 'PATCH',
      headers: getHeadersNoBody(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בשחזור החשבונית. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה בשחזור החשבונית. נסה שוב.');
    }

    return res.json();
  },

  // Permanently delete invoice
  async permanentDeleteInvoice(invoiceId: string): Promise<{ success: boolean }> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/invoices/${invoiceId}/permanent`, {
      method: 'DELETE',
      headers: getHeadersNoBody(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה במחיקת החשבונית לצמיתות. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה במחיקת החשבונית לצמיתות. נסה שוב.');
    }

    return res.json();
  },

  // Cleanup recycle bin (delete invoices older than 30 days)
  async cleanupRecycleBin(): Promise<{ success: boolean; deletedCount: number }> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/invoices/recycle-bin/cleanup`, {
      method: 'DELETE',
      headers: getHeadersNoBody(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בניקוי סל המיחזור. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה בניקוי סל המיחזור. נסה שוב.');
    }

    return res.json();
  },

  async verifyInvoice(invoiceId: string, data: { status: 'APPROVED' | 'REJECTED' | 'CLARIFICATION_NEEDED'; note?: string }): Promise<any> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/invoices/${invoiceId}/verify`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה באימות החשבונית. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה באימות החשבונית. נסה שוב.');
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

    const res = await fetchWithAuth(`${config.baseUrl}/admin/audit-logs?${searchParams}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בטעינת יומן הביקורת. נסה לרענן את הדף.' }));
      throw new Error(error.message || 'שגיאה בטעינת יומן הביקורת. נסה לרענן את הדף.');
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

    const res = await fetchWithAuth(`${config.baseUrl}/admin/logs?${searchParams}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בטעינת יומני המערכת. נסה לרענן את הדף.' }));
      throw new Error(error.message || 'שגיאה בטעינת יומני המערכת. נסה לרענן את הדף.');
    }

    return res.json();
  },

  async getSystemLog(id: string): Promise<SystemLog> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/logs/${id}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בטעינת יומן המערכת. נסה לרענן את הדף.' }));
      throw new Error(error.message || 'שגיאה בטעינת יומן המערכת. נסה לרענן את הדף.');
    }

    return res.json();
  },

  async getSystemLogStats(): Promise<SystemLogStats> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/logs/stats`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בטעינת נתוני היומנים. נסה לרענן את הדף.' }));
      throw new Error(error.message || 'שגיאה בטעינת נתוני היומנים. נסה לרענן את הדף.');
    }

    return res.json();
  },

  async resolveSystemLog(id: string): Promise<SystemLog> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/logs/${id}/resolve`, {
      method: 'PATCH',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בפתרון היומן. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה בפתרון היומן. נסה שוב.');
    }

    return res.json();
  },

  async runSystemScan(): Promise<{
    passed: number;
    failed: number;
    warnings: number;
    results: Array<{ name: string; status: string; message: string }>;
  }> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/scan`, {
      method: 'POST',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בהפעלת סריקת המערכת. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה בהפעלת סריקת המערכת. נסה שוב.');
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
    const res = await fetchWithAuth(`${config.baseUrl}/admin/scan/latest`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      return { error: 'לא נמצאו דוחות סריקה' };
    }

    return res.json();
  },

  async getScanHistory(limit: number = 10): Promise<{ data: any[] }> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/scan/history?limit=${limit}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בטעינת היסטוריית הסריקות. נסה לרענן את הדף.' }));
      throw new Error(error.message || 'שגיאה בטעינת היסטוריית הסריקות. נסה לרענן את הדף.');
    }

    return res.json();
  },

  // Contracts
  async getContracts(): Promise<any[]> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/contracts`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בטעינת החוזים. נסה לרענן את הדף.' }));
      throw new Error(error.message || 'שגיאה בטעינת החוזים. נסה לרענן את הדף.');
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
    const res = await fetchWithAuth(`${config.baseUrl}/admin/contracts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה ביצירת החוזה. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה ביצירת החוזה. נסה שוב.');
    }

    return res.json();
  },

  // Image Upload
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetchWithAuth(`${config.baseUrl}/admin/upload-image`, {
      method: 'POST',
      headers: getMultipartHeaders(),
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בהעלאת התמונה. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה בהעלאת התמונה. נסה שוב.');
    }

    return res.json();
  },

  // Products Management
  async getProducts(): Promise<{ data: any[]; total: number }> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/products`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בטעינת המוצרים. נסה לרענן את הדף.' }));
      throw new Error(error.message || 'שגיאה בטעינת המוצרים. נסה לרענן את הדף.');
    }

    return res.json();
  },

  async getProductCategories(): Promise<{ data: string[] }> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/product-categories`, {
      headers: getHeaders(),
    });
    if (!res.ok) return { data: [] };
    return res.json();
  },

  async createProduct(data: {
    name: string;
    description?: string;
    pointCost: number;
    cashCost?: number;
    stock: number;
    imageUrl?: string;
    category?: string;
  }): Promise<any> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה ביצירת המוצר. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה ביצירת המוצר. נסה שוב.');
    }

    return res.json();
  },

  async updateProduct(id: string, data: {
    name?: string;
    description?: string;
    pointCost?: number;
    cashCost?: number;
    stock?: number;
    imageUrl?: string;
    isActive?: boolean;
  }): Promise<any> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/products/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בעדכון המוצר. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה בעדכון המוצר. נסה שוב.');
    }

    return res.json();
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה במחיקת המוצר. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה במחיקת המוצר. נסה שוב.');
    }

    return res.json();
  },

  // ============ System Status ============

  async getSystemStatus(): Promise<{
    overall: 'healthy' | 'degraded' | 'down';
    services: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'down';
      message: string;
      lastCheck: string;
      responseTime?: number;
    }>;
    alerts: Array<{
      type: 'critical' | 'warning' | 'info';
      title: string;
      message: string;
      action?: string;
    }>;
    lastUpdated: string;
  }> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/system-status`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בטעינת סטטוס המערכת. נסה לרענן את הדף.' }));
      throw new Error(error.message || 'שגיאה בטעינת סטטוס המערכת. נסה לרענן את הדף.');
    }

    return res.json();
  },

  async sendSystemAlert(data?: { subject?: string; message?: string }): Promise<{ success: boolean; sentTo: string[] }> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/system-status/alert`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data || {}),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בשליחת התראת המערכת. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה בשליחת התראת המערכת. נסה שוב.');
    }

    return res.json();
  },

  async getSystemStatusHistory(hours: number = 24): Promise<{
    logs: any[];
    hourlyStats: Array<{ hour: string; errors: number; warnings: number; total: number }>;
    totalInPeriod: number;
  }> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/system-status/history?hours=${hours}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בטעינת היסטוריית הסטטוס. נסה לרענן את הדף.' }));
      throw new Error(error.message || 'שגיאה בטעינת היסטוריית הסטטוס. נסה לרענן את הדף.');
    }

    return res.json();
  },

  async sendTestEmail(): Promise<{ success: boolean; sentTo: string[] }> {
    const res = await fetchWithAuth(`${config.baseUrl}/admin/system-status/test-email`, {
      method: 'POST',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בשליחת מייל בדיקה. נסה שוב.' }));
      throw new Error(error.message || 'שגיאה בשליחת מייל בדיקה. נסה שוב.');
    }

    return res.json();
  },
};
