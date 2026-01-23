import { PrismaClient } from '@prisma/client';
import Flutterwave from 'flutterwave-node-v3';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

// Initialize Flutterwave SDK
const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY,
  process.env.FLUTTERWAVE_SECRET_KEY
);

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
 * Initialize payment for agent coupon credits (returns data for inline widget)
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

    const COUPON_PRICE = 100; // ₦100 per coupon credit
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

    const COUPON_PRICE = 100; // ₦100 per coupon credit
    const paymentAmount = credits * COUPON_PRICE;
    const paymentReference = `AGENT-${userId}-${Date.now()}`;

    // Create pending investment record
    await prisma.investment.create({
      data: {
        userId,
        amount: paymentAmount,
        tier: 'AGENT_COUPON',
        paymentReference,
        status: 'pending',
      },
    });

    // Build redirect URL (Flutterwave will redirect back here after payment)
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;
    const redirectUrl = `${baseUrl}/api/payment/agent-coupons/callback?tx_ref=${paymentReference}`;

    // Use Flutterwave SDK to create payment link
    const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    
    if (!flutterwaveSecretKey) {
      throw new Error('Flutterwave secret key not configured');
    }

    // Initialize Flutterwave
    const flw = new Flutterwave(process.env.FLUTTERWAVE_PUBLIC_KEY, flutterwaveSecretKey);

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
      console.error('Flutterwave API error:', flutterwaveError);
      throw new Error(`Flutterwave error: ${flutterwaveError.message || 'Failed to create payment link'}`);
    }
  } catch (error) {
    console.error('Agent coupon payment URL generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate payment URL',
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
    const investment = await prisma.investment.findUnique({
      where: { paymentReference: tx_ref },
      include: { user: true },
    });

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
    console.error('Payment callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/dashboard/agent?payment=error&message=${encodeURIComponent(error.message)}`);
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
    const investment = await prisma.investment.findUnique({
      where: { paymentReference: tx_ref },
      include: { user: true },
    });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    if (investment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only verify your own payments',
      });
    }

    if (investment.status === 'completed') {
      return res.json({
        success: true,
        message: 'Payment already processed',
        data: {
          credits: investment.user.agentCouponCredits,
        },
      });
    }

    // Verify payment with Flutterwave
    try {
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
        // Process the payment
        await prisma.$transaction(async (tx) => {
          await tx.investment.update({
            where: { paymentReference: tx_ref },
            data: {
              status: 'completed',
              tier: 'AGENT_COUPON',
            },
          });

          const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
              agentCouponCredits: {
                increment: creditsToAdd,
              },
            },
            select: { agentCouponCredits: true },
          });

          logger.info(`Manually verified and credited ${creditsToAdd} coupon credits to user ${userId}. New balance: ${updatedUser.agentCouponCredits}`);
        });

        const updatedUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { agentCouponCredits: true },
        });

        return res.json({
          success: true,
          message: `Payment verified and ${creditsToAdd} coupon credit(s) added successfully`,
          data: {
            credits: creditsToAdd,
            newBalance: updatedUser.agentCouponCredits,
          },
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Payment is not for agent coupon credits',
        });
      }
    } catch (flutterwaveError) {
      logger.error('Flutterwave verification error:', flutterwaveError);
      return res.status(500).json({
        success: false,
        message: `Failed to verify payment with Flutterwave: ${flutterwaveError.message}`,
      });
    }
  } catch (error) {
    logger.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify payment',
    });
  }
}

