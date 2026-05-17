const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const suppliers = await prisma.user.findMany({
    where: { role: 'SUPPLIER' },
    select: { id: true, name: true, email: true, role: true, company: true }
  });
  console.log('Suppliers found:', suppliers.length);
  console.log(JSON.stringify(suppliers, null, 2));
  await prisma.$disconnect();
}

check();
