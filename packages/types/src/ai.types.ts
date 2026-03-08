// AI Chat Types

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  conversationId?: string;
}

export interface SuggestedPrompt {
  id: string;
  text: string;
  category: 'general' | 'invoices' | 'wallet' | 'events' | 'rewards';
}
