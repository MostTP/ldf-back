import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { connect, disconnect } from '../utils/db.js';
import { User, Coupon } from '../models/index.js';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL is not set in environment variables');
  process.exit(1);
}

async function main() {
  try {
    await connect();

    const existingAgent = await User.findOne({ email: 'agent@ldf.com' });

    if (existingAgent) {
      console.log('Agent already exists. Skipping seed...');
      const coupons = await Coupon.find({ agentId: existingAgent._id });
      
      if (coupons.length === 0) {
        const couponCode = `LDF-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
        await Coupon.create({
          code: couponCode,
          agentId: existingAgent._id,
          isUsed: false,
        });
        console.log(`Created coupon: ${couponCode}`);
      }
      return;
    }

    const saltRounds = 10;
    const defaultPassword = 'Agent123!';
    const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);
    
    const agent = await User.create({
      firstName: 'Agent',
      lastName: 'LDF',
      email: 'agent@ldf.com',
      phone: '+2348000000001',
      username: 'agent001',
      passwordHash,
      bankName: 'Access Bank',
      bankAccount: '1234567890',
      isAgent: true,
      isPremium: true,
      emailVerified: true,
      kycVerified: true,
      agentCouponCredits: 10,
      termsAccepted: true,
      riskDisclosureAccepted: true,
      couponAcknowledged: true,
    });

    const couponCode = `LDF-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const coupon = await Coupon.create({
      code: couponCode,
      agentId: agent._id,
      isUsed: false,
    });

    console.log('Agent created successfully');
    console.log(`Username: ${agent.username}`);
    console.log(`Email: ${agent.email}`);
    console.log(`Password: ${defaultPassword}`);
    console.log(`Coupon Code: ${coupon.code}`);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    throw error;
  }
}

main()
  .then(async () => {
    await disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    await disconnect();
    process.exit(1);
  });

