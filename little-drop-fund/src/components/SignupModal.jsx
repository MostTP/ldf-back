import { X } from "lucide-react";

export default function SignupModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-8 animate-fadeIn relative">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Heading */}
        <h2 className="text-3xl font-bold text-center text-emerald-700 mb-6">
          Create Your Account
        </h2>

        {/* FORM */}
        <form className="space-y-4">

          {/* Coupon */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Coupon Code
            </label>
            <input
              type="text"
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              placeholder="Enter your coupon code"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Full Name
            </label>
            <input
              type="text"
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Email Address
            </label>
            <input
              type="email"
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              placeholder="example@gmail.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              placeholder="080..."
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              placeholder="********"
            />
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              placeholder="********"
            />
          </div>

          {/* Disclaimer Checkbox */}
          <div className="flex items-start gap-3 mt-3">
            <input type="checkbox" className="mt-1 w-5 h-5" />

            <p className="text-gray-600 text-sm leading-snug">
              I have read and agree to the{" "}
              <span className="text-emerald-700 font-semibold">Disclaimer</span> and{" "}
              <span className="text-emerald-700 font-semibold">Terms & Conditions</span>.
            </p>
          </div>

          {/* WARNING */}
          <div className="bg-amber-100 border border-amber-300 text-amber-800 text-sm p-3 rounded-lg">
            Ensure all information provided is correct and belongs to you.
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="button"
            className="w-full py-3 bg-emerald-700 text-white font-bold rounded-xl mt-4 hover:bg-emerald-800 transition"
          >
            Create Account
          </button>
        </form>

      </div>
    </div>
  );
}
