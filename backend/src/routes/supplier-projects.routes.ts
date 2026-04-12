// Supplier Projects Routes - For suppliers to manage their project portfolio

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

interface CreateProjectBody {
  title: string;
  description: string;
  location?: string;
  year?: number;
  area?: string;
  duration?: string;
  images?: string[];
}

interface UpdateProjectBody extends Partial<CreateProjectBody> {
  isActive?: boolean;
  order?: number;
}

export async function supplierProjectsRoutes(server: FastifyInstance) {
  // Apply auth middleware
  server.addHook('preHandler', authMiddleware);

  // Get all projects for a supplier (public - for viewing supplier profile)
  server.get('/supplier/:supplierId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { supplierId } = request.params as { supplierId: string };

      // Find supplier profile by user ID
      const supplierProfile = await prisma.supplierProfile.findFirst({
        where: {
          OR: [
            { id: supplierId },
            { userId: supplierId },
          ],
        },
      });

      if (!supplierProfile) {
        return reply.code(404).send({ error: 'Supplier not found' });
      }

      const projects = await prisma.supplierProject.findMany({
        where: {
          supplierId: supplierProfile.id,
          isActive: true,
        },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'desc' },
        ],
      });

      return { data: projects };
    } catch (error) {
      console.error('Error fetching supplier projects:', error);
      return reply.code(500).send({ error: 'Failed to fetch projects' });
    }
  });

  // Get single project by ID
  server.get('/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { projectId } = request.params as { projectId: string };

      const project = await prisma.supplierProject.findUnique({
        where: { id: projectId },
        include: {
          supplier: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      return project;
    } catch (error) {
      console.error('Error fetching project:', error);
      return reply.code(500).send({ error: 'Failed to fetch project' });
    }
  });

  // Get my projects (for supplier dashboard)
  server.get('/my', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;

      if (user.role !== 'SUPPLIER') {
        return reply.code(403).send({ error: 'Only suppliers can access this endpoint' });
      }

      const supplierProfile = await prisma.supplierProfile.findUnique({
        where: { userId: user.id },
      });

      if (!supplierProfile) {
        return reply.code(404).send({ error: 'Supplier profile not found' });
      }

      const projects = await prisma.supplierProject.findMany({
        where: { supplierId: supplierProfile.id },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'desc' },
        ],
      });

      return { data: projects };
    } catch (error) {
      console.error('Error fetching my projects:', error);
      return reply.code(500).send({ error: 'Failed to fetch projects' });
    }
  });

  // Create new project
  server.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const body = request.body as CreateProjectBody;

      if (user.role !== 'SUPPLIER') {
        return reply.code(403).send({ error: 'Only suppliers can create projects' });
      }

      const supplierProfile = await prisma.supplierProfile.findUnique({
        where: { userId: user.id },
      });

      if (!supplierProfile) {
        return reply.code(404).send({ error: 'Supplier profile not found' });
      }

      // Get the highest order number
      const lastProject = await prisma.supplierProject.findFirst({
        where: { supplierId: supplierProfile.id },
        orderBy: { order: 'desc' },
      });

      const project = await prisma.supplierProject.create({
        data: {
          supplierId: supplierProfile.id,
          title: body.title,
          description: body.description,
          location: body.location,
          year: body.year,
          area: body.area,
          duration: body.duration,
          images: body.images || [],
          order: lastProject ? lastProject.order + 1 : 0,
        },
      });

      return reply.code(201).send(project);
    } catch (error) {
      console.error('Error creating project:', error);
      return reply.code(500).send({ error: 'Failed to create project' });
    }
  });

  // Update project
  server.patch('/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { projectId } = request.params as { projectId: string };
      const body = request.body as UpdateProjectBody;

      if (user.role !== 'SUPPLIER') {
        return reply.code(403).send({ error: 'Only suppliers can update projects' });
      }

      const supplierProfile = await prisma.supplierProfile.findUnique({
        where: { userId: user.id },
      });

      if (!supplierProfile) {
        return reply.code(404).send({ error: 'Supplier profile not found' });
      }

      // Verify project belongs to this supplier
      const existingProject = await prisma.supplierProject.findFirst({
        where: {
          id: projectId,
          supplierId: supplierProfile.id,
        },
      });

      if (!existingProject) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      const project = await prisma.supplierProject.update({
        where: { id: projectId },
        data: {
          ...(body.title !== undefined && { title: body.title }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.location !== undefined && { location: body.location }),
          ...(body.year !== undefined && { year: body.year }),
          ...(body.area !== undefined && { area: body.area }),
          ...(body.duration !== undefined && { duration: body.duration }),
          ...(body.images !== undefined && { images: body.images }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
          ...(body.order !== undefined && { order: body.order }),
        },
      });

      return project;
    } catch (error) {
      console.error('Error updating project:', error);
      return reply.code(500).send({ error: 'Failed to update project' });
    }
  });

  // Delete project
  server.delete('/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { projectId } = request.params as { projectId: string };

      if (user.role !== 'SUPPLIER') {
        return reply.code(403).send({ error: 'Only suppliers can delete projects' });
      }

      const supplierProfile = await prisma.supplierProfile.findUnique({
        where: { userId: user.id },
      });

      if (!supplierProfile) {
        return reply.code(404).send({ error: 'Supplier profile not found' });
      }

      // Verify project belongs to this supplier
      const existingProject = await prisma.supplierProject.findFirst({
        where: {
          id: projectId,
          supplierId: supplierProfile.id,
        },
      });

      if (!existingProject) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      await prisma.supplierProject.delete({
        where: { id: projectId },
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting project:', error);
      return reply.code(500).send({ error: 'Failed to delete project' });
    }
  });

  // Reorder projects
  server.post('/reorder', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { projectIds } = request.body as { projectIds: string[] };

      if (user.role !== 'SUPPLIER') {
        return reply.code(403).send({ error: 'Only suppliers can reorder projects' });
      }

      const supplierProfile = await prisma.supplierProfile.findUnique({
        where: { userId: user.id },
      });

      if (!supplierProfile) {
        return reply.code(404).send({ error: 'Supplier profile not found' });
      }

      // Update order for each project
      await Promise.all(
        projectIds.map((id, index) =>
          prisma.supplierProject.updateMany({
            where: {
              id,
              supplierId: supplierProfile.id,
            },
            data: { order: index },
          })
        )
      );

      return { success: true };
    } catch (error) {
      console.error('Error reordering projects:', error);
      return reply.code(500).send({ error: 'Failed to reorder projects' });
    }
  });
}
