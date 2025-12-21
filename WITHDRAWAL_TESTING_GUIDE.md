# Withdrawal Testing Guide

## How to Test Withdrawals in the Frontend

### Prerequisites

1. **User must have earnings** - You need some balance to withdraw
2. **KYC must be verified** - User needs `kycVerified: true` in database
3. **Bank details must be set** - User needs `bankName` and `bankAccount` in profile
4. **Seerbit credentials** - Add to `.env` (see `SEERBIT_SETUP.md`)

### Step 1: Ensure User Has Balance

The balance is calculated as: `Total Earnings - Total Withdrawals`

To give a user earnings for testing:
- Option A: Create earnings via database (direct SQL/Prisma)
- Option B: Have someone activate with a coupon (creates referral/matrix earnings)
- Option C: Use admin endpoint to create earnings (if you create one)

### Step 2: Verify KYC Status

Check if user has `kycVerified: true`:
```sql
-- In Prisma Studio or database
SELECT id, email, kycVerified FROM User WHERE email = 'user@example.com';
```

If not verified, update it:
```sql
UPDATE User SET kycVerified = true WHERE id = 1;
```

### Step 3: Set Bank Details

Bank details should be in user profile. Check in Settings page or update via:
- Settings page in frontend
- Or directly in database

### Step 4: Test Withdrawal Flow

#### A. Frontend Testing (User Side)

1. **Navigate to Wallet Page:**
   - Go to: `/dashboard/wallet` or click "Wallet" in sidebar
   - You should see:
     - Available Balance
     - Total Earnings
     - Withdrawal form

2. **Submit Withdrawal Request:**
   - Enter amount (minimum ₦5,000)
   - Click "Submit Payout Request"
   - You should see success message
   - Withdrawal appears in Transaction History with status "PENDING"

3. **Check Withdrawal Status:**
   - View Transaction History table
   - Status will show: PENDING → APPROVED → PAID (or FAILED)

#### B. Backend Testing (Admin Side)

1. **Process Withdrawal:**
   ```bash
   POST /api/admin/withdrawals/process
   Headers: { "Authorization": "Bearer ADMIN_TOKEN" }
   Body: { "withdrawalId": 1 }
   ```

2. **Check Withdrawal Status:**
   ```bash
   GET /api/withdraw/history
   Headers: { "Authorization": "Bearer USER_TOKEN" }
   ```

### Step 5: Test Different Scenarios

#### ✅ Success Flow:
1. User has balance ≥ ₦5,000
2. User has KYC verified
3. User has bank details
4. Submit withdrawal → Status: PENDING
5. Admin processes → Calls Seerbit → Status: APPROVED/PAID
6. Seerbit webhook updates → Status: PAID

#### ❌ Error Scenarios:

**Test 1: Insufficient Balance**
- Try withdrawing more than available balance
- Should show: "Insufficient balance"

**Test 2: KYC Not Verified**
- Set `kycVerified: false` for user
- Try withdrawing
- Should show: "KYC verification required for withdrawals"

**Test 3: Below Minimum**
- Try withdrawing less than ₦5,000
- Frontend should prevent submission

**Test 4: No Bank Details**
- Remove bank details from user
- Try withdrawing
- Should use default from user profile or show error

### Step 6: Monitor Withdrawal Status

**In Frontend:**
- Transaction History table shows all withdrawals
- Status indicators:
  - ✅ Green checkmark = PAID/Completed
  - ⏰ Yellow clock = PENDING/APPROVED
  - ❌ Red X = FAILED

**In Backend Logs:**
- Check for Seerbit API calls
- Check for webhook receipts
- Check for errors

### Step 7: Test Webhook (Seerbit)

1. **Configure Webhook URL in Seerbit Dashboard:**
   - URL: `https://your-ngrok-url.ngrok.io/api/webhooks/seerbit`
   - Or production URL when deployed

2. **Test Webhook:**
   - After processing withdrawal, Seerbit will send webhook
   - Check backend logs for webhook receipt
   - Withdrawal status should update automatically

### Common Issues & Solutions

**Issue: "No transactions yet"**
- **Solution:** Make sure `getTransactions()` is calling `/withdraw/history` endpoint

**Issue: Balance not updating after withdrawal**
- **Solution:** Balance only updates when withdrawal status is APPROVED or PAID. PENDING withdrawals don't affect balance.

**Issue: "KYC verification required"**
- **Solution:** Update user's `kycVerified` field to `true` in database

**Issue: "Bank code not found"**
- **Solution:** Ensure bank name matches exactly (case-sensitive). Check bank code mapping in `withdrawalService.js`

### Testing Checklist

- [ ] User has earnings/balance
- [ ] User has KYC verified
- [ ] User has bank details set
- [ ] Can submit withdrawal request
- [ ] Withdrawal appears in history
- [ ] Admin can process withdrawal
- [ ] Seerbit API is called
- [ ] Webhook updates status
- [ ] Balance updates correctly
- [ ] Error handling works

### Quick Test Commands

```bash
# Check user balance
curl -H "Authorization: Bearer TOKEN" http://localhost:4000/api/withdraw/balance

# Get withdrawal history
curl -H "Authorization: Bearer TOKEN" http://localhost:4000/api/withdraw/history

# Submit withdrawal (from frontend or Postman)
curl -X POST http://localhost:4000/api/withdraw \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000}'

# Admin process withdrawal
curl -X POST http://localhost:4000/api/admin/withdrawals/process \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"withdrawalId": 1}'
```

