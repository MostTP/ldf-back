import React from "react";
import { Crown, CheckCircle2, Shield, TrendingUp, Layers } from "lucide-react";
import SectionCard from "./SectionCard";

export default function PremiumInvestment({ onOpenSignup }) {
  // Standard Global Pool Benefits (Remains focused on the safety net)
  const safetyNetBenefits = [
    "Available to all active members (₦5,000 entry)",
    "Monthly dividend payout (₦3,000 - ₦10,000)",
    "Earn even if you haven't referred anyone yet",
    "Sustainable community-driven profit sharing",
  ];

  return (
    <section id="investment-streams" className="py-20 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto text-center">
        {/* Center wrapper */}
        <div className="flex justify-center">
          <div className="w-full max-w-xl">
            {/* Card: Global Pool / Safety Net */}
            <SectionCard
              className="p-8 text-left h-full bg-white"
              borderEmphasis="left"
            >
              <Shield className="w-10 h-10 text-[--emerald] mb-4" />

              <h3 className="text-2xl font-bold text-[--dark] mb-2">
                B. Global Pool Payout
              </h3>

              <p className="text-gray-600 mb-6 text-sm">
                Our baseline income stream designed to ensure every active
                member shares in the community's success.
              </p>

              <ul className="space-y-3 text-gray-700 mb-8">
                {safetyNetBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-[--emerald] shrink-0 mt-0.5 mr-3" />
                    <span className="text-sm font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={onOpenSignup}
                className="mt-auto w-full py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                Get Started
              </button>
            </SectionCard>
          </div>
        </div>
      </div>
    </section>
  );
}
