// src/components/Navbar.jsx
import { useState } from "react";
import { Menu, X, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
// 🛑 FIX: Renamed the imported asset variable to 'logo'
import logo from '../assets/logo.jpg';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Links for the Landing Page sections
  const navLinks = [
    { name: 'How It Works', id: 'how-it-works' },
    { name: 'Features', id: 'features' },
    { name: 'Earnings', id: 'matrix-earnings' }
  ];

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
    setOpen(false);
  };

  return (
    <nav className="fixed w-full top-0 left-0 bg-white border-b border-gray-100 shadow-soft z-50 transition-fast">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 h-20">

        {/* LOGO */}
        <div className="flex items-center text-xl font-bold text-[--dark]">
          <img src={logo} alt="LDF Logo" className="h-8 md:h-10 w-auto" />
          <span className="ml-2 uppercase tracking-tight">LITTLE DROP FUND</span>
        </div>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center space-x-8 text-gray-600 font-medium">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className="hover:text-[--dark] transition-fast text-sm"
            >
              {link.name}
            </button>
          ))}

          {/* NOTIFICATION BELL */}
          <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-fast">
            <Bell size={22} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          {/* LOGIN TAG - Clickable to Login Page */}
          <button
            onClick={() => navigate('/login')}
            className="border-l border-gray-200 pl-6 text-[--emerald] font-bold transition-fast hover:text-green-700 uppercase tracking-widest text-sm"
          >
            Login
          </button>
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button className="md:hidden text-[--dark] text-2xl" onClick={() => setOpen(!open)}>
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="md:hidden absolute w-full bg-white border-t border-gray-100 pb-4 shadow-xl animate-fade-in">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className="block w-full px-6 py-3 text-left text-gray-700 hover:bg-gray-50 transition-fast"
            >
              {link.name}
            </button>
          ))}

          <div className="px-6 pt-4 flex flex-col gap-4">
             {/* Mobile Notification Access */}
             <button className="flex items-center gap-2 text-gray-700 font-medium">
               <Bell size={20} /> Notifications
             </button>
             
             {/* Mobile Login Button */}
             <button
               onClick={() => navigate('/login')}
               className="w-full py-3 rounded-lg bg-[--emerald] text-white font-bold transition-fast hover:bg-green-700 text-center uppercase"
             >
               Login
             </button>
          </div>
        </div>
      )}
    </nav>
  );
}