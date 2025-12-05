import { Facebook, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-200 py-14 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">

        {/* LOGO + DESCRIPTION */}
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-wide">
            Little Drop Fund
          </h2>
          <p className="text-gray-400 mt-3 text-sm leading-relaxed">
            Turning little drops into streams of wealth.  
            Join a fast-growing community committed to achieving financial freedom through collaboration.
          </p>
        </div>

        {/* QUICK LINKS */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
          <ul className="space-y-2 text-gray-400">
            <li>
              <a href="#features" className="hover:text-white transition">
                Features
              </a>
            </li>
            <li>
              <a href="#matrix" className="hover:text-white transition">
                Matrix & Earnings
              </a>
            </li>
            <li>
              <a href="#faq" className="hover:text-white transition">
                FAQ
              </a>
            </li>
            <li>
              <a href="#disclaimer" className="hover:text-white transition">
                Disclaimer
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition">
                Sign Up
              </a>
            </li>
          </ul>
        </div>

        {/* SOCIAL LINKS */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Connect With Us</h3>

          <div className="flex items-center gap-4">
            <a
              href="#"
              className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition"
            >
              <Facebook className="w-5 h-5" />
            </a>

            <a
              href="#"
              className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition"
            >
              <Instagram className="w-5 h-5" />
            </a>

            <a
              href="#"
              className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition"
            >
              <Youtube className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      {/* BOTTOM COPYRIGHT */}
      <div className="mt-10 text-center text-gray-500 text-sm border-t border-gray-800 pt-6">
        © {new Date().getFullYear()} Little Drop Fund. All rights reserved.
      </div>
    </footer>
  );
}
