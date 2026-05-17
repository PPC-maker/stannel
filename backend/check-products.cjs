const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== All Products ===');
  const allProducts = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      isActive: true,
      stock: true,
      pointCost: true,
      imageUrl: true,
      createdAt: true,
    }
  });
  console.log('Total products:', allProducts.length);
  allProducts.forEach(p => {
    console.log(`- ${p.name}: active=${p.isActive}, stock=${p.stock}, points=${p.pointCost}, image=${p.imageUrl ? 'YES' : 'NO'}`);
  });

  console.log('\n=== Products visible to users (isActive && stock > 0) ===');
  const visibleProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 },
    },
    select: {
      id: true,
      name: true,
      stock: true,
    }
  });
  console.log('Visible products:', visibleProducts.length);
  visibleProducts.forEach(p => console.log(`- ${p.name}: stock=${p.stock}`));
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
