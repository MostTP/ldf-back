// src/components/DashboardLayout.jsx
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Users, DollarSign, Wallet, Clipboard, Settings, LogOut, X, Menu, Crown, Ticket } from "lucide-react";
import { getUser, clearAuth } from "../utils/auth";
import { dashboardService } from "../api/services";

// Define the dashboard navigation links (must match routes in App.jsx)
const baseNavItems = [
  { name: "Dashboard", icon: Home, path: "/app" },
  { name: "My Team Matrix", icon: Users, path: "/app/matrix" },
  { name: "Wallet & Payouts", icon: Wallet, path: "/app/wallet" },
  { name: "Masterclass Access", icon: Clipboard, path: "/app/masterclass" },
  { name: "Settings", icon: Settings, path: "/app/settings" },
  // Optional but good to include:
  { name: "Premium Upgrade", icon: Crown, path: "/app/premium" },
];

// 🚨 This line must use 'export default' to fix your previous error 🚨
export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Load user data from localStorage or API
    const loadUser = async () => {
      const storedUser = getUser();
      if (storedUser) {
        setUser(storedUser);
        // If user doesn't have isAgent property, fetch profile to get updated data
        if (storedUser.isAgent === undefined) {
          try {
            const profile = await dashboardService.getProfile();
            const updatedUser = { ...storedUser, ...profile };
            localStorage.setItem('ldf_user', JSON.stringify(updatedUser));
            setUser(updatedUser);
          } catch (err) {
            console.error('Failed to load user profile:', err);
          }
        }
      } else {
        // Try to fetch from API if not in localStorage
        try {
          const profile = await dashboardService.getProfile();
          setUser(profile);
        } catch (err) {
          console.error('Failed to load user profile:', err);
        }
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const displayUser = user || { name: 'User', username: 'user' };

  const Sidebar = () => (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Logo Area */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center text-2xl font-extrabold text-white">
          <span className="mr-1 text-[--emerald] text-3xl font-extrabold">LDF</span> 
          <span className="text-sm font-light text-gray-400">DASHBOARD</span>
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-grow p-4 space-y-2">
        {(() => {
          // Add agent dashboard if user is an agent
          const navItems = user?.isAgent 
            ? [...baseNavItems, { name: "Agent Dashboard", icon: Ticket, path: "/app/agent" }]
            : baseNavItems;
          
          return navItems.map((item) => {
            // Checks if the current route matches the link path
            const isActive = location.pathname === item.path; 
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center p-3 rounded-lg text-sm font-medium transition-colors 
                  ${isActive 
                    ? 'bg-[--emerald] text-white shadow-md shadow-green-600/20' 
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon size={18} className="mr-3" />
                {item.name}
              </Link>
            );
          });
        })()}
      </nav>
      
      {/* Settings and Logout */}
      <div className="p-4 space-y-2 border-t border-gray-700/50">
        <button onClick={handleLogout} className="w-full flex items-center p-3 rounded-lg text-sm font-medium text-red-400 hover:bg-gray-700/50 transition-colors">
            <LogOut size={18} className="mr-3" />
            Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden md:block w-64 bg-[--dark] shadow-xl z-30 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar (Modal) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}>
          <div className="w-64 bg-[--dark] h-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end p-4">
              <button onClick={() => setIsSidebarOpen(false)} className="text-white">
                <X size={24} />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        
        {/* Top Bar / Header */}
        <header className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-20 shadow-sm">
            
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-[--dark]">
                <Menu size={24} />
            </button>
            
            <h1 className="text-xl font-bold text-[--dark] ml-2">
                {/* Dynamically display the current page name */}
                {(() => {
                  const navItems = user?.isAgent 
                    ? [...baseNavItems, { name: "Agent Dashboard", icon: Ticket, path: "/app/agent" }]
                    : baseNavItems;
                  return navItems.find(item => item.path === location.pathname)?.name || 'Dashboard';
                })()}
            </h1>

            <div className="flex items-center space-x-3">
                <div className="text-right">
                    <p className="text-sm font-semibold text-[--dark]">
                        {displayUser.firstName ? `${displayUser.firstName} ${displayUser.lastName || ''}`.trim() : displayUser.name}
                    </p>
                    <p className="text-xs text-gray-500">@{displayUser.username}</p>
                </div>
                {/* Placeholder Avatar */}
                <div className="w-10 h-10 bg-[--emerald] rounded-full flex items-center justify-center text-white font-bold">
                    {(displayUser.firstName || displayUser.name || 'U')[0].toUpperCase()}
                </div>
            </div>
        </header>

        {/* Content Wrapper */}
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}