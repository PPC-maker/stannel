const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function backup() {
  console.log("Starting production backup 13:00 9-4-26...");

  const data = {
    timestamp: new Date().toISOString(),
    backup_name: "13-00-9-4-26",
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

  fs.writeFileSync("backup-13-00-9-4-26.json", JSON.stringify(data, null, 2));
  console.log("Backup created: backup-13-00-9-4-26.json");
  console.log("Users:", data.users.length);
  console.log("Products:", data.products.length);
  console.log("Invoices:", data.invoices.length);
  console.log("Events:", data.events.length);

  await prisma.$disconnect();
}

backup().catch(e => {
  console.error(e);
  process.exit(1);
});
