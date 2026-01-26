import { User, Investment } from '../models/index.js';
import Flutterwave from 'flutterwave-node-v3';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

// Initialize Flutterwave SDK lazily
let flw = null;
function getFlutterwaveInstance() {
  if (!flw) {
    const publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY;
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    
    if (!publicKey || !secretKey) {
      throw new Error('Flutterwave keys not configured. Please set FLUTTERWAVE_PUBLIC_KEY and FLUTTERWAVE_SECRET_KEY environment variables.');
    }
    
    flw = new Flutterwave(publicKey, secretKey);
  }
  return flw;
}

/**
 * Initialize payment for premium tier upgrade
 */
export async function initializePayment(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const { amount } = req.body;

    const user = await User.findById(userId);
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

    const paymentReference = `LDF-${userId}-${Date.now()}`;
    const paymentAmount = parseFloat(amount) || 5000;

    await Investment.create({
      userId,
      amount: paymentAmount,
      tier: 'PREMIUM',
      paymentReference,
      status: 'pending',
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
    logger.error('Payment initialization error');
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
    });
  }
}

/**
 * Initialize payment for agent coupon credits (returns data for inline widget)
 * Simple rule: 1 coupon credit = ₦3,000
 */
export async function initializeAgentCouponPayment(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const { quantity } = req.body;

    const credits = parseInt(quantity, 10) || 0;
    if (!credits || credits < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1',
      });
    }

    const user = await User.findById(userId).select('_id email phone firstName lastName isAgent');

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

    const COUPON_PRICE = 100; // ₦100 per coupon credit
    const paymentAmount = credits * COUPON_PRICE;
    const paymentReference = `AGENT-${userId}-${Date.now()}`;

    // Create pending investment record for tracking (tier: AGENT_COUPON)
    await Investment.create({
      userId,
      amount: paymentAmount,
      tier: 'AGENT_COUPON',
      paymentReference,
      status: 'pending',
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
    logger.error('Agent coupon payment initialization error');
    res.status(500).json({
      success: false,
      message: 'Failed to initialize agent coupon payment',
    });
  }
}

/**
 * Get payment URL for agent coupon credits (backend handles everything)
 * Returns payment URL that frontend can redirect to
 */
export async function redirectAgentCouponPayment(req, res) {
  try {
    const userId = req.user.id;
    const { quantity } = req.body; // Get from request body for POST request

    const credits = parseInt(quantity, 10) || 0;
    if (!credits || credits < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1',
      });
    }

    // Get user details
    const user = await User.findById(userId).select('_id email phone firstName lastName isAgent');

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

    const COUPON_PRICE = 100; // ₦100 per coupon credit
    const paymentAmount = credits * COUPON_PRICE;
    const paymentReference = `AGENT-${userId}-${Date.now()}`;

    // Create pending investment record
    await Investment.create({
      userId,
      amount: paymentAmount,
      tier: 'AGENT_COUPON',
      paymentReference,
      status: 'pending',
    });

    // Build redirect URL (Flutterwave will redirect back here after payment)
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;
    const redirectUrl = `${baseUrl}/api/payment/agent-coupons/callback?tx_ref=${paymentReference}`;

    // Use Flutterwave SDK to create payment link
    const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    
    if (!flutterwaveSecretKey) {
      throw new Error('Flutterwave secret key not configured');
    }

    // Get Flutterwave instance
    const flw = getFlutterwaveInstance();

    // Create payment link using Flutterwave API
    const paymentData = {
      tx_ref: paymentReference,
      amount: paymentAmount,
      currency: 'NGN',
      payment_options: 'card,ussd,banktransfer,mobilemoney',
      redirect_url: redirectUrl,
      customer: {
        email: user.email,
        phone_number: user.phone || '',
        name: `${user.firstName} ${user.lastName}`,
      },
      customizations: {
        title: 'LDF Agent Coupon Credits',
        description: `Purchase of ${credits} coupon credit(s)`,
      },
      meta: {
        userId: userId.toString(),
        purpose: 'AGENT_COUPON',
        credits: credits.toString(),
      },
    };

    try {
      const flutterwaveResponse = await flw.Payment.initiate(paymentData);
      
      if (flutterwaveResponse.status !== 'success' || !flutterwaveResponse.data?.link) {
        throw new Error(flutterwaveResponse.message || 'Failed to generate payment link from Flutterwave');
      }

      // Return payment URL
      return res.json({
        success: true,
        message: 'Payment URL generated',
        data: {
          paymentUrl: flutterwaveResponse.data.link,
          paymentReference,
          amount: paymentAmount,
          credits,
        },
      });
    } catch (flutterwaveError) {
      logger.error('Flutterwave API error');
      throw new Error('Failed to create payment link');
    }
  } catch (error) {
    logger.error('Agent coupon payment URL generation error');
    res.status(500).json({
      success: false,
      message: 'Failed to generate payment URL',
    });
  }
}

/**
 * Callback endpoint after Flutterwave payment (handles redirect back)
 */
export async function agentCouponPaymentCallback(req, res) {
  try {
    const { tx_ref, status, transaction_id } = req.query;

    if (!tx_ref) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/dashboard/agent?payment=error&message=Missing payment reference`);
    }

    // Find the investment record
    const investment = await Investment.findOne({ paymentReference: tx_ref });

    if (!investment) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/dashboard/agent?payment=error&message=Payment not found`);
    }

    // Check payment status from Flutterwave
    // Note: The webhook is the source of truth, but we can show status here
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (status === 'successful' || status === 'completed') {
      // Payment successful - webhook will handle the actual crediting
      // Just redirect to success page
      res.redirect(`${frontendUrl}/dashboard/agent?payment=success&tx_ref=${tx_ref}`);
    } else {
      // Payment failed or cancelled
      res.redirect(`${frontendUrl}/dashboard/agent?payment=failed&tx_ref=${tx_ref}`);
    }
  } catch (error) {
    logger.error('Payment callback error');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/dashboard/agent?payment=error`);
  }
}

/**
 * Manually verify and process a payment (useful if webhook didn't fire)
 * This endpoint checks Flutterwave for payment status and credits the account
 */
export async function verifyAgentCouponPayment(req, res) {
  try {
    const userId = req.user.id;
    const { tx_ref } = req.body;

    if (!tx_ref) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference (tx_ref) is required',
      });
    }

    // Find the investment record
    const investment = await Investment.findOne({ paymentReference: tx_ref })
      .populate('userId', 'agentCouponCredits');

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    // Convert userId to string for comparison (handle both populated and non-populated)
    const investmentUserId = investment.userId._id 
      ? investment.userId._id.toString() 
      : (investment.userId.toString ? investment.userId.toString() : String(investment.userId));
    const requestUserId = userId.toString ? userId.toString() : String(userId);

    if (investmentUserId !== requestUserId) {
      return res.status(403).json({
        success: false,
        message: 'You can only verify your own payments',
      });
    }

    if (investment.status === 'completed') {
      const user = investment.userId;
      const credits = (user && user.agentCouponCredits) ? user.agentCouponCredits : 0;
      return res.json({
        success: true,
        message: 'Payment already processed',
        data: {
          credits: credits,
        },
      });
    }

    // Verify payment with Flutterwave
    try {
      const flw = getFlutterwaveInstance();
      const verificationResponse = await flw.Transaction.verify({ tx_ref });
      
      if (verificationResponse.status !== 'success') {
        return res.status(400).json({
          success: false,
          message: verificationResponse.message || 'Payment verification failed',
        });
      }

      
      const paymentData = verificationResponse.data;
      const paymentStatus = paymentData.status;
      const paymentAmount = parseFloat(paymentData.amount);

      if (paymentStatus !== 'successful' && paymentStatus !== 'completed') {
        return res.status(400).json({
          success: false,
          message: `Payment status is ${paymentStatus}, not successful`,
        });
      }

      // Extract meta data from Flutterwave response
      const meta = paymentData.meta || {};
      const purpose = meta.purpose || 'AGENT_COUPON';
      const credits = meta.credits ? parseInt(meta.credits, 10) || 0 : 0;
      
      // Calculate credits from amount if not in meta (fallback: ₦100 per credit)
      const COUPON_PRICE = 100;
      const creditsToAdd = credits > 0 ? credits : Math.floor(paymentAmount / COUPON_PRICE);

      if (purpose === 'AGENT_COUPON' && creditsToAdd > 0) {
        // Process the payment using Mongoose session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          await Investment.findOneAndUpdate(
            { paymentReference: tx_ref },
            {
              status: 'completed',
              tier: 'AGENT_COUPON',
            },
            { session }
          );

          const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
              $inc: { agentCouponCredits: creditsToAdd },
            },
            { session, new: true, select: 'agentCouponCredits' }
          );

          await session.commitTransaction();
          session.endSession();

          logger.info('Payment verified and credits added');

          return res.json({
            success: true,
            message: `Payment verified and ${creditsToAdd} coupon credit(s) added successfully`,
            data: {
              credits: creditsToAdd,
              newBalance: updatedUser.agentCouponCredits,
            },
          });
        } catch (transactionError) {
          await session.abortTransaction();
          session.endSession();
          throw transactionError;
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Payment is not for agent coupon credits',
        });
      }
    } catch (flutterwaveError) {
      logger.error('Flutterwave verification error');
      return res.status(500).json({
        success: false,
        message: 'Failed to verify payment',
      });
    }
  } catch (error) {
    logger.error('Payment verification error');
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
    });
  }
}

