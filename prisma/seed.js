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
  
  const earnings = [
    // Referral bonuses for agent1
    {
      userId: agent1.id,
      amount: 1000.00,
      type: 'REFERRAL_BONUS',
      description: 'Direct referral bonus for Michael Okoro',
      referrerId: user1.id,
      sponsorId: agent1.id,
    },
    {
      userId: agent1.id,
      amount: 1000.00,
      type: 'REFERRAL_BONUS',
      description: 'Direct referral bonus for Chioma Nwosu',
      referrerId: user2.id,
      sponsorId: agent1.id,
    },
    // Matrix level bonuses for agent1
    {
      userId: agent1.id,
      amount: 120.00,
      type: 'MATRIX_LEVEL_1',
      description: 'Matrix Level 1 bonus',
      sponsorId: agent1.id,
    },
    {
      userId: agent1.id,
      amount: 100.00,
      type: 'MATRIX_LEVEL_2',
      description: 'Matrix Level 2 bonus',
      sponsorId: agent1.id,
    },
    {
      userId: agent1.id,
      amount: 60.00,
      type: 'MATRIX_LEVEL_3',
      description: 'Matrix Level 3 bonus',
      sponsorId: agent1.id,
    },
    // Referral bonuses for user1
    {
      userId: user1.id,
      amount: 1000.00,
      type: 'REFERRAL_BONUS',
      description: 'Direct referral bonus for David Adebayo',
      referrerId: user3.id,
      sponsorId: user1.id,
    },
    {
      userId: user1.id,
      amount: 1000.00,
      type: 'REFERRAL_BONUS',
      description: 'Direct referral bonus for Amina Ibrahim',
      referrerId: user4.id,
      sponsorId: user1.id,
    },
    // Global pool ROI for premium users
    {
      userId: agent1.id,
      amount: 3500.00,
      type: 'GLOBAL_POOL_ROI',
      description: 'Monthly Global Pool ROI',
      sponsorId: agent1.id,
    },
    // Premium ROI
    {
      userId: agent1.id,
      amount: 5000.00,
      type: 'PREMIUM_ROI',
      description: 'Premium Investment ROI',
      sponsorId: agent1.id,
    },
    // Some earnings for user1
    {
      userId: user1.id,
      amount: 120.00,
      type: 'MATRIX_LEVEL_1',
      description: 'Matrix Level 1 bonus',
      sponsorId: user1.id,
    },
    {
      userId: user1.id,
      amount: 100.00,
      type: 'MATRIX_LEVEL_2',
      description: 'Matrix Level 2 bonus',
      sponsorId: user1.id,
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
    {
      userId: agent1.id,
      amount: 20000.00,
      currency: 'NGN',
      bankName: 'Guaranty Trust Bank',
      bankAccount: '0123456789',
      accountName: 'John Agent',
      status: 'PAID',
      paymentReference: 'WITHDRAW-001',
      processedAt: new Date(),
    },
    {
      userId: agent1.id,
      amount: 15000.00,
      currency: 'NGN',
      bankName: 'Guaranty Trust Bank',
      bankAccount: '0123456789',
      accountName: 'John Agent',
      status: 'APPROVED',
      paymentReference: 'WITHDRAW-002',
    },
    {
      userId: user1.id,
      amount: 5000.00,
      currency: 'NGN',
      bankName: 'First Bank',
      bankAccount: '1111111111',
      accountName: 'Michael Okoro',
      status: 'PENDING',
    },
    {
      userId: user2.id,
      amount: 3000.00,
      currency: 'NGN',
      bankName: 'Zenith Bank',
      bankAccount: '2222222222',
      accountName: 'Chioma Nwosu',
      status: 'REJECTED',
      rejectionReason: 'Insufficient balance',
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

