// Events API Client

import { config, getHeaders } from './config';
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

    const response = await fetch(`${config.baseUrl}/events?${searchParams}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get events');
    }

    return response.json();
  },

  async getById(id: string): Promise<EventWithRegistration> {
    const response = await fetch(`${config.baseUrl}/events/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get event');
    }

    return response.json();
  },

  async register(eventId: string): Promise<EventRegistration> {
    const response = await fetch(`${config.baseUrl}/events/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ eventId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to register for event');
    }

    return response.json();
  },

  async cancelRegistration(eventId: string): Promise<SuccessResponse> {
    const response = await fetch(`${config.baseUrl}/events/${eventId}/cancel`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel registration');
    }

    return response.json();
  },

  async getMyEvents(): Promise<EventWithRegistration[]> {
    const response = await fetch(`${config.baseUrl}/events/my`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get my events');
    }

    return response.json();
  },
};
