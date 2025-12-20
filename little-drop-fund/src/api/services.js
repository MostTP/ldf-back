// src/api/services.js
// API service functions for backend integration

import api from './api';

// =========================================================================
// AUTHENTICATION SERVICES
// =========================================================================
export const authService = {
  login: async (identifier, password) => {
    const response = await api.post('/auth/login', { identifier, password });
    return response.data;
  },

  // Register new user (maps frontend form data to backend format)
  register: async (userData) => {
    // Map frontend form fields to backend API format
    const registerData = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      username: userData.username,
      bankName: userData.bankName || 'Not Provided', // Required by backend - can be updated later
      bankAccount: userData.bankAccount || '0000000000', // Required by backend - can be updated later
      sponsor: userData.ldfStarterCode || userData.sponsor || null,
      couponCode: userData.coupon || userData.couponCode,
      password: userData.password,
      confirmPassword: userData.confirmPassword || userData.password, // Use password if confirmPassword not provided
      termsAccepted: userData.agreeTerms === true || userData.agreeTerms === 'true' ? 'true' : 'false',
      riskDisclosureAccepted: userData.agreeRisk === true || userData.agreeRisk === 'true' ? 'true' : 'false',
      couponAcknowledged: userData.acknowledgeRefund === true || userData.acknowledgeRefund === 'true' ? 'true' : 'false',
    };
    const response = await api.post('/auth/register', registerData);
    return response.data;
  },

  // Alias for register (for backward compatibility)
  signup: async (userData) => {
    return authService.register(userData);
  },

  verifyEmail: async (token) => {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  resendVerification: async (email) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },

  forgotPassword: async (email) => {
    // Note: This endpoint may not exist yet in the backend
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('ldf_token');
    localStorage.removeItem('ldf_user');
  }
};

// =========================================================================
// DASHBOARD SERVICES
// =========================================================================
export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/dashboard/profile');
    return response.data;
  }
};

// =========================================================================
// ACTIVATION SERVICES
// =========================================================================
export const activationService = {
  activate: async (couponCode) => {
    const response = await api.post('/activate', { couponCode });
    return response.data;
  }
};

// =========================================================================
// PAYMENT SERVICES
// =========================================================================
export const paymentService = {
  // Initialize payment for premium upgrade
  initializePayment: async (amount) => {
    const response = await api.post('/payment/initialize', { amount });
    return response.data;
  },

  // Initialize payment for agent coupon credits
  // Get payment URL for agent coupon credits (redirect-based)
  getAgentCouponPaymentUrl: async (quantity) => {
    console.log('Making POST request to /payment/agent-coupons/pay with quantity:', quantity);
    const response = await api.post('/payment/agent-coupons/pay', { quantity });
    console.log('Response received:', response.data);
    return response.data;
  },
  initializeAgentCouponPayment: async (quantity) => {
    const response = await api.post('/payment/agent-coupons/initialize', { quantity });
    return response.data;
  },
  verifyAgentCouponPayment: async (tx_ref) => {
    const response = await api.post('/payment/agent-coupons/verify', { tx_ref });
    return response.data;
  }
};

// =========================================================================
// WALLET SERVICES
// =========================================================================
export const walletService = {
  // Get wallet balance and summary
  getWalletData: async () => {
    try {
      // Get balance from withdrawal endpoint
      const balanceResponse = await api.get('/withdraw/balance');
      const balance = balanceResponse.data.balance || 0;
      
      // Get stats for total earnings
      const statsResponse = await api.get('/dashboard/stats');
      const stats = statsResponse.data;
      
      // Get transactions
      const transactionsResponse = await walletService.getTransactions();
      
      return {
        currentBalance: balance,
        totalEarnings: stats.totalEarnings || 0,
        minWithdrawal: 5000, // Default minimum
        globalPoolStatus: stats.globalPoolStatus || 'Ineligible',
        globalPoolAmount: 0, // Can be calculated from earnings if needed
      };
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      throw error;
    }
  },

  // Get balance only
  getBalance: async () => {
    const response = await api.get('/withdraw/balance');
    return response.data;
  },

  // Get transaction history (earnings and withdrawals)
  getTransactions: async () => {
    try {
      // Get earnings
      const earningsResponse = await api.get('/dashboard/stats');
      // Note: Full transaction history endpoint may need to be created
      // For now, return empty array or mock data structure
      return {
        transactions: [],
        // In the future, this should call a dedicated transactions endpoint
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return { transactions: [] };
    }
  },

  // Request withdrawal
  requestWithdrawal: async (amount, currency = 'NGN', bankDetails = {}) => {
    const response = await api.post('/withdraw', {
      amount,
      currency,
      ...bankDetails
    });
    return response.data;
  }
};

// =========================================================================
// AGENT SERVICES (for agents only)
// =========================================================================
export const agentService = {
  // Get agent's coupons
  getCoupons: async () => {
    const response = await api.get('/agent/coupons');
    return response.data;
  },

  // Generate new coupon codes
  generateCoupons: async (quantity = 1) => {
    const response = await api.post('/agent/coupons/generate', { quantity });
    return response.data;
  }
};

// =========================================================================
// ADMIN SERVICES (for admins only)
// =========================================================================
export const adminService = {
  // Upgrade user to agent
  upgradeToAgent: async (userId) => {
    const response = await api.post('/admin/upgrade-agent', { userId });
    return response.data;
  }
};

// =========================================================================
// MATRIX SERVICES
// =========================================================================
export const matrixService = {
  // Get matrix data (team structure and earnings)
  getMatrixData: async () => {
    try {
      // Get stats, profile, and matrix tree in parallel
      const [statsResponse, profileResponse, matrixResponse] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/profile'),
        api.get('/dashboard/matrix'),
      ]);

      const stats = statsResponse.data;
      const profile = profileResponse.data;
      const matrixTree = matrixResponse.data?.tree;
      
      // Structured data used by MatrixView
      return {
        username: profile.username || 'user',
        totalDownline: stats.teamSize || 0,
        filledSpots: stats.directReferrals || 0,
        potentialEarning: stats.totalEarnings || 0,
        matrixLevels: [
          { level: 1, required: 2, current: Math.min(stats.directReferrals || 0, 2), status: (stats.directReferrals || 0) >= 2 ? 'Completed' : 'In Progress', bonus: 200 },
          { level: 2, required: 4, current: 0, status: 'In Progress', bonus: 100 },
          { level: 3, required: 8, current: 0, status: 'In Progress', bonus: 70 },
          { level: 4, required: 16, current: 0, status: 'In Progress', bonus: 60 },
          { level: 5, required: 32, current: 0, status: 'In Progress', bonus: 70 },
        ],
        tree: matrixTree || null,
      };
    } catch (error) {
      console.error('Error fetching matrix data:', error);
      throw error;
    }
  }
};

// =========================================================================
// SETTINGS SERVICES
// =========================================================================
// Note: These endpoints may need to be created in the backend
export const settingsService = {
  // Update user profile
  updateProfile: async (profileData) => {
    // TODO: Create PUT /api/dashboard/profile endpoint in backend
    // For now, this will fail until the endpoint is created
    const response = await api.put('/dashboard/profile', profileData);
    return response.data;
  },

  // Update bank details
  updateBankDetails: async (bankData) => {
    // TODO: Create PUT /api/dashboard/bank endpoint in backend
    // For now, this will fail until the endpoint is created
    const response = await api.put('/dashboard/bank', bankData);
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    // TODO: Create PUT /api/dashboard/password endpoint in backend
    // For now, this will fail until the endpoint is created
    const response = await api.put('/dashboard/password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }
};
