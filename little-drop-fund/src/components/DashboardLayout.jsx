import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Users, Wallet, Clipboard, Settings, LogOut, X, Menu, Crown, Ticket } from "lucide-react";
import { getUser, clearAuth } from "../utils/auth";
import { dashboardService } from "../api/services";

const baseNavItems = [
  { name: "Dashboard", icon: Home, path: "/app" },
  { name: "My Team Matrix", icon: Users, path: "/app/matrix" },
  { name: "Wallet & Payouts", icon: Wallet, path: "/app/wallet" },
  { name: "Masterclass Access", icon: Clipboard, path: "/app/masterclass" },
  { name: "Settings", icon: Settings, path: "/app/settings" },
  { name: "Premium Upgrade", icon: Crown, path: "/app/premium" },
];

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = getUser();
      if (storedUser) {
        setUser(storedUser);
        // If agent status is unknown, fetch profile
        if (storedUser.isAgent === undefined) {
          try {
            const profile = await dashboardService.getProfile();
            const updatedUser = { ...storedUser, ...profile };
            localStorage.setItem('ldf_user', JSON.stringify(updatedUser));
            setUser(updatedUser);
          } catch (err) { console.error('Profile fetch failed:', err); }
        }
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  // Helper to determine the current navigation list
  const getNavItems = () => {
    return user?.isAgent 
      ? [...baseNavItems, { name: "Coupon Wallet", icon: Ticket, path: "/app/agent" }]
      : baseNavItems;
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center text-2xl font-extrabold text-white">
          <span className="mr-1 text-[--emerald] text-3xl font-extrabold">LDF</span> 
          <span className="text-sm font-light text-gray-400 uppercase tracking-widest ml-1">App</span>
        </div>
      </div>
      
      <nav className="flex-grow p-4 space-y-2">
        {getNavItems().map((item) => {
          const isActive = location.pathname === item.path; 
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center p-3 rounded-lg text-sm font-medium transition-all 
                ${isActive 
                  ? 'bg-[--emerald] text-white shadow-lg shadow-green-900/20' 
                  : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                }`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <item.icon size={18} className="mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-700/50">
        <button onClick={handleLogout} className="w-full flex items-center p-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={18} className="mr-3" /> Logout
        </button>
      </div>
    </div>
  );

  const displayUser = user || { firstName: 'User', username: 'user' };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="hidden md:block w-64 bg-[--dark] shadow-xl z-30 flex-shrink-0">
        <Sidebar />
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        <header className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-20 shadow-sm">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-[--dark]">
                <Menu size={24} />
            </button>
            
            <h1 className="text-lg font-bold text-[--dark] ml-2 hidden sm:block">
              {getNavItems().find(item => item.path === location.pathname)?.name || 'Dashboard'}
            </h1>

            {/* 🛑 FIX: Route the profile to Settings */}
            <Link 
              to="/app/settings" 
              className="flex items-center space-x-3 group hover:bg-gray-50 p-1 pr-3 rounded-full transition-all"
            >
                <div className="text-right leading-tight">
                    <p className="text-sm font-bold text-[--dark] group-hover:text-[--emerald]">
                      {displayUser.firstName} {displayUser.lastName || ''}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium">@{displayUser.username}</p>
                </div>
                {/* Avatar Icon */}
                <div className="w-10 h-10 bg-[--emerald] rounded-full flex items-center justify-center text-white font-bold ring-2 ring-transparent group-hover:ring-[--emerald] transition-all">
                    {(displayUser.firstName || 'U')[0].toUpperCase()}
                </div>
            </Link>
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}