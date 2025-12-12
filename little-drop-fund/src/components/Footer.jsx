// src/components/Footer.jsx
import { Facebook, Instagram, Youtube } from "lucide-react";
import useScrollAnimation from "../hooks/useScrollAnimation"; // Use the scroll hook

export default function Footer() {
 const ref = useScrollAnimation();
 const currentYear = new Date().getFullYear();

 return (
 <footer id="footer" ref={ref} className="animate-section bg-[--dark] text-gray-300 py-16 px-6">
 {/* 🛑 UPDATED: Grid layout now uses md:grid-cols-5 to make room for the legal column */}
 <div className="max-w-6xl mx-auto grid md:grid-cols-5 gap-10 border-b border-gray-800 pb-10">

 {/* LOGO + DESCRIPTION */}
 {/* Retained col-span-2 for visual balance (2/5ths width) */}
 <div className="md:col-span-2"> 
 {/* Logo styled to match Navbar */}
 <div className="flex items-center text-2xl font-extrabold text-white mb-3">
 <span className="mr-2 text-[--emerald] text-3xl font-extrabold">LDF</span> 
 LITTLE DROP FUND
 </div>
 <p className="text-gray-400 mt-3 text-sm leading-relaxed max-w-sm">
 Turning little drops into streams of wealth. Join a fast-growing community committed to achieving financial freedom through collaboration.
 </p>
 </div>

 {/* QUICK LINKS */}
 <div>
 <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
 <ul className="space-y-3 text-sm">
 {/* Ensuring links scroll to the correct section IDs */}
 <li><a href="#features" className="hover:text-[--emerald] transition-fast">Features</a></li>
 <li><a href="#matrix-earnings" className="hover:text-[--emerald] transition-fast">Matrix & Earnings</a></li>
 <li><a href="#faq" className="hover:text-[--emerald] transition-fast">FAQ</a></li>
 <li><a href="#disclaimer" className="hover:text-amber-500 transition-fast">Disclaimer</a></li>
 </ul>
 </div>

 {/* 🛑 NEW COLUMN: LEGAL LINKS */}
 <div>
 <h3 className="text-lg font-semibold text-white mb-4">Legal</h3>
 <ul className="space-y-3 text-sm">
 <li>
 <a href="/terms" className="hover:text-[--emerald] transition-fast">Terms & Conditions</a>
 </li>
 <li>
 <a href="/privacy" className="hover:text-[--emerald] transition-fast">Privacy Policy</a>
 </li>
 <li>
 <a href="/signup" className="hover:text-[--emerald] transition-fast">Join Now</a>
 </li>
 </ul>
 </div>
        
 {/* SOCIAL LINKS */}
 <div>
 <h3 className="text-lg font-semibold text-white mb-4">Connect With Us</h3>

 <div className="flex items-center gap-4">
 {/* Social Icons with Emerald hover */}
 <a
 href="#"
 aria-label="Facebook"
 className="p-3 bg-gray-800 rounded-full hover:bg-[--emerald] transition-fast text-gray-300 hover:text-white"
 >
 <Facebook className="w-5 h-5" />
 </a>

 <a
 href="#"
 aria-label="Instagram"
 className="p-3 bg-gray-800 rounded-full hover:bg-[--emerald] transition-fast text-gray-300 hover:text-white"
 >
 <Instagram className="w-5 h-5" />
 </a>

 <a
 href="#"
 aria-label="Youtube"
 className="p-3 bg-gray-800 rounded-full hover:bg-[--emerald] transition-fast text-gray-300 hover:text-white"
 >
 <Youtube className="w-5 h-5" />
 </a>
 </div>
 </div>
 </div>

 {/* BOTTOM COPYRIGHT */}
 <div className="mt-10 text-center text-gray-500 text-sm pt-6">
 © {currentYear} Little Drop Fund. All rights reserved.
 </div>
 </footer>
 );
}