# Seerbit Integration Setup Guide

## Step 1: Sign Up for Seerbit Merchant Account

1. **Visit Seerbit Website:**
   - Go to: https://seerbit.com
   - Click "Get Started" or "Sign Up"

2. **Register as a Merchant:**
   - Fill out the merchant registration form
   - Provide business details (company name, registration documents, etc.)
   - Complete KYC verification
   - Wait for approval (usually 1-2 business days)

3. **Access Dashboard:**
   - Once approved, log into your Seerbit Dashboard
   - URL: https://dashboard.seerbit.com

## Step 2: Get API Credentials

### For Sandbox/Testing:
1. Go to Seerbit Sandbox: https://dashboard.seerbit.com (use sandbox mode)
2. Navigate to **Settings** → **API Keys** or **Developer Settings**
3. Generate or view your credentials:
   - **Public Key** (also called API Key)
   - **Secret Key** (also called Private Key)

### For Production:
1. After merchant approval, log into your Seerbit Dashboard
2. Go to **Settings** → **API Keys** or **Developer Settings**
3. Generate or view your credentials:
   - **Public Key**
   - **Secret Key**

## Step 3: Configure Environment Variables

Add these to your `.env` file in the `ldf` folder:

```env
# Seerbit Configuration
SEERBIT_PUBLIC_KEY=your_public_key_here
SEERBIT_SECRET_KEY=your_secret_key_here
SEERBIT_ENVIRONMENT=sandbox
```

### Environment Options:
- `SEERBIT_ENVIRONMENT=sandbox` - For testing (default)
- `SEERBIT_ENVIRONMENT=production` - For live transactions

## Step 4: Configure Webhook URL

1. **In Seerbit Dashboard:**
   - Go to **Settings** → **Webhooks** or **Notifications**
   - Add webhook URL: `https://your-domain.com/api/webhooks/seerbit`
   - For local testing with ngrok: `https://your-ngrok-url.ngrok.io/api/webhooks/seerbit`

2. **Webhook Events to Subscribe:**
   - Transaction Status Updates
   - Transfer Completion
   - Transfer Failure

## Step 5: Get Bank Codes

The system includes a bank code mapping for common Nigerian banks. If you need to add more banks:

1. **Via API:** Call `GET /api/v2/banks` (requires authentication)
2. **Via Dashboard:** Check Seerbit documentation for bank codes
3. **Common Bank Codes:**
   - Access Bank: 044
   - GTBank: 058
   - First Bank: 011
   - UBA: 033
   - Zenith Bank: 057
   - Fidelity Bank: 070
   - Union Bank: 032
   - Stanbic IBTC: 221
   - Sterling Bank: 232
   - Wema Bank: 035
   - FCMB: 214
   - Heritage Bank: 030
   - Keystone Bank: 082
   - Polaris Bank: 076
   - Providus Bank: 101
   - Jaiz Bank: 301
   - Taj Bank: 302

## Step 6: Test the Integration

### Test Endpoint:
```bash
POST /api/admin/withdrawals/process
Headers: { "Authorization": "Bearer YOUR_ADMIN_TOKEN" }
Body: { "withdrawalId": 1 }
```

### Test Flow:
1. User creates withdrawal request → Status: PENDING
2. Admin processes withdrawal → Calls Seerbit API → Status: APPROVED/PAID
3. Seerbit webhook updates status → Status: PAID/FAILED

## Important Notes:

1. **Sandbox vs Production:**
   - Sandbox: Use for testing, no real money
   - Production: Real transactions, requires merchant approval

2. **API Documentation:**
   - Seerbit API Docs: https://seerbit.com/api-documentation
   - Bank Transfer API: Check Seerbit developer documentation

3. **Support:**
   - Seerbit Support: support@seerbit.com
   - Developer Support: dev@seerbit.com
   - Phone: Check Seerbit website for support numbers

4. **Fees:**
   - Check Seerbit pricing for bank transfer fees
   - Usually a percentage or flat fee per transaction

## Troubleshooting:

- **"Credentials not configured"**: Check your `.env` file has all required variables
- **"Bank code not found"**: Add the bank to the mapping in `seerbitService.js` or `withdrawalService.js`
- **Webhook not working**: Verify webhook URL is accessible and signature verification is correct
- **Token authentication fails**: Verify your Public Key and Secret Key are correct

## Seerbit Advantages:

- ✅ Lower transaction fees
- ✅ Fast bank transfers
- ✅ Good documentation
- ✅ Reliable service in Nigeria
- ✅ Easy integration

