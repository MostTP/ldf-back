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

  const signature = req.headers['verif-hash'] || req.headers['x-flutterwave-signature'];
  if (!signature) {
    logger.warn('No signature header found in webhook request');
    // In dev mode, allow if no signature (Flutterwave test mode might not send it)
    if (!isProduction) {
      logger.warn('Allowing webhook without signature in dev mode');
      return true;
    }
    return false;
  }

  // Handle both raw body (Buffer) and parsed JSON
  // For signature verification, we need the raw body string
  let bodyString;
  if (Buffer.isBuffer(req.body)) {
    bodyString = req.body.toString('utf8');
  } else {
    // If body was already parsed, we need to stringify it
    // But note: this might not match Flutterwave's original string
    bodyString = JSON.stringify(req.body);
  }

  const hash = crypto
    .createHash('sha256')
    .update(bodyString + secretHash)
    .digest('hex');

  const isValid = hash === signature;
  
  if (!isValid) {
    logger.warn('Webhook signature verification failed', {
      expected: hash,
      received: signature,
      hasSecretHash: !!secretHash
    });
  }
  
  return isValid;
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

    // Log webhook received for debugging
    logger.info('Webhook received:', {
      event: body.event,
      tx_ref: body.data?.tx_ref,
      status: body.data?.status,
      amount: body.data?.amount,
      hasMetaData: !!body.meta_data,
      hasMeta: !!body.meta,
      headers: {
        'verif-hash': req.headers['verif-hash'] ? 'present' : 'missing',
        'x-flutterwave-signature': req.headers['x-flutterwave-signature'] ? 'present' : 'missing'
      }
    });

    // Verify webhook signature (uses original req.body which may be Buffer)
    const signatureValid = verifyFlutterwaveSignature(req);
    if (!signatureValid) {
      const isProduction = process.env.NODE_ENV === 'production';
      const hasSecretHash = !!process.env.FLUTTERWAVE_SECRET_HASH;
      
      // In production, always reject invalid signatures
      if (isProduction) {
        logger.error('Webhook signature verification failed in production');
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid webhook signature' 
      });
      }
      
      // In dev mode, log warning but continue if no secret hash is set
      if (!hasSecretHash) {
        logger.warn('Skipping signature verification in dev mode (no secret hash set)');
      } else {
        logger.warn('Webhook signature verification failed, but allowing in dev mode');
      }
    }

    const { tx_ref, amount, status, customer } = body.data || body;
    const paymentReference = tx_ref;
    
    // Try multiple ways to get meta data (Flutterwave can send it in different places)
    // Note: Flutterwave sometimes uses 'meta_data' instead of 'meta'
    const meta = body.meta_data || body.data?.meta || body.meta || body.data?.customer?.meta || {};
    const purpose = meta.purpose || 'PREMIUM_UPGRADE';
    const credits = meta.credits ? parseInt(meta.credits, 10) || 0 : 0;
    const userId = meta.userId || body.meta_data?.userId || body.data?.meta?.userId || body.meta?.userId || body.data?.customer?.meta?.userId;
    
    logger.info('Webhook processing:', {
      paymentReference,
      purpose,
      credits,
      userId,
      status,
      meta: JSON.stringify(meta)
    });

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
      include: {
        user: {
          select: { agentCouponCredits: true },
        },
      },
    });

    if (existingInvestment && existingInvestment.status === 'completed') {
      logger.info(`Payment ${paymentReference} already processed. Current user balance: ${existingInvestment.user?.agentCouponCredits || 'N/A'}`);
      return res.json({
        success: true,
        message: 'Payment already processed',
        data: {
          alreadyProcessed: true,
          currentBalance: existingInvestment.user?.agentCouponCredits,
        },
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
      try {
        // First, verify user exists
        const userExists = await prisma.user.findUnique({
          where: { id: finalUserId },
          select: { id: true, agentCouponCredits: true, isAgent: true },
        });

        if (!userExists) {
          logger.error(`User ${finalUserId} not found for payment ${paymentReference}`);
          return res.status(404).json({
            success: false,
            message: `User ${finalUserId} not found`,
          });
        }

        logger.info(`Processing AGENT_COUPON payment for user ${finalUserId}. Current balance: ${userExists.agentCouponCredits}, Credits to add: ${credits}`);

        // Calculate credits to add
        const creditsToAdd = credits > 0 ? credits : Math.floor(parseFloat(amount) / 100);
        
        if (creditsToAdd <= 0) {
          logger.warn(`No credits to add for payment ${paymentReference}. Credits: ${credits}, Amount: ${amount}`);
          return res.status(400).json({
            success: false,
            message: `Invalid credits: ${credits}, amount: ${amount}`,
          });
        }

        // Process in transaction
        const result = await prisma.$transaction(async (tx) => {
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
          const updatedUser = await tx.user.update({
            where: { id: finalUserId },
            data: {
              agentCouponCredits: {
                increment: creditsToAdd,
              },
            },
            select: { 
              id: true,
              agentCouponCredits: true,
              firstName: true,
              lastName: true,
            },
          });

          logger.info(`Successfully credited ${creditsToAdd} coupon credits to user ${finalUserId} (${updatedUser.firstName} ${updatedUser.lastName}). New balance: ${updatedUser.agentCouponCredits}`);

          return updatedUser;
        });

        return res.json({
          success: true,
          message: 'Agent coupon payment processed successfully',
          data: {
            userId: finalUserId,
            creditsAdded: creditsToAdd,
            newBalance: result.agentCouponCredits,
          },
        });
      } catch (transactionError) {
        logger.error('Error processing AGENT_COUPON payment:', transactionError);
        throw transactionError;
      }
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
        const premiumAmount = parseFloat(amount);
        await tx.earning.create({
          data: {
            userId: finalUserId,
            amount: premiumAmount,
            type: 'PREMIUM_ROI',
            description: `Premium tier investment - ${paymentReference}`,
          },
        });
        
        // Increment user's balance
        await tx.user.update({
          where: { id: finalUserId },
          data: {
            balance: {
              increment: premiumAmount,
            },
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

