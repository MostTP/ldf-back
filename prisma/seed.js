// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...');
  await prisma.withdrawal.deleteMany();
  await prisma.investment.deleteMany();
  await prisma.earning.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Existing data cleared');

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin/Agent Users
  console.log('👤 Creating users...');
  
  const agent1 = await prisma.user.create({
    data: {
      firstName: 'John',
      lastName: 'Agent',
      email: 'agent1@ldf.com',
      phone: '08011111111',
      username: 'agent1',
      bankName: 'Guaranty Trust Bank',
      bankAccount: '0123456789',
      couponCode: 'AGENT1-CODE',
      passwordHash: hashedPassword,
      termsAccepted: true,
      riskDisclosureAccepted: true,
      couponAcknowledged: true,
      emailVerified: true,
      isAgent: true,
      isPremium: true,
      kycVerified: true,
    },
  });

  const agent2 = await prisma.user.create({
    data: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah@ldf.com',
      phone: '08022222222',
      username: 'sarahjmoney',
      bankName: 'Access Bank',
      bankAccount: '9876543210',
      couponCode: 'SARAH-CODE',
      passwordHash: hashedPassword,
      termsAccepted: true,
      riskDisclosureAccepted: true,
      couponAcknowledged: true,
      emailVerified: true,
      isAgent: true,
      isPremium: false,
      kycVerified: true,
    },
  });

  // Create Regular Users with sponsors
  const user1 = await prisma.user.create({
    data: {
      firstName: 'Michael',
      lastName: 'Okoro',
      email: 'michael@ldf.com',
      phone: '08033333333',
      username: 'mikeokoro',
      bankName: 'First Bank',
      bankAccount: '1111111111',
      couponCode: 'MIKE-CODE',
      passwordHash: hashedPassword,
      sponsorId: agent1.id,
      termsAccepted: true,
      riskDisclosureAccepted: true,
      couponAcknowledged: true,
      emailVerified: true,
      isAgent: false,
      isPremium: false,
      kycVerified: false,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      firstName: 'Chioma',
      lastName: 'Nwosu',
      email: 'chioma@ldf.com',
      phone: '08044444444',
      username: 'chiomanwosu',
      bankName: 'Zenith Bank',
      bankAccount: '2222222222',
      couponCode: 'CHIOMA-CODE',
      passwordHash: hashedPassword,
      sponsorId: agent1.id,
      termsAccepted: true,
      riskDisclosureAccepted: true,
      couponAcknowledged: true,
      emailVerified: true,
      isAgent: false,
      isPremium: false,
      kycVerified: false,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      firstName: 'David',
      lastName: 'Adebayo',
      email: 'david@ldf.com',
      phone: '08055555555',
      username: 'davidade',
      bankName: 'UBA',
      bankAccount: '3333333333',
      couponCode: 'DAVID-CODE',
      passwordHash: hashedPassword,
      sponsorId: user1.id,
      termsAccepted: true,
      riskDisclosureAccepted: true,
      couponAcknowledged: true,
      emailVerified: true,
      isAgent: false,
      isPremium: false,
      kycVerified: false,
    },
  });

  const user4 = await prisma.user.create({
    data: {
      firstName: 'Amina',
      lastName: 'Ibrahim',
      email: 'amina@ldf.com',
      phone: '08066666666',
      username: 'aminaib',
      bankName: 'GTB',
      bankAccount: '4444444444',
      couponCode: 'AMINA-CODE',
      passwordHash: hashedPassword,
      sponsorId: user1.id,
      termsAccepted: true,
      riskDisclosureAccepted: true,
      couponAcknowledged: true,
      emailVerified: true,
      isAgent: false,
      isPremium: false,
      kycVerified: false,
    },
  });

  const user5 = await prisma.user.create({
    data: {
      firstName: 'Emeka',
      lastName: 'Okafor',
      email: 'emeka@ldf.com',
      phone: '08077777777',
      username: 'emekaok',
      bankName: 'Access Bank',
      bankAccount: '5555555555',
      couponCode: 'EMEKA-CODE',
      passwordHash: hashedPassword,
      sponsorId: user2.id,
      termsAccepted: true,
      riskDisclosureAccepted: true,
      couponAcknowledged: true,
      emailVerified: true,
      isAgent: false,
      isPremium: false,
      kycVerified: false,
    },
  });

  console.log('✅ Users created');

  // Create Coupons for Agents
  console.log('🎫 Creating coupons...');
  
  const coupons = [
    { code: 'COUPON-001', agentId: agent1.id },
    { code: 'COUPON-002', agentId: agent1.id },
    { code: 'COUPON-003', agentId: agent1.id },
    { code: 'COUPON-004', agentId: agent1.id },
    { code: 'COUPON-005', agentId: agent1.id },
    { code: 'COUPON-101', agentId: agent2.id },
    { code: 'COUPON-102', agentId: agent2.id },
    { code: 'COUPON-103', agentId: agent2.id },
  ];

  for (const coupon of coupons) {
    await prisma.coupon.create({
      data: coupon,
    });
  }

  // Mark some coupons as used
  const usedCoupons = await prisma.coupon.findMany({ take: 3 });
  for (const coupon of usedCoupons) {
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        isUsed: true,
        usedBy: user1.id,
        usedAt: new Date(),
      },
    });
  }

  console.log('✅ Coupons created');

  // Create Earnings
  console.log('💰 Creating earnings...');
  
  // Helper function to create date in the past
  const daysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  };

  const earnings = [
    // === AGENT1 EARNINGS ===
    // Referral bonuses for agent1
    {
      userId: agent1.id,
      amount: 1000.00,
      type: 'REFERRAL_BONUS',
      description: 'Direct referral bonus for Michael Okoro',
      referrerId: user1.id,
      sponsorId: agent1.id,
      createdAt: daysAgo(30),
    },
    {
      userId: agent1.id,
      amount: 1000.00,
      type: 'REFERRAL_BONUS',
      description: 'Direct referral bonus for Chioma Nwosu',
      referrerId: user2.id,
      sponsorId: agent1.id,
      createdAt: daysAgo(25),
    },
    // Matrix level bonuses for agent1
    {
      userId: agent1.id,
      amount: 200.00,
      type: 'MATRIX_LEVEL_1',
      description: 'Matrix Level 1 bonus - David Adebayo activation',
      sponsorId: agent1.id,
      createdAt: daysAgo(20),
    },
    {
      userId: agent1.id,
      amount: 200.00,
      type: 'MATRIX_LEVEL_1',
      description: 'Matrix Level 1 bonus - Amina Ibrahim activation',
      sponsorId: agent1.id,
      createdAt: daysAgo(18),
    },
    {
      userId: agent1.id,
      amount: 100.00,
      type: 'MATRIX_LEVEL_2',
      description: 'Matrix Level 2 bonus',
      sponsorId: agent1.id,
      createdAt: daysAgo(15),
    },
    {
      userId: agent1.id,
      amount: 70.00,
      type: 'MATRIX_LEVEL_3',
      description: 'Matrix Level 3 bonus',
      sponsorId: agent1.id,
      createdAt: daysAgo(12),
    },
    {
      userId: agent1.id,
      amount: 60.00,
      type: 'MATRIX_LEVEL_4',
      description: 'Matrix Level 4 bonus',
      sponsorId: agent1.id,
      createdAt: daysAgo(10),
    },
    // Global pool ROI for premium users
    {
      userId: agent1.id,
      amount: 3500.00,
      type: 'GLOBAL_POOL_ROI',
      description: 'Monthly Global Pool ROI - November',
      sponsorId: agent1.id,
      createdAt: daysAgo(5),
    },
    {
      userId: agent1.id,
      amount: 3800.00,
      type: 'GLOBAL_POOL_ROI',
      description: 'Monthly Global Pool ROI - December',
      sponsorId: agent1.id,
      createdAt: daysAgo(2),
    },
    // Premium ROI
    {
      userId: agent1.id,
      amount: 5000.00,
      type: 'PREMIUM_ROI',
      description: 'Premium Investment ROI - Month 1',
      sponsorId: agent1.id,
      createdAt: daysAgo(28),
    },
    {
      userId: agent1.id,
      amount: 5200.00,
      type: 'PREMIUM_ROI',
      description: 'Premium Investment ROI - Month 2',
      sponsorId: agent1.id,
      createdAt: daysAgo(1),
    },
    // Detty December bonus (special promotion)
    {
      userId: agent1.id,
      amount: 5000.00,
      type: 'DETTY_DECEMBER',
      description: 'Detty December Special Bonus - Premium Member',
      sponsorId: agent1.id,
      createdAt: daysAgo(7),
    },

    // === USER1 EARNINGS ===
    {
      userId: user1.id,
      amount: 1000.00,
      type: 'REFERRAL_BONUS',
      description: 'Direct referral bonus for David Adebayo',
      referrerId: user3.id,
      sponsorId: user1.id,
      createdAt: daysAgo(20),
    },
    {
      userId: user1.id,
      amount: 1000.00,
      type: 'REFERRAL_BONUS',
      description: 'Direct referral bonus for Amina Ibrahim',
      referrerId: user4.id,
      sponsorId: user1.id,
      createdAt: daysAgo(18),
    },
    {
      userId: user1.id,
      amount: 200.00,
      type: 'MATRIX_LEVEL_1',
      description: 'Matrix Level 1 bonus',
      sponsorId: user1.id,
      createdAt: daysAgo(15),
    },
    {
      userId: user1.id,
      amount: 100.00,
      type: 'MATRIX_LEVEL_2',
      description: 'Matrix Level 2 bonus',
      sponsorId: user1.id,
      createdAt: daysAgo(12),
    },
    {
      userId: user1.id,
      amount: 70.00,
      type: 'MATRIX_LEVEL_3',
      description: 'Matrix Level 3 bonus',
      sponsorId: user1.id,
      createdAt: daysAgo(8),
    },

    // === USER2 EARNINGS ===
    {
      userId: user2.id,
      amount: 1000.00,
      type: 'REFERRAL_BONUS',
      description: 'Direct referral bonus for Emeka Okafor',
      referrerId: user5.id,
      sponsorId: user2.id,
      createdAt: daysAgo(14),
    },
    {
      userId: user2.id,
      amount: 200.00,
      type: 'MATRIX_LEVEL_1',
      description: 'Matrix Level 1 bonus',
      sponsorId: user2.id,
      createdAt: daysAgo(10),
    },
    {
      userId: user2.id,
      amount: 100.00,
      type: 'MATRIX_LEVEL_2',
      description: 'Matrix Level 2 bonus',
      sponsorId: user2.id,
      createdAt: daysAgo(7),
    },

    // === USER3 EARNINGS ===
    {
      userId: user3.id,
      amount: 200.00,
      type: 'MATRIX_LEVEL_1',
      description: 'Matrix Level 1 bonus',
      sponsorId: user3.id,
      createdAt: daysAgo(5),
    },

    // === USER4 EARNINGS ===
    {
      userId: user4.id,
      amount: 200.00,
      type: 'MATRIX_LEVEL_1',
      description: 'Matrix Level 1 bonus',
      sponsorId: user4.id,
      createdAt: daysAgo(3),
    },

    // === AGENT2 EARNINGS ===
    {
      userId: agent2.id,
      amount: 1500.00,
      type: 'REFERRAL_BONUS',
      description: 'Direct referral bonus',
      sponsorId: agent2.id,
      createdAt: daysAgo(22),
    },
    {
      userId: agent2.id,
      amount: 200.00,
      type: 'MATRIX_LEVEL_1',
      description: 'Matrix Level 1 bonus',
      sponsorId: agent2.id,
      createdAt: daysAgo(19),
    },
    {
      userId: agent2.id,
      amount: 2000.00,
      type: 'DETTY_DECEMBER',
      description: 'Detty December Special Bonus',
      sponsorId: agent2.id,
      createdAt: daysAgo(6),
    },

    // === DETTY DECEMBER BONUSES FOR REGULAR USERS ===
    {
      userId: user1.id,
      amount: 1500.00,
      type: 'DETTY_DECEMBER',
      description: 'Detty December Special Bonus',
      sponsorId: user1.id,
      createdAt: daysAgo(5),
    },
    {
      userId: user2.id,
      amount: 1200.00,
      type: 'DETTY_DECEMBER',
      description: 'Detty December Special Bonus',
      sponsorId: user2.id,
      createdAt: daysAgo(4),
    },
    {
      userId: user3.id,
      amount: 800.00,
      type: 'DETTY_DECEMBER',
      description: 'Detty December Special Bonus',
      sponsorId: user3.id,
      createdAt: daysAgo(3),
    },
    {
      userId: user4.id,
      amount: 1000.00,
      type: 'DETTY_DECEMBER',
      description: 'Detty December Special Bonus',
      sponsorId: user4.id,
      createdAt: daysAgo(2),
    },
    {
      userId: user5.id,
      amount: 600.00,
      type: 'DETTY_DECEMBER',
      description: 'Detty December Special Bonus',
      sponsorId: user5.id,
      createdAt: daysAgo(1),
    },
  ];

  for (const earning of earnings) {
    await prisma.earning.create({
      data: earning,
    });
  }

  console.log('✅ Earnings created');

  // Create Investments
  console.log('💼 Creating investments...');
  
  const investments = [
    {
      userId: agent1.id,
      amount: 50000.00,
      tier: 'PREMIUM',
      paymentReference: 'PAY-REF-001',
      status: 'completed',
    },
    {
      userId: user1.id,
      amount: 3000.00,
      tier: 'BASIC',
      paymentReference: 'PAY-REF-002',
      status: 'completed',
    },
    {
      userId: user2.id,
      amount: 3000.00,
      tier: 'BASIC',
      paymentReference: 'PAY-REF-003',
      status: 'completed',
    },
    {
      userId: user3.id,
      amount: 3000.00,
      tier: 'BASIC',
      paymentReference: 'PAY-REF-004',
      status: 'pending',
    },
  ];

  for (const investment of investments) {
    await prisma.investment.create({
      data: investment,
    });
  }

  console.log('✅ Investments created');

  // Create Withdrawals
  console.log('💸 Creating withdrawals...');
  
  const withdrawals = [
    // === AGENT1 WITHDRAWALS ===
    {
      userId: agent1.id,
      amount: 20000.00,
      currency: 'NGN',
      bankName: 'Guaranty Trust Bank',
      bankAccount: '0123456789',
      accountName: 'John Agent',
      status: 'PAID',
      paymentReference: 'WITHDRAW-001',
      processedAt: daysAgo(25),
      createdAt: daysAgo(26),
    },
    {
      userId: agent1.id,
      amount: 15000.00,
      currency: 'NGN',
      bankName: 'Guaranty Trust Bank',
      bankAccount: '0123456789',
      accountName: 'John Agent',
      status: 'PAID',
      paymentReference: 'WITHDRAW-002',
      processedAt: daysAgo(15),
      createdAt: daysAgo(16),
    },
    {
      userId: agent1.id,
      amount: 12000.00,
      currency: 'NGN',
      bankName: 'Guaranty Trust Bank',
      bankAccount: '0123456789',
      accountName: 'John Agent',
      status: 'APPROVED',
      paymentReference: 'WITHDRAW-003',
      createdAt: daysAgo(5),
    },
    {
      userId: agent1.id,
      amount: 8000.00,
      currency: 'NGN',
      bankName: 'Guaranty Trust Bank',
      bankAccount: '0123456789',
      accountName: 'John Agent',
      status: 'PENDING',
      paymentReference: 'WITHDRAW-004',
      createdAt: daysAgo(1),
    },

    // === USER1 WITHDRAWALS ===
    {
      userId: user1.id,
      amount: 5000.00,
      currency: 'NGN',
      bankName: 'First Bank',
      bankAccount: '1111111111',
      accountName: 'Michael Okoro',
      status: 'PAID',
      paymentReference: 'WITHDRAW-005',
      processedAt: daysAgo(18),
      createdAt: daysAgo(19),
    },
    {
      userId: user1.id,
      amount: 3000.00,
      currency: 'NGN',
      bankName: 'First Bank',
      bankAccount: '1111111111',
      accountName: 'Michael Okoro',
      status: 'PENDING',
      paymentReference: 'WITHDRAW-006',
      createdAt: daysAgo(3),
    },
    {
      userId: user1.id,
      amount: 2500.00,
      currency: 'NGN',
      bankName: 'First Bank',
      bankAccount: '1111111111',
      accountName: 'Michael Okoro',
      status: 'APPROVED',
      paymentReference: 'WITHDRAW-007',
      createdAt: daysAgo(2),
    },

    // === USER2 WITHDRAWALS ===
    {
      userId: user2.id,
      amount: 3000.00,
      currency: 'NGN',
      bankName: 'Zenith Bank',
      bankAccount: '2222222222',
      accountName: 'Chioma Nwosu',
      status: 'REJECTED',
      rejectionReason: 'Insufficient balance',
      paymentReference: 'WITHDRAW-008',
      createdAt: daysAgo(20),
    },
    {
      userId: user2.id,
      amount: 2000.00,
      currency: 'NGN',
      bankName: 'Zenith Bank',
      bankAccount: '2222222222',
      accountName: 'Chioma Nwosu',
      status: 'PAID',
      paymentReference: 'WITHDRAW-009',
      processedAt: daysAgo(10),
      createdAt: daysAgo(11),
    },
    {
      userId: user2.id,
      amount: 1500.00,
      currency: 'NGN',
      bankName: 'Zenith Bank',
      bankAccount: '2222222222',
      accountName: 'Chioma Nwosu',
      status: 'PENDING',
      paymentReference: 'WITHDRAW-010',
      createdAt: daysAgo(4),
    },

    // === USER3 WITHDRAWALS ===
    {
      userId: user3.id,
      amount: 1000.00,
      currency: 'NGN',
      bankName: 'UBA',
      bankAccount: '3333333333',
      accountName: 'David Adebayo',
      status: 'PAID',
      paymentReference: 'WITHDRAW-011',
      processedAt: daysAgo(12),
      createdAt: daysAgo(13),
    },
    {
      userId: user3.id,
      amount: 800.00,
      currency: 'NGN',
      bankName: 'UBA',
      bankAccount: '3333333333',
      accountName: 'David Adebayo',
      status: 'PENDING',
      paymentReference: 'WITHDRAW-012',
      createdAt: daysAgo(2),
    },

    // === USER4 WITHDRAWALS ===
    {
      userId: user4.id,
      amount: 1200.00,
      currency: 'NGN',
      bankName: 'GTB',
      bankAccount: '4444444444',
      accountName: 'Amina Ibrahim',
      status: 'APPROVED',
      paymentReference: 'WITHDRAW-013',
      createdAt: daysAgo(6),
    },

    // === USER5 WITHDRAWALS ===
    {
      userId: user5.id,
      amount: 1000.00,
      currency: 'NGN',
      bankName: 'Access Bank',
      bankAccount: '5555555555',
      accountName: 'Emeka Okafor',
      status: 'PENDING',
      paymentReference: 'WITHDRAW-014',
      createdAt: daysAgo(1),
    },

    // === AGENT2 WITHDRAWALS ===
    {
      userId: agent2.id,
      amount: 5000.00,
      currency: 'NGN',
      bankName: 'Access Bank',
      bankAccount: '9876543210',
      accountName: 'Sarah Johnson',
      status: 'PAID',
      paymentReference: 'WITHDRAW-015',
      processedAt: daysAgo(21),
      createdAt: daysAgo(22),
    },
    {
      userId: agent2.id,
      amount: 3000.00,
      currency: 'NGN',
      bankName: 'Access Bank',
      bankAccount: '9876543210',
      accountName: 'Sarah Johnson',
      status: 'PENDING',
      paymentReference: 'WITHDRAW-016',
      createdAt: daysAgo(7),
    },
  ];

  for (const withdrawal of withdrawals) {
    await prisma.withdrawal.create({
      data: withdrawal,
    });
  }

  console.log('✅ Withdrawals created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: ${await prisma.user.count()}`);
  console.log(`   - Agents: ${await prisma.user.count({ where: { isAgent: true } })}`);
  console.log(`   - Coupons: ${await prisma.coupon.count()}`);
  console.log(`   - Earnings: ${await prisma.earning.count()}`);
  console.log(`   - Investments: ${await prisma.investment.count()}`);
  console.log(`   - Withdrawals: ${await prisma.withdrawal.count()}`);
  console.log('\n🔑 Test Credentials:');
  console.log('   Email: agent1@ldf.com | Password: password123');
  console.log('   Email: sarah@ldf.com | Password: password123');
  console.log('   Email: michael@ldf.com | Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

