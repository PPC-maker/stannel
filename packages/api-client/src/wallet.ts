// Wallet API Client

import { config, getHeaders } from './config';
import type {
  WalletBalance,
  CardTransaction,
  DigitalCard,
  PaginatedResponse
} from '@stannel/types';

export const walletApi = {
  async getBalance(): Promise<WalletBalance> {
    const response = await fetch(`${config.baseUrl}/wallet/balance`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get balance');
    }

    return response.json();
  },

  async getTransactions(params?: {
    page?: number;
    pageSize?: number;
    type?: 'CREDIT' | 'DEBIT';
  }): Promise<PaginatedResponse<CardTransaction>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params?.type) searchParams.set('type', params.type);

    const response = await fetch(`${config.baseUrl}/wallet/transactions?${searchParams}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get transactions');
    }

    return response.json();
  },

  async getCard(): Promise<DigitalCard> {
    const response = await fetch(`${config.baseUrl}/wallet/card`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get card');
    }

    return response.json();
  },
};
