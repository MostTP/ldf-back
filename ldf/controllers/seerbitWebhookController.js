import { Withdrawal, User } from '../models/index.js';
import { verifyWebhookSignature } from '../services/seerbitService.js';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

/**
 * Handle Seerbit webhook for withdrawal status updates
 */
export async function handleSeerbitWebhook(req, res) {
  try {
    // Parse body
    let body = req.body;
    if (Buffer.isBuffer(req.body)) {
      body = JSON.parse(req.body.toString('utf8'));
    }

    // Verify webhook signature
    const signature = req.headers['x-seerbit-signature'] || req.headers['signature'] || req.headers['authorization'];
    if (signature && !verifyWebhookSignature(body, signature)) {
      logger.warn('Invalid Seerbit webhook signature');
      return res.status(403).json({
        success: false,
        message: 'Invalid webhook signature',
      });
    }

    // Log webhook received
    logger.info('Seerbit webhook received');

    const transactionReference = body.transactionReference || body.reference || body.data?.reference;
    const status = body.status || body.data?.status || body.transactionStatus;

    if (!transactionReference) {
      return res.status(400).json({
        success: false,
        message: 'Transaction reference missing',
      });
    }

    const withdrawal = await Withdrawal.findOne({
      paymentReference: transactionReference,
    }).populate('userId');

    if (!withdrawal) {
      logger.warn(`Withdrawal not found for reference: ${transactionReference}`);
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found',
      });
    }

    // Update withdrawal status based on Seerbit response
    let newStatus = withdrawal.status;
    let rejectionReason = null;

    if (status === 'SUCCESS' || status === 'COMPLETED' || status === 'SUCCESSFUL' || status === '00') {
      newStatus = 'PAID';
    } else if (status === 'FAILED' || status === 'DECLINED' || status === 'REJECTED' || status === '01') {
      newStatus = 'FAILED';
      rejectionReason = body.message || body.data?.message || body.reason || 'Transfer failed';
    } else if (status === 'PENDING' || status === 'PROCESSING' || status === '02') {
      newStatus = 'APPROVED'; // Still processing
    }

    // Handle balance updates based on status change
    const oldStatus = withdrawal.status;
    const withdrawalAmount = Number(withdrawal.amount);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await Withdrawal.findByIdAndUpdate(
        withdrawal._id,
        {
          status: newStatus,
          rejectionReason,
          processedAt: newStatus === 'PAID' ? new Date() : withdrawal.processedAt,
        },
        { session }
      );

      if (oldStatus === 'PENDING' && (newStatus === 'APPROVED' || newStatus === 'PAID')) {
        await User.findByIdAndUpdate(
          withdrawal.userId,
          { $inc: { balance: -withdrawalAmount } },
          { session }
        );
        logger.info('Balance decremented for withdrawal');

        // Create Detty December earning: 10% of withdrawal amount
        const dettyDecemberAmount = withdrawalAmount * 0.1;
        if (dettyDecemberAmount > 0) {
          await tx.earning.create({
            data: {
              userId: withdrawal.userId,
              amount: dettyDecemberAmount,
              type: 'DETTY_DECEMBER',
              description: `Detty December bonus - 10% of withdrawal (₦${withdrawalAmount.toLocaleString()})`,
            },
          });

          // Increment user's balance with Detty December bonus
          await tx.user.update({
            where: { id: withdrawal.userId },
            data: {
              balance: {
                increment: dettyDecemberAmount,
              },
            },
          });

          logger.info('Detty December bonus created');
        }
      } else if ((oldStatus === 'APPROVED' || oldStatus === 'PAID') && newStatus === 'FAILED') {
        await User.findByIdAndUpdate(
          withdrawal.userId,
          { $inc: { balance: withdrawalAmount } },
          { session }
        );
        logger.info('Balance incremented back (withdrawal failed)');
      }

      const dettyDecemberAmount = withdrawalAmount * 0.1;
      if (newStatus === 'PAID' && dettyDecemberAmount > 0) {
        const { Earning } = await import('../models/index.js');
        await Earning.create([{
          userId: withdrawal.userId,
          amount: dettyDecemberAmount,
          type: 'DETTY_DECEMBER',
          description: `Detty December bonus - 10% of withdrawal (₦${withdrawalAmount.toLocaleString()})`,
        }], { session });

        await User.findByIdAndUpdate(
          withdrawal.userId,
          { $inc: { balance: dettyDecemberAmount } },
          { session }
        );
        logger.info('Detty December bonus created');
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    logger.info('Withdrawal updated via Seerbit webhook');

    return res.json({
      success: true,
      message: 'Webhook processed successfully',
      withdrawalId: withdrawal._id.toString(),
      status: newStatus,
    });
  } catch (error) {
    logger.error('Seerbit webhook error');
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
    });
  }
}

