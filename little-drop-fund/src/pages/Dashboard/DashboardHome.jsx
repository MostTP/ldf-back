import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
    Users, Loader, Crown, Layers, Calendar, TrendingUp,
    MessageCircle, ShoppingCart, Send, Image as ImageIcon,
    CheckCircle, ArrowRight, Bell, X, Info, AlertCircle, User, LogOut,
    Globe, Copy, ExternalLink, Wallet 
} from 'lucide-react';
import { dashboardService } from '../../api/services';
import PaymentModal from '../../components/PaymentModal';

export default function DashboardHome() {
    const navigate = useNavigate();
    
    // Core States
    const [stats, setStats] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPayment, setShowPayment] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
    const [lastPurchaseQty, setLastPurchaseQty] = useState(0);

    const loadDashboardData = async () => {
        try {
            const [statsResponse, profileResponse] = await Promise.all([
                dashboardService.getStats(),
                dashboardService.getProfile()
            ]);
            setStats(statsResponse);
            setProfile(profileResponse);
        } catch (err) {
            console.error('Dashboard load error:', err);
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadDashboardData(); }, []);

    // Referral Logic
    const referralLink = `${window.location.origin}/register?ref=${profile?.username || ''}`;
    
    const handleCopyReferral = () => {
        navigator.clipboard.writeText(referralLink);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handlePaymentSuccess = (response) => {
        const qty = response?.meta?.slot_quantity || 1;
        setLastPurchaseQty(qty);
        
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 300 };
        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        setShowSuccessOverlay(true);
        loadDashboardData(); 
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <Loader size={36} className="animate-spin text-emerald-600" />
        </div>
    );

    const userFirstName = profile?.username || 'User';
    const activeSlots = stats?.premiumSlots || 0;
    const totalInvested = stats?.totalInvested || 0; // From API
    const estMonthlyProfit = stats?.estMonthlyProfit || 0; // From API
    const estMonthlyProfitMin = stats?.estMonthlyProfitMin || 0;
    const estMonthlyProfitMax = stats?.estMonthlyProfitMax || 0;

    return (
        <div className="relative p-6 md:p-10 bg-gray-50 min-h-screen pt-35">
            
            {/* Header & Referral Link Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                    <h1 className="text-3xl font-bold text-gray-900">Welcome, {userFirstName}!</h1>
                    <div className="flex gap-3 mt-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Status: {stats?.userStatus || 'Active'}</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Matrix: {stats?.matrixLevel || 'Level 1'}</span>
                    </div>

                    {/* Referral Link Box */}
                    <div className="mt-6 p-4 bg-white rounded-xl border border-dashed border-emerald-300 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                <Users size={20} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Your Referral Link</p>
                                <p className="text-sm font-medium text-gray-600 truncate">{referralLink}</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleCopyReferral}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${copySuccess ? 'bg-emerald-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                        >
                            {copySuccess ? <CheckCircle size={16} /> : <Copy size={16} />}
                            {copySuccess ? 'Copied!' : 'Copy Link'}
                        </button>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-tight">Monthly Subscription</p>
                    <div className="flex items-center justify-between gap-6 mt-1">
                        <span className="text-2xl font-black text-gray-800">{stats?.subDaysLeft || '0/30'} <span className="text-xs font-normal text-gray-400 uppercase">Days</span></span>
                        <button 
                            onClick={() => setShowPayment(true)}
                            className="text-sm text-emerald-600 font-bold hover:underline"
                        >
                            Subscribe Now
                        </button>
                    </div>
                </div>
            </div>

            {/* Earnings Wallet Section */}
            <div className="mb-10">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Wallet size={20} className="text-emerald-600" /> Earnings Wallet
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <IncomeCard title="Affiliate Income" available={stats?.affiliateAvailable ?? 0} lifetime={stats?.affiliateLifetime ?? 0} icon={<Users size={16} className="text-emerald-600" />} />
                    <IncomeCard title="Matrix Income" available={stats?.matrixAvailable ?? 0} lifetime={stats?.matrixLifetime ?? 0} icon={<Layers size={16} className="text-blue-600" />} />
                    <IncomeCard title="Global Pool" available={stats?.globalPoolAvailable ?? 0} lifetime={stats?.globalPoolLifetime ?? 0} icon={<Globe size={16} className="text-amber-600" />} />
                    <IncomeCard title="Detty December" available={stats?.dettyDec ?? 0} isLocked={true} icon={<Calendar size={16} className="text-red-500" />} />
                </div>
                <div className="mt-4 p-4 bg-emerald-600 rounded-xl text-white flex justify-between items-center shadow-lg">
                    <div>
                        <p className="text-sm opacity-80">Total Withdrawable</p>
                        <h3 className="text-2xl font-bold">₦{(stats?.totalWithdrawable || 0).toLocaleString()}</h3>
                    </div>
                    <button 
                        onClick={() => navigate('/app/wallet')}
                        className="px-6 py-2 bg-white text-emerald-600 font-bold rounded-lg hover:bg-emerald-50 transition-colors"
                    >
                        Request Withdrawal
                    </button>
                </div>
            </div>

             {/* Matrix Progression */}
            <div className="mb-10 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><Layers size={20} className="text-emerald-500" /> Matrix Progression</h3>
                {(() => {
                    // Calculate matrix progression dynamically based on direct referrals
                    // Matrix structure (matches backend):
                    // Level 1: 0-1 referrals (2 slots max)
                    // Level 2: 2-3 referrals (4 slots max)
                    // Level 3: 4-7 referrals (8 slots max)
                    // Level 4: 8-15 referrals (16 slots max)
                    // Level 5: 16+ referrals (32 slots max)
                    const directReferrals = stats?.directReferrals ?? 0;
                    const currentLevelSlotsFilled = stats?.currentLevelSlotsFilled ?? 0;
                    const matrixLevel = stats?.matrixLevel || 'Level 1';
                    const currentLevelNum = parseInt(matrixLevel.replace('Level ', '')) || 1;
                    
                    const getMatrixProgression = () => {
                        const levels = [
                            { level: 1, minReferrals: 0, maxReferrals: 1, maxSlots: 2 },
                            { level: 2, minReferrals: 2, maxReferrals: 3, maxSlots: 4 },
                            { level: 3, minReferrals: 4, maxReferrals: 7, maxSlots: 8 },
                            { level: 4, minReferrals: 8, maxReferrals: 15, maxSlots: 16 },
                            { level: 5, minReferrals: 16, maxReferrals: Infinity, maxSlots: 32 },
                        ];
                        
                        return levels.map((l) => {
                            let slotsFilled = 0;
                            let status = 'locked';
                            
                            if (l.level < currentLevelNum) {
                                // Previous level - completed
                                status = 'completed';
                                slotsFilled = l.maxSlots;
                            } else if (l.level === currentLevelNum) {
                                // Current level
                                status = 'current';
                                slotsFilled = currentLevelSlotsFilled;
                            } else {
                                // Future level - locked
                                status = 'locked';
                                slotsFilled = 0;
                            }
                            
                            return {
                                level: l.level,
                                status,
                                slots: `${slotsFilled}/${l.maxSlots}`
                            };
                        });
                    };
                    
                    const matrixProgression = getMatrixProgression();
                    
                    return (
                        <div className="flex flex-col md:flex-row gap-6 items-center justify-between px-4">
                            {matrixProgression.map((prog, index) => (
                                <React.Fragment key={prog.level}>
                                    <MatrixStep level={prog.level.toString()} status={prog.status} slots={prog.slots} />
                                    {index < matrixProgression.length - 1 && (
                                        <div className={`hidden md:block h-0.5 flex-1 ${prog.status === 'completed' ? 'bg-green-200' : prog.status === 'current' ? 'bg-blue-200' : 'bg-gray-200'}`}></div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    );
                })()}
            </div>
            

            {/* Premium Investment Wallet Section */}
            <div className="mb-10 bg-indigo-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-white/10">

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">

                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Users size={20} className="text-blue-500" /> Team Metrics</h3>

                    <div className="grid grid-cols-2 gap-4">

                        <MetricBox label="Direct Referrals" value={stats?.directReferrals || 0} />

                        <MetricBox label="Total Team Size" value={stats?.totalTeam || 0} />

                        <MetricBox label="Spillover" value={stats?.spillover || 0} />

                        <MetricBox label="Slots Filled" value={`${stats?.slotsFilled || 0}/${stats?.maxSlots || 2}`} />

                    </div>

                </div>
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Crown size={140} />
                </div>
                
                <div className="relative z-10">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Crown size={20} className="text-yellow-400" /> Capital Pool Management
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Active Capital</p>
                            <h4 className="text-3xl font-black mt-1">₦{totalInvested.toLocaleString()}</h4>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-yellow-400 text-indigo-900 rounded text-[10px] font-black uppercase tracking-tighter">
                                    {activeSlots} SLOTS
                                </span>
                            </div>
                        </div>

                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Est. Monthly Profit</p>
                            <h4 className="text-3xl font-black mt-1">₦{estMonthlyProfit.toLocaleString()}</h4>
                            <p className="text-[10px] mt-2 text-white/50 italic">
                                {estMonthlyProfitMin > 0 && estMonthlyProfitMax > 0 
                                    ? `Range: ₦${estMonthlyProfitMin.toLocaleString()} - ₦${estMonthlyProfitMax.toLocaleString()}`
                                    : 'Based on 10% - 20% performance'}
                            </p>
                        </div>

                        <div className="flex flex-col justify-center gap-3">
                            <button 
                                onClick={() => setShowPayment(true)}
                                className="w-full py-3 bg-yellow-400 text-indigo-950 font-black rounded-xl hover:bg-yellow-300 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest shadow-lg"
                            >
                                <TrendingUp size={18} /> Buy More Slots
                            </button>
                            <button 
                                onClick={() => navigate('/app/investment-history')}
                                className="w-full py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2 text-xs border border-white/10"
                            >
                                Investment History <ExternalLink size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Access Footer */}
            <div className="mt-12 pt-8 border-t border-gray-200 pb-10">
                <h3 className="text-lg font-bold text-gray-800 mb-4 uppercase">Quick Resources</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FooterTile icon={<MessageCircle size={22}/>} title="Support" desc="FAQ & Chat" color="bg-blue-50 text-blue-600" onClick={() => navigate('/app/support')} />
                    <FooterTile icon={<Send size={22}/>} title="Telegram" desc="Community" color="bg-sky-50 text-sky-600" link="https://t.me/YOUR_CHANNEL" />
                    <FooterTile icon={<ImageIcon size={22}/>} title="Marketing" desc="Banners" color="bg-orange-50 text-orange-600" onClick={() => navigate('/app/marketing')} />
                </div>
                <p>{error}</p>
            </div>

            {/* Success Overlay */}
            {showSuccessOverlay && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={40} className="text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Payment Successful!</h2>
                        <p className="text-gray-500 mb-6 font-medium text-sm">Congratulations! You have acquired <span className="text-emerald-600 font-bold">{lastPurchaseQty} new slot(s)</span>.</p>
                        <button onClick={() => setShowSuccessOverlay(false)} className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                            Back to Dashboard <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} currentSlots={activeSlots} onSuccess={handlePaymentSuccess} />
        </div> 
    );
}

// --- SUB-COMPONENTS ---
const MatrixStep = ({ level, status, slots }) => {
    const isCompleted = status === 'completed';
    const isCurrent = status === 'current';
    return (
        <div className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse' : 'bg-gray-100 text-gray-400'}`}>{level}</div>
            <div className="text-center">
                <p className="text-[10px] font-black text-gray-500 uppercase">Level {level}</p>
                <p className={`text-[10px] font-bold ${isCurrent ? 'text-blue-600' : 'text-gray-400'}`}>{slots} Slots</p>
            </div>
        </div>
    );
};

const IncomeCard = ({ title, available, lifetime, isLocked, icon }) => (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
            {icon && icon}
        </div>
        <h4 className="text-xl font-black text-gray-800">₦{(available || 0).toLocaleString()}</h4>
        {lifetime !== undefined && <p className="text-[10px] text-emerald-600 mt-2 font-bold uppercase tracking-tighter">Lifetime: ₦{lifetime.toLocaleString()}</p>}
        {isLocked && <p className="text-[10px] text-amber-600 mt-2 font-bold flex items-center gap-1 uppercase tracking-tighter"><Calendar size={10} /> Unlocks Dec 24</p>}
    </div>
);

const MetricBox = ({ label, value }) => (
    <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 font-bold uppercase">{label}</p>
        <p className="text-xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
);

const FooterTile = ({ icon, title, desc, color, onClick, link }) => {
    const commonStyles = `${color} p-4 rounded-xl text-left flex flex-col gap-2 hover:opacity-80 transition-all border border-transparent hover:border-current shadow-sm w-full`;
    const content = (
        <>
            {icon}
            <div>
                <p className="font-bold text-sm">{title}</p>
                <p className="text-[10px] uppercase opacity-70 font-bold">{desc}</p>
            </div>
        </>
    );
    return link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className={commonStyles}>{content}</a>
    ) : (
        <button onClick={onClick} className={commonStyles}>{content}</button>
    );
};