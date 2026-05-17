const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const users = await prisma.user.count();
  const invoices = await prisma.invoice.count();
  const products = await prisma.product.count();
  const events = await prisma.event.count();
  const contracts = await prisma.supplierContract.count();
  const transactions = await prisma.cardTransaction.count();
  console.log('=== Local DB Status ===');
  console.log('Users:', users);
  console.log('Invoices:', invoices);
  console.log('Products:', products);
  console.log('Events:', events);
  console.log('Contracts:', contracts);
  console.log('Transactions:', transactions);
  await prisma.$disconnect();
}
check().catch(e => console.error(e));
