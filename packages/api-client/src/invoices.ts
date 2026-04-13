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
  async getSuppliers(): Promise<{ data: { id: string; companyName: string; email?: string }[] }> {
    const response = await fetch(`${config.baseUrl}/invoices/suppliers`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בטעינת הספקים. נסה לרענן את הדף.');
    }

    return response.json();
  },

  async getMySuppliers(): Promise<{ data: { id: string; companyName: string; email?: string; invoiceCount: number; totalAmount: number }[] }> {
    const response = await fetch(`${config.baseUrl}/invoices/my-suppliers`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בטעינת הספקים שלך. נסה לרענן את הדף.');
    }

    return response.json();
  },

  async upload(formData: FormData): Promise<{ invoice: Invoice; aiValidation: AIValidationResult }> {
    const response = await fetch(`${config.baseUrl}/invoices/upload`, {
      method: 'POST',
      headers: getMultipartHeaders(),
      body: formData,
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'שגיאה בהעלאת החשבונית. נסה שוב.');
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

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בטעינת החשבוניות. נסה לרענן את הדף.');
    }

    return response.json();
  },

  async getById(id: string): Promise<InvoiceWithDetails> {
    const response = await fetch(`${config.baseUrl}/invoices/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בטעינת החשבונית. נסה לרענן את הדף.');
    }

    return response.json();
  },

  async getStats(): Promise<InvoiceStats> {
    const response = await fetch(`${config.baseUrl}/invoices/stats`, {
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
      throw new Error(error.message || 'שגיאה באימות החשבונית. נסה שוב.');
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

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה באישור התשלום. נסה שוב.');
    }

    return response.json();
  },
};
