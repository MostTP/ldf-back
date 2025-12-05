import useScrollAnimation from "../hooks/useScrollAnimation";
import { Wallet, Users, BarChart3 } from "lucide-react";

export default function Streams() {
  const ref = useScrollAnimation();

  const data = [
    {
      icon: <Users className="w-10 h-10 text-emerald-700" />,
      title: "Direct Referral Earnings",
      desc: "Earn ₦1,500 instantly for every person you refer into the system."
    },
    {
      icon: <BarChart3 className="w-10 h-10 text-emerald-700" />,
      title: "Matrix Bonus",
      desc: "Earn across 5 levels as your team grows naturally through spillovers."
    },
    {
      icon: <Wallet className="w-10 h-10 text-emerald-700" />,
      title: "Community Monthly Pool",
      desc: "Earn ₦3,500 monthly from community-driven projects and ventures."
    }
  ];

  return (
    <section
      id="streams"
      ref={ref}
      className="animate-section py-20 px-6 bg-white"
    >
      <div className="max-w-6xl mx-auto">

        <h2 className="text-3xl font-bold text-center text-emerald-700 mb-10">
          3 Streams of Financial Growth
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {data.map((item, i) => (
            <div
              key={i}
              className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm hover:shadow-lg transition"
            >
              {item.icon}
              <h3 className="text-xl font-semibold text-gray-900 mt-4">
                {item.title}
              </h3>
              <p className="text-gray-700 mt-2 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
