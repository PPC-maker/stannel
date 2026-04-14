// Suppliers Directory Routes - Public access for architects to browse suppliers

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

export async function suppliersDirectoryRoutes(server: FastifyInstance) {
  // Apply auth middleware - architects need to be logged in to view suppliers
  server.addHook('preHandler', authMiddleware);

  // Get all suppliers for directory (public listing)
  server.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('Fetching suppliers...');

      const suppliers = await prisma.user.findMany({
        where: { role: 'SUPPLIER' },
        include: { supplierProfile: true },
      });

      console.log('Found suppliers:', suppliers.length);

      const data = suppliers.map((supplier) => ({
        id: supplier.id, // Always use User ID for consistency
        companyName: supplier.supplierProfile?.companyName || supplier.company || supplier.name,
        description: supplier.supplierProfile?.description || null,
        phone: supplier.supplierProfile?.phone || supplier.phone || null,
        address: supplier.supplierProfile?.address || supplier.address || null,
        website: supplier.supplierProfile?.website || null,
        businessImages: supplier.supplierProfile?.businessImages || [],
        user: {
          name: supplier.name,
          email: supplier.email,
        },
        profileImage: supplier.profileImage,
      }));

      return {
        data,
        total: suppliers.length,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      };
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return reply.code(500).send({ error: 'Failed to fetch suppliers', details: String(error) });
    }
  });

  // Get single supplier profile by User ID
  server.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      console.log('Fetching supplier by User ID:', id);

      // Find user with supplier role
      const user = await prisma.user.findFirst({
        where: { id, role: 'SUPPLIER' },
        include: {
          supplierProfile: {
            include: {
              products: {
                take: 10,
              },
            },
          },
        },
      });

      if (!user) {
        console.log('Supplier not found for ID:', id);
        return reply.code(404).send({ error: 'Supplier not found' });
      }

      console.log('Found supplier:', user.name);

      // Return formatted data
      return {
        id: user.id,
        companyName: user.supplierProfile?.companyName || user.company || user.name,
        description: user.supplierProfile?.description || null,
        phone: user.supplierProfile?.phone || user.phone || null,
        address: user.supplierProfile?.address || user.address || null,
        website: user.supplierProfile?.website || null,
        facebook: user.supplierProfile?.facebook || null,
        instagram: user.supplierProfile?.instagram || null,
        linkedin: user.supplierProfile?.linkedin || null,
        businessImages: user.supplierProfile?.businessImages || [],
        profileImage: user.profileImage,
        user: {
          name: user.name,
          email: user.email,
        },
        products: user.supplierProfile?.products || [],
      };
    } catch (error) {
      console.error('Error fetching supplier by ID:', error);
      return reply.code(500).send({ error: 'Failed to fetch supplier', details: String(error) });
    }
  });

  // Send meeting request to supplier
  server.post('/:id/meeting-request', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { phone, message } = request.body as { phone: string; message?: string };

    if (!phone) {
      return reply.code(400).send({ error: 'נא להזין מספר טלפון' });
    }

    // Find supplier user
    const supplier = await prisma.user.findFirst({
      where: { supplierProfile: { id } },
      include: { supplierProfile: true },
    });

    if (!supplier) {
      // Try finding by user ID
      const supplierByUser = await prisma.user.findUnique({
        where: { id },
        include: { supplierProfile: true },
      });
      if (!supplierByUser?.supplierProfile) {
        return reply.code(404).send({ error: 'ספק לא נמצא' });
      }
    }

    const supplierUser = supplier || await prisma.user.findUnique({ where: { id }, include: { supplierProfile: true } });
    if (!supplierUser) {
      return reply.code(404).send({ error: 'ספק לא נמצא' });
    }

    const senderName = request.user?.name || 'משתמש';
    const senderEmail = request.user?.email || '';
    const companyName = supplierUser.supplierProfile?.companyName || supplierUser.name;

    // Create notification for supplier
    await prisma.notification.create({
      data: {
        recipientId: supplierUser.id,
        type: 'MEETING_REQUEST',
        title: `בקשת תיאום פגישה מ-${senderName}`,
        message: `טלפון: ${phone}${message ? `\nהודעה: ${message}` : ''}`,
        relatedEntity: 'meeting',
        relatedId: request.user?.id,
      },
    });

    // Send email to supplier
    try {
      const { emailService } = await import('../services/email.service.js');
      await emailService.send({
        to: supplierUser.email,
        subject: `בקשת תיאום פגישה חדשה - STANNEL CLUB`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0f2620, #1a4a3a); padding: 30px; border-radius: 16px; color: white; text-align: center; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 24px;">STANNEL CLUB</h1>
              <p style="margin: 8px 0 0; opacity: 0.8;">בקשת תיאום פגישה חדשה</p>
            </div>
            <div style="background: #f8f9fa; padding: 24px; border-radius: 12px; border: 1px solid #e9ecef;">
              <h2 style="color: #0f2620; margin-top: 0;">שלום ${companyName},</h2>
              <p style="color: #495057;">קיבלת בקשת תיאום פגישה חדשה:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px; color: #6c757d; border-bottom: 1px solid #dee2e6;">שם:</td><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #dee2e6;">${senderName}</td></tr>
                <tr><td style="padding: 8px; color: #6c757d; border-bottom: 1px solid #dee2e6;">אימייל:</td><td style="padding: 8px; border-bottom: 1px solid #dee2e6;">${senderEmail}</td></tr>
                <tr><td style="padding: 8px; color: #6c757d; border-bottom: 1px solid #dee2e6;">טלפון:</td><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #dee2e6;">${phone}</td></tr>
                ${message ? `<tr><td style="padding: 8px; color: #6c757d;">הודעה:</td><td style="padding: 8px;">${message}</td></tr>` : ''}
              </table>
              <div style="text-align: center; margin-top: 24px;">
                <a href="https://stannel-web-t5yfdlp7wq-zf.a.run.app/supplier/messages" style="background: #10b981; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">צפה בהודעות</a>
              </div>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send meeting request email:', emailError);
    }

    // Broadcast via WebSocket
    try {
      const { wsService } = await import('../services/websocket.service.js');
      wsService.sendToUser(supplierUser.id, 'notification:new', {
        type: 'MEETING_REQUEST',
        title: `בקשת תיאום פגישה מ-${senderName}`,
      });
    } catch {}

    return { success: true, message: 'הבקשה נשלחה בהצלחה' };
  });
}
