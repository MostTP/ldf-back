# Payment Integration Guide

## ✅ Current Status

**Backend:** ✅ Working
- Endpoint: `POST /api/payment/initialize` 
- Requires authentication
- Returns payment data for Flutterwave inline widget

**Frontend Service:** ✅ Working
- `paymentService.initializePayment(amount)` is defined

**PaymentModal Component:** ✅ Created but **NOT integrated yet**

## 🔧 How to Integrate PaymentModal

### Option 1: Add to Dashboard Home (Recommended)

Update `src/pages/Dashboard/DashboardHome.jsx`:

```jsx
import { useState } from 'react';
import PaymentModal from '../../components/PaymentModal';
import { Crown } from 'lucide-react';

export default function DashboardHome() {
    const [showPayment, setShowPayment] = useState(false);
    // ... existing code ...

    const isPremium = profile?.isPremium || false;

    const handlePaymentSuccess = (response) => {
        console.log('Payment successful:', response);
        // Reload dashboard data
        loadDashboardData();
        setShowPayment(false);
        alert('Payment successful! You are now a premium member.');
    };

    return (
        <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
            {/* ... existing stats grid ... */}

            {/* Premium Upgrade Card */}
            {!isPremium && (
                <div className="mt-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <Crown className="w-8 h-8 mb-2" />
                            <h3 className="text-2xl font-bold mb-2">Upgrade to Premium</h3>
                            <p className="text-yellow-100">Get higher returns and exclusive benefits</p>
                        </div>
                        <button
                            onClick={() => setShowPayment(true)}
                            className="px-6 py-3 bg-white text-yellow-600 font-semibold rounded-lg hover:bg-yellow-50 transition-colors"
                        >
                            Upgrade Now (₦10,000)
                        </button>
                    </div>
                </div>
            )}

            <PaymentModal
                isOpen={showPayment}
                onClose={() => setShowPayment(false)}
                amount={10000}
                onSuccess={handlePaymentSuccess}
            />
        </div>
    );
}
```

### Option 2: Add to Wallet Page

Update `src/pages/Dashboard/WalletPage.jsx`:

```jsx
import PaymentModal from '../../components/PaymentModal';

export default function WalletPage() {
    const [showPayment, setShowPayment] = useState(false);
    // ... existing code ...

    return (
        <div>
            {/* ... existing wallet content ... */}
            
            <button onClick={() => setShowPayment(true)}>
                Upgrade to Premium
            </button>

            <PaymentModal
                isOpen={showPayment}
                onClose={() => setShowPayment(false)}
                amount={10000}
                onSuccess={() => window.location.reload()}
            />
        </div>
    );
}
```

### Option 3: Create Dedicated Premium Page

Create `src/pages/Dashboard/PremiumPage.jsx`:

```jsx
import { useState } from 'react';
import PaymentModal from '../../components/PaymentModal';
import { Crown, CheckCircle2 } from 'lucide-react';

export default function PremiumPage() {
    const [showPayment, setShowPayment] = useState(false);

    const handlePaymentSuccess = () => {
        alert('Payment successful! You are now a premium member.');
        setShowPayment(false);
        window.location.reload();
    };

    return (
        <div className="p-6 md:p-10">
            <h1 className="text-3xl font-bold mb-6">Premium Membership</h1>
            
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl p-8 text-white mb-6">
                <Crown className="w-12 h-12 mb-4" />
                <h2 className="text-2xl font-bold mb-4">Upgrade to Premium</h2>
                <ul className="space-y-2 mb-6">
                    <li className="flex items-center">
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Higher monthly returns
                    </li>
                    <li className="flex items-center">
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Priority in payout queues
                    </li>
                    <li className="flex items-center">
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Exclusive promotions
                    </li>
                </ul>
                <button
                    onClick={() => setShowPayment(true)}
                    className="px-8 py-3 bg-white text-yellow-600 font-semibold rounded-lg hover:bg-yellow-50"
                >
                    Upgrade Now - ₦10,000
                </button>
            </div>

            <PaymentModal
                isOpen={showPayment}
                onClose={() => setShowPayment(false)}
                amount={10000}
                onSuccess={handlePaymentSuccess}
            />
        </div>
    );
}
```

Then add route in `App.jsx`:
```jsx
<Route path="premium" element={<PremiumPage />} />
```

## 🧪 Testing

1. **Make sure backend is running** on `http://localhost:4000`
2. **Set environment variables** in backend `.env`:
   ```
   FLUTTERWAVE_PUBLIC_KEY=your_key
   FLUTTERWAVE_SECRET_KEY=your_key
   FLUTTERWAVE_SECRET_HASH=your_hash
   ```
3. **Login to dashboard**
4. **Click "Upgrade to Premium"** button
5. **Payment modal should open**
6. **Use Flutterwave test card**: `5531886652142950` (CVV: 123, Expiry: 12/32)

## 📝 Notes

- Payment requires user to be authenticated (token in localStorage)
- Webhook automatically upgrades user after successful payment
- Frontend should refresh user data after payment success
- Payment stays on your site (no redirect)

