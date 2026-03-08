// Invoices API Client

import { config, getHeaders, getMultipartHeaders } from './config';
import type {
  Invoice,
  InvoiceWithDetails,
  InvoiceStats,
  PaginatedResponse,
  AIValidationResult
} from '@stannel/types';

export const invoicesApi = {
  async getSuppliers(): Promise<{ data: { id: string; companyName: string }[] }> {
    const response = await fetch(`${config.baseUrl}/invoices/suppliers`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get suppliers');
    }

    return response.json();
  },

  async upload(formData: FormData): Promise<{ invoice: Invoice; aiValidation: AIValidationResult }> {
    const response = await fetch(`${config.baseUrl}/invoices/upload`, {
      method: 'POST',
      headers: getMultipartHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload invoice');
    }

    return response.json();
  },

  async getAll(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<PaginatedResponse<InvoiceWithDetails>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params?.status) searchParams.set('status', params.status);

    const response = await fetch(`${config.baseUrl}/invoices?${searchParams}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get invoices');
    }

    return response.json();
  },

  async getById(id: string): Promise<InvoiceWithDetails> {
    const response = await fetch(`${config.baseUrl}/invoices/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get invoice');
    }

    return response.json();
  },

  async getStats(): Promise<InvoiceStats> {
    const response = await fetch(`${config.baseUrl}/invoices/stats`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get stats');
    }

    return response.json();
  },

  // Admin endpoints
  async verify(id: string, data: {
    status: 'APPROVED' | 'REJECTED' | 'CLARIFICATION_NEEDED';
    note?: string;
  }): Promise<Invoice> {
    const response = await fetch(`${config.baseUrl}/admin/invoices/${id}/verify`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to verify invoice');
    }

    return response.json();
  },

  // Supplier endpoints
  async confirmPayment(id: string, reference: string): Promise<Invoice> {
    const response = await fetch(`${config.baseUrl}/supplier/invoices/${id}/confirm`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ reference }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to confirm payment');
    }

    return response.json();
  },
};
