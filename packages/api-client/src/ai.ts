// AI API Client

import { config, getHeaders } from './config';
import type { ChatMessage, ChatResponse, SuggestedPrompt } from '@stannel/types';

export const aiApi = {
  async chat(
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatResponse> {
    const response = await fetch(`${config.baseUrl}/ai/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, conversationHistory }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send chat message');
    }

    return response.json();
  },

  async getPrompts(): Promise<{ prompts: SuggestedPrompt[] }> {
    const response = await fetch(`${config.baseUrl}/ai/prompts`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get prompts');
    }

    return response.json();
  },
};
