// src/components/CommunityImpact.jsx
import useScrollAnimation from "../hooks/useScrollAnimation";
import { Users, Coins, TrendingUp, Wallet } from "lucide-react";

export default function CommunityImpact() {
  const ref = useScrollAnimation();

  const stats = [
    {
      icon: <Users size={36} className="text-[--emerald]" />,
      number: "16,752",
      label: "Total Members",
    },
    {
      icon: <Coins size={36} className="text-[--gold]" />,
      number: "₦10,125,800",
      label: "Total Payouts",
    },
    {
      icon: <TrendingUp size={36} className="text-[--emerald]" />,
      number: "150",
      label: "Active Referrals Today",
    },
    {
      icon: <Wallet size={36} className="text-[--emerald]" />,
      number: "₦2,500",
      label: "Avg. Pool Payout",
    },
  ];

  return (
    <section id="community" ref={ref} className="animate-section py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto text-center">
        {/* Updated Heading to use --dark and font-extrabold */}
        <h2 className="text-3xl md:text-4xl font-extrabold text-[--dark] mb-6">
          Community Impact & Metrics
        </h2>
        <p className="text-gray-600 mb-12 max-w-xl mx-auto">
            Our commitment to growth is measurable. These real-time statistics showcase the success and trust built within the Little Drop Fund community.
        </p>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-6">
          {stats.map((item, index) => (
            <div
              key={index}
              // Enhanced card styling
              className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 hover:shadow-lg transition-fast"
            >
              <div className="flex justify-center mb-3">{item.icon}</div>
              {/* Statistic Number highlighted with --emerald */}
              <p className="text-3xl font-extrabold text-[--emerald] mb-1">
                {item.number}
              </p>
              <p className="text-gray-600 font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}