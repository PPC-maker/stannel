const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function exportProdData() {
  console.log('Exporting PRODUCTION data...\n');

  const prod = new PrismaClient({
    datasources: { db: { url: 'postgresql://postgres:StannelDb2026Secure@35.252.24.88/stannel' } }
  });

  try {
    const data = {
      timestamp: new Date().toISOString(),
      description: 'Production Export 14:00',
      users: await prod.user.findMany({ include: { architectProfile: true, supplierProfile: true } }),
      invoices: await prod.invoice.findMany(),
      events: await prod.event.findMany(),
      products: await prod.product.findMany(),
      cardTransactions: await prod.cardTransaction.findMany(),
      eventRegistrations: await prod.eventRegistration.findMany(),
      redemptions: await prod.redemption.findMany(),
      notifications: await prod.notification.findMany(),
      contracts: await prod.contract.findMany(),
    };

    const filename = `PROD-DATA-14-00.json`;
    fs.writeFileSync(`../${filename}`, JSON.stringify(data, null, 2));

    console.log('=== PRODUCTION EXPORT COMPLETE ===');
    console.log('File:', filename);
    console.log('Users:', data.users.length);
    console.log('Invoices:', data.invoices.length);
    console.log('Events:', data.events.length);
    console.log('Products:', data.products.length);
    console.log('Card Transactions:', data.cardTransactions.length);
    console.log('Event Registrations:', data.eventRegistrations.length);
    console.log('Redemptions:', data.redemptions.length);
    console.log('Notifications:', data.notifications.length);
    console.log('Contracts:', data.contracts.length);

    return data;
  } finally {
    await prod.$disconnect();
  }
}

exportProdData().catch(console.error);
