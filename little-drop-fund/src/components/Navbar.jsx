import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar({ openSignup }) {
  const [open, setOpen] = useState(false);

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
    setOpen(false);
  };

  return (
    <nav className="fixed w-full top-0 left-0 bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
        
        {/* LOGO */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <span className="font-bold text-xl text-emerald-700 tracking-wide">
            LITTLE DROP FUND
          </span>
        </div>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-8 text-gray-700 font-medium">

          <button onClick={() => scrollToSection("how")} className="hover:text-emerald-600">
            How It Works
          </button>

          <button onClick={() => scrollToSection("features")} className="hover:text-emerald-600">
            Features
          </button>

          <button onClick={() => scrollToSection("earnings")} className="hover:text-emerald-600">
            Earnings
          </button>

          {/* JOIN NOW */}
          <button
            onClick={openSignup}
            className="bg-emerald-600 text-white px-5 py-2 rounded-md hover:bg-emerald-700 transition"
          >
            Join Now
          </button>
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="md:hidden bg-white shadow-lg px-6 py-4 space-y-4 text-gray-700 font-medium">

          <button onClick={() => scrollToSection("how")} className="block w-full text-left">
            How It Works
          </button>

          <button onClick={() => scrollToSection("features")} className="block w-full text-left">
            Features
          </button>

          <button onClick={() => scrollToSection("earnings")} className="block w-full text-left">
            Earnings
          </button>

          <button
            onClick={openSignup}
            className="bg-emerald-600 text-white px-5 py-2 rounded-md w-full text-center"
          >
            Join Now
          </button>

        </div>
      )}
    </nav>
  );
}
