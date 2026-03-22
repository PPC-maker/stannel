// Supplier API Client

import { config, getHeaders, getAuthToken } from './config';

export interface SupplierInvoice {
  id: string;
  amount: number;
  status: string;
  slaDeadline?: string;
  createdAt: string;
  architect: {
    user: { name: string; email: string };
  };
}

export interface SupplierStats {
  pendingPayments: {
    amount: number;
    count: number;
  };
  paidThisMonth: {
    amount: number;
    count: number;
  };
  overdueCount: number;
  totalPaid: number;
  totalCommissionsPaid: number;
}

export interface CommissionHistory {
  id: string;
  invoiceId: string;
  amount: number;
  commissionRate: number;
  createdAt: string;
  invoice: {
    amount: number;
    architect: {
      user: { name: string };
    };
  };
}

export interface SupplierGoal {
  id: string;
  targetAmount: number;
  currentAmount: number;
  bonusPoints: number;
  period: 'MONTHLY' | 'QUARTERLY';
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface SupplierProduct {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  pointCost: number;
  cashCost: number;
  stock: number;
}

export const supplierApi = {
  async getInvoices(params?: { page?: number; pageSize?: number; status?: string }): Promise<{
    data: SupplierInvoice[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.status) searchParams.set('status', params.status);

    const response = await fetch(`${config.baseUrl}/supplier/invoices?${searchParams}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get invoices');
    }

    return response.json();
  },

  async confirmPayment(invoiceId: string, reference: string, paymentProofUrl?: string): Promise<SupplierInvoice> {
    const body: { reference: string; paymentProofUrl?: string } = { reference };
    if (paymentProofUrl) body.paymentProofUrl = paymentProofUrl;

    const response = await fetch(`${config.baseUrl}/supplier/invoices/${invoiceId}/confirm`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to confirm payment');
    }

    return response.json();
  },

  async uploadPaymentProof(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    const response = await fetch(`${config.baseUrl}/supplier/upload-payment-proof`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload payment proof');
    }

    return response.json();
  },

  async getStats(): Promise<SupplierStats> {
    const response = await fetch(`${config.baseUrl}/supplier/stats`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get stats');
    }

    return response.json();
  },

  async getGoals(): Promise<SupplierGoal[]> {
    const response = await fetch(`${config.baseUrl}/supplier/goals`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get goals');
    }

    return response.json();
  },

  async getCatalog(): Promise<SupplierProduct[]> {
    const response = await fetch(`${config.baseUrl}/supplier/catalog`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get catalog');
    }

    return response.json();
  },

  async addProduct(data: {
    name: string;
    description?: string;
    imageUrl: string;
    pointCost: number;
    cashCost?: number;
    stock: number;
  }): Promise<SupplierProduct> {
    const response = await fetch(`${config.baseUrl}/supplier/catalog`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add product');
    }

    return response.json();
  },

  async updateProduct(id: string, data: Partial<{
    name: string;
    description: string;
    imageUrl: string;
    pointCost: number;
    cashCost: number;
    stock: number;
  }>): Promise<SupplierProduct> {
    const response = await fetch(`${config.baseUrl}/supplier/catalog/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update product');
    }

    return response.json();
  },

  async getCommissionHistory(params?: { page?: number; pageSize?: number }): Promise<{
    data: CommissionHistory[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const response = await fetch(`${config.baseUrl}/supplier/commissions?${searchParams}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get commission history');
    }

    return response.json();
  },

  async getPaymentHistory(params?: { page?: number; pageSize?: number }): Promise<{
    data: SupplierInvoice[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    searchParams.set('status', 'PAID'); // Only paid invoices for history

    const response = await fetch(`${config.baseUrl}/supplier/invoices?${searchParams}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get payment history');
    }

    return response.json();
  },
};
