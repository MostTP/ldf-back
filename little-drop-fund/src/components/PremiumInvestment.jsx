// src/components/PremiumInvestment.jsx
import useScrollAnimation from "../hooks/useScrollAnimation";
import { Crown, CheckCircle2, Shield } from "lucide-react";

export default function PremiumInvestment({ onOpenSignup }) {
  const ref = useScrollAnimation();

  const safetyNetBenefits = [
    "Available to all active members (₦3,000 entry)",
    "Monthly dividend payout (₦1,250 – ₦3,500)",
    "Earn even if you haven't referred anyone yet",
  ];

  const premiumPlanBenefits = [
    "Upgrade Cost: ₦10,000 (one-time)",
    "Higher monthly returns from community investments",
    "Priority in payout queues and matrix placement",
    "Exclusive promotions and bonuses",
  ];

  return (
    <section id="investment-streams" ref={ref} className="animate-section py-20 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[--dark] mb-12">
          Passive & Premium Earnings
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* ----------------------------------------------------- */}
          {/* Card B: Global Pool / Safety Net Payout */}
          {/* ----------------------------------------------------- */}
          <div className="bg-white p-8 rounded-xl shadow-soft hover:shadow-lg transition-fast text-left border border-gray-100">
            <Shield className="w-8 h-8 text-[--emerald] mb-3" />
            <h3 className="text-2xl font-bold text-[--dark] mb-2">
              B. Global Pool Payout
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Our safety net income stream, distributing profits to all active members.
            </p>
            
            <ul className="space-y-3 text-gray-700">
              {safetyNetBenefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-[--emerald] shrink-0 mt-1 mr-2" />
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>

            <button
                onClick={onOpenSignup}
                className="mt-6 w-full py-3 rounded-md bg-[--emerald] text-white font-semibold shadow-md shadow-green-500/20 hover:bg-green-700 transition-fast"
            >
                Learn More
            </button>
          </div>

          {/* ----------------------------------------------------- */}
          {/* Card C: Premium Investment Returns */}
          {/* ----------------------------------------------------- */}
          <div className="bg-neutral-900 text-white p-8 rounded-xl shadow-xl hover:shadow-2xl transition-fast text-left premium-border">
            <Crown className="w-8 h-8 text-[--gold] mb-3" />
            <h3 className="text-2xl font-bold mb-2 text-[--gold]">
              C. Premium Investment Returns
            </h3>
            <p className="text-gray-300 mb-4 text-sm">
              Higher returns and exclusive access for advanced financial growth.
            </p>
            
            <ul className="space-y-3 text-gray-300">
              {premiumPlanBenefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-[--gold] shrink-0 mt-1 mr-2" />
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
            
            <button 
                onClick={onOpenSignup}
                className="mt-6 w-full py-3 rounded-md bg-[--gold] text-black font-semibold shadow-md shadow-yellow-500/30 hover:bg-yellow-400 transition-fast"
            >
                Activate Premium (₦10,000)
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}