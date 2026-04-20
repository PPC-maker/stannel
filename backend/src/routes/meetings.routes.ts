import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireArchitect } from '../middleware/auth.middleware.js';
import { notificationService } from '../services/notification.service.js';

export async function meetingsRoutes(server: FastifyInstance) {
  server.addHook('preHandler', authMiddleware);

  // Create meeting request (architect → supplier)
  server.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    if (user.role !== 'ARCHITECT') {
      return reply.code(403).send({ error: 'Only architects can request meetings' });
    }

    const body = request.body as {
      supplierId: string;
      date: string;
      time: string;
      subject: string;
      notes?: string;
    };

    if (!body.supplierId || !body.date || !body.time || !body.subject) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }

    const architect = await prisma.architectProfile.findUnique({
      where: { userId: user.id },
    });

    if (!architect) {
      return reply.code(404).send({ error: 'Architect profile not found' });
    }

    const supplier = await prisma.supplierProfile.findUnique({
      where: { id: body.supplierId },
      include: { user: true },
    });

    if (!supplier) {
      return reply.code(404).send({ error: 'Supplier not found' });
    }

    const meeting = await prisma.meeting.create({
      data: {
        architectId: architect.id,
        supplierId: body.supplierId,
        date: new Date(body.date),
        time: body.time,
        subject: body.subject,
        notes: body.notes,
      },
      include: {
        architect: { include: { user: { select: { name: true, email: true } } } },
        supplier: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    // Notify supplier
    await notificationService.send(supplier.userId, {
      title: 'בקשת פגישה חדשה',
      body: `${user.name} מבקש פגישה בנושא: ${body.subject}`,
      data: { type: 'MEETING_REQUEST', meetingId: meeting.id },
    });

    return meeting;
  });

  // Get my meetings (architect or supplier)
  server.get('/', async (request: FastifyRequest) => {
    const user = request.user!;
    const query = request.query as { status?: string };

    let where: any = {};

    if (user.role === 'ARCHITECT') {
      const architect = await prisma.architectProfile.findUnique({ where: { userId: user.id } });
      if (!architect) return { data: [] };
      where.architectId = architect.id;
    } else if (user.role === 'SUPPLIER') {
      const supplier = await prisma.supplierProfile.findUnique({ where: { userId: user.id } });
      if (!supplier) return { data: [] };
      where.supplierId = supplier.id;
    } else {
      return { data: [] };
    }

    if (query.status) {
      where.status = query.status;
    }

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        architect: { include: { user: { select: { name: true, email: true, profileImage: true } } } },
        supplier: { select: { companyName: true, user: { select: { name: true, email: true } } } },
      },
      orderBy: { date: 'asc' },
    });

    return { data: meetings };
  });

  // Update meeting status (supplier approves/rejects)
  server.patch('/:id/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: 'approved' | 'rejected' };

    if (!['approved', 'rejected'].includes(status)) {
      return reply.code(400).send({ error: 'Invalid status' });
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        supplier: true,
        architect: { include: { user: true } },
      },
    });

    if (!meeting) {
      return reply.code(404).send({ error: 'Meeting not found' });
    }

    // Verify supplier owns this meeting
    if (user.role === 'SUPPLIER') {
      const supplier = await prisma.supplierProfile.findUnique({ where: { userId: user.id } });
      if (!supplier || supplier.id !== meeting.supplierId) {
        return reply.code(403).send({ error: 'Unauthorized' });
      }
    } else if (user.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Only supplier or admin can update meeting status' });
    }

    const updated = await prisma.meeting.update({
      where: { id },
      data: { status },
    });

    // Notify architect
    const statusText = status === 'approved' ? 'אושרה' : 'נדחתה';
    await notificationService.send(meeting.architect.userId, {
      title: `הפגישה ${statusText}`,
      body: `הפגישה בנושא "${meeting.subject}" ${statusText}`,
      data: { type: 'MEETING_STATUS', meetingId: id, status },
    });

    return updated;
  });

  // Upload document for a meeting (architect sends PDF to supplier)
  server.post('/:id/document', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = request.params as { id: string };

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        supplier: { include: { user: true } },
        architect: { include: { user: true } },
      },
    });

    if (!meeting) {
      return reply.code(404).send({ error: 'Meeting not found' });
    }

    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    const buffer = await data.toBuffer();
    const { storageService } = await import('../services/storage.service.js');
    const url = await storageService.uploadAsset(buffer, 'meetings', `${id}-${Date.now()}.pdf`);

    await prisma.meeting.update({
      where: { id },
      data: { documentUrl: url },
    });

    // Send email notification to supplier
    try {
      const { emailService } = await import('../services/email.service.js');
      await emailService.send({
        to: meeting.supplier.user.email,
        subject: `מסמך חדש מ-${meeting.architect.user.name}`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>מסמך חדש התקבל</h2>
            <p>${meeting.architect.user.name} שלח/ה מסמך בנושא: <strong>${meeting.subject}</strong></p>
            <p><a href="${url}" style="background: #10b981; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none;">צפייה במסמך</a></p>
          </div>
        `,
      });
    } catch (e) {
      // Email is best-effort, don't fail the request
      console.error('Failed to send email:', e);
    }

    return { success: true, documentUrl: url };
  });

  // Cancel meeting (architect can cancel their own)
  server.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = request.params as { id: string };

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: { architect: true },
    });

    if (!meeting) {
      return reply.code(404).send({ error: 'Meeting not found' });
    }

    if (user.role === 'ARCHITECT') {
      const architect = await prisma.architectProfile.findUnique({ where: { userId: user.id } });
      if (!architect || architect.id !== meeting.architectId) {
        return reply.code(403).send({ error: 'Unauthorized' });
      }
    } else if (user.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Unauthorized' });
    }

    await prisma.meeting.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return { success: true };
  });
}
