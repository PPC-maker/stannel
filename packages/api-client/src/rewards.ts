// Rewards API Client

import { config, getHeaders } from './config';
import type {
  Product,
  Redemption,
  RedeemRequest,
  PaginatedResponse,
  SuccessResponse
} from '@stannel/types';

export const rewardsApi = {
  async getProducts(params?: {
    page?: number;
    pageSize?: number;
    supplierId?: string;
  }): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params?.supplierId) searchParams.set('supplierId', params.supplierId);

    const response = await fetch(`${config.baseUrl}/rewards/products?${searchParams}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get products');
    }

    return response.json();
  },

  async getProductById(id: string): Promise<Product> {
    const response = await fetch(`${config.baseUrl}/rewards/products/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get product');
    }

    return response.json();
  },

  async redeem(data: RedeemRequest): Promise<Redemption> {
    const response = await fetch(`${config.baseUrl}/rewards/redeem`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to redeem product');
    }

    return response.json();
  },

  async getRedemptions(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Redemption>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));

    const response = await fetch(`${config.baseUrl}/rewards/redemptions?${searchParams}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get redemptions');
    }

    return response.json();
  },
};
