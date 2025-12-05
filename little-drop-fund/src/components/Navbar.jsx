import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar({ onOpenSignup }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  };

  return (
    <nav className={`fixed w-full left-0 top-0 z-50 transition ${scrolled ? "backdrop-blur-md bg-white/90 shadow-md" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="w-10 h-10 bg-emerald-600 rounded-lg" />
          <div className="text-xl font-bold text-emerald-700">Little Drop Fund</div>
        </div>

        <ul className="hidden md:flex items-center gap-6">
          <li><button onClick={() => scrollTo("home")} className="text-gray-700 hover:text-emerald-600 transition">Home</button></li>
          <li><button onClick={() => scrollTo("signup")} className="text-gray-700 hover:text-emerald-600 transition">Sign Up</button></li>
          <li><button onClick={() => scrollTo("streams")} className="text-gray-700 hover:text-emerald-600 transition">Streams</button></li>
          <li><button onClick={() => scrollTo("matrix")} className="text-gray-700 hover:text-emerald-600 transition">Matrix</button></li>
          <li><button onClick={() => scrollTo("premium")} className="text-gray-700 hover:text-emerald-600 transition">Premium</button></li>
          <li><button onClick={() => scrollTo("earners")} className="text-gray-700 hover:text-emerald-600 transition">Top Earners</button></li>
          <li><button onClick={() => scrollTo("features")} className="text-gray-700 hover:text-emerald-600 transition">Features</button></li>
          <li>
            <button onClick={onOpenSignup} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">Join Now</button>
          </li>
        </ul>

        <div className="md:hidden">
          <button onClick={() => setOpen(!open)} className="p-2">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white/95 p-6 border-t shadow-md">
          <ul className="flex flex-col gap-4">
            <li><button onClick={() => { setOpen(false); document.getElementById('home')?.scrollIntoView({behavior:'smooth'}); }} className="block text-gray-700">Home</button></li>
            <li><button onClick={() => { setOpen(false); onOpenSignup(); }} className="block text-gray-700">Sign Up</button></li>
            <li><button onClick={() => { setOpen(false); document.getElementById('streams')?.scrollIntoView({behavior:'smooth'}); }} className="block text-gray-700">Streams</button></li>
            <li><button onClick={() => { setOpen(false); document.getElementById('matrix')?.scrollIntoView({behavior:'smooth'}); }} className="block text-gray-700">Matrix</button></li>
            <li><button onClick={() => { setOpen(false); document.getElementById('premium')?.scrollIntoView({behavior:'smooth'}); }} className="block text-gray-700">Premium</button></li>
            <li><button onClick={() => { setOpen(false); document.getElementById('earners')?.scrollIntoView({behavior:'smooth'}); }} className="block text-gray-700">Top Earners</button></li>
            <li><button onClick={() => { setOpen(false); document.getElementById('features')?.scrollIntoView({behavior:'smooth'}); }} className="block text-gray-700">Features</button></li>
            <li><button onClick={() => { setOpen(false); onOpenSignup(); }} className="block mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-center">Join Now</button></li>
          </ul>
        </div>
      )}
    </nav>
  );
}
