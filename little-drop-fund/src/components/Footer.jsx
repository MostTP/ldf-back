// src/components/Footer.jsx
import {
  FaWhatsapp,
  FaTiktok,
  FaTelegramPlane,
  FaYoutube,
} from "react-icons/fa";
import useScrollAnimation from "../hooks/useScrollAnimation"; // Use the scroll hook
import logo from "../assets/logo.png";

export default function Footer() {
  const ref = useScrollAnimation();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      id="footer"
      ref={ref}
      className="animate-section bg-[--dark] text-gray-300 py-16 px-6"
    >
      {/* 🛑 UPDATED: Grid layout now uses md:grid-cols-5 to make room for the legal column */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-5 gap-10 border-b border-gray-800 pb-10">
        {/* LOGO + DESCRIPTION */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 text-white mb-3">
            <img
              src={logo}
              alt="LDF Logo"
              className="
        h-10 w-10 md:h-14 md:w-14
        object-contain
        flex-shrink-0
      "
            />

            <span className="text-xl md:text-2xl font-extrabold tracking-tight leading-none">
              LITTLE DROP FUND
            </span>
          </div>

          <p className="text-gray-400 mt-3 text-sm leading-relaxed max-w-sm">
            Turning little drops into streams of wealth. Join a fast-growing
            community committed to achieving financial freedom through
            collaboration.
          </p>
        </div>

        {/* QUICK LINKS */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
          <ul className="space-y-3 text-sm">
            {/* Ensuring links scroll to the correct section IDs */}
            <li>
              <a
                href="#features"
                className="hover:text-[--emerald] transition-fast"
              >
                Features
              </a>
            </li>
            <li>
              <a
                href="#matrix-earnings"
                className="hover:text-[--emerald] transition-fast"
              >
                Matrix & Earnings
              </a>
            </li>
            <li>
              <a href="#faq" className="hover:text-[--emerald] transition-fast">
                FAQ
              </a>
            </li>
            <li>
              <a
                href="#disclaimer"
                className="hover:text-amber-500 transition-fast"
              >
                Disclaimer
              </a>
            </li>
          </ul>
        </div>

        {/* 🛑 NEW COLUMN: LEGAL LINKS */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Legal</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <a
                href="/terms"
                className="hover:text-[--emerald] transition-fast"
              >
                Terms & Conditions
              </a>
            </li>
            <li>
              <a
                href="/privacy"
                className="hover:text-[--emerald] transition-fast"
              >
                Privacy Policy
              </a>
            </li>
            <li>
              <a
                href="/signup"
                className="hover:text-[--emerald] transition-fast"
              >
                Join Now
              </a>
            </li>
          </ul>
        </div>

        {/* SOCIAL LINKS */}
        <div className="flex items-center gap-4">
          {/* WhatsApp */}
          <a
            href="#"
            aria-label="WhatsApp"
            className="
      p-3 rounded-full bg-gray-800 text-gray-300
      transition-all duration-300
      hover:bg-[#25D366] hover:text-white
      hover:scale-110 hover:-translate-y-1
      hover:shadow-[0_0_15px_#25D366]
      active:scale-95
    "
          >
            <FaWhatsapp className="w-5 h-5" />
          </a>

          {/* Telegram */}
          <a
            href="#"
            aria-label="Telegram"
            className="
      p-3 rounded-full bg-gray-800 text-gray-300
      transition-all duration-300
      hover:bg-[#229ED9] hover:text-white
      hover:scale-110 hover:-translate-y-1
      hover:shadow-[0_0_15px_#229ED9]
      active:scale-95
    "
          >
            <FaTelegramPlane className="w-5 h-5" />
          </a>

          {/* YouTube */}
          <a
            href="#"
            aria-label="YouTube"
            className="
      p-3 rounded-full bg-gray-800 text-gray-300
      transition-all duration-300
      hover:bg-[#FF0000] hover:text-white
      hover:scale-110 hover:-translate-y-1
      hover:shadow-[0_0_18px_#FF0000]
      active:scale-95
    "
          >
            <FaYoutube className="w-5 h-5" />
          </a>

          {/* TikTok (Dual Glow Effect) */}
          <a
            href="#"
            aria-label="TikTok"
            className="
      p-3 rounded-full bg-gray-800 text-gray-300
      transition-all duration-300
      hover:bg-black hover:text-white
      hover:scale-110 hover:-translate-y-1
      hover:shadow-[0_0_10px_#69C9D0,0_0_20px_#EE1D52]
      active:scale-95
    "
          >
            <FaTiktok className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* BOTTOM COPYRIGHT */}
      <div className="mt-10 text-center text-gray-500 text-sm pt-6">
        © {currentYear} Little Drop Fund. All rights reserved.
      </div>
    </footer>
  );
}
