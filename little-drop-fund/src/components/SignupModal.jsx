import { X, User, Mail, Phone, Lock, BadgeCheck, KeyRound } from "lucide-react";

export default function SignupModal({ close }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-start pt-10 md:pt-20 z-[2000] overflow-y-auto">
      
      <div className="bg-white w-[95%] md:w-[60%] lg:w-[45%] rounded-xl shadow-xl p-6 md:p-8 animate-fadeIn relative">

        {/* Close Button */}
        <button 
          onClick={close} 
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>

        {/* Title */}
        <h2 className="text-3xl font-extrabold text-gray-900 text-center leading-tight">
          Start Your Journey Today!
        </h2>

        <p className="text-gray-600 text-center mt-2">
          Unlock the Masterclass and your opportunity for multiple streams of income—activated by your coupon code.
        </p>

        {/* FORM */}
        <div className="mt-6 space-y-5">

          {/* Name Row */}
          <div className="flex flex-col md:flex-row gap-4">
            <InputField icon={<User />} placeholder="First Name *" />
            <InputField icon={<User />} placeholder="Last Name *" />
          </div>

          {/* Contact Row */}
          <div className="flex flex-col md:flex-row gap-4">
            <InputField icon={<Mail />} placeholder="Email Address *" />
            <InputField icon={<Phone />} placeholder="Phone Number (WhatsApp) *" />
          </div>

          {/* Username */}
          <InputField 
            icon={<BadgeCheck />} 
            placeholder="Desired Username *"
            note="Must be unique, 6–15 characters."
          />

          {/* Default Plan */}
          <InputField 
            icon={<BadgeCheck />} 
            placeholder="LDF-Starter"
            note="Auto-filled if from an affiliate link."
          />

          {/* Coupon Code */}
          <InputField 
            icon={<KeyRound />} 
            placeholder="Activation Coupon Code (₦3,000) *"
            note="The ₦3,000 coupon code purchased from your sponsor."
          />

          {/* Passwords */}
          <InputField 
            icon={<Lock />} 
            placeholder="Password *" 
            note="Minimum 8 characters."
          />

          <InputField 
            icon={<Lock />} 
            placeholder="Confirm Password *"
          />

          {/* LEGAL ACCEPTANCE */}
          <div className="mt-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              Legal & Compliance Acceptance
            </h3>

            <Checkbox label="I have read and agree to the Terms & Conditions." />
            <Checkbox label="I have read and understand the Risk Disclosure Statement regarding the non-guaranteed nature of earnings." />
            <Checkbox label="I acknowledge that the coupon grants access to the LDF Digital Masterclass, is non-refundable, and that any earnings are performance-based." />
          </div>

          {/* SUBMIT BUTTON */}
          <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-md font-semibold shadow-md transition">
            CREATE AND ACTIVATE ACCOUNT
          </button>

        </div>
      </div>
    </div>
  );
}

/* ------------------------- */
/* REUSABLE INPUT COMPONENTS */
/* ------------------------- */

function InputField({ icon, placeholder, note }) {
  return (
    <div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </span>
        <input
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-md py-3 pl-10 pr-3 outline-none focus:ring-2 focus:ring-emerald-600 transition"
        />
      </div>
      {note && <p className="text-xs text-gray-500 mt-1">{note}</p>}
    </div>
  );
}

function Checkbox({ label }) {
  return (
    <label className="flex items-start gap-3 text-gray-700 mt-2 cursor-pointer">
      <input type="checkbox" className="mt-1 w-4 h-4 accent-emerald-600" />
      <span>{label}</span>
    </label>
  );
}
