import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
    Users, Loader, Crown, Layers, Calendar, TrendingUp,
    MessageCircle, ShoppingCart, Send, Image as ImageIcon,
    CheckCircle, ArrowRight, Bell, X, Info, AlertCircle, User, LogOut
} from 'lucide-react';
import { dashboardService } from '../../api/services';
import PaymentModal from '../../components/PaymentModal';
import logo from '../../assets/logo.jpg';

export default function DashboardHome() {
    const navigate = useNavigate();
    
    // Core States
    const [stats, setStats] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPayment, setShowPayment] = useState(false);
    
    // UI Dropdown States
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Mock Notifications
    const [notifications, setNotifications] = useState([
        { id: 1, title: "Welcome to LDF", message: "Start your journey by activating your premium slots.", type: "info", time: "Just now", unread: true },
        { id: 2, title: "Matrix Update", message: "You have new members in your downline.", type: "success", time: "2h ago", unread: true }
    ]);

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
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadDashboardData(); }, []);

    // --- NAVIGATION HANDLERS ---
    
    const handleLogout = () => {
        localStorage.removeItem('token'); 
        sessionStorage.clear();
        navigate('/login');
    };

    const handleProfileRedirect = () => {
        // Directs user to the settings page
       navigate('/dashboard/settings?tab=profile');
        setShowProfileMenu(false);
    };

    const unreadCount = notifications.filter(n => n.unread).length;

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
    const matrixLevel = stats?.matrixLevel || 'Level 2';
    const subDaysLeft = stats?.subDaysLeft || '20/30';
    const activeSlots = stats?.premiumSlots || 0;
    const totalInvested = activeSlots * 10000;

    return (
        <div className="relative p-6 md:p-10 bg-gray-50 min-h-screen pt-24">
            
            {/* --- TOP NAVIGATION BAR --- */}
            <nav className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-gray-100 z-[100] px-4 md:px-8 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <img src={logo} alt="LDF" className="h-10 w-10 rounded-lg shadow-sm" />
                    <span className="font-black text-gray-900 tracking-tighter hidden sm:block uppercase">LDF Capital</span>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    {/* NOTIFICATION BELL */}
                    <div className="relative">
                        <button 
                            onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
                            className={`p-2.5 rounded-xl transition-all relative ${showNotifications ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            <Bell size={22} />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 h-4 w-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[110] animate-in slide-in-from-top-2">
                                <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                    <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                                    <button onClick={() => setNotifications(notifications.map(n => ({...n, unread: false})))} className="text-[10px] text-emerald-600 font-bold uppercase hover:underline">Mark all read</button>
                                </div>
                                <div className="max-h-[350px] overflow-y-auto">
                                    {notifications.map(n => (
                                        <div key={n.id} className={`p-4 border-b border-gray-50 flex gap-3 hover:bg-gray-50 transition-colors ${n.unread ? 'bg-emerald-50/20' : ''}`}>
                                            <div className="mt-1">{n.type === 'success' ? <CheckCircle size={16} className="text-emerald-500" /> : <Info size={16} className="text-blue-500" />}</div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-gray-900">{n.title}</p>
                                                <p className="text-[11px] text-gray-500 leading-snug">{n.message}</p>
                                                <p className="text-[9px] text-gray-400 mt-1 font-bold">{n.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                  
                    <div className="relative">
                        <button 
                            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                            className="flex items-center gap-3 p-1.5 md:pl-4 pr-1.5 rounded-xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
                        >
                            <div className="text-right hidden md:block">
                                <p className="text-xs font-black text-gray-900 leading-none capitalize">{userFirstName}</p>
                                <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-tighter">Verified Member</p>
                            </div>
                            <div className="h-10 w-10 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                                {userFirstName.charAt(0).toUpperCase()}
                            </div>
                        </button>

                        {showProfileMenu && (
                            <div className="absolute right-0 mt-3 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 p-2 z-[110] animate-in slide-in-from-top-2">
                                
                                <Link
                                    // onClick={handleProfileRedirect}
                                    to='/app/settings?tab=profile'
                                    className="w-full text-left px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg flex items-center gap-3 transition-colors"
                                >
                                    <User size={16} className="text-emerald-600" /> My Profile
                                </Link>
                                <div className="h-px bg-gray-100 my-1"></div>
                                <button 
                                    onClick={handleLogout}
                                    className="w-full text-left px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-3 transition-colors"
                                >
                                    <LogOut size={16} /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* --- DASHBOARD BODY --- */}
            <div className="flex justify-center mb-10 w-full">
                <img src={logo} alt="LDF Logo" className="h-24 md:h-32 w-auto rounded-2xl shadow-md border-2 border-white" />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Welcome, {userFirstName}!</h1>
                    <div className="flex gap-3 mt-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">Status: Active</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase">Matrix: {matrixLevel}</span>
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 w-full md:w-auto">
                    <p className="text-xs text-gray-500 uppercase font-bold">Monthly Subscription</p>
                    <div className="flex items-center justify-between gap-6 mt-1">
                        <span className="text-lg font-bold text-gray-800">{subDaysLeft} Days</span>
                        <button className="text-sm text-emerald-600 font-bold hover:underline">Subscribe Now</button>
                    </div>
                </div>
            </div>

            {/* Wallet Section */}
            <div className="mb-10">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Earnings Wallet</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <IncomeCard title="Affiliate Income" available={stats?.affiliateAvailable || 0} lifetime={stats?.affiliateLifetime || 0} />
                    <IncomeCard title="Matrix Income" available={stats?.matrixAvailable || 0} lifetime={stats?.matrixLifetime || 0} />
                    <IncomeCard title="Detty December" available={stats?.dettyDec || 0} isLocked={true} />
                </div>
                <div className="mt-4 p-4 bg-emerald-600 rounded-xl text-white flex justify-between items-center shadow-lg">
                    <div>
                        <p className="text-sm opacity-80">Total Withdrawable</p>
                        <h3 className="text-2xl font-bold">₦{(stats?.totalWithdrawable || 0).toLocaleString()}</h3>
                    </div>
                    <button className="px-6 py-2 bg-white text-emerald-600 font-bold rounded-lg hover:bg-emerald-50 transition-colors">
                        Request Withdrawal
                    </button>
                </div>
            </div>

            {/* Matrix Progression */}
            <div className="mb-10 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><Layers size={20} className="text-emerald-500" /> Matrix Progression</h3>
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between px-4">
                    <MatrixStep level="1" status="completed" slots="5/5" />
                    <div className="hidden md:block h-0.5 bg-green-200 flex-1"></div>
                    <MatrixStep level="2" status="current" slots="3/5" />
                    <div className="hidden md:block h-0.5 bg-gray-200 flex-1"></div>
                    <MatrixStep level="3" status="locked" slots="0/5" />
                    <div className="hidden md:block h-0.5 bg-gray-200 flex-1"></div>
                    <MatrixStep level="4" status="locked" slots="0/5" />
                    <div className="hidden md:block h-0.5 bg-gray-200 flex-1"></div>
                    <MatrixStep level="5" status="locked" slots="0/5" />
                </div>
            </div>

            {/* Team and Premium Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Users size={20} className="text-blue-500" /> Team Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <MetricBox label="Direct Referrals" value={stats?.directReferrals || 0} />
                        <MetricBox label="Total Team Size" value={stats?.totalTeam || 0} />
                        <MetricBox label="Spillover" value={stats?.spillover || 0} />
                        <MetricBox label="Slots Filled" value={`${stats?.slotsFilled || 0}/3905`} />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-900 via-indigo-950 to-black p-6 rounded-xl text-white shadow-xl relative overflow-hidden flex flex-col justify-center border border-yellow-500/30">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Crown className="text-yellow-400" size={24} />
                                    <h3 className="text-xl font-bold">LDF Capital Pool</h3>
                                </div>
                                <p className="text-indigo-300 text-[10px] uppercase font-bold tracking-widest italic">{activeSlots > 0 ? "Portfolio Management" : "High-Yield Investment"}</p>
                            </div>
                            {activeSlots > 0 && <div className="bg-yellow-400 text-black px-3 py-1 rounded-lg font-black text-xs shadow-lg animate-pulse">{activeSlots} SLOTS ACTIVE</div>}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white/5 p-3 rounded-lg border border-white/10"><p className="text-[10px] text-gray-400 uppercase font-bold">Total Capital</p><p className="text-lg font-bold text-white">₦{totalInvested.toLocaleString()}</p></div>
                            <div className="bg-white/5 p-3 rounded-lg border border-white/10"><p className="text-[10px] text-gray-400 uppercase font-bold">Est. Monthly ROI</p><p className="text-lg font-bold text-emerald-400">10% - 20%</p></div>
                        </div>
                        <button onClick={() => setShowPayment(true)} className="w-full py-3 bg-yellow-400 text-indigo-900 font-bold rounded-lg hover:bg-yellow-300 transition-all flex items-center justify-center gap-2 shadow-lg uppercase text-xs tracking-widest">
                            <TrendingUp size={18} /> {activeSlots > 0 ? "Acquire More Slots" : "Activate Premium Investment"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Access Footer */}
            <div className="mt-12 pt-8 border-t border-gray-200 pb-10">
                <h3 className="text-lg font-bold text-gray-800 mb-4 uppercase">Quick Resources</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FooterTile icon={<MessageCircle size={22}/>} title="Support" desc="FAQ & Chat" color="bg-blue-50 text-blue-600" />
                    <FooterTile icon={<ShoppingCart size={22}/>} title="Agent" desc="Buy Coupons" color="bg-purple-50 text-purple-600" />
                    <FooterTile icon={<Send size={22}/>} title="Telegram" desc="Community" color="bg-sky-50 text-sky-600" />
                    <FooterTile icon={<ImageIcon size={22}/>} title="Marketing" desc="Banners" color="bg-orange-50 text-orange-600" />
                </div>
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

const IncomeCard = ({ title, available, lifetime, isLocked }) => (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <p className="text-sm font-bold text-gray-500 mb-1">{title}</p>
        <h4 className="text-2xl font-black text-gray-800">₦{(available || 0).toLocaleString()}</h4>
        {lifetime !== undefined && <p className="text-xs text-emerald-600 mt-2 font-medium">Lifetime: ₦{lifetime.toLocaleString()}</p>}
        {isLocked && <p className="text-xs text-amber-600 mt-2 font-medium flex items-center gap-1"><Calendar size={12} /> Unlocks Dec 24</p>}
    </div>
);

const MetricBox = ({ label, value }) => (
    <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 font-bold uppercase">{label}</p>
        <p className="text-xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
);

const FooterTile = ({ icon, title, desc, color }) => (
    <button className={`${color} p-4 rounded-xl text-left flex flex-col gap-2 hover:opacity-80 transition-all border border-transparent hover:border-current shadow-sm`}>
        {icon}
        <div>
            <p className="font-bold text-sm">{title}</p>
            <p className="text-[10px] uppercase opacity-70 font-bold">{desc}</p>
        </div>
    </button>
);