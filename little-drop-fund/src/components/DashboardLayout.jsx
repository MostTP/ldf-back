import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Users, Wallet, Clipboard, Settings, LogOut, X, Menu, Crown, Ticket, User, Bell } from "lucide-react";
import { getUser, clearAuth } from "../utils/auth";
import { dashboardService } from "../api/services";
import logo from '../assets/logo.png'; 

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

   // UI Dropdown States
      const [showNotifications, setShowNotifications] = useState(false);
      const [showProfileMenu, setShowProfileMenu] = useState(false);
  
      // Mock Notifications
      const [notifications, setNotifications] = useState([
          { id: 1, title: "Welcome to LDF", message: "Start your journey by activating your premium slots.", type: "info", time: "Just now", unread: true },
          { id: 2, title: "Matrix Update", message: "You have new members in your downline.", type: "success", time: "2h ago", unread: true }
      ]);

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

      const unreadCount = notifications.filter(n => n.unread).length;

  // Helper to determine the current navigation list
  const getNavItems = () => {
    return user?.isAgent 
      ? [...baseNavItems, { name: "Coupon Wallet", icon: Ticket, path: "/app/agent" }]
      : baseNavItems;
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center justify-center gap-2">
                    <img src={logo} alt="LDF" className="h-14.5 w-24  rounded-lg shadow-sm" />
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
    <div className="flex h-screen bg-gray-50 relative">
      {/* Mobile Sidebar Overlay */}  
      {/* <button onClick={handleMenuToggle}>menu</button> */}
      <aside className={`fixed md:relative left-0 top-0  w-64 bg-[--dark] shadow-xl z-30 flex-shrink-0 ${isSidebarOpen ? 'translate-x-[0%]' : 'translate-x-[-150%]'} md:translate-x-0 h-full transition-transform duration-300 ease-in-out`}>
        <div className="absolute top-4 right-4 md:hidden">
          <button onClick={() => setIsSidebarOpen(false)} className="text-white">
            <X size={24} />
          </button>
        </div>
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

           <div className="flex items-center gap-2 md:gap-4">
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
                                           <p className="text-xs font-black text-gray-900 leading-none capitalize">{displayUser.firstName}</p>
                                           <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-tighter">Verified Member</p>
                                       </div>
                                       <div className="h-10 w-10 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                                           {displayUser.firstName.charAt(0).toUpperCase()}
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
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}