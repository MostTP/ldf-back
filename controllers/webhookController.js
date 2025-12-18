import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Verify Flutterwave webhook signature
 */
function verifyFlutterwaveSignature(req) {
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!secretHash) {
    if (isProduction) {
      logger.error('FLUTTERWAVE_SECRET_HASH not set in production - rejecting webhook');
      return false;
    }
    logger.warn('FLUTTERWAVE_SECRET_HASH not set, skipping signature verification (dev mode)');
    return true; // Allow in development only
  }

  const signature = req.headers['verif-hash'];
  if (!signature) {
    return false;
  }

  // Handle both raw body (Buffer) and parsed JSON
  const bodyString = Buffer.isBuffer(req.body) 
    ? req.body.toString('utf8')
    : JSON.stringify(req.body);

  const hash = crypto
    .createHash('sha256')
    .update(bodyString + secretHash)
    .digest('hex');

  return hash === signature;
}

/**
 * Handle payment gateway webhook
 * Verifies payment and activates premium tier
 */
export async function handlePaymentWebhook(req, res) {
  try {
    // Parse body if it's a Buffer (raw body) - keep original for signature verification
    let body = req.body;
    if (Buffer.isBuffer(req.body)) {
      body = JSON.parse(req.body.toString('utf8'));
    }

    // Verify webhook signature (uses original req.body which may be Buffer)
    if (!verifyFlutterwaveSignature(req)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid webhook signature' 
      });
    }

    const { tx_ref, amount, status, customer } = body.data || body;
    const paymentReference = tx_ref;
    const meta = body.data?.meta || body.meta || {};
    const purpose = meta.purpose || 'PREMIUM_UPGRADE';
    const credits = meta.credits ? parseInt(meta.credits, 10) || 0 : 0;
    const userId = meta.userId || body.data?.meta?.userId || body.meta?.userId;

    if (!paymentReference) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference missing',
      });
    }

    // Flutterwave status check
    if (status !== 'successful' && status !== 'completed') {
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

    const finalUserId = userId 
      ? parseInt(userId) 
      : existingInvestment?.userId;

    if (!finalUserId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found',
      });
    }

    // Process payment based on purpose
    if (purpose === 'AGENT_COUPON') {
      // Agent coupon credits purchase
      await prisma.$transaction(async (tx) => {
        // Update or create investment record with tier AGENT_COUPON
        await tx.investment.upsert({
          where: { paymentReference },
          update: {
            status: 'completed',
            tier: 'AGENT_COUPON',
          },
          create: {
            userId: finalUserId,
            amount: parseFloat(amount),
            tier: 'AGENT_COUPON',
            paymentReference,
            status: 'completed',
          },
        });

        // Credit agent coupon balance
        if (credits > 0) {
          await tx.user.update({
            where: { id: finalUserId },
            data: {
              agentCouponCredits: {
                increment: credits,
              },
            },
          });
        }
      });

      return res.json({
        success: true,
        message: 'Agent coupon payment processed successfully',
      });
    } else {
      // Default: premium tier activation
      await prisma.$transaction(async (tx) => {
        // Update or create investment record
        await tx.investment.upsert({
          where: { paymentReference },
          update: {
            status: 'completed',
            tier: 'PREMIUM',
          },
          create: {
            userId: finalUserId,
            amount: parseFloat(amount),
            tier: 'PREMIUM',
            paymentReference,
            status: 'completed',
          },
        });

        // Upgrade user to premium
        await tx.user.update({
          where: { id: finalUserId },
          data: { isPremium: true },
        });

        // Create earning entry for premium ROI tracking (if not already exists)
        const existingEarning = await tx.earning.findFirst({
          where: {
            userId: finalUserId,
            type: 'PREMIUM_ROI',
            description: { contains: paymentReference },
          },
        });

        if (!existingEarning) {
          await tx.earning.create({
            data: {
              userId: finalUserId,
              amount: parseFloat(amount),
              type: 'PREMIUM_ROI',
              description: `Premium tier investment - ${paymentReference}`,
            },
          });
        }
      });

      return res.json({
        success: true,
        message: 'Payment processed successfully',
      });
    }
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
    });
  }
}

