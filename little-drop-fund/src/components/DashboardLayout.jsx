import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Users, Wallet, Clipboard, Settings, LogOut,
  X, Menu, Crown, Ticket, User, Bell, Info, CheckCircle
} from "lucide-react";
import { getUser, clearAuth } from "../utils/auth";
import { dashboardService } from "../api/services";
import Sidebar from "./Sidebar";
import logo from "../assets/logo.png";

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [notifications, setNotifications] = useState([
    { id: 1, title: "Welcome to LDF", message: "Start your journey by activating your premium slots.", type: "info", time: "Just now", unread: true },
    { id: 2, title: "Matrix Update", message: "You have new members in your downline.", type: "success", time: "2h ago", unread: true },
  ]);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = getUser();
      if (storedUser) {
        setUser(storedUser);
        if (storedUser.isAgent === undefined) {
          try {
            const profile = await dashboardService.getProfile();
            const updatedUser = { ...storedUser, ...profile };
            localStorage.setItem("ldf_user", JSON.stringify(updatedUser));
            setUser(updatedUser);
          } catch (err) {
            console.error("Profile fetch failed:", err);
          }
        }
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const unreadCount = notifications.filter((n) => n.unread).length;
  const displayUser = user || { firstName: "User", username: "user" };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      
      {/* 1. TOP NAVBAR (Full Width) */}
      <header className="h-20 bg-white border-b border-gray-200 px-6 flex items-center justify-between z-[60] shadow-sm flex-shrink-0">
        <div className="flex items-center gap-4">
          <img src={logo} alt="LDF Logo" className="h-10 w-auto rounded-lg" />
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
              className={`p-2.5 rounded-xl transition-all relative ${showNotifications ? "bg-emerald-50 text-emerald-600" : "hover:bg-gray-100 text-gray-500"}`}
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 h-4 w-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[70]">
                {/* ... (Notification Content) */}
                <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                  <button onClick={() => setNotifications(notifications.map(n => ({...n, unread: false})))} className="text-[10px] text-emerald-600 font-bold uppercase">Mark all read</button>
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-4 border-b border-gray-50 flex gap-3 ${n.unread ? "bg-emerald-50/20" : ""}`}>
                      <div className="mt-1">{n.type === "success" ? <CheckCircle size={16} className="text-emerald-500" /> : <Info size={16} className="text-blue-500" />}</div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-900">{n.title}</p>
                        <p className="text-[11px] text-gray-500 leading-snug">{n.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown (Logout Added Back Here) */}
          <div className="relative">
            <button
              onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
              className="flex items-center gap-3 p-1.5 md:pl-4 rounded-xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
            >
              <div className="text-right hidden md:block">
                <p className="text-xs font-black text-gray-900 leading-none capitalize">{displayUser.firstName}</p>
                <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-tighter">Verified Member</p>
              </div>
              <div className="h-10 w-10 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {displayUser.firstName.charAt(0).toUpperCase()}
              </div>
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 p-2 z-[70]">
                <Link to="/app/settings?tab=profile" className="w-full text-left px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg flex items-center gap-3">
                  <User size={16} className="text-emerald-600" /> My Profile
                </Link>
                <div className="h-px bg-gray-100 my-1"></div>
                {/* LOGOUT BUTTON RETURNED */}
                <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-3 transition-colors">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>

          {/* MOBILE HAMBURGER (Moved to far right) */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden text-gray-700 p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors ml-1"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* 2. BOTTOM SECTION */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* SIDEBAR (Starts below Header) */}
        <aside
          className={`fixed md:relative left-0 top-0 w-64 bg-[--dark] shadow-xl z-50 flex-shrink-0 flex flex-col h-full transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="flex justify-end p-4 md:hidden">
            <button onClick={() => setIsSidebarOpen(false)} className="text-white"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Sidebar />
          </div>
          <div className="p-4 border-t border-gray-700/50 bg-black/20">
            <button onClick={handleLogout} className="w-full flex items-center p-3 rounded-lg text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors">
              <LogOut size={18} className="mr-3" /> Logout
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

        {/* OVERLAY */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        )}
      </div>
    </div>
  );
}