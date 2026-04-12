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
}
