// Database Seed Script
// Run with: npx tsx src/prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user (you'll need to create this in Firebase first)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@stannel.app' },
    update: {},
    create: {
      firebaseUid: 'admin-firebase-uid', // Replace with actual Firebase UID
      email: 'admin@stannel.app',
      name: 'מנהל מערכת',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', adminUser.email);

  // Create sample supplier
  const supplierUser = await prisma.user.upsert({
    where: { email: 'supplier@example.com' },
    update: {},
    create: {
      firebaseUid: 'supplier-firebase-uid', // Replace with actual Firebase UID
      email: 'supplier@example.com',
      name: 'ספק לדוגמה',
      role: 'SUPPLIER',
      isActive: true,
      supplierProfile: {
        create: {
          companyName: 'חברת דוגמה בע"מ',
          trustScore: 5.0,
          qualityScore: 5.0,
        },
      },
    },
    include: { supplierProfile: true },
  });
  console.log('✅ Supplier user created:', supplierUser.email);

  // Create sample architect
  const architectUser = await prisma.user.upsert({
    where: { email: 'architect@example.com' },
    update: {},
    create: {
      firebaseUid: 'architect-firebase-uid', // Replace with actual Firebase UID
      email: 'architect@example.com',
      name: 'אדריכל לדוגמה',
      role: 'ARCHITECT',
      isActive: true,
      rank: 'GOLD',
      architectProfile: {
        create: {
          pointsBalance: 5000,
          cashBalance: 250,
          totalEarned: 10000,
          totalRedeemed: 5000,
          monthlyGoal: 20000,
          monthlyProgress: 15000,
        },
      },
    },
    include: { architectProfile: true },
  });
  console.log('✅ Architect user created:', architectUser.email);

  // Create sample products
  const products = [
    {
      name: 'שובר מתנה 100 ש"ח',
      description: 'שובר לרכישה בחנויות נבחרות',
      imageUrl: '/images/products/gift-card-100.jpg',
      pointCost: 1000,
      cashCost: 0,
      stock: 100,
    },
    {
      name: 'שובר מתנה 250 ש"ח',
      description: 'שובר לרכישה בחנויות נבחרות',
      imageUrl: '/images/products/gift-card-250.jpg',
      pointCost: 2500,
      cashCost: 0,
      stock: 50,
    },
    {
      name: 'ארוחת שף זוגית',
      description: 'חוויה קולינרית במסעדת יוקרה',
      imageUrl: '/images/products/chef-dinner.jpg',
      pointCost: 5000,
      cashCost: 100,
      stock: 20,
    },
    {
      name: 'חופשה זוגית בצפון',
      description: 'לילה בצימר יוקרתי כולל ארוחת בוקר',
      imageUrl: '/images/products/vacation.jpg',
      pointCost: 10000,
      cashCost: 200,
      stock: 10,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.name.replace(/\s/g, '-').toLowerCase() },
      update: product,
      create: {
        ...product,
        id: product.name.replace(/\s/g, '-').toLowerCase(),
      },
    });
  }
  console.log('✅ Products created:', products.length);

  // Create sample events
  const events = [
    {
      title: 'ערב נטוורקינג לאדריכלים',
      description: 'הצטרפו אלינו לערב נטוורקינג בלעדי עם מיטב האדריכלים והספקים',
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      location: 'תל אביב - מלון דן',
      capacity: 100,
      isHidden: false,
    },
    {
      title: 'סדנת עיצוב פנים',
      description: 'סדנה מעשית בנושא טרנדים בעיצוב פנים 2025',
      date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      location: 'ירושלים - מרכז הקונגרסים',
      capacity: 50,
      isHidden: false,
    },
  ];

  for (const event of events) {
    await prisma.event.create({
      data: event,
    });
  }
  console.log('✅ Events created:', events.length);

  // Create contract for supplier
  if (supplierUser.supplierProfile) {
    await prisma.contract.create({
      data: {
        supplierId: supplierUser.supplierProfile.id,
        type: 'STANDARD',
        feePercent: 5.0,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isActive: true,
      },
    });
    console.log('✅ Supplier contract created');
  }

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
