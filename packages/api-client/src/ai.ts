// AI API Client

import { config, getHeaders, fetchWithAuth } from './config';
import type { ChatMessage, ChatResponse, SuggestedPrompt } from '@stannel/types';

export const aiApi = {
  async chat(
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatResponse> {
    const response = await fetchWithAuth(`${config.baseUrl}/ai/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, conversationHistory }),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בשליחת ההודעה. נסה שוב.');
    }

    return response.json();
  },

  async getPrompts(): Promise<{ prompts: SuggestedPrompt[] }> {
    const response = await fetchWithAuth(`${config.baseUrl}/ai/prompts`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('פג תוקף החיבור. אנא התחבר/י מחדש למערכת.');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בטעינת ההצעות. נסה לרענן את הדף.');
    }

    return response.json();
  },
};
