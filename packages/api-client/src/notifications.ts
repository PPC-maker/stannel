// Notifications API Client

import { config, getHeaders } from './config';

export interface Notification {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  relatedEntity?: string;
  relatedId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationsResponse {
  data: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const notificationsApi = {
  async getAll(params?: {
    unreadOnly?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<NotificationsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.unreadOnly) searchParams.set('unreadOnly', 'true');
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));

    const response = await fetch(`${config.baseUrl}/notifications?${searchParams}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בטעינת ההתראות. נסה לרענן את הדף.');
    }

    return response.json();
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await fetch(`${config.baseUrl}/notifications/unread-count`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בטעינת ההתראות. נסה לרענן את הדף.');
    }

    return response.json();
  },

  async markAsRead(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${config.baseUrl}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בסימון ההתראה. נסה שוב.');
    }

    return response.json();
  },

  async markAllAsRead(): Promise<{ success: boolean }> {
    const response = await fetch(`${config.baseUrl}/notifications/read-all`, {
      method: 'PATCH',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בסימון ההתראות. נסה שוב.');
    }

    return response.json();
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${config.baseUrl}/notifications/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה במחיקת ההתראה. נסה שוב.');
    }

    return response.json();
  },
};
