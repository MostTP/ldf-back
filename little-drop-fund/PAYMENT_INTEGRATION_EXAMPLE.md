# Payment Integration Example

## How to Use PaymentModal Component

### Basic Usage

```jsx
import { useState } from 'react';
import PaymentModal from './components/PaymentModal';

function PremiumUpgradeButton() {
  const [showPayment, setShowPayment] = useState(false);

  const handlePaymentSuccess = (response) => {
    console.log('Payment successful:', response);
    // Refresh user data or redirect
    window.location.reload(); // Or update user state
  };

  return (
    <>
      <button 
        onClick={() => setShowPayment(true)}
        className="px-6 py-3 bg-[--gold] text-black font-semibold rounded-lg"
      >
        Upgrade to Premium (₦10,000)
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

### Integration with PremiumInvestment Component

Update `PremiumInvestment.jsx`:

```jsx
import { useState } from 'react';
import PaymentModal from './PaymentModal';

export default function PremiumInvestment({ onOpenSignup }) {
  const [showPayment, setShowPayment] = useState(false);

  const handlePaymentSuccess = () => {
    alert('Payment successful! You are now a premium member.');
    setShowPayment(false);
    // Optionally refresh page or update UI
  };

  return (
    <>
      {/* ... existing code ... */}
      
      <button 
        onClick={() => setShowPayment(true)}
        className="mt-6 w-full py-3 rounded-lg bg-[--gold] text-black font-semibold"
      >
        Activate Premium (Min. ₦10,000)
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

## Features

✅ **No Redirect** - Payment happens inline on your website  
✅ **Multiple Payment Methods** - Card, USSD, Bank Transfer, Mobile Money  
✅ **Secure** - Webhook verification ensures payment authenticity  
✅ **User-Friendly** - Modal interface with loading states  
✅ **Error Handling** - Clear error messages for failed payments  

## Payment Flow

1. User clicks "Upgrade to Premium"
2. PaymentModal opens
3. User clicks "Proceed to Payment"
4. Flutterwave inline widget appears (stays on your site)
5. User completes payment
6. Webhook automatically upgrades user
7. Success callback fires
8. Modal closes

