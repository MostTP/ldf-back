// src/pages/Dashboard/AgentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Copy, CheckCircle, XCircle, Loader, Crown } from 'lucide-react';
import { agentService } from '../../api/services';
import { getUser } from '../../utils/auth';

export default function AgentDashboard() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [copiedCode, setCopiedCode] = useState(null);

    const user = getUser();

    useEffect(() => {
        if (user?.isAgent) {
            loadCoupons();
        }
    }, []);

    const loadCoupons = async () => {
        try {
            setLoading(true);
            const response = await agentService.getCoupons();
            setCoupons(response.data || []);
        } catch (err) {
            setError(err.message || 'Failed to load coupons');
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
            setError(err.message || 'Failed to generate coupons');
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    if (!user?.isAgent) {
        return (
            <div className="p-8 max-w-4xl mx-auto text-center">
                <Crown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-700 mb-2">Agent Access Required</h2>
                <p className="text-gray-600">You need to be an agent to access this page.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <Loader size={36} className="animate-spin text-[--emerald]" />
                <p className="ml-4 text-lg text-gray-600">Loading coupons...</p>
            </div>
        );
    }

    const usedCount = coupons.filter(c => c.isUsed).length;
    const availableCount = coupons.filter(c => !c.isUsed).length;

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

            {/* Generate Coupons Form */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
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

