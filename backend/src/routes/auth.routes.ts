// Auth Routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getFirebaseAuth } from '../lib/firebase.js';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(['ARCHITECT', 'SUPPLIER']),
  companyName: z.string().optional(),
  firebaseToken: z.string(),
});

const verifySchema = z.object({
  token: z.string(),
});

export async function authRoutes(server: FastifyInstance) {
  // Register new user
  server.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = registerSchema.parse(request.body);

      const firebaseAuth = getFirebaseAuth();
      if (!firebaseAuth) {
        console.error('[Auth] Firebase Auth not initialized for register');
        return reply.code(500).send({ error: 'Auth service not configured' });
      }

      // Verify Firebase token
      const decoded = await firebaseAuth.verifyIdToken(body.firebaseToken);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { firebaseUid: decoded.uid },
      });

      if (existingUser) {
        return reply.code(400).send({ error: 'User already exists' });
      }

      // Create user with profile
      const user = await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          email: body.email,
          name: body.name,
          phone: body.phone,
          role: body.role,
          isActive: false, // Admin must approve
          ...(body.role === 'ARCHITECT' && {
            architectProfile: { create: {} },
          }),
          ...(body.role === 'SUPPLIER' && {
            supplierProfile: { create: { companyName: body.companyName || '' } },
          }),
        },
        include: {
          architectProfile: true,
          supplierProfile: true,
        },
      });

      return { user, message: 'Registration successful. Awaiting admin approval.' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  });

  // Verify token and get user
  server.post('/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = verifySchema.parse(request.body);
      const firebaseAuth = getFirebaseAuth();

      if (!firebaseAuth) {
        console.error('[Auth] Firebase Auth not initialized');
        return reply.code(500).send({ error: 'Auth service not configured' });
      }

      const decoded = await firebaseAuth.verifyIdToken(body.token);

      const user = await prisma.user.findUnique({
        where: { firebaseUid: decoded.uid },
        include: {
          architectProfile: true,
          supplierProfile: true,
        },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return { user, token: body.token };
    } catch (error) {
      console.error('[Auth] Token verification failed:', error);
      return reply.code(401).send({ error: 'Invalid token' });
    }
  });

  // Get current user
  server.get('/me', { preHandler: [authMiddleware] }, async (request: FastifyRequest) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      include: {
        architectProfile: true,
        supplierProfile: true,
      },
    });

    return user;
  });

  // Update profile
  server.patch('/profile', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { name?: string; phone?: string; profileImage?: string };

    const user = await prisma.user.update({
      where: { id: request.user!.id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.phone && { phone: body.phone }),
        ...(body.profileImage && { profileImage: body.profileImage }),
      },
      include: {
        architectProfile: true,
        supplierProfile: true,
      },
    });

    return user;
  });
}
