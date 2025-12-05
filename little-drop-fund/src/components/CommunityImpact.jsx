import useScrollAnimation from "../hooks/useScrollAnimation";
import { Users, Wallet, TrendingUp } from "lucide-react";

export default function CommunityImpact() {
  const ref = useScrollAnimation();

  const stats = [
    { icon: <Users className="w-10 h-10 text-emerald-700"/>, label: "Total Members", value: "12,840+" },
    { icon: <Wallet className="w-10 h-10 text-emerald-700"/>, label: "Total Payout", value: "₦24,500,000+" },
    { icon: <TrendingUp className="w-10 h-10 text-emerald-700"/>, label: "Total Referrals", value: "98,200+" }
  ];

  return (
    <section id="community-impact" ref={ref} className="animate-section py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">

        <h2 className="text-3xl font-bold text-center text-emerald-700 mb-12">
          Community Impact
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {stats.map((s, i) => (
            <div
              key={i}
              className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 text-center"
            >
              <div className="flex justify-center mb-4">{s.icon}</div>
              <h3 className="text-3xl font-bold text-emerald-700">{s.value}</h3>
              <p className="text-gray-600 mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
