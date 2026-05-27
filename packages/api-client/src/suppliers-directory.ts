// Suppliers Directory API Client - For architects to browse suppliers

import { config, getHeaders, fetchWithAuth } from './config';

export interface SupplierListItem {
  id: string;
  companyName: string;
  description?: string;
  phone?: string;
  address?: string;
  website?: string;
  businessImages: string[];
  profileImage?: string;
  user: {
    name: string;
    email: string;
  };
}

export interface SupplierDetail extends SupplierListItem {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  profileImage?: string;
  products: {
    id: string;
    name: string;
    description?: string;
    imageUrl: string;
    pointCost: number;
  }[];
}

export interface SuppliersResponse {
  data: SupplierListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const suppliersDirectoryApi = {
  async getAll(params?: { page?: number; pageSize?: number; search?: string }): Promise<SuppliersResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.search) searchParams.set('search', params.search);

    // Public route - no auth required
    const response = await fetch(`${config.baseUrl}/suppliers?${searchParams}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'שגיאה בטעינת הספקים. נסה לרענן את הדף.');
    }

    return response.json();
  },

  async getById(id: string): Promise<SupplierDetail> {
    // Public route - no auth required
    const response = await fetch(`${config.baseUrl}/suppliers/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'שגיאה בטעינת פרטי הספק. נסה לרענן את הדף.');
    }

    return response.json();
  },
};
