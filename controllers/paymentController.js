import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Initialize payment for premium tier upgrade
 */
export async function initializePayment(req, res) {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.isPremium) {
      return res.status(400).json({
        success: false,
        message: 'User is already premium',
      });
    }

    // Create payment reference
    const paymentReference = `LDF-${userId}-${Date.now()}`;
    const paymentAmount = parseFloat(amount) || 5000;

    // Create pending investment record first
    await prisma.investment.create({
      data: {
        userId,
        amount: paymentAmount,
        tier: 'PREMIUM',
        paymentReference,
        status: 'pending',
      },
    });

    // Return payment details for inline payment widget
    return res.json({
      success: true,
      message: 'Payment initialized',
      data: {
        publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: paymentReference,
        amount: paymentAmount,
        currency: 'NGN',
        customer: {
          email: user.email,
          phone_number: user.phone,
          name: `${user.firstName} ${user.lastName}`,
        },
        customizations: {
          title: 'LDF Premium Upgrade',
          description: 'Upgrade to Premium Tier',
        },
        meta: {
          userId: userId.toString(),
          purpose: 'PREMIUM_UPGRADE',
        },
      },
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initialize payment',
    });
  }
}

/**
 * Initialize payment for agent coupon credits
 * Simple rule: 1 coupon credit = ₦3,000
 */
export async function initializeAgentCouponPayment(req, res) {
  try {
    const userId = req.user.id;
    const { quantity } = req.body;

    const credits = parseInt(quantity, 10) || 0;
    if (!credits || credits < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1',
      });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        isAgent: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isAgent) {
      return res.status(403).json({
        success: false,
        message: 'Only agents can purchase coupon credits',
      });
    }

    const COUPON_PRICE = 3000; // ₦3,000 per coupon credit
    const paymentAmount = credits * COUPON_PRICE;
    const paymentReference = `AGENT-${userId}-${Date.now()}`;

    // Create pending investment record for tracking (tier: AGENT_COUPON)
    await prisma.investment.create({
      data: {
        userId,
        amount: paymentAmount,
        tier: 'AGENT_COUPON',
        paymentReference,
        status: 'pending',
      },
    });

    return res.json({
      success: true,
      message: 'Agent coupon payment initialized',
      data: {
        publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: paymentReference,
        amount: paymentAmount,
        currency: 'NGN',
        customer: {
          email: user.email,
          phone_number: user.phone,
          name: `${user.firstName} ${user.lastName}`,
        },
        customizations: {
          title: 'LDF Agent Coupon Credits',
          description: `Purchase of ${credits} coupon credit(s)`,
        },
        meta: {
          userId: userId.toString(),
          purpose: 'AGENT_COUPON',
          credits: credits,
        },
      },
    });
  } catch (error) {
    console.error('Agent coupon payment initialization error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initialize agent coupon payment',
    });
  }
}

