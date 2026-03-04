// Events Routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { z } from 'zod';

const registerSchema = z.object({
  eventId: z.string(),
});

export async function eventsRoutes(server: FastifyInstance) {
  // Get all events
  server.get('/', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest) => {
    const query = request.query as { page?: string; pageSize?: string; upcoming?: string };
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '10');

    const where = {
      isHidden: false,
      ...(query.upcoming === 'true' && { date: { gte: new Date() } }),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { date: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.event.count({ where }),
    ]);

    // Add registration status for current user
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        userId: request.user!.id,
        eventId: { in: events.map(e => e.id) },
      },
    });

    const eventsWithStatus = events.map(event => ({
      ...event,
      isRegistered: registrations.some(r => r.eventId === event.id),
      registrationStatus: registrations.find(r => r.eventId === event.id)?.status,
      spotsLeft: event.capacity - event.registeredCount,
    }));

    return {
      data: eventsWithStatus,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });

  // Get single event
  server.get('/:id', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return reply.code(404).send({ error: 'Event not found' });
    }

    const registration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId: request.user!.id,
        },
      },
    });

    return {
      ...event,
      isRegistered: !!registration,
      registrationStatus: registration?.status,
      spotsLeft: event.capacity - event.registeredCount,
    };
  });

  // Register for event
  server.post('/register', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = registerSchema.parse(request.body);

    const event = await prisma.event.findUnique({
      where: { id: body.eventId },
    });

    if (!event) {
      return reply.code(404).send({ error: 'Event not found' });
    }

    // Check if already registered
    const existing = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId: body.eventId,
          userId: request.user!.id,
        },
      },
    });

    if (existing) {
      return reply.code(400).send({ error: 'Already registered for this event' });
    }

    // Check capacity
    const isWaitlist = event.registeredCount >= event.capacity;

    if (isWaitlist && !event.waitlistEnabled) {
      return reply.code(400).send({ error: 'Event is full and waitlist is disabled' });
    }

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: body.eventId,
        userId: request.user!.id,
        status: isWaitlist ? 'WAITLIST' : 'CONFIRMED',
      },
    });

    // Update registered count if confirmed
    if (!isWaitlist) {
      await prisma.event.update({
        where: { id: body.eventId },
        data: { registeredCount: { increment: 1 } },
      });
    }

    return registration;
  });

  // Cancel registration
  server.delete('/:id/cancel', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const registration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId: request.user!.id,
        },
      },
    });

    if (!registration) {
      return reply.code(404).send({ error: 'Registration not found' });
    }

    await prisma.eventRegistration.delete({
      where: { id: registration.id },
    });

    // Decrement count if was confirmed
    if (registration.status === 'CONFIRMED') {
      await prisma.event.update({
        where: { id },
        data: { registeredCount: { decrement: 1 } },
      });
    }

    return { success: true, message: 'Registration cancelled' };
  });

  // Get my events
  server.get('/my', {
    preHandler: [authMiddleware],
  }, async (request: FastifyRequest) => {
    const registrations = await prisma.eventRegistration.findMany({
      where: { userId: request.user!.id },
      include: { event: true },
      orderBy: { event: { date: 'asc' } },
    });

    return registrations.map(r => ({
      ...r.event,
      isRegistered: true,
      registrationStatus: r.status,
      spotsLeft: r.event.capacity - r.event.registeredCount,
    }));
  });
}
