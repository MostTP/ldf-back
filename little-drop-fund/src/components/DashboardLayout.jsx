// src/components/DashboardLayout.jsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Users, DollarSign, Wallet, Clipboard, Settings, LogOut, X, Menu, Crown } from "lucide-react";

// Placeholder for user data (this would come from context/API in a real app)
const DUMMY_USER = {
  name: "Sarah J.",
  username: "sarahjmoney",
};

// Define the dashboard navigation links (must match routes in App.jsx)
const navItems = [
  { name: "Dashboard", icon: Home, path: "/dashboard" },
  { name: "My Team Matrix", icon: Users, path: "/dashboard/matrix" },
  { name: "Wallet & Payouts", icon: Wallet, path: "/dashboard/wallet" },
  { name: "Masterclass Access", icon: Clipboard, path: "/dashboard/masterclass" },
  { name: "Settings", icon: Settings, path: "/dashboard/settings" },
  // Optional but good to include:
  { name: "Premium Upgrade", icon: Crown, path: "/dashboard/premium" },
];

// 🚨 This line must use 'export default' to fix your previous error 🚨
export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    // Implement actual logout logic here
    console.log("Logging out...");
    // Redirect to login page
  };

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
        {navItems.map((item) => {
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
        })}
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
                {navItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
            </h1>

            <div className="flex items-center space-x-3">
                <div className="text-right">
                    <p className="text-sm font-semibold text-[--dark]">{DUMMY_USER.name}</p>
                    <p className="text-xs text-gray-500">@{DUMMY_USER.username}</p>
                </div>
                {/* Placeholder Avatar */}
                <div className="w-10 h-10 bg-[--emerald] rounded-full flex items-center justify-center text-white font-bold">
                    {DUMMY_USER.name[0]}
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