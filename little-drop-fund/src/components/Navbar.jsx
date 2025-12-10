// src/components/Navbar.jsx
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar({ onOpenSignup }) {
  const [open, setOpen] = useState(false);

  // Links data for easy mapping
  const navLinks = [
    { name: 'How It Works', id: 'how-it-works' }, 
    { name: 'Features', id: 'features' }, 
    { name: 'Earnings', id: 'matrix-earnings' } // Using a unique ID for the Matrix section
  ];

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      // Use scroll-margin-top fix defined in index.css
      section.scrollIntoView({ behavior: "smooth" });
    }
    setOpen(false);
  };

  return (
    <nav className="fixed w-full top-0 left-0 bg-white border-b border-gray-100 shadow-soft z-50 transition-fast">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 h-20">
        
        {/* LOGO (Styled using --dark and --emerald) */}
        <div className="flex items-center text-xl font-bold text-[--dark]">
          <span className="mr-2 text-[--emerald] text-2xl font-extrabold">LDF</span> 
          LITTLE DROP FUND
        </div>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center space-x-8 text-gray-600 font-medium">

          {navLinks.map((link) => (
             <button 
                key={link.id} 
                onClick={() => scrollToSection(link.id)} 
                className="hover:text-[--dark] transition-fast" // Use --dark for hover
             >
                {link.name}
             </button>
          ))}

          {/* JOIN NOW BUTTON (Styled using --emerald and premium shadow) */}
          <button
            onClick={onOpenSignup}
            className="px-6 py-2 ml-4 rounded-lg bg-[--emerald] text-white font-semibold transition-fast hover:bg-green-700 shadow-lg shadow-green-500/30"
          >
            Join Now
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
          
          <div className="px-6 pt-4">
            <button
              onClick={onOpenSignup}
              className="w-full py-3 rounded-lg bg-[--emerald] text-white font-semibold transition-fast hover:bg-green-700"
            >
              Join Now
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}