// Wallet API Client

import { config, getHeaders, fetchWithAuth } from './config';
import type {
  WalletBalance,
  CardTransaction,
  DigitalCard,
  PaginatedResponse
} from '@stannel/types';

export const walletApi = {
  async getBalance(): Promise<WalletBalance> {
    const response = await fetchWithAuth(`${config.baseUrl}/wallet/balance`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בטעינת היתרה. נסה לרענן את הדף.');
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

    const response = await fetchWithAuth(`${config.baseUrl}/wallet/transactions?${searchParams}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בטעינת העסקאות. נסה לרענן את הדף.');
    }

    return response.json();
  },

  async getCard(): Promise<DigitalCard> {
    const response = await fetchWithAuth(`${config.baseUrl}/wallet/card`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בטעינת פרטי הכרטיס. נסה לרענן את הדף.');
    }

    return response.json();
  },
};
