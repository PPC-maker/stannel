const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function backup() {
  console.log("Starting backup...");
  const now = new Date();
  const dateStr = `${now.getDate()}-${now.getMonth()+1}-${now.getFullYear().toString().slice(-2)}`;
  const timeStr = `${now.getHours()}-${now.getMinutes().toString().padStart(2,'0')}`;
  const backupName = `${timeStr}-${dateStr}`;

  const data = {
    timestamp: now.toISOString(),
    backup_name: backupName,
    users: await prisma.user.findMany({ include: { architectProfile: true, supplierProfile: true }}),
    products: await prisma.product.findMany(),
    invoices: await prisma.invoice.findMany({ include: { statusHistory: true }}),
    events: await prisma.event.findMany({ include: { registrations: true }}),
    redemptions: await prisma.redemption.findMany(),
    contracts: await prisma.contract.findMany(),
    notifications: await prisma.notification.findMany(),
    cardTransactions: await prisma.cardTransaction.findMany(),
    supplierCardTransactions: await prisma.supplierCardTransaction.findMany(),
    auditLogs: await prisma.auditLog.findMany(),
    systemLogs: await prisma.systemLog.findMany({ take: 100, orderBy: { createdAt: 'desc' }})
  };

  const filename = `backups/backup-${backupName}.json`;
  fs.mkdirSync('backups', { recursive: true });
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log("Backup created:", filename);
  console.log("Users:", data.users.length);
  console.log("Products:", data.products.length);
  console.log("Invoices:", data.invoices.length);
  console.log("Events:", data.events.length);
  console.log("Redemptions:", data.redemptions.length);
  console.log("Contracts:", data.contracts.length);
  console.log("Notifications:", data.notifications.length);
  console.log("Card Transactions:", data.cardTransactions.length);
  console.log("Supplier Card Transactions:", data.supplierCardTransactions.length);

  await prisma.$disconnect();
}

backup().catch(e => {
  console.error(e);
  process.exit(1);
});
