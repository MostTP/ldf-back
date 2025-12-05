import useScrollAnimation from "../hooks/useScrollAnimation";
import { BadgeDollarSign } from "lucide-react";

export default function PremiumInvestment() {
  const ref = useScrollAnimation();

  return (
    <section id="investment" ref={ref} className="animate-section py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">

        <h2 className="text-3xl font-bold text-center text-emerald-700 mb-6">
          Premium Investment Plan
        </h2>

        <p className="text-center text-gray-600 max-w-xl mx-auto mb-10">
          Boost your earnings with our optional ₦10,000 premium investment plan.
        </p>

        <div className="bg-emerald-50 p-10 rounded-2xl shadow-md border border-emerald-100">

          <div className="flex items-center mb-6">
            <BadgeDollarSign className="w-12 h-12 text-emerald-700 mr-4" />
            <h3 className="text-2xl font-bold text-emerald-800">
              ₦10,000 Premium Investment
            </h3>
          </div>

          <ul className="text-gray-700 space-y-3 mb-6">
            <li>✔ 25% monthly ROI</li>
            <li>✔ Paid directly into your wallet</li>
            <li>✔ No referrals required</li>
            <li>✔ Withdraw anytime</li>
          </ul>

          <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow w-full">
            Activate Investment
          </button>
        </div>
      </div>
    </section>
  );
}
