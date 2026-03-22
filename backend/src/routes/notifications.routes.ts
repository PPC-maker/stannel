// Notifications Routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

export async function notificationsRoutes(server: FastifyInstance) {
  // Get all notifications for the current user
  server.get('/', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const query = request.query as { unreadOnly?: string; page?: string; pageSize?: string };
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');
    const unreadOnly = query.unreadOnly === 'true';

    const where = {
      recipientId: user.id,
      ...(unreadOnly && { isRead: false }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { recipientId: user.id, isRead: false },
      }),
    ]);

    return {
      data: notifications,
      total,
      unreadCount,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });

  // Get unread count only
  server.get('/unread-count', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;

    const count = await prisma.notification.count({
      where: { recipientId: user.id, isRead: false },
    });

    return { count };
  });

  // Mark notification as read
  server.patch('/:id/read', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = request.params as { id: string };

    const notification = await prisma.notification.findFirst({
      where: { id, recipientId: user.id },
    });

    if (!notification) {
      return reply.code(404).send({ error: 'Notification not found' });
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    return { success: true };
  });

  // Mark all notifications as read
  server.patch('/read-all', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;

    await prisma.notification.updateMany({
      where: { recipientId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { success: true };
  });

  // Delete a notification
  server.delete('/:id', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = request.params as { id: string };

    const notification = await prisma.notification.findFirst({
      where: { id, recipientId: user.id },
    });

    if (!notification) {
      return reply.code(404).send({ error: 'Notification not found' });
    }

    await prisma.notification.delete({ where: { id } });

    return { success: true };
  });
}

// Helper function to create notifications (used by other services)
export async function createNotification(data: {
  recipientId: string;
  type: 'INVOICE_SUBMITTED' | 'INVOICE_APPROVED' | 'INVOICE_REJECTED' | 'INVOICE_CLARIFICATION' |
        'INVOICE_PAID' | 'CARD_CREDITED' | 'GOAL_ACHIEVED' | 'BONUS_RECEIVED' |
        'PROFILE_VIEWED' | 'SYSTEM_ALERT' | 'WELCOME';
  title: string;
  message: string;
  relatedEntity?: string;
  relatedId?: string;
}) {
  return prisma.notification.create({
    data: {
      recipientId: data.recipientId,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedEntity: data.relatedEntity,
      relatedId: data.relatedId,
    },
  });
}
