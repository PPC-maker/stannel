const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function syncProdToLocal() {
  console.log('=== SYNCING PRODUCTION TO LOCAL ===\n');

  // Read production data
  const prodData = JSON.parse(fs.readFileSync('../PROD-DATA-14-00.json', 'utf8'));
  console.log('Loaded production data from:', prodData.timestamp);

  const local = new PrismaClient({
    datasources: { db: { url: 'postgresql://stannel:stannel@localhost:5432/stannel?schema=public' } }
  });

  try {
    // Clear local data first
    console.log('\n1. Clearing local data...');
    await local.eventRegistration.deleteMany();
    await local.cardTransaction.deleteMany();
    await local.supplierCardTransaction.deleteMany();
    await local.redemption.deleteMany();
    await local.notification.deleteMany();
    await local.invoiceStatusHistory.deleteMany();
    await local.invoice.deleteMany();
    await local.contract.deleteMany();
    await local.goalBonus.deleteMany();
    await local.bonusTransaction.deleteMany();
    await local.architectGoal.deleteMany();
    await local.supplierGoal.deleteMany();
    await local.supplierPayment.deleteMany();
    await local.product.deleteMany();
    await local.event.deleteMany();
    await local.architectProfile.deleteMany();
    await local.supplierProfile.deleteMany();
    await local.auditLog.deleteMany();
    await local.profileView.deleteMany();
    await local.user.deleteMany();
    console.log('   Done clearing.');

    // Import users
    console.log('\n2. Importing users...');
    for (const user of prodData.users) {
      const { architectProfile, supplierProfile, ...userData } = user;

      await local.user.create({
        data: {
          ...userData,
          architectProfile: architectProfile ? {
            create: {
              id: architectProfile.id,
              pointsBalance: architectProfile.pointsBalance,
              cashBalance: architectProfile.cashBalance,
              totalEarned: architectProfile.totalEarned,
              totalRedeemed: architectProfile.totalRedeemed,
              cardNumber: architectProfile.cardNumber,
              cardExpiry: architectProfile.cardExpiry,
              monthlyGoal: architectProfile.monthlyGoal,
              monthlyProgress: architectProfile.monthlyProgress,
              trustLevel: architectProfile.trustLevel || 'BRONZE',
              monthlyLimit: architectProfile.monthlyLimit || 5000,
              monthlySpent: architectProfile.monthlySpent || 0,
              onboardingStatus: architectProfile.onboardingStatus || 'pending_review',
              businessId: architectProfile.businessId,
            }
          } : undefined,
          supplierProfile: supplierProfile ? {
            create: {
              id: supplierProfile.id,
              companyName: supplierProfile.companyName,
              trustScore: supplierProfile.trustScore,
              qualityScore: supplierProfile.qualityScore,
              pointsBalance: supplierProfile.pointsBalance || 0,
              totalEarned: supplierProfile.totalEarned || 0,
              totalRedeemed: supplierProfile.totalRedeemed || 0,
              cardNumber: supplierProfile.cardNumber,
              onboardingStatus: supplierProfile.onboardingStatus || 'pending_review',
              status: supplierProfile.status || 'active',
            }
          } : undefined,
        }
      });
      console.log(`   + ${user.name} (${user.role})`);
    }

    // Import products
    console.log('\n3. Importing products...');
    for (const product of prodData.products) {
      // Handle schema changes - remove cashCost if present
      const { cashCost, ...productData } = product;
      await local.product.create({
        data: {
          ...productData,
          pointsPerShekel: productData.pointsPerShekel || 100
        }
      });
      console.log(`   + ${product.name}`);
    }

    // Import events
    console.log('\n4. Importing events...');
    for (const event of prodData.events) {
      const { registrations, ...eventData } = event;
      await local.event.create({ data: eventData });
      console.log(`   + ${event.title}`);
    }

    // Import contracts
    console.log('\n5. Importing contracts...');
    for (const contract of prodData.contracts) {
      await local.contract.create({ data: contract });
      console.log(`   + Contract for supplier ${contract.supplierId}`);
    }

    // Import invoices
    console.log('\n6. Importing invoices...');
    for (const invoice of prodData.invoices) {
      const { statusHistory, ...invoiceData } = invoice;
      await local.invoice.create({ data: invoiceData });
      console.log(`   + Invoice ${invoice.id.slice(-6)} - ₪${invoice.amount}`);
    }

    // Import card transactions
    console.log('\n7. Importing card transactions...');
    for (const tx of prodData.cardTransactions) {
      await local.cardTransaction.create({ data: tx });
      console.log(`   + ${tx.type} ₪${tx.amount}`);
    }

    // Import event registrations
    console.log('\n8. Importing event registrations...');
    for (const reg of prodData.eventRegistrations) {
      await local.eventRegistration.create({ data: reg });
      console.log(`   + Registration ${reg.id.slice(-6)}`);
    }

    console.log('\n=== SYNC COMPLETE ===');
    console.log('Local database now matches production!');
    console.log('\nSummary:');
    console.log(`  Users: ${prodData.users.length}`);
    console.log(`  Products: ${prodData.products.length}`);
    console.log(`  Events: ${prodData.events.length}`);
    console.log(`  Contracts: ${prodData.contracts.length}`);
    console.log(`  Invoices: ${prodData.invoices.length}`);
    console.log(`  Card Transactions: ${prodData.cardTransactions.length}`);
    console.log(`  Event Registrations: ${prodData.eventRegistrations.length}`);

  } finally {
    await local.$disconnect();
  }
}

syncProdToLocal().catch(console.error);
