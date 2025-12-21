import { PrismaClient } from '@prisma/client';
import { verifyWebhookSignature } from '../services/seerbitService.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

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
    logger.info('Seerbit webhook received:', {
      transactionReference: body.transactionReference || body.reference || body.data?.reference,
      status: body.status || body.data?.status,
      event: body.event || body.type,
    });

    const transactionReference = body.transactionReference || body.reference || body.data?.reference;
    const status = body.status || body.data?.status || body.transactionStatus;

    if (!transactionReference) {
      return res.status(400).json({
        success: false,
        message: 'Transaction reference missing',
      });
    }

    // Find withdrawal by payment reference
    const withdrawal = await prisma.withdrawal.findFirst({
      where: {
        paymentReference: transactionReference,
      },
      include: { user: true },
    });

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

    // Update withdrawal and balance in a transaction
    await prisma.$transaction(async (tx) => {
      // Update withdrawal
      await tx.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: newStatus,
          rejectionReason,
          processedAt: newStatus === 'PAID' ? new Date() : withdrawal.processedAt,
        },
      });

      // Update balance based on status transitions
      if (oldStatus === 'PENDING' && (newStatus === 'APPROVED' || newStatus === 'PAID')) {
        // PENDING → APPROVED/PAID: Decrement balance
        await tx.user.update({
          where: { id: withdrawal.userId },
          data: {
            balance: {
              decrement: withdrawalAmount,
            },
          },
        });
        logger.info(`Balance decremented by ₦${withdrawalAmount} for user ${withdrawal.userId}`);
      } else if ((oldStatus === 'APPROVED' || oldStatus === 'PAID') && newStatus === 'FAILED') {
        // APPROVED/PAID → FAILED: Increment balance back (refund)
        await tx.user.update({
          where: { id: withdrawal.userId },
          data: {
            balance: {
              increment: withdrawalAmount,
            },
          },
        });
        logger.info(`Balance incremented back by ₦${withdrawalAmount} for user ${withdrawal.userId} (withdrawal failed)`);
      }
      // If status doesn't change or transitions don't affect balance, no update needed
    });

    logger.info(`Withdrawal ${withdrawal.id} updated to ${newStatus} via Seerbit webhook`);

    return res.json({
      success: true,
      message: 'Webhook processed successfully',
      withdrawalId: withdrawal.id,
      status: newStatus,
    });
  } catch (error) {
    logger.error('Seerbit webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
    });
  }
}

