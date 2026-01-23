import crypto from 'crypto';
import axios from 'axios';
import { logger } from '../utils/logger.js';

/**
 * Seerbit Payment Service
 * Handles bank transfers and payouts via Seerbit API
 */

// Get Seerbit credentials from environment
const PUBLIC_KEY = process.env.SEERBIT_PUBLIC_KEY;
const SECRET_KEY = process.env.SEERBIT_SECRET_KEY;
const ENVIRONMENT = process.env.SEERBIT_ENVIRONMENT || 'sandbox';

// API endpoints based on environment
const BASE_URL = ENVIRONMENT === 'production'
  ? 'https://api.seerbit.com'
  : 'https://seerbitapi.com';

/**
 * Generate Seerbit authorization token
 * Uses public key and secret key for authentication
 */
async function getAccessToken() {
  try {
    if (!PUBLIC_KEY || !SECRET_KEY) {
      throw new Error('Seerbit credentials not configured');
    }

    const response = await axios.post(
      `${BASE_URL}/api/v2/auth`,
      {},
      {
        auth: {
          username: PUBLIC_KEY,
          password: SECRET_KEY,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data || !response.data.data || !response.data.data.token) {
      throw new Error('Failed to get access token from Seerbit');
    }

    return response.data.data.token;
  } catch (error) {
    logger.error('Seerbit token error:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Seerbit');
  }
}

/**
 * Initiate bank transfer via Seerbit
 * @param {Object} transferData - Transfer details
 * @param {string} transferData.accountNumber - Bank account number
 * @param {string} transferData.bankCode - Bank code (e.g., '058' for GTB)
 * @param {number} transferData.amount - Amount in Naira
 * @param {string} transferData.accountName - Account name
 * @param {string} transferData.narration - Transfer narration
 * @param {string} transferData.reference - Unique transaction reference
 * @returns {Promise<Object>} Transfer response
 */
export async function initiateBankTransfer(transferData) {
  try {
    if (!PUBLIC_KEY || !SECRET_KEY) {
      throw new Error('Seerbit credentials not configured');
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Prepare transfer payload
    const payload = {
      accountNumber: transferData.accountNumber,
      bankCode: transferData.bankCode,
      amount: transferData.amount.toString(),
      accountName: transferData.accountName,
      narration: transferData.narration || 'LDF Withdrawal',
      reference: transferData.reference,
      currency: 'NGN',
      country: 'NG',
    };

    const url = `${BASE_URL}/api/v2/transfers/bank`;
    
    logger.info('Initiating Seerbit bank transfer:', {
      reference: transferData.reference,
      amount: transferData.amount,
      accountNumber: transferData.accountNumber.substring(0, 4) + '****', // Mask account number in logs
    });

    // Make API request
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const responseData = response.data;

    if (!responseData || response.status !== 200) {
      logger.error('Seerbit transfer error:', responseData);
      throw new Error(responseData.message || `Transfer failed: ${response.statusText}`);
    }

    // Check if transfer was successful
    const status = responseData.status || responseData.data?.status || 'PENDING';
    const isSuccess = status === 'SUCCESS' || status === 'SUCCESSFUL' || status === 'COMPLETED';

    logger.info('Seerbit transfer initiated:', {
      reference: transferData.reference,
      amount: transferData.amount,
      status: status,
      transactionReference: responseData.data?.transactionReference || responseData.reference,
    });

    return {
      success: true,
      transactionReference: responseData.data?.transactionReference || responseData.reference || transferData.reference,
      status: isSuccess ? 'SUCCESS' : 'PENDING',
      message: responseData.message || 'Transfer initiated successfully',
      data: responseData,
    };
  } catch (error) {
    logger.error('Seerbit bank transfer error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Failed to initiate bank transfer');
  }
}

/**
 * Verify transaction status
 * @param {string} transactionReference - Transaction reference
 * @returns {Promise<Object>} Transaction status
 */
export async function verifyTransaction(transactionReference) {
  try {
    if (!PUBLIC_KEY || !SECRET_KEY) {
      throw new Error('Seerbit credentials not configured');
    }

    const accessToken = await getAccessToken();
    const url = `${BASE_URL}/api/v2/transactions/${transactionReference}`;

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = response.data;

    if (!data || response.status !== 200) {
      throw new Error(data.message || 'Failed to verify transaction');
    }

    return {
      success: true,
      status: data.data?.status || data.status,
      transactionReference: data.data?.transactionReference || transactionReference,
      amount: data.data?.amount || data.amount,
      data,
    };
  } catch (error) {
    logger.error('Seerbit verification error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Failed to verify transaction');
  }
}

/**
 * Get list of supported banks
 * @returns {Promise<Array>} List of banks
 */
export async function getBanks() {
  try {
    if (!PUBLIC_KEY || !SECRET_KEY) {
      throw new Error('Seerbit credentials not configured');
    }

    const accessToken = await getAccessToken();
    const url = `${BASE_URL}/api/v2/banks`;

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = response.data;

    if (!data || response.status !== 200) {
      throw new Error(data.message || 'Failed to get banks');
    }

    return {
      success: true,
      banks: data.data || data.banks || data,
    };
  } catch (error) {
    logger.error('Seerbit get banks error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Failed to get banks');
  }
}

/**
 * Verify webhook signature from Seerbit
 * @param {Object} payload - Webhook payload
 * @param {string} signature - Webhook signature
 * @returns {boolean} True if signature is valid
 */
export function verifyWebhookSignature(payload, signature) {
  try {
    if (!SECRET_KEY) {
      logger.warn('Seerbit secret key not set, skipping webhook signature verification');
      return true; // Allow in dev mode
    }

    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expectedSignature = crypto
      .createHash('sha512')
      .update(payloadString + SECRET_KEY)
      .digest('hex');
    
    return expectedSignature === signature;
  } catch (error) {
    logger.error('Webhook signature verification error:', error);
    return false;
  }
}

