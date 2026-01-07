import React, { useState, useEffect } from 'react';
import { X, Loader2, Plus, Minus, CreditCard, ShieldCheck } from 'lucide-react';
import { paymentService } from '../api/services';

export default function PaymentModal({ isOpen, onClose, currentSlots = 0, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  
  const slotPrice = 10000;
  const totalAmount = quantity * slotPrice;

  // Load Flutterwave Script
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      if (window.FlutterwaveCheckout) return;
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [isOpen]);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Initialize payment with the dynamic totalAmount
      const response = await paymentService.initializePayment(totalAmount);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to initialize payment');
      }

      const { publicKey, tx_ref, amount: paymentAmount, currency, customer, customizations, meta } = response.data;

      // 2. Open Flutterwave Checkout
      if (window.FlutterwaveCheckout) {
        window.FlutterwaveCheckout({
          public_key: publicKey,
          tx_ref: tx_ref,
          amount: paymentAmount,
          currency: currency,
          payment_options: 'card,ussd,banktransfer,mobilemoney',
          customer: customer,
          customizations: {
            ...customizations,
            title: "LDF Capital Pool",
            description: `Purchase of ${quantity} Investment Slot(s)`,
          },
          // Send slot_quantity to backend via meta
          meta: { ...meta, slot_quantity: quantity },
          callback: function(response) {
            if (response.status === 'successful') {
              // Pass the quantity back to DashboardHome for the success overlay
              onSuccess?.({ ...response, meta: { slot_quantity: quantity } });
              onClose();
            } else {
              setError('Payment was not successful. Please try again.');
            }
            setLoading(false);
          },
          onclose: () => setLoading(false),
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to process payment');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {currentSlots > 0 ? 'Expand Investment' : 'Premium Activation'}
            </h2>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-tight">
               LDF Capital Pool Portfolio
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors" disabled={loading}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Quantity Selector Section */}
          <div className="mb-6 p-4 bg-gray-900 rounded-xl text-white text-center shadow-lg">
            <label className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-3 block">
              Number of Slots
            </label>
            <div className="flex items-center justify-center gap-8">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-30"
                disabled={loading || quantity <= 1}
              >
                <Minus size={20} />
              </button>
              
              <div className="flex flex-col">
                <span className="text-4xl font-black leading-none">{quantity}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">Units</span>
              </div>
              
              <button 
                onClick={() => setQuantity(q => q + 1)}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                disabled={loading}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Pricing Details */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center px-2">
              <span className="text-gray-600 font-medium">Price per slot:</span>
              <span className="font-bold">₦10,000</span>
            </div>
            <div className="flex justify-between items-center px-2 pt-3 border-t border-gray-100">
              <span className="text-gray-900 font-bold">Total Payable:</span>
              <span className="text-2xl font-black text-[--emerald]">₦{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full py-4 bg-[--emerald] text-white rounded-xl font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-100"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CreditCard size={18} />
                  {currentSlots > 0 ? 'Buy More Slots' : 'Activate Premium'}
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-2 text-sm text-gray-500 font-medium hover:text-gray-700 transition-colors"
              disabled={loading}
            >
              Cancel Transaction
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-center gap-2 text-gray-400">
            <ShieldCheck size={14} />
            <p className="text-[10px] font-bold uppercase tracking-tighter">
              Secured by Flutterwave Infrastructure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}