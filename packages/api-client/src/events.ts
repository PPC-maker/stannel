// Events API Client

import { config, getHeaders, fetchWithAuth } from './config';
import type {
  Event,
  EventWithRegistration,
  EventRegistration,
  PaginatedResponse,
  SuccessResponse
} from '@stannel/types';

export const eventsApi = {
  async getAll(params?: {
    page?: number;
    pageSize?: number;
    upcoming?: boolean;
  }): Promise<PaginatedResponse<EventWithRegistration>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params?.upcoming !== undefined) searchParams.set('upcoming', String(params.upcoming));

    const response = await fetchWithAuth(`${config.baseUrl}/events?${searchParams}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בטעינת האירועים. נסה לרענן את הדף.');
    }

    return response.json();
  },

  async getById(id: string): Promise<EventWithRegistration> {
    const response = await fetchWithAuth(`${config.baseUrl}/events/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בטעינת האירוע. נסה לרענן את הדף.');
    }

    return response.json();
  },

  async register(eventId: string): Promise<EventRegistration> {
    const response = await fetchWithAuth(`${config.baseUrl}/events/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ eventId }),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בהרשמה לאירוע. נסה שוב.');
    }

    return response.json();
  },

  async cancelRegistration(eventId: string): Promise<SuccessResponse> {
    const response = await fetchWithAuth(`${config.baseUrl}/events/${eventId}/cancel`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בביטול ההרשמה. נסה שוב.');
    }

    return response.json();
  },

  async getMyEvents(): Promise<EventWithRegistration[]> {
    const response = await fetchWithAuth(`${config.baseUrl}/events/my`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בטעינת האירועים שלך. נסה לרענן את הדף.');
    }

    return response.json();
  },

  // Admin functions
  admin: {
    async getAllEvents(): Promise<Event[]> {
      // Use admin endpoint to get ALL events including hidden ones
      const response = await fetchWithAuth(`${config.baseUrl}/admin/events`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'שגיאה בטעינת האירועים. נסה לרענן את הדף.');
      }

      const data = await response.json();
      return data.data;
    },

    async createEvent(data: {
      title: string;
      description: string;
      date: string;
      location: string;
      capacity: number;
      pointsCost?: number;
      imageUrl?: string;
    }): Promise<Event> {
      const response = await fetchWithAuth(`${config.baseUrl}/admin/events`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'שגיאה ביצירת האירוע. נסה שוב.');
      }

      return response.json();
    },

    async updateEvent(id: string, data: Partial<{
      title: string;
      description: string;
      date: string;
      location: string;
      capacity: number;
      pointsCost: number;
      imageUrl: string;
      isHidden: boolean;
    }>): Promise<Event> {
      const response = await fetchWithAuth(`${config.baseUrl}/admin/events/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'שגיאה בעדכון האירוע. נסה שוב.');
      }

      return response.json();
    },

    async deleteEvent(id: string): Promise<{ success: boolean }> {
      const response = await fetchWithAuth(`${config.baseUrl}/admin/events/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'שגיאה במחיקת האירוע. נסה שוב.');
      }

      return response.json();
    },
  },
};
