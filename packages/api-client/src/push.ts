// Push Notifications API Client

import { config, getHeaders, fetchWithAuth } from './config';

export type PushAudience = 'ALL' | 'ARCHITECT' | 'DESIGNER' | 'SUPPLIER';

export interface PushCampaign {
  id: string;
  title: string;
  body: string;
  audience: PushAudience;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

async function parse<T>(response: Response, fallback: string): Promise<T> {
  if (response.status === 401) {
    throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
  }
  if (!response.ok) {
    let message = fallback;
    try {
      const error = await response.json();
      if (error?.message) message = error.message;
    } catch {
      // keep fallback
    }
    throw new Error(message);
  }
  return response.json();
}

export const pushApi = {
  // Device registration (called by the app, after login)
  async registerDevice(token: string, platform: 'ios' | 'android'): Promise<{ success: boolean }> {
    const response = await fetchWithAuth(`${config.baseUrl}/push/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ token, platform }),
    });
    return parse(response, 'רישום המכשיר להתראות נכשל.');
  },

  async unregisterDevice(token: string): Promise<{ success: boolean }> {
    const response = await fetchWithAuth(`${config.baseUrl}/push/unregister`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ token }),
    });
    return parse(response, 'ביטול רישום המכשיר נכשל.');
  },

  // Admin
  async getStats(audience: PushAudience): Promise<{ devices: number; users: number }> {
    const response = await fetchWithAuth(`${config.baseUrl}/push/admin/stats?audience=${audience}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return parse(response, 'לא הצלחנו לטעון את מספר המכשירים.');
  },

  async send(data: {
    title: string;
    body: string;
    audience: PushAudience;
    alsoInApp?: boolean;
  }): Promise<{ campaign: PushCampaign; devices: number; sent: number; failed: number }> {
    const response = await fetchWithAuth(`${config.baseUrl}/push/admin/send`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return parse(response, 'שליחת ההודעה נכשלה. נסו שוב בעוד רגע.');
  },

  async getHistory(): Promise<{ data: PushCampaign[] }> {
    const response = await fetchWithAuth(`${config.baseUrl}/push/admin/history`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return parse(response, 'לא הצלחנו לטעון את היסטוריית ההודעות.');
  },
};
