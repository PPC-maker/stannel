// Service Providers API Client

import { config, getHeaders } from './config';

export interface ServiceProvider {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  category: string;
  description?: string;
  website?: string;
  address?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceProviderCategory {
  value: string;
  label: string;
}

export const serviceProvidersApi = {
  async getAll(params?: {
    category?: string;
    search?: string;
  }): Promise<{ data: ServiceProvider[] }> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);

    const response = await fetch(`${config.baseUrl}/service-providers?${searchParams}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get service providers');
    }

    return response.json();
  },

  async getById(id: string): Promise<ServiceProvider> {
    const response = await fetch(`${config.baseUrl}/service-providers/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get service provider');
    }

    return response.json();
  },

  async getCategories(): Promise<{ categories: ServiceProviderCategory[] }> {
    const response = await fetch(`${config.baseUrl}/service-providers/meta/categories`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get categories');
    }

    return response.json();
  },

  // Admin methods
  admin: {
    async create(data: {
      name: string;
      phone?: string;
      email?: string;
      category: string;
      description?: string;
      website?: string;
      address?: string;
    }): Promise<ServiceProvider> {
      const response = await fetch(`${config.baseUrl}/service-providers/admin/create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create service provider');
      }

      return response.json();
    },

    async update(id: string, data: Partial<{
      name: string;
      phone: string;
      email: string;
      category: string;
      description: string;
      website: string;
      address: string;
      isActive: boolean;
      isVerified: boolean;
    }>): Promise<ServiceProvider> {
      const response = await fetch(`${config.baseUrl}/service-providers/admin/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update service provider');
      }

      return response.json();
    },

    async delete(id: string): Promise<{ success: boolean }> {
      const response = await fetch(`${config.baseUrl}/service-providers/admin/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete service provider');
      }

      return response.json();
    },

    async getAll(params?: {
      page?: number;
      pageSize?: number;
    }): Promise<{
      data: ServiceProvider[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }> {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));

      const response = await fetch(`${config.baseUrl}/service-providers/admin/all?${searchParams}`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get all service providers');
      }

      return response.json();
    },
  },
};
