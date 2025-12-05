import useScrollAnimation from "../hooks/useScrollAnimation";
import { Wallet, Users, TrendingUp } from "lucide-react";

export default function GrowthStreams() {
  const ref = useScrollAnimation();

  const streams = [
    {
      icon: <Wallet className="w-10 h-10 text-yellow-400" />,
      title: "Direct Referral Bonus",
      desc: "Earn ₦1,500 instantly for every person you refer who activates their account.",
    },
    {
      icon: <Users className="w-10 h-10 text-yellow-400" />,
      title: "Matrix Spill-Over Earnings",
      desc: "Earn as your matrix fills—whether from your referrals or community spillover.",
    },
    {
      icon: <TrendingUp className="w-10 h-10 text-yellow-400" />,
      title: "Premium Investment Returns",
      desc: "Upgrade to ₦10,000 and earn monthly returns & exclusive premium bonuses.",
    },
  ];

  return (
    <section id="streams" ref={ref} className="animate-section py-20 px-6 bg-neutral-950">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-yellow-400">
          3 Streams to Financial Growth
        </h2>
        <p className="text-gray-300 mt-3 max-w-2xl mx-auto">
          Multiple income opportunities designed to help members grow sustainably.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mt-14">
          {streams.map((s, i) => (
            <div
              key={i}
              className="bg-black border border-yellow-500/40 p-8 rounded-3xl shadow-xl hover:scale-[1.03] transition"
            >
              <div className="flex items-center justify-center mb-4">{s.icon}</div>
              <h3 className="text-xl font-bold text-white">{s.title}</h3>
              <p className="mt-2 text-gray-300">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
