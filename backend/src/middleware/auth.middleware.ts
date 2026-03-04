// Auth Middleware - Firebase Token Verification

import { FastifyRequest, FastifyReply } from 'fastify';
import { getAuth } from 'firebase-admin/auth';
import prisma from '../lib/prisma.js';
import type { UserRole } from '@stannel/types';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      firebaseUid: string;
      email: string;
      name: string;
      role: UserRole;
      isActive: boolean;
      architectProfile?: {
        id: string;
        pointsBalance: number;
        cashBalance: number;
      };
      supplierProfile?: {
        id: string;
        companyName: string;
      };
    };
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Unauthorized', message: 'Missing authorization token' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Verify Firebase token
    const decoded = await getAuth().verifyIdToken(token);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      include: {
        architectProfile: {
          select: {
            id: true,
            pointsBalance: true,
            cashBalance: true,
          },
        },
        supplierProfile: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'User not found' });
    }

    if (!user.isActive) {
      return reply.code(403).send({ error: 'Forbidden', message: 'Account not activated' });
    }

    // Attach user to request
    request.user = {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      isActive: user.isActive,
      architectProfile: user.architectProfile || undefined,
      supplierProfile: user.supplierProfile || undefined,
    };
  } catch (error) {
    return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid token' });
  }
}

// Role-based access control middleware
export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Not authenticated' });
    }

    if (!roles.includes(request.user.role)) {
      return reply.code(403).send({ error: 'Forbidden', message: 'Insufficient permissions' });
    }
  };
}

// Require architect role
export async function requireArchitect(request: FastifyRequest, reply: FastifyReply) {
  return requireRole('ARCHITECT')(request, reply);
}

// Require supplier role
export async function requireSupplier(request: FastifyRequest, reply: FastifyReply) {
  return requireRole('SUPPLIER')(request, reply);
}

// Require admin role
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  return requireRole('ADMIN')(request, reply);
}
