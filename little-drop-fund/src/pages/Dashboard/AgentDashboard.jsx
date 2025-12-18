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
    const [buyLoading, setBuyLoading] = useState(false);

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
        try {
            setBuyLoading(true);
            setError(null);

            const qty = parseInt(buyQuantity, 10) || 0;
            if (qty < 1) {
                setError('Quantity must be at least 1');
                setBuyLoading(false);
                return;
            }

            // Initialize payment for agent coupon credits
            const resp = await paymentService.initializeAgentCouponPayment(qty);
            if (!resp.success || !resp.data) {
                throw new Error(resp.message || 'Failed to initialize payment');
            }

            const { publicKey, tx_ref, amount, currency, customer, customizations, meta } = resp.data;

            // Ensure Flutterwave script is loaded
            if (typeof window !== 'undefined' && !window.FlutterwaveCheckout) {
                const script = document.createElement('script');
                script.src = 'https://checkout.flutterwave.com/v3.js';
                script.async = true;
                document.body.appendChild(script);
            }

            let attempts = 0;
            const maxAttempts = 10;

            const startPayment = () => {
                if (window.FlutterwaveCheckout) {
                    window.FlutterwaveCheckout({
                        public_key: publicKey,
                        tx_ref,
                        amount,
                        currency,
                        payment_options: 'card,ussd,banktransfer,mobilemoney',
                        customer,
                        customizations,
                        meta,
                        callback: function (response) {
                            if (response.status === 'successful') {
                                // Backend webhook will credit the agent; refresh profile to show new balance
                                loadUserProfile();
                            } else {
                                setError('Payment was not successful. Please try again.');
                            }
                            setBuyLoading(false);
                        },
                        onclose: function () {
                            setBuyLoading(false);
                        },
                    });
                } else if (attempts < maxAttempts) {
                    attempts += 1;
                    setTimeout(startPayment, 500);
                } else {
                    setBuyLoading(false);
                    setError('Flutterwave payment SDK failed to load. Please refresh and try again.');
                }
            };

            startPayment();
        } catch (err) {
            console.error('Buy credits error:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to start payment';
            setError(errorMessage);
            setBuyLoading(false);
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
                        1 credit = 1 coupon you can generate. Each credit costs ₦3,000.
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
                            disabled={buyLoading}
                            className="px-6 py-2 bg-[--emerald] text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {buyLoading ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Pay with Flutterwave'
                            )}
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

