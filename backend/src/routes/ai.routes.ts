// AI Routes - Chat Assistant

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { aiService } from '../services/ai.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatRequestBody {
  message: string;
  conversationHistory?: ChatMessage[];
}

export async function aiRoutes(fastify: FastifyInstance) {
  // Chat endpoint - requires authentication
  fastify.post(
    '/chat',
    { preHandler: authMiddleware },
    async (
      request: FastifyRequest<{ Body: ChatRequestBody }>,
      reply: FastifyReply
    ) => {
      const { message, conversationHistory = [] } = request.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Message is required',
        });
      }

      // Limit message length
      if (message.length > 2000) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Message too long (max 2000 characters)',
        });
      }

      // Limit conversation history
      const limitedHistory = conversationHistory.slice(-10);

      try {
        const response = await aiService.chat(message.trim(), limitedHistory);

        return reply.send({
          message: response,
        });
      } catch (error: unknown) {
        fastify.log.error('AI chat error: %s', error instanceof Error ? error.message : error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to process chat request',
        });
      }
    }
  );

  // Get suggested prompts
  fastify.get(
    '/prompts',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const prompts = [
        { id: '1', text: 'איך מעלים חשבונית חדשה?', category: 'invoices' },
        { id: '2', text: 'איך רואים את יתרת הנקודות שלי?', category: 'wallet' },
        { id: '3', text: 'איך מממשים נקודות להטבות?', category: 'rewards' },
        { id: '4', text: 'איך נרשמים לאירוע?', category: 'events' },
        { id: '5', text: 'איך מעדכנים את הפרופיל שלי?', category: 'general' },
        { id: '6', text: 'מה הסטטוס של החשבוניות שלי?', category: 'invoices' },
        { id: '7', text: 'איך מתחילים להשתמש במערכת?', category: 'general' },
        { id: '8', text: 'מה ההטבות הזמינות כרגע?', category: 'rewards' },
      ];

      return reply.send({ prompts });
    }
  );
}
