const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function backup() {
  console.log('Creating PRODUCTION backup at 14:00...\n');

  const prod = new PrismaClient({
    datasources: { db: { url: 'postgresql://postgres:StannelDb2026Secure@35.252.24.88/stannel' } }
  });

  try {
    const backup = {
      timestamp: new Date().toISOString(),
      description: 'Production Backup 14:00',
      production: {
        users: await prod.user.findMany({ include: { architectProfile: true, supplierProfile: true } }),
        invoices: await prod.invoice.findMany(),
        events: await prod.event.findMany(),
        products: await prod.product.findMany(),
        walletTransactions: await prod.walletTransaction.findMany(),
        eventRegistrations: await prod.eventRegistration.findMany(),
        redemptions: await prod.redemption.findMany(),
      }
    };

    const filename = `BACKUP-PROD-14-00-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(`../${filename}`, JSON.stringify(backup, null, 2));

    console.log('=== PRODUCTION BACKUP COMPLETE ===');
    console.log('File:', filename);
    console.log('Users:', backup.production.users.length);
    console.log('Invoices:', backup.production.invoices.length);
    console.log('Events:', backup.production.events.length);
    console.log('Products:', backup.production.products.length);
    console.log('Wallet Transactions:', backup.production.walletTransactions.length);
    console.log('Event Registrations:', backup.production.eventRegistrations.length);
    console.log('Redemptions:', backup.production.redemptions.length);
  } finally {
    await prod.$disconnect();
  }
}

backup().catch(console.error);
