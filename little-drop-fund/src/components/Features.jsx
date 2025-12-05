import useScrollAnimation from "../hooks/useScrollAnimation";
import { Sparkles, Box, Users, Zap } from "lucide-react";

export default function Features(){
  const ref = useScrollAnimation();

  const items = [
    { icon: <Sparkles size={28} className="text-emerald-600"/>, title: "Simple Activation", desc: "Activate with a one-time ₦3,000 coupon and start instantly." },
    { icon: <Box size={28} className="text-emerald-600"/>, title: "Transparent Payouts", desc: "Automated earnings and complete system transparency." },
    { icon: <Zap size={28} className="text-emerald-600"/>, title: "Fast Referrals", desc: "Earn ₦1,500 per direct referral and grow your matrix." },
    { icon: <Users size={28} className="text-emerald-600"/>, title: "Community Growth", desc: "Participate in ventures and monthly profit-sharing." }
  ];

  return (
    <section id="features" ref={ref} className="animate-section py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-emerald-700 mb-10">Platform Features</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((it,i)=>(
            <div key={i} className="p-6 bg-emerald-50 rounded-xl shadow-sm border hover:shadow-lg transition">
              <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg shadow mb-4">{it.icon}</div>
              <h3 className="font-semibold text-lg mb-1">{it.title}</h3>
              <p className="text-gray-600">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
