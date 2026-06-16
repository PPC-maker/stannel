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
  role: z.enum(['ARCHITECT', 'DESIGNER', 'SUPPLIER']),
  companyName: z.string().optional(),
  address: z.string().optional(),
  firebaseToken: z.string(),
});

// Auth rate limiting tracker (with periodic cleanup to prevent memory leaks)
const authAttempts: Record<string, number[]> = {};

// Cleanup stale IPs every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const key of Object.keys(authAttempts)) {
    authAttempts[key] = authAttempts[key].filter(t => now - t < 300000);
    if (authAttempts[key].length === 0) {
      delete authAttempts[key];
    }
  }
}, 10 * 60 * 1000);

const verifySchema = z.object({
  token: z.string(),
});

const googleAuthSchema = z.object({
  token: z.string(),
  role: z.enum(['ARCHITECT', 'DESIGNER', 'SUPPLIER']).optional(),
});

export async function authRoutes(server: FastifyInstance) {
  // Rate limiting only for login/register (not verify — verify is called on every page load)
  server.addHook('onRequest', async (request, reply) => {
    if (request.method === 'POST' && !request.url.includes('/verify')) {
      const key = `auth:${request.ip}`;
      const now = Date.now();
      if (!authAttempts[key]) authAttempts[key] = [];
      authAttempts[key] = authAttempts[key].filter(t => now - t < 300000); // 5 min window
      if (authAttempts[key].length >= 50) {
        return reply.code(429).send({ error: 'יותר מדי ניסיונות. נסה שוב בעוד 5 דקות.' });
      }
      authAttempts[key].push(now);
    }
  });
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
          address: body.address,
          company: body.companyName,
          role: body.role as any,
          isActive: false, // Admin must approve
          ...((body.role === 'ARCHITECT' || body.role === 'DESIGNER') && {
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

  // Update profile (with input validation)
  const profileUpdateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    phone: z.string().max(20).optional().nullable(),
    company: z.string().max(200).optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    profileImage: z.string().url().max(2000).optional().nullable(),
  });

  server.patch('/profile', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = profileUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid input', details: parsed.error.errors });
    }
    const body = parsed.data;

    const user = await prisma.user.update({
      where: { id: request.user!.id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.company !== undefined && { company: body.company || null }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.profileImage !== undefined && { profileImage: body.profileImage || null }),
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

  // Get user preferences
  server.get('/preferences', { preHandler: [authMiddleware] }, async (request: FastifyRequest) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      select: {
        prefEmailNotifications: true,
        prefPushNotifications: true,
        prefSmsNotifications: true,
        prefDarkMode: true,
        prefLanguage: true,
      },
    });
    return user;
  });

  // Update user preferences
  const preferencesSchema = z.object({
    prefEmailNotifications: z.boolean().optional(),
    prefPushNotifications: z.boolean().optional(),
    prefSmsNotifications: z.boolean().optional(),
    prefDarkMode: z.boolean().optional(),
    prefLanguage: z.string().max(5).optional(),
  });

  server.patch('/preferences', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = preferencesSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid input', details: parsed.error.errors });
    }

    const updated = await prisma.user.update({
      where: { id: request.user!.id },
      data: parsed.data,
      select: {
        prefEmailNotifications: true,
        prefPushNotifications: true,
        prefSmsNotifications: true,
        prefDarkMode: true,
        prefLanguage: true,
      },
    });

    return updated;
  });

  // Request password reset via email (sent through our SMTP)
  server.post('/request-password-reset', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = request.body as { email: string };

    if (!email) {
      return reply.code(400).send({ error: 'אימייל הוא שדה חובה' });
    }

    try {
      // Check if user exists in our system
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      // Always return success to prevent email enumeration
      if (!user || !user.firebaseUid) {
        return { success: true };
      }

      // Generate password reset link via Firebase Admin
      const { getAuth } = await import('firebase-admin/auth');
      const resetLink = await getAuth().generatePasswordResetLink(email);

      // Send via our SMTP
      const { emailService } = await import('../services/email.service.js');
      const emailSent = await emailService.send({
        to: email,
        subject: '🔐 איפוס סיסמה - STANNEL',
        html: `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #060f1f; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, rgba(26, 58, 107, 0.9) 0%, rgba(15, 35, 71, 0.95) 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.4); border: 1px solid rgba(212, 175, 55, 0.3);">
    <div style="background: linear-gradient(135deg, #1a3a6b 0%, #0f2347 100%); padding: 40px; text-align: center; border-bottom: 2px solid rgba(212, 175, 55, 0.4);">
      <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #d4af37 0%, #f5d77e 100%); border-radius: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(212, 175, 55, 0.4);">
        <span style="color: #1a3a6b; font-size: 40px; font-weight: bold;">S</span>
      </div>
      <h1 style="color: #d4af37; margin: 0; font-size: 28px;">איפוס סיסמה</h1>
    </div>
    <div style="padding: 40px;">
      <div style="background: rgba(255,255,255,0.07); border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 1px solid rgba(255,255,255,0.15);">
        <h2 style="color: white; margin: 0 0 15px 0; font-size: 20px;">שלום ${user.name || ''}! 👋</h2>
        <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 16px; line-height: 1.6;">
          קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ על הכפתור למטה כדי לבחור סיסמה חדשה.
        </p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f5d77e 100%); color: #1a3a6b; padding: 16px 48px; border-radius: 12px; font-size: 18px; font-weight: bold; text-decoration: none; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);">
          איפוס סיסמה
        </a>
      </div>
      <div style="background: rgba(212, 175, 55, 0.1); border-radius: 12px; padding: 20px; border: 1px solid rgba(212, 175, 55, 0.2);">
        <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 14px; text-align: center;">
          אם לא ביקשת לאפס את הסיסמה, ניתן להתעלם מהודעה זו.
          <br/>הקישור תקף לשעה אחת בלבד.
        </p>
      </div>
    </div>
    <div style="background: rgba(0,0,0,0.3); padding: 25px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
      <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 0;">© 2026 STANNEL. כל הזכויות שמורות.</p>
    </div>
  </div>
</body>
</html>
        `,
      });

      if (emailSent) {
        console.log(`[Auth] Password reset email sent to ${email}`);
      } else {
        console.error(`[Auth] PASSWORD RESET EMAIL FAILED for ${email} - check GMAIL_APP_PASSWORD env var`);
      }
      return { success: true };
    } catch (err: any) {
      console.error('[Auth] Password reset error:', err);
      // Still return success to prevent email enumeration
      return { success: true };
    }
  });
}
