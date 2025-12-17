// src/components/PaymentModal.jsx
import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { paymentService } from '../api/services';

export default function PaymentModal({ isOpen, onClose, amount = 5000, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      // Check if script already exists
      if (window.FlutterwaveCheckout) {
        return; // Already loaded
      }

      // Load Flutterwave inline script
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      document.body.appendChild(script);

      return () => {
        // Don't remove script on unmount - keep it for future use
        // Script will be reused if component remounts
      };
    }
  }, [isOpen]);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize payment from backend
      const response = await paymentService.initializePayment(amount);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to initialize payment');
      }

      const { publicKey, tx_ref, amount: paymentAmount, currency, customer, customizations, meta } = response.data;
      setPaymentData(response.data);

      // Wait for Flutterwave SDK to load if not already available
      let attempts = 0;
      const maxAttempts = 10;
      
      const tryPayment = () => {
        if (window.FlutterwaveCheckout) {
          window.FlutterwaveCheckout({
          public_key: publicKey,
          tx_ref: tx_ref,
          amount: paymentAmount,
          currency: currency,
          payment_options: 'card,ussd,banktransfer,mobilemoney',
          customer: customer,
          customizations: customizations,
          meta: meta,
          callback: function(response) {
            // Payment completed
            if (response.status === 'successful') {
              onSuccess?.(response);
              onClose();
            } else {
              setError('Payment was not successful. Please try again.');
            }
            setLoading(false);
          },
          onclose: function() {
            // User closed the payment modal
            setLoading(false);
            setError(null);
          },
          });
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(tryPayment, 500); // Wait 500ms and try again
        } else {
          throw new Error('Flutterwave SDK failed to load. Please refresh the page.');
        }
      };

      tryPayment();
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to process payment');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Upgrade to Premium</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">Amount to pay:</p>
          <p className="text-3xl font-bold text-[--emerald]">₦{amount.toLocaleString()}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-[--emerald] text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Proceed to Payment'
            )}
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-500 text-center">
          Secure payment powered by Flutterwave
        </p>
      </div>
    </div>
  );
}

