const { PrismaClient } = require('@prisma/client');

const localDb = new PrismaClient({
  datasources: { db: { url: 'postgresql://stannel:stannel@localhost:5432/stannel?schema=public' } }
});

const prodDb = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:StannelDb2026Secure@35.252.24.88/stannel' } }
});

async function syncUsers() {
  console.log('=== SYNC LOCAL → PRODUCTION ===');
  console.log('(Keeping ADMIN user intact)\n');

  // Step 1: Get local users (excluding admin)
  console.log('1. Getting local users (non-admin)...');
  const localUsers = await localDb.user.findMany({
    where: { role: { not: 'ADMIN' } },
    include: {
      architectProfile: true,
      supplierProfile: true
    }
  });
  console.log(`   Found ${localUsers.length} local users to sync\n`);

  // Step 2: Delete all production data EXCEPT admin
  console.log('2. Clearing production database (keeping ADMIN)...');

  // Get admin user to preserve
  const adminUser = await prodDb.user.findFirst({ where: { role: 'ADMIN' } });
  if (adminUser) {
    console.log(`   Preserving admin: ${adminUser.email}`);
  }

  // Delete non-admin users and their related data
  const nonAdminUsers = await prodDb.user.findMany({
    where: { role: { not: 'ADMIN' } },
    select: { id: true }
  });
  const nonAdminIds = nonAdminUsers.map(u => u.id);

  // Get architect/supplier profile IDs for these users
  const archProfiles = await prodDb.architectProfile.findMany({
    where: { userId: { in: nonAdminIds } },
    select: { id: true }
  });
  const archIds = archProfiles.map(p => p.id);

  const suppProfiles = await prodDb.supplierProfile.findMany({
    where: { userId: { in: nonAdminIds } },
    select: { id: true }
  });
  const suppIds = suppProfiles.map(p => p.id);

  // Delete related records
  if (archIds.length > 0) {
    await prodDb.invoice.deleteMany({ where: { architectId: { in: archIds } } });
    await prodDb.cardTransaction.deleteMany({ where: { architectId: { in: archIds } } });
    await prodDb.redemption.deleteMany({ where: { architectId: { in: archIds } } });
    await prodDb.goalBonus.deleteMany({ where: { architectId: { in: archIds } } });
  }

  if (suppIds.length > 0) {
    await prodDb.invoice.deleteMany({ where: { supplierId: { in: suppIds } } });
    await prodDb.contract.deleteMany({ where: { supplierId: { in: suppIds } } });
    await prodDb.supplierGoal.deleteMany({ where: { supplierId: { in: suppIds } } });
  }

  // Delete profiles
  await prodDb.architectProfile.deleteMany({ where: { userId: { in: nonAdminIds } } });
  await prodDb.supplierProfile.deleteMany({ where: { userId: { in: nonAdminIds } } });
  await prodDb.eventRegistration.deleteMany({ where: { userId: { in: nonAdminIds } } });
  await prodDb.auditLog.deleteMany({ where: { userId: { in: nonAdminIds } } });

  // Delete non-admin users
  await prodDb.user.deleteMany({ where: { role: { not: 'ADMIN' } } });

  console.log('   Production cleared (admin preserved)!\n');

  // Step 3: Copy local users to production
  console.log('3. Copying local users to production...');

  for (const user of localUsers) {
    // Create user
    await prodDb.user.create({
      data: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        rank: user.rank,
        isActive: user.isActive,
        activatedAt: user.activatedAt,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
    console.log(`   ✓ Created user: ${user.email} (${user.role})`);

    // Create architect profile if exists
    if (user.architectProfile) {
      await prodDb.architectProfile.create({
        data: {
          id: user.architectProfile.id,
          userId: user.id,
          pointsBalance: user.architectProfile.pointsBalance,
          cashBalance: user.architectProfile.cashBalance,
          totalEarned: user.architectProfile.totalEarned,
          totalRedeemed: user.architectProfile.totalRedeemed,
          cardNumber: user.architectProfile.cardNumber,
          cardExpiry: user.architectProfile.cardExpiry,
          monthlyGoal: user.architectProfile.monthlyGoal,
          monthlyProgress: user.architectProfile.monthlyProgress
        }
      });
      console.log(`     + Architect profile created`);
    }

    // Create supplier profile if exists
    if (user.supplierProfile) {
      await prodDb.supplierProfile.create({
        data: {
          id: user.supplierProfile.id,
          userId: user.id,
          companyName: user.supplierProfile.companyName,
          trustScore: user.supplierProfile.trustScore,
          qualityScore: user.supplierProfile.qualityScore
        }
      });
      console.log(`     + Supplier profile created`);
    }
  }

  console.log('\n=== SYNC COMPLETE ===');

  // Verify
  const prodUsers = await prodDb.user.findMany({ orderBy: { createdAt: 'asc' } });
  console.log(`\nProduction now has ${prodUsers.length} users:`);
  prodUsers.forEach(u => console.log(`  - ${u.email} (${u.role})${u.role === 'ADMIN' ? ' [PRESERVED]' : ''}`));
}

syncUsers()
  .catch(console.error)
  .finally(async () => {
    await localDb.$disconnect();
    await prodDb.$disconnect();
  });
