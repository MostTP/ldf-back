import { ArrowRight, Coins, Users, TrendingUp } from "lucide-react";

export default function Streams() {
  const streams = [
    {
      icon: <Users size={38} className="text-emerald-600" />,
      title: "Direct Referral Earnings",
      details: [
        "Earn ₦1,000 instantly for every person you refer.",
        "No limits — refer as many people as you want.",
        "Instant payout to your dashboard wallet.",
      ],
      highlight: "Unlimited ₦1,000 earnings per referral.",
    },

    {
      icon: <TrendingUp size={38} className="text-yellow-500" />,
      title: "Matrix Earnings (5 Levels)",
      details: [
        "Earn from every member placed under you up to 5 levels.",
        "Daily matrix auto-filling from global spill.",
        "Earn even without referrals (team spill earnings).",
      ],
      highlight: "Passive earnings as your matrix fills.",
    },

    {
      icon: <Coins size={38} className="text-emerald-600" />,
      title: "Premium Investment Returns",
      details: [
        "Activate the ₦10,000 premium slot for extra rewards.",
        "Earn monthly returns from community investments.",
        "Higher priority in payout queues and bonuses.",
      ],
      highlight: "Higher earnings with premium upgrade.",
    },
  ];

  return (
    <section id="streams" className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-emerald-700 mb-10">
          Three Streams to Financial Growth
        </h2>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {streams.map((stream, idx) => (
            <div
              key={idx}
              className="bg-white p-8 rounded-xl shadow-md border border-gray-200 hover:shadow-xl transition duration-300"
            >
              <div className="flex justify-center mb-4">{stream.icon}</div>
              <h3 className="text-xl font-bold text-center mb-3 text-gray-900">
                {stream.title}
              </h3>

              <ul className="text-gray-700 space-y-2 text-sm mt-4">
                {stream.details.map((d, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ArrowRight size={16} className="text-emerald-600 mt-1" />
                    {d}
                  </li>
                ))}
              </ul>

              <p className="mt-5 text-center font-semibold text-emerald-700">
                {stream.highlight}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
