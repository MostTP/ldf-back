import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "../utils/auth";
import { dashboardService } from "../api/services";
import { Crown, Home, LogOut, Settings, Ticket, Users, Wallet, Clipboard } from "lucide-react";

const Sidebar = () => {
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const baseNavItems = [
    { name: "Dashboard", icon: Home, path: "/app" },
    { name: "My Team Matrix", icon: Users, path: "/app/matrix" },
    { name: "Wallet & Payouts", icon: Wallet, path: "/app/wallet" },
    { name: "Masterclass Access", icon: Clipboard, path: "/app/masterclass" },
    { name: "Settings", icon: Settings, path: "/app/settings" },
    { name: "Premium Upgrade", icon: Crown, path: "/app/premium" },
  ];

  const [, setIsSidebarOpen] = useState(false);

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


  const getNavItems = () => {
    return user?.isAgent
      ? [
          ...baseNavItems,
          { name: "Coupon Wallet", icon: Ticket, path: "/app/agent" },
        ]
      : baseNavItems;
  };
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center justify-center gap-2">
          <img
            src={logo}
            alt="LDF"
            className="h-14.5 w-24  rounded-lg shadow-sm"
          />
        </div>
      </div> */}

      <nav className="flex-grow p-4 space-y-2">
        {getNavItems().map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center p-3 rounded-lg text-sm font-medium transition-all 
                ${
                  isActive
                    ? "bg-[--emerald] text-white shadow-lg shadow-green-900/20"
                    : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
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
        
      </div>
    </div>
  );
};

export default Sidebar;
    