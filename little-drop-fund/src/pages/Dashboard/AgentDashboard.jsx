// src/pages/Dashboard/AgentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Copy, CheckCircle, XCircle, Loader, Crown } from 'lucide-react';
import { agentService, dashboardService, paymentService } from '../../api/services';
import { getUser } from '../../utils/auth';

export default function AgentDashboard() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [copiedCode, setCopiedCode] = useState(null);
    const [user, setUser] = useState(getUser());
    const [buyQuantity, setBuyQuantity] = useState(1);

    useEffect(() => {
        // Check if user is agent, if not try to fetch profile
        if (user?.isAgent) {
            loadCoupons();
        } else if (user) {
            // User exists but might not have isAgent property
            // Try to load profile to get updated user data
            loadUserProfile();
        } else {
            setLoading(false);
        }
    }, []);

    const loadUserProfile = async () => {
        try {
            const profile = await dashboardService.getProfile();
            // Update user in localStorage and state with profile data
            if (profile) {
                const updatedUser = { ...user, ...profile };
                localStorage.setItem('ldf_user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                // Reload coupons if user is agent
                if (profile.isAgent) {
                    loadCoupons();
                } else {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        } catch (err) {
            console.error('Error loading profile:', err);
            setLoading(false);
        }
    };

    const loadCoupons = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await agentService.getCoupons();
            console.log('Coupons response:', response); // Debug log
            
            // Handle different response structures
            const couponsData = response?.data || response || [];
            setCoupons(Array.isArray(couponsData) ? couponsData : []);
        } catch (err) {
            console.error('Error loading coupons:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to load coupons';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        try {
            setGenerating(true);
            setError(null);
            const response = await agentService.generateCoupons(quantity);
            if (response.success) {
                await loadCoupons(); // Reload coupons
                setQuantity(1);
            }
        } catch (err) {
            console.error('Error generating coupons:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to generate coupons';
            setError(errorMessage);
        } finally {
            setGenerating(false);
        }
    };

    const handleBuyCredits = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const qty = parseInt(buyQuantity, 10) || 0;
        if (qty < 1) {
            setError('Quantity must be at least 1');
            return;
        }

        try {
            setError(null);
            
            // Initialize payment for inline widget (stays on page)
            const response = await paymentService.initializeAgentCouponPayment(qty);
            
            if (!response.success || !response.data) {
                throw new Error(response.message || 'Failed to initialize payment');
            }

            const { publicKey, tx_ref, amount, currency, customer, customizations, meta } = response.data;

            // Load Flutterwave script if not already loaded
            const loadFlutterwaveScript = () => {
                return new Promise((resolve, reject) => {
                    if (typeof window === 'undefined') {
                        reject(new Error('Window not available'));
                        return;
                    }

                    // Check if already loaded
                    if (window.FlutterwaveCheckout) {
                        resolve();
                        return;
                    }

                    // Check if script tag already exists
                    const existingScript = document.querySelector('script[src*="checkout.flutterwave.com"]');
                    if (existingScript) {
                        existingScript.onload = () => resolve();
                        existingScript.onerror = () => reject(new Error('Failed to load Flutterwave script'));
                        return;
                    }

                    // Create and load script
                    const script = document.createElement('script');
                    script.src = 'https://checkout.flutterwave.com/v3.js';
                    script.async = true;
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error('Failed to load Flutterwave script'));
                    document.body.appendChild(script);
                });
            };

            // Load script and open inline payment modal
            await loadFlutterwaveScript();
            
            // Wait a bit for Flutterwave to initialize
            await new Promise(resolve => setTimeout(resolve, 500));

            if (!window.FlutterwaveCheckout) {
                throw new Error('Flutterwave SDK not available after loading');
            }

            // Suppress Flutterwave analytics errors (non-critical, doesn't affect payment)
            // This error is from Flutterwave's event tracking system and doesn't affect payment processing
            // Note: Browser network errors (like "POST https://flw-events-ge.myflutterwave.com/event/create 400")
            // appear in the console but cannot be suppressed via JavaScript. They are harmless and don't affect payments.
            const originalError = console.error;
            const originalWarn = console.warn;
            let errorSuppressorActive = false;
            
            const errorSuppressor = (...args) => {
                const errorMsg = args.join(' ').toLowerCase();
                // Ignore Flutterwave event tracking errors (400 from flw-events-ge.myflutterwave.com)
                if (errorSuppressorActive && (
                    errorMsg.includes('flw-events-ge') || 
                    errorMsg.includes('event/create') ||
                    errorMsg.includes('flw-events-ge.myflutterwave.com') ||
                    errorMsg.includes('400') && errorMsg.includes('flutterwave')
                )) {
                    return; // Suppress this error
                }
                originalError.apply(console, args);
            };
            
            const warnSuppressor = (...args) => {
                const warnMsg = args.join(' ').toLowerCase();
                // Also suppress warnings from Flutterwave analytics
                if (errorSuppressorActive && (
                    warnMsg.includes('flw-events-ge') || 
                    warnMsg.includes('event/create')
                )) {
                    return; // Suppress this warning
                }
                originalWarn.apply(console, args);
            };
            
            const restoreError = () => {
                if (errorSuppressorActive) {
                    console.error = originalError;
                    console.warn = originalWarn;
                    errorSuppressorActive = false;
                }
            };

            // Activate error suppression
            console.error = errorSuppressor;
            console.warn = warnSuppressor;
            errorSuppressorActive = true;

            // Store tx_ref for verification if needed
            const paymentTxRef = tx_ref;
            
            // Open inline payment modal (stays on your page, no redirect)
            window.FlutterwaveCheckout({
                public_key: publicKey,
                tx_ref: paymentTxRef,
                amount,
                currency,
                payment_options: 'card,ussd,banktransfer,mobilemoney',
                customer,
                customizations,
                meta,
                callback: async function (response) {
                    restoreError(); // Restore original console.error
                    
                    if (response.status === 'successful') {
                        // Backend webhook will credit the agent; wait a moment for webhook to process
                        setError(null);
                        setBuyQuantity(1); // Reset quantity
                        
                        // Store old balance before waiting
                        const oldBalance = user?.agentCouponCredits || 0;
                        
                        // Wait 3 seconds for webhook to process, then refresh profile
                        setTimeout(async () => {
                            await loadUserProfile();
                            
                            // If balance didn't update, try manual verification
                            const updatedProfile = await dashboardService.getProfile();
                            const newBalance = updatedProfile?.agentCouponCredits || 0;
                            
                            if (newBalance === oldBalance && paymentTxRef) {
                                // Webhook might not have fired, try manual verification
                                try {
                                    console.log('Balance not updated, attempting manual verification...');
                                    const verifyResponse = await paymentService.verifyAgentCouponPayment(paymentTxRef);
                                    if (verifyResponse.success) {
                                        console.log('Manual verification successful!', verifyResponse);
                                        await loadUserProfile(); // Refresh again to show new balance
                                    }
                                } catch (verifyErr) {
                                    console.error('Manual verification failed:', verifyErr);
                                    setError('Payment successful but balance not updated. Please contact support with payment reference: ' + paymentTxRef);
                                }
                            }
                        }, 3000); // Wait 3 seconds for webhook to process
                    } else {
                        setError('Payment was not successful. Please try again.');
                    }
                },
                onclose: function () {
                    restoreError(); // Restore original console.error when modal closes
                    // User closed the payment modal
                    // Do nothing, just let them try again
                },
            });
        } catch (err) {
            console.error('Buy credits error:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to start payment';
            setError(errorMessage);
        }
    };

    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Check if user is agent (from localStorage or after profile load)
    const isAgent = user?.isAgent;
    
    if (!isAgent && !loading) {
        return (
            <div className="p-8 max-w-4xl mx-auto text-center">
                <Crown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-700 mb-2">Agent Access Required</h2>
                <p className="text-gray-600">You need to be an agent to access this page.</p>
                <p className="text-sm text-gray-500 mt-2">Please contact an administrator to upgrade your account.</p>
            </div>
        );
    }

    if (loading && coupons.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <Loader size={36} className="animate-spin text-[--emerald]" />
                <p className="ml-4 text-lg text-gray-600">Loading coupons...</p>
            </div>
        );
    }

    const usedCount = coupons.filter(c => c.isUsed).length;
    const availableCount = coupons.filter(c => !c.isUsed).length;
    const couponCredits = user?.agentCouponCredits ?? 0;

    return (
        <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
            <div className="flex items-center gap-3 mb-6">
                <Crown className="w-8 h-8 text-[--gold]" />
                <h1 className="text-3xl font-bold text-[--dark]">Agent Dashboard</h1>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Coupons</p>
                            <h3 className="text-2xl font-bold text-[--dark] mt-1">{coupons.length}</h3>
                        </div>
                        <Ticket className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Coupon Credits</p>
                            <h3 className="text-2xl font-bold text-[--dark] mt-1">{couponCredits}</h3>
                            <p className="text-xs text-gray-500 mt-1">1 credit = 1 coupon you can generate</p>
                        </div>
                        <Crown className="w-8 h-8 text-[--gold]" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Available</p>
                            <h3 className="text-2xl font-bold text-green-600 mt-1">{availableCount}</h3>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Used</p>
                            <h3 className="text-2xl font-bold text-gray-600 mt-1">{usedCount}</h3>
                        </div>
                        <XCircle className="w-8 h-8 text-gray-500" />
                    </div>
                </div>
            </div>

            {/* Generate Coupons + Buy Credits */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-[--dark] mb-4">Generate New Coupons</h2>
                <form onSubmit={handleGenerate} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity (1-100)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--emerald] focus:border-transparent"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={generating}
                        className="px-6 py-2 bg-[--emerald] text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {generating ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Generate
                            </>
                        )}
                    </button>
                </form>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-[--dark] mb-2">Buy Coupon Credits</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        1 credit = 1 coupon you can generate. Each credit costs ₦100.
                    </p>
                    <form onSubmit={handleBuyCredits} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Credits to buy
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={buyQuantity}
                                onChange={(e) => setBuyQuantity(parseInt(e.target.value) || 1)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[--emerald] focus:border-transparent"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-[--emerald] text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                            Pay with Flutterwave
                        </button>
                    </form>
                </div>
            </div>

            {/* Coupons List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-[--dark] mb-4">My Coupons</h2>
                {coupons.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No coupons generated yet. Generate your first coupon above.</p>
                ) : (
                    <div className="space-y-3">
                        {coupons.map((coupon) => (
                            <div
                                key={coupon.id}
                                className={`p-4 rounded-lg border-2 flex items-center justify-between ${
                                    coupon.isUsed
                                        ? 'bg-gray-50 border-gray-300'
                                        : 'bg-green-50 border-green-300'
                                }`}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <code className="text-lg font-mono font-bold text-[--dark]">
                                            {coupon.code}
                                        </code>
                                        {coupon.isUsed ? (
                                            <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded">
                                                USED
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-green-200 text-green-700 text-xs font-semibold rounded">
                                                AVAILABLE
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2 text-sm text-gray-600">
                                        Created: {new Date(coupon.createdAt).toLocaleDateString()}
                                        {coupon.isUsed && coupon.usedByUser && (
                                            <span className="ml-4">
                                                Used by: {coupon.usedByUser.firstName} {coupon.usedByUser.lastName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(coupon.code)}
                                    className="ml-4 p-2 text-gray-600 hover:text-[--emerald] transition-colors"
                                    title="Copy code"
                                >
                                    {copiedCode === coupon.code ? (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <Copy className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

