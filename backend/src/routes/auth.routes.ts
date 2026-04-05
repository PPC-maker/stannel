// Auth Routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getFirebaseAuth } from '../lib/firebase.js';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { storageService } from '../services/storage.service.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import type { DecodedIdToken } from 'firebase-admin/auth';

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

const googleAuthSchema = z.object({
  token: z.string(),
  role: z.enum(['ARCHITECT', 'SUPPLIER']).optional(),
});

export async function authRoutes(server: FastifyInstance) {
  // Google auto-login/register - creates user if doesn't exist
  server.post('/google', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = googleAuthSchema.parse(request.body);
      const firebaseAuth = getFirebaseAuth();

      if (!firebaseAuth) {
        console.error('[Auth] Firebase Auth not initialized for Google auth');
        return reply.code(500).send({ error: 'Auth service not configured' });
      }

      let decoded: DecodedIdToken;
      try {
        decoded = await firebaseAuth.verifyIdToken(body.token);
      } catch (tokenError) {
        const err = tokenError as { code?: string; message?: string };
        console.error('[Auth] Google token verification failed:', err.code, err.message);
        return reply.code(401).send({
          error: 'Invalid authentication token',
          code: err.code || 'auth/invalid-token',
        });
      }

      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { firebaseUid: decoded.uid },
        include: { architectProfile: true, supplierProfile: true },
      });

      if (user) {
        console.log('[Auth] Google login - existing user:', user.email);
        return { user, token: body.token, isNewUser: false };
      }

      // Auto-register with Google profile
      const email = decoded.email || '';
      const name = decoded.name || decoded.email?.split('@')[0] || 'User';
      const profileImage = decoded.picture || undefined;
      const role = body.role || 'ARCHITECT';

      const existingByEmail = await prisma.user.findUnique({ where: { email } });
      if (existingByEmail) {
        return reply.code(400).send({
          error: 'Email already registered with a different account',
          code: 'auth/email-exists'
        });
      }

      user = await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          email,
          name,
          profileImage,
          role,
          isActive: false,
          ...(role === 'ARCHITECT' && { architectProfile: { create: {} } }),
          ...(role === 'SUPPLIER' && { supplierProfile: { create: { companyName: name } } }),
        },
        include: { architectProfile: true, supplierProfile: true },
      });

      console.log('[Auth] Google auto-register - new user:', user.email, user.role);
      return { user, token: body.token, isNewUser: true, message: 'Registration successful. Awaiting admin approval.' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return reply.code(400).send({ error: 'User already exists' });
      }
      console.error('[Auth] Google auth error:', error);
      return reply.code(500).send({ error: 'Google authentication failed' });
    }
  });

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
      let decoded: DecodedIdToken;
      try {
        decoded = await firebaseAuth.verifyIdToken(body.firebaseToken);
      } catch (tokenError) {
        const err = tokenError as { code?: string; message?: string };
        console.error('[Auth] Token verification failed:', err.code, err.message);
        return reply.code(401).send({
          error: 'Invalid authentication token',
          code: err.code || 'auth/invalid-token',
          message: err.message || 'Token verification failed'
        });
      }

      // Check if user already exists by firebaseUid
      const existingByUid = await prisma.user.findUnique({
        where: { firebaseUid: decoded.uid },
        include: { architectProfile: true, supplierProfile: true },
      });

      if (existingByUid) {
        // User already registered - return existing user
        return { user: existingByUid, token: body.firebaseToken, message: 'User already registered.' };
      }

      // Check if user already exists by email (different Firebase account)
      const existingByEmail = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (existingByEmail) {
        return reply.code(400).send({ error: 'Email already registered with a different account' });
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

      console.log('[Auth] New user registered:', user.email, user.role);
      return { user, token: body.firebaseToken, message: 'Registration successful. Awaiting admin approval.' };
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors });
      }

      // Handle Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('[Auth] Database error:', error.code, error.message);
        if (error.code === 'P2002') {
          return reply.code(400).send({ error: 'User already exists' });
        }
        return reply.code(500).send({ error: 'Database error' });
      }

      console.error('[Auth] Registration error:', error);
      return reply.code(500).send({ error: 'Registration failed' });
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

      let decoded: DecodedIdToken;
      try {
        decoded = await firebaseAuth.verifyIdToken(body.token);
      } catch (tokenError) {
        const err = tokenError as { code?: string; message?: string };
        console.error('[Auth] Token verification failed:', err.code, err.message);
        return reply.code(401).send({
          error: 'Invalid token',
          code: err.code || 'auth/invalid-token',
          message: err.message || 'Token verification failed'
        });
      }

      const user = await prisma.user.findUnique({
        where: { firebaseUid: decoded.uid },
        include: {
          architectProfile: true,
          supplierProfile: true,
        },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found in database', firebaseUid: decoded.uid });
      }

      // Check if user is approved by admin (except for admins themselves)
      if (!user.isActive && user.role !== 'ADMIN') {
        return reply.code(403).send({
          error: 'החשבון שלך ממתין לאישור מנהל. נודיע לך כשהחשבון יאושר.',
          code: 'auth/pending-approval',
          pendingApproval: true
        });
      }

      return { user, token: body.token };
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid request body', details: error.errors });
      }

      // Handle Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('[Auth] Database error in verify:', error.code, error.message);
        return reply.code(500).send({ error: 'Database error', code: error.code });
      }

      // Handle Prisma connection errors
      if (error instanceof Prisma.PrismaClientInitializationError) {
        console.error('[Auth] Database connection error:', error.message);
        return reply.code(503).send({ error: 'Database unavailable' });
      }

      console.error('[Auth] Verify error:', error);
      return reply.code(500).send({ error: 'Verification failed' });
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

  // Upload profile image
  server.post('/profile/image', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.code(400).send({ error: 'Invalid file type. Only images are allowed.' });
      }

      // Validate file size (max 5MB)
      const buffer = await data.toBuffer();
      if (buffer.length > 5 * 1024 * 1024) {
        return reply.code(400).send({ error: 'File too large. Maximum size is 5MB.' });
      }

      // Upload to storage
      const imageUrl = await storageService.uploadProfileImage(buffer, request.user!.id, data.filename);

      // Update user profile
      const user = await prisma.user.update({
        where: { id: request.user!.id },
        data: { profileImage: imageUrl },
        include: {
          architectProfile: true,
          supplierProfile: true,
        },
      });

      return { user, imageUrl };
    } catch (error) {
      console.error('[Auth] Profile image upload error:', error);
      return reply.code(500).send({ error: 'Failed to upload profile image' });
    }
  });
}
