// src/pages/Dashboard/DashboardHome.jsx
import React, { useState, useEffect } from 'react';
import { DollarSign, Users, TrendingUp, CreditCard, Loader, Crown } from 'lucide-react';
import { dashboardService } from '../../api/services';
import PaymentModal from '../../components/PaymentModal';

export default function DashboardHome() {
    const [stats, setStats] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPayment, setShowPayment] = useState(false);

    const loadDashboardData = async () => {
        try {
            // Fetch stats and profile concurrently for speed
            const [statsResponse, profileResponse] = await Promise.all([
                dashboardService.getStats(),
                dashboardService.getProfile()
            ]);

            setStats(statsResponse);
            setProfile(profileResponse);
        } catch (err) {
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const handlePaymentSuccess = () => {
        setShowPayment(false);
        loadDashboardData(); // Reload to show premium status
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <Loader size={36} className="animate-spin text-[--emerald]" />
                <p className="ml-4 text-lg text-gray-600">Loading Dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-4xl mx-auto text-red-700 bg-red-100 border border-red-300 rounded-lg mt-10">
                <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
                <p>{error.toString()}</p>
                <p className="mt-2">Please ensure you are logged in or try again later.</p>
            </div>
        );
    }

    // Safely destructure data
    const userFirstName = profile?.firstName || profile?.username || 'User';
    const isPremium = profile?.isPremium || false;
    
    // Default mock stats if the response is empty, just for structure
    const dashboardStats = stats || {
        totalEarnings: 0,
        directReferrals: 0,
        teamSize: 0,
        globalPoolStatus: 'Ineligible'
    };

    return (
        <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-[--dark] mb-1">
                Welcome back, {userFirstName}!
            </h1>
            <p className="text-gray-600 mb-8">Your dashboard summary and performance metrics.</p>

            {/* Dashboard Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Earnings" 
                    value={`₦${dashboardStats.totalEarnings.toLocaleString()}`} 
                    icon={<DollarSign size={24} />} 
                    color="bg-green-100 text-green-700" 
                />
                <StatCard 
                    title="Direct Referrals" 
                    value={dashboardStats.directReferrals.toLocaleString()} 
                    icon={<Users size={24} />} 
                    color="bg-blue-100 text-blue-700" 
                />
                <StatCard 
                    title="Team Size (Matrix)" 
                    value={dashboardStats.teamSize.toLocaleString()} 
                    icon={<TrendingUp size={24} />} 
                    color="bg-yellow-100 text-yellow-700" 
                />
                <StatCard 
                    title="Global Pool Status" 
                    value={dashboardStats.globalPoolStatus} 
                    icon={<CreditCard size={24} />} 
                    color={dashboardStats.globalPoolStatus === 'Eligible' ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-700'} 
                />
            </div>
            
            {/* Premium Upgrade Card */}
            {!isPremium && (
                <div className="mt-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Crown className="w-6 h-6" />
                                <h3 className="text-2xl font-bold">Upgrade to Premium</h3>
                            </div>
                            <p className="text-yellow-100">Get higher returns and exclusive benefits</p>
                        </div>
                        <button
                            onClick={() => setShowPayment(true)}
                            className="px-6 py-3 bg-white text-yellow-600 font-semibold rounded-lg hover:bg-yellow-50 transition-colors whitespace-nowrap"
                        >
                            Upgrade Now - ₦10,000
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

// Helper component for styled stat cards
const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-extrabold text-[--dark] mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
    </div>
);