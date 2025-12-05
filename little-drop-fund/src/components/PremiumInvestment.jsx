import { Crown, CheckCircle2 } from "lucide-react";

export default function PremiumInvestment() {
  const benefits = [
    "Earn from the premium monthly pool",
    "Get priority in matrix placement",
    "Higher earnings potential",
    "Exclusive promotions and bonuses",
  ];

  return (
    <section id="premium" className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-emerald-700 mb-6">
          Premium Investment Plan
        </h2>

        <p className="text-gray-700 text-lg max-w-3xl mx-auto mb-10">
          Upgrade with a one-time <span className="font-semibold">₦10,000</span> 
          to unlock higher earnings, monthly pool rewards, and exclusive placement benefits.
        </p>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl shadow-md p-10">
          <div className="flex justify-center mb-6">
            <Crown size={48} className="text-yellow-500" />
          </div>

          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            What You Gain
          </h3>

          <ul className="text-gray-700 space-y-3 max-w-md mx-auto text-left">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-600" size={20} /> {b}
              </li>
            ))}
          </ul>

          <button className="mt-8 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 transition text-white rounded-xl font-semibold shadow-md">
            Upgrade to Premium
          </button>
        </div>
      </div>
    </section>
  );
}
