import { Users, Coins, TrendingUp, Wallet } from "lucide-react";

export default function CommunityImpact() {
  const stats = [
    {
      icon: <Users size={36} className="text-emerald-600" />,
      number: "16,752",
      label: "Total Members",
    },
    {
      icon: <Coins size={36} className="text-yellow-500" />,
      number: "₦10,125,800",
      label: "Total Payouts",
    },
    {
      icon: <TrendingUp size={36} className="text-emerald-600" />,
      number: "150",
      label: "Active Referrals Today",
    },
    {
      icon: <Wallet size={36} className="text-emerald-600" />,
      number: "₦2,500",
      label: "Avg. Pool Payout",
    },
  ];

  return (
    <section id="community" className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-emerald-700 mb-12">
          Community Impact
        </h2>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-6">
          {stats.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-xl transition"
            >
              <div className="flex justify-center mb-3">{item.icon}</div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {item.number}
              </p>
              <p className="text-gray-600">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
