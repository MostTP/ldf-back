import useScrollAnimation from "../hooks/useScrollAnimation";
import { Crown } from "lucide-react";

export default function PremiumPlan() {
  const ref = useScrollAnimation();

  return (
    <section id="premium" ref={ref} className="animate-section py-20 px-6 bg-neutral-950">
      <div className="max-w-5xl mx-auto text-center">

        <div className="flex justify-center mb-3">
          <Crown className="w-12 h-12 text-yellow-400" />
        </div>

        <h2 className="text-3xl md:text-4xl font-extrabold text-yellow-400">
          Premium Investment (₦10,000 Upgrade)
        </h2>
        <p className="text-gray-300 mt-3 max-w-2xl mx-auto">
          Unlock higher monthly returns, exclusive bonuses, and premium community benefits.
        </p>

        <div className="mt-10 bg-black border border-yellow-500/50 p-10 rounded-3xl shadow-xl">
          <h3 className="text-2xl font-bold text-white">Premium Benefits</h3>
          <ul className="mt-4 text-gray-300 space-y-3">
            <li>• Monthly ROI + long-term community rewards</li>
            <li>• Double referral bonuses</li>
            <li>• Priority payouts</li>
            <li>• Special premium-only matrix</li>
          </ul>

          <button className="mt-8 bg-yellow-400 text-black font-bold px-10 py-3 rounded-xl hover:bg-yellow-500 transition">
            Upgrade to Premium
          </button>
        </div>

      </div>
    </section>
  );
}
