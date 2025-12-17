# Payment Integration Setup (Flutterwave)

## Environment Variables

Add these to your `.env` file:

```env
# Flutterwave API Keys (get from https://dashboard.flutterwave.com)
FLUTTERWAVE_PUBLIC_KEY=your_public_key_here
FLUTTERWAVE_SECRET_KEY=your_secret_key_here

# Flutterwave Webhook Secret Hash (set in Flutterwave dashboard)
FLUTTERWAVE_SECRET_HASH=your_webhook_secret_hash_here

# Frontend URL (for payment redirect)
FRONTEND_URL=http://localhost:5173
```

## Setup Steps

1. **Get Flutterwave API Keys:**
   - Sign up at https://dashboard.flutterwave.com
   - Go to Settings → API Keys
   - Copy your Public Key and Secret Key

2. **Set Webhook URL:**
   - In Flutterwave dashboard, go to Settings → Webhooks
   - Add webhook URL: `https://yourdomain.com/api/webhooks/payment`
   - Copy the Secret Hash and add to `.env`

3. **Test Payment Flow:**
   - Use Flutterwave test cards: https://developer.flutterwave.com/docs/test-cards
   - Initialize payment: `POST /api/payment/initialize`
   - User completes payment on Flutterwave checkout
   - Webhook automatically upgrades user to premium

## API Endpoints

### Initialize Payment
```
POST /api/payment/initialize
Headers: Authorization: Bearer <token>
Body: { "amount": 5000 }
Response: { "paymentLink": "...", "paymentReference": "..." }
```

### Webhook (Flutterwave calls this)
```
POST /api/webhooks/payment
Headers: verif-hash: <signature>
Body: <Flutterwave webhook payload>
```

## Usage in Frontend

### Option 1: Using PaymentModal Component (Recommended)

```jsx
import { useState } from 'react';
import PaymentModal from './components/PaymentModal';

function PremiumUpgrade() {
  const [showPayment, setShowPayment] = useState(false);

  const handlePaymentSuccess = (response) => {
    console.log('Payment successful:', response);
    // Refresh user data or show success message
    alert('Payment successful! You are now a premium member.');
  };

  return (
    <>
      <button onClick={() => setShowPayment(true)}>
        Upgrade to Premium
      </button>
      
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={10000}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
```

### Option 2: Direct API Call

```javascript
import { paymentService } from './api/services';

// Initialize payment
const response = await paymentService.initializePayment(5000);

// Use Flutterwave inline widget
if (window.FlutterwaveCheckout) {
  window.FlutterwaveCheckout({
    public_key: response.data.publicKey,
    tx_ref: response.data.tx_ref,
    amount: response.data.amount,
    currency: response.data.currency,
    customer: response.data.customer,
    customizations: response.data.customizations,
    callback: function(response) {
      if (response.status === 'successful') {
        // Payment successful
        console.log('Payment completed');
      }
    },
  });
}
```

## Payment Flow

1. User clicks "Upgrade to Premium" button
2. Frontend calls `POST /api/payment/initialize` with amount
3. Backend creates pending investment record and returns payment details
4. Flutterwave inline payment widget opens (stays on your site)
5. User completes payment
6. Flutterwave sends webhook to `/api/webhooks/payment`
7. Backend verifies and upgrades user to premium
8. Frontend receives success callback

