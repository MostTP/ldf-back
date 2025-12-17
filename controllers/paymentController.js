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

