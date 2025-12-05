import { X, Mail, Lock } from "lucide-react";
import { useEffect } from "react";

export default function LoginModal({ onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative z-[210] w-full max-w-md mx-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-xl p-8 relative">

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-6 top-6 bg-gray-100 hover:bg-gray-200 p-2 rounded-full"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-emerald-700">Welcome Back</h2>
            <p className="text-gray-600 mt-1">
              Login to access your dashboard & earnings.
            </p>
          </div>

          {/* Login Form */}
          <form className="grid gap-4">

            {/* Email */}
            <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50">
              <Mail className="text-emerald-600 mr-3" />
              <input
                name="email"
                placeholder="Email Address"
                className="w-full bg-transparent outline-none"
              />
            </div>

            {/* Password */}
            <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50">
              <Lock className="text-emerald-600 mr-3" />
              <input
                name="password"
                type="password"
                placeholder="Password"
                className="w-full bg-transparent outline-none"
              />
            </div>

            {/* Forgot Password */}
            <p className="text-right text-sm text-emerald-700 underline cursor-pointer">
              Forgot Password?
            </p>

            {/* Login Button */}
            <button className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition">
              Login
            </button>

            {/* Create Account */}
            <p className="text-center text-sm text-gray-600 mt-2">
              Don’t have an account?{" "}
              <span className="text-emerald-700 font-semibold underline cursor-pointer">
                Create Account
              </span>
            </p>
          </form>

        </div>
      </div>
    </div>
  );
}
