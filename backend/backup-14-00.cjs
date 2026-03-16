const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function backup() {
  console.log('Creating backup at 14:00...\n');

  const local = new PrismaClient({
    datasources: { db: { url: 'postgresql://stannel:stannel@localhost:5432/stannel?schema=public' } }
  });
  const prod = new PrismaClient({
    datasources: { db: { url: 'postgresql://postgres:StannelDb2026Secure@35.252.24.88/stannel' } }
  });

  const backup = {
    timestamp: new Date().toISOString(),
    description: 'Backup 14:00 - After sync local to production',
    local: {
      users: await local.user.findMany({ include: { architectProfile: true, supplierProfile: true } }),
      events: await local.event.findMany(),
      products: await local.product.findMany(),
    },
    production: {
      users: await prod.user.findMany({ include: { architectProfile: true, supplierProfile: true } }),
      events: await prod.event.findMany(),
      products: await prod.product.findMany(),
    }
  };

  fs.writeFileSync('../BACKUP-14-00.json', JSON.stringify(backup, null, 2));

  console.log('=== BACKUP COMPLETE ===');
  console.log('File: BACKUP-14-00.json');
  console.log('Local users:', backup.local.users.length);
  console.log('Prod users:', backup.production.users.length);

  await local.$disconnect();
  await prod.$disconnect();
}

backup().catch(console.error);
