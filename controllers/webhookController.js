import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Handle payment gateway webhook
 * Verifies payment and activates premium tier
 */
export async function handlePaymentWebhook(req, res) {
  try {
    const { paymentReference, amount, status, userId, metadata } = req.body;

    // Verify webhook signature (implement based on your payment gateway)
    // const isValid = verifyWebhookSignature(req);
    // if (!isValid) {
    //   return res.status(403).json({ success: false, message: 'Invalid signature' });
    // }

    if (status !== 'success' || status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful',
      });
    }

    // Check if payment already processed (idempotency)
    const existingInvestment = await prisma.investment.findUnique({
      where: { paymentReference },
    });

    if (existingInvestment && existingInvestment.status === 'completed') {
      return res.json({
        success: true,
        message: 'Payment already processed',
      });
    }

    // Process premium tier activation
    await prisma.$transaction(async (tx) => {
      // Create investment record
      const investment = await tx.investment.upsert({
        where: { paymentReference },
        update: {
          status: 'completed',
        },
        create: {
          userId: parseInt(userId),
          amount: parseFloat(amount),
          tier: 'PREMIUM',
          paymentReference,
          status: 'completed',
        },
      });

      // Upgrade user to premium
      await tx.user.update({
        where: { id: parseInt(userId) },
        data: { isPremium: true },
      });

      // Create earning entry for premium ROI tracking
      await tx.earning.create({
        data: {
          userId: parseInt(userId),
          amount: parseFloat(amount),
          type: 'PREMIUM_ROI',
          description: 'Premium tier investment',
        },
      });
    });

    res.json({
      success: true,
      message: 'Payment processed successfully',
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
    });
  }
}

