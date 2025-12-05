import { useState } from "react";
import { Mail, Phone, Lock, User, KeyRound } from "lucide-react";

export default function SignUp() {
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    phone: "",
    password: "",
    coupon: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-xl rounded-xl shadow-lg p-8 border border-gray-200">

        {/* Header */}
        <h2 className="text-3xl font-bold text-center text-emerald-700 mb-2">
          Create Your Account
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Join Little Drop Fund and start your journey to financial growth.
        </p>

        {/* Form */}
        <form className="space-y-5">

          {/* Full Name */}
          <div>
            <label className="text-gray-700 font-medium">Full Name</label>
            <div className="flex items-center mt-2 bg-gray-100 px-3 rounded-lg">
              <User className="text-emerald-600" size={20} />
              <input
                type="text"
                name="fullname"
                value={form.fullname}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full bg-transparent py-3 px-2 outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-gray-700 font-medium">Email Address</label>
            <div className="flex items-center mt-2 bg-gray-100 px-3 rounded-lg">
              <Mail className="text-emerald-600" size={20} />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@gmail.com"
                className="w-full bg-transparent py-3 px-2 outline-none"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-gray-700 font-medium">Phone Number</label>
            <div className="flex items-center mt-2 bg-gray-100 px-3 rounded-lg">
              <Phone className="text-emerald-600" size={20} />
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="08012345678"
                className="w-full bg-transparent py-3 px-2 outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-gray-700 font-medium">Password</label>
            <div className="flex items-center mt-2 bg-gray-100 px-3 rounded-lg">
              <Lock className="text-emerald-600" size={20} />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                className="w-full bg-transparent py-3 px-2 outline-none"
              />
            </div>
          </div>

          {/* Coupon Code */}
          <div>
            <label className="text-gray-700 font-medium">Coupon Code</label>
            <div className="flex items-center mt-2 bg-gray-100 px-3 rounded-lg">
              <KeyRound className="text-emerald-600" size={20} />
              <input
                type="text"
                name="coupon"
                value={form.coupon}
                onChange={handleChange}
                placeholder="Enter your activation coupon"
                className="w-full bg-transparent py-3 px-2 outline-none"
              />
            </div>
          </div>

          {/* Button */}
          <button
            type="button"
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-lg transition"
          >
            Create Account
          </button>
        </form>

        {/* Disclaimer */}
        <p className="mt-6 text-sm text-gray-600 leading-relaxed">
          By signing up, you agree to our{" "}
          <a href="/terms" className="text-emerald-700 font-semibold underline">
            Terms & Conditions
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-emerald-700 font-semibold underline">
            Privacy Policy
          </a>
          . Little Drop Fund is a team-growth financial system. Earnings depend
          on your activity and community performance.
        </p>

      </div>
    </div>
  );
}
