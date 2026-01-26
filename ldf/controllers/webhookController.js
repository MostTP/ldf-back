import crypto from 'crypto';
import { User, Investment, Earning } from '../models/index.js';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

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
    logger.warn('Webhook signature verification failed');
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

    // Log webhook received (sanitized)
    logger.info('Webhook received:', {
      event: body.event,
      status: body.data?.status,
      hasMetaData: !!body.meta_data,
      hasMeta: !!body.meta,
      hasSignature: !!(req.headers['verif-hash'] || req.headers['x-flutterwave-signature'])
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
      purpose,
      status
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
    const existingInvestment = await Investment.findOne({ paymentReference })
      .populate('userId', 'agentCouponCredits');

    if (existingInvestment && existingInvestment.status === 'completed') {
      const user = existingInvestment.userId;
      const credits = user?.agentCouponCredits || 0;
      logger.info('Payment already processed');
      return res.json({
        success: true,
        message: 'Payment already processed',
        data: {
          alreadyProcessed: true,
          currentBalance: credits,
        },
      });
    }

    const finalUserId = userId 
      ? userId 
      : existingInvestment?.userId?._id || existingInvestment?.userId;

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
        const userExists = await User.findById(finalUserId)
          .select('agentCouponCredits isAgent');

        if (!userExists) {
          logger.error('User not found for payment');
          return res.status(404).json({
            success: false,
            message: `User ${finalUserId} not found`,
          });
        }

        logger.info('Processing AGENT_COUPON payment');

        // Calculate credits to add
        const creditsToAdd = credits > 0 ? credits : Math.floor(parseFloat(amount) / 100);
        
        if (creditsToAdd <= 0) {
          logger.warn('No credits to add for payment');
          return res.status(400).json({
            success: false,
            message: `Invalid credits: ${credits}, amount: ${amount}`,
          });
        }

        // Process in transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          // Update or create investment record with tier AGENT_COUPON
          let investment = await Investment.findOne({ paymentReference }).session(session);
          
          if (investment) {
            investment.status = 'completed';
            investment.tier = 'AGENT_COUPON';
            await investment.save({ session });
          } else {
            investment = await Investment.create([{
              userId: finalUserId,
              amount: parseFloat(amount),
              tier: 'AGENT_COUPON',
              paymentReference,
              status: 'completed',
            }], { session });
            investment = investment[0];
          }

          // Credit agent coupon balance
          const updatedUser = await User.findByIdAndUpdate(
            finalUserId,
            { $inc: { agentCouponCredits: creditsToAdd } },
            { session, new: true }
          ).select('agentCouponCredits firstName lastName');

          await session.commitTransaction();
          session.endSession();

          logger.info('Successfully credited coupon credits');

          const result = updatedUser;

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
          await session.abortTransaction();
          session.endSession();
          logger.error('Error processing AGENT_COUPON payment:', transactionError);
          throw transactionError;
        }
      } catch (error) {
        logger.error('Error processing AGENT_COUPON payment');
        return res.status(500).json({
          success: false,
          message: 'Failed to process agent coupon payment',
        });
      }
    } else {
      // Default: premium tier activation
      try {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          // Update or create investment record
          let investment = await Investment.findOne({ paymentReference }).session(session);
          
          if (investment) {
            investment.status = 'completed';
            investment.tier = 'PREMIUM';
            await investment.save({ session });
          } else {
            investment = await Investment.create([{
              userId: finalUserId,
              amount: parseFloat(amount),
              tier: 'PREMIUM',
              paymentReference,
              status: 'completed',
            }], { session });
            investment = investment[0];
          }

          // Upgrade user to premium
          await User.findByIdAndUpdate(
            finalUserId,
            { isPremium: true },
            { session }
          );

          // Create earning entry for premium ROI tracking (if not already exists)
          const existingEarning = await Earning.findOne({
            userId: finalUserId,
            type: 'PREMIUM_ROI',
            description: { $regex: paymentReference },
          }).session(session);

          if (!existingEarning) {
            const premiumAmount = parseFloat(amount);
            await Earning.create([{
              userId: finalUserId,
              amount: premiumAmount,
              type: 'PREMIUM_ROI',
              description: `Premium tier investment - ${paymentReference}`,
            }], { session });
            
            // Increment user's balance
            await User.findByIdAndUpdate(
              finalUserId,
              { $inc: { balance: premiumAmount } },
              { session }
            );
          }

          await session.commitTransaction();
          session.endSession();
        } catch (transactionError) {
          await session.abortTransaction();
          session.endSession();
          throw transactionError;
        }

        return res.json({
          success: true,
          message: 'Payment processed successfully',
        });
      } catch (error) {
        logger.error('Error processing premium payment');
        return res.status(500).json({
          success: false,
          message: 'Failed to process premium payment',
        });
      }
    }
  } catch (error) {
    logger.error('Webhook error');
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
    });
  }
}

