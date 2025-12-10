// src/pages/Dashboard/Wallet.jsx

import React, { useState } from 'react';
import { Wallet, DollarSign, TrendingUp, Send, CheckCircle, Clock } from 'lucide-react';

// --- 1. DUMMY DATA ---
const dummyWalletData = {
    currentBalance: 15450.00,
    totalEarnings: 85200.00,
    minWithdrawal: 5000.00,
    globalPoolStatus: 'Eligible - Payout due Dec 31st',
};

const dummyTransactions = [
    { id: 105, date: '2025-12-05', type: 'Direct Referral Bonus', amount: 1500, source: 'Active Income', status: 'Completed' },
    { id: 104, date: '2025-12-01', type: 'Global Pool Payout', amount: 3500, source: 'Passive Income', status: 'Completed' },
    { id: 103, date: '2025-11-28', type: 'Matrix Level 2 Bonus', amount: 100, source: 'Passive Income', status: 'Completed' },
    { id: 102, date: '2025-11-25', type: 'Withdrawal Request', amount: -20000, source: 'Payout', status: 'Processing' },
    { id: 101, date: '2025-11-15', type: 'Direct Referral Bonus', amount: 1500, source: 'Active Income', status: 'Completed' },
];

// --- 2. WALLET COMPONENT ---
export default function WalletPage() {
    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleWithdrawal = (e) => {
        e.preventDefault();
        const amount = parseFloat(withdrawalAmount);
        if (amount < dummyWalletData.minWithdrawal || amount > dummyWalletData.currentBalance) {
            alert(`Withdrawal must be between ₦${dummyWalletData.minWithdrawal.toLocaleString()} and ₦${dummyWalletData.currentBalance.toLocaleString()}`);
            return;
        }

        setIsSubmitting(true);
        console.log(`Submitting withdrawal request for ₦${amount}`);
        
        // Simulate API call
        setTimeout(() => {
            alert(`Withdrawal of ₦${amount.toLocaleString()} requested! It will be processed within 24-48 hours.`);
            setWithdrawalAmount('');
            setIsSubmitting(false);
        }, 2000);
    };

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-[--dark]">Wallet & Payouts Management</h2>
            
            {/* --- A. Summary Cards --- */}
            <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
                <SummaryCard 
                    title="Available Balance" 
                    value={dummyWalletData.currentBalance} 
                    icon={Wallet} 
                    color="text-[--gold]"
                    description="Ready for withdrawal to your registered bank account."
                />
                <SummaryCard 
                    title="Total Lifetime Earnings" 
                    value={dummyWalletData.totalEarnings} 
                    icon={TrendingUp} 
                    color="text-[--emerald]"
                    description="Total income generated across all streams."
                />
                <SummaryCard 
                    title="Monthly Global Pool" 
                    value={3500.00} 
                    icon={CheckCircle} 
                    color="text-indigo-600"
                    description={dummyWalletData.globalPoolStatus}
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* --- B. Withdrawal Form --- */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-soft border border-gray-200 h-fit">
                    <h3 className="text-xl font-semibold text-[--dark] mb-4 flex items-center">
                        <Send size={20} className="text-red-500 mr-2" />
                        Request Withdrawal
                    </h3>
                    
                    <form onSubmit={handleWithdrawal} className="space-y-4">
                        <p className="text-sm text-gray-500">Min. Withdrawal: ₦{dummyWalletData.minWithdrawal.toLocaleString()}. Funds are processed automatically to your bank account.</p>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
                            <input
                                type="number"
                                step="any"
                                value={withdrawalAmount}
                                onChange={(e) => setWithdrawalAmount(e.target.value)}
                                min={dummyWalletData.minWithdrawal}
                                max={dummyWalletData.currentBalance}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[--emerald] focus:ring-1 focus:ring-[--emerald] outline-none"
                                placeholder="e.g., 5000.00"
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isSubmitting || withdrawalAmount < dummyWalletData.minWithdrawal}
                            className={`w-full py-3 text-white font-bold rounded-lg shadow-md transition-fast ${
                                isSubmitting 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-[--emerald] hover:bg-green-700'
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
                                {dummyTransactions.map((tx) => (
                                    <tr key={tx.id} className={tx.type.includes('Payout') ? 'bg-red-50/50' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[--dark]">{tx.type}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${tx.amount > 0 ? 'text-[--emerald]' : 'text-red-500'}`}>
                                            {tx.amount > 0 ? '+' : ''}₦{tx.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 flex items-center">
                                            {tx.status === 'Completed' ? (
                                                <CheckCircle size={16} className="text-[--emerald] mr-1" />
                                            ) : (
                                                <Clock size={16} className="text-yellow-500 mr-1" />
                                            )}
                                            {tx.status}
                                        </td>
                                    </tr>
                                ))}
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