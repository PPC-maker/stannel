// Meetings API Client

import { config, getHeaders, getMultipartHeaders, fetchWithAuth } from './config';

export const meetingsApi = {
  async create(data: {
    supplierId: string;
    date: string;
    time: string;
    subject: string;
    notes?: string;
  }): Promise<any> {
    const res = await fetchWithAuth(`${config.baseUrl}/meetings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה ביצירת הפגישה' }));
      throw new Error(error.message || 'שגיאה ביצירת הפגישה');
    }

    return res.json();
  },

  async getAll(status?: string): Promise<{ data: any[] }> {
    const url = status
      ? `${config.baseUrl}/meetings?status=${status}`
      : `${config.baseUrl}/meetings`;

    const res = await fetchWithAuth(url, {
      headers: getHeaders(),
    });

    if (!res.ok) return { data: [] };
    return res.json();
  },

  async updateStatus(meetingId: string, status: 'approved' | 'rejected'): Promise<any> {
    const res = await fetchWithAuth(`${config.baseUrl}/meetings/${meetingId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בעדכון סטטוס' }));
      throw new Error(error.message || 'שגיאה בעדכון סטטוס');
    }

    return res.json();
  },

  async uploadDocument(meetingId: string, file: File): Promise<{ success: boolean; documentUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetchWithAuth(`${config.baseUrl}/meetings/${meetingId}/document`, {
      method: 'POST',
      headers: getMultipartHeaders(),
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בהעלאת מסמך' }));
      throw new Error(error.message || 'שגיאה בהעלאת מסמך');
    }

    return res.json();
  },

  async cancel(meetingId: string): Promise<any> {
    const res = await fetchWithAuth(`${config.baseUrl}/meetings/${meetingId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'שגיאה בביטול הפגישה' }));
      throw new Error(error.message || 'שגיאה בביטול הפגישה');
    }

    return res.json();
  },
};
