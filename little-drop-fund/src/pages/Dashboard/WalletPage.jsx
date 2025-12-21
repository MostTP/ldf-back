// src/pages/Dashboard/Wallet.jsx

import React, { useState, useEffect } from 'react';
import { Wallet, DollarSign, TrendingUp, Send, CheckCircle, Clock, Loader, AlertCircle } from 'lucide-react';
import { walletService } from '../../api/services';

// --- 2. WALLET COMPONENT ---
export default function WalletPage() {
    const [walletData, setWalletData] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [withdrawalError, setWithdrawalError] = useState(null);
    const [withdrawalSuccess, setWithdrawalSuccess] = useState(null);

    useEffect(() => {
        const loadWalletData = async () => {
            try {
                const [walletResponse, transactionsResponse] = await Promise.all([
                    walletService.getWalletData(),
                    walletService.getTransactions()
                ]);
                setWalletData(walletResponse);
                setTransactions(transactionsResponse.transactions || transactionsResponse || []);
            } catch (err) {
                setError(err.message || 'Failed to load wallet data');
            } finally {
                setLoading(false);
            }
        };

        loadWalletData();
    }, []);

    // Default wallet data structure
    const wallet = walletData || {
        currentBalance: 0,
        totalEarnings: 0,
        minWithdrawal: 500,
        globalPoolStatus: 'Ineligible'
    };

    const handleWithdrawal = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Clear previous messages
        setWithdrawalError(null);
        setWithdrawalSuccess(null);
        
        const amount = parseFloat(withdrawalAmount);
        
        if (isNaN(amount) || amount <= 0) {
            setWithdrawalError('Please enter a valid withdrawal amount');
            return;
        }
        
        if (amount < wallet.minWithdrawal || amount > wallet.currentBalance) {
            setWithdrawalError(`Withdrawal must be between ₦${wallet.minWithdrawal.toLocaleString()} and ₦${wallet.currentBalance.toLocaleString()}`);
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await walletService.requestWithdrawal(amount);
            
            if (response.success) {
                // Show success message
                setWithdrawalSuccess(`Withdrawal request submitted successfully! Amount: ₦${amount.toLocaleString()}. Status: ${response.data?.status || 'PENDING'}. Your withdrawal will be processed via Seerbit.`);
            setWithdrawalAmount('');
                
                // Clear success message after 8 seconds
                setTimeout(() => setWithdrawalSuccess(null), 8000);
                
                // Reload wallet data and transactions
                const [walletResponse, transactionsResponse] = await Promise.all([
                    walletService.getWalletData(),
                    walletService.getTransactions()
                ]);
            setWalletData(walletResponse);
                setTransactions(transactionsResponse.transactions || []);
            } else {
                throw new Error(response.message || 'Withdrawal request failed');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 
                                err.response?.data?.errors?.[0]?.msg || 
                                err.message || 
                                'Failed to process withdrawal request';
            setWithdrawalError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader size={36} className="animate-spin text-[--emerald]" />
                <p className="ml-4 text-lg text-gray-600">Loading wallet data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-4xl mx-auto text-red-700 bg-red-100 border border-red-300 rounded-lg mt-10">
                <h2 className="text-xl font-bold mb-2">Error Loading Wallet</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-[--dark]">Wallet & Payouts Management</h2>
            
            {/* --- A. Summary Cards --- */}
            <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
                <SummaryCard 
                    title="Available Balance" 
                    value={wallet.currentBalance} 
                    icon={Wallet} 
                    color="text-[--gold]"
                    description="Ready for withdrawal to your registered bank account."
                />
                <SummaryCard 
                    title="Total Lifetime Earnings" 
                    value={wallet.totalEarnings} 
                    icon={TrendingUp} 
                    color="text-[--emerald]"
                    description="Total income generated across all streams."
                />
                <SummaryCard 
                    title="Monthly Global Pool" 
                    value={wallet.globalPoolAmount || 0} 
                    icon={CheckCircle} 
                    color="text-indigo-600"
                    description={wallet.globalPoolStatus}
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* --- B. Withdrawal Form --- */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-soft border border-gray-200 h-fit">
                    <h3 className="text-xl font-semibold text-[--dark] mb-4 flex items-center">
                        <Send size={20} className="text-red-500 mr-2" />
                        Request Withdrawal
                    </h3>
                    
                    <form onSubmit={handleWithdrawal} className="space-y-4" noValidate>
                        <p className="text-sm text-gray-500">Min. Withdrawal: ₦{wallet.minWithdrawal.toLocaleString()}. Funds are processed automatically to your bank account.</p>
                        
                        {withdrawalSuccess && (
                            <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-start">
                                <CheckCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                                <span>{withdrawalSuccess}</span>
                            </div>
                        )}
                        
                        {withdrawalError && (
                            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium flex items-start">
                                <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                                <span>{withdrawalError}</span>
                            </div>
                        )}
                        
                        {wallet.currentBalance === 0 && (
                            <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                                ⚠️ You don't have any available balance to withdraw. You need to earn first.
                            </p>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
                            <input
                                type="number"
                                step="any"
                                value={withdrawalAmount}
                                onChange={(e) => setWithdrawalAmount(e.target.value)}
                                min={wallet.minWithdrawal}
                                max={wallet.currentBalance}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[--emerald] focus:ring-1 focus:ring-[--emerald] outline-none"
                                placeholder="e.g., 5000.00"
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isSubmitting || !withdrawalAmount || isNaN(parseFloat(withdrawalAmount)) || parseFloat(withdrawalAmount) < wallet.minWithdrawal || parseFloat(withdrawalAmount) > wallet.currentBalance}
                            className={`w-full py-3 text-white font-bold rounded-lg shadow-md transition-fast ${
                                isSubmitting 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-[--emerald] hover:bg-green-700 active:bg-green-800'
                            }`}
                        >
                            {isSubmitting ? 'Processing...' : 'Submit Payout Request'}
                        </button>
                    </form>
                </div>
                
                {/* --- C. Transaction History Table --- */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-soft border border-gray-200">
                    <h3 className="text-xl font-semibold text-[--dark] mb-4">Transaction History</h3>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₦)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                            No withdrawal requests yet
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => (
                                    <tr key={tx.id} className={tx.type === 'Withdrawal' ? 'bg-red-50/50' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[--dark]">{tx.type}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${tx.amount > 0 ? 'text-[--emerald]' : 'text-red-500'}`}>
                                            {tx.amount > 0 ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 flex items-center">
                                            {tx.status === 'Completed' || tx.status === 'PAID' ? (
                                                <CheckCircle size={16} className="text-[--emerald] mr-1" />
                                            ) : tx.status === 'FAILED' ? (
                                                <span className="text-red-500 mr-1">✕</span>
                                            ) : (
                                                <Clock size={16} className="text-yellow-500 mr-1" />
                                            )}
                                            <span className={tx.status === 'FAILED' ? 'text-red-500' : ''}>
                                                {tx.status === 'PAID' ? 'Completed' : tx.status === 'PENDING' ? 'Pending' : tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- 3. HELPER COMPONENT ---
const SummaryCard = ({ title, value, icon: Icon, color, description }) => (
    <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-200 transition-shadow hover:shadow-lg">
        <div className="flex items-start justify-between">
            <p className="text-lg font-medium text-gray-500">{title}</p>
            <Icon size={32} className={`${color}`} />
        </div>
        <p className="text-3xl font-extrabold text-[--dark] mt-2 mb-2">
            ₦{value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-sm text-gray-400">{description}</p>
    </div>
);