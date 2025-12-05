import useScrollAnimation from "../hooks/useScrollAnimation";
import { Users, ArrowDownCircle, Wallet, Coins } from "lucide-react";

export default function EarningPathways(){
  const ref = useScrollAnimation();

  const items = [
    { icon: <Users size={32} className="text-emerald-600"/>, title: "Direct Referral", amount: "₦1,500 Per Person", desc: "Earn instantly whenever you refer someone." },
    { icon: <ArrowDownCircle size={32} className="text-emerald-600"/>, title: "5-Level Matrix Bonus", amount: "₦500 Total Per Downline", desc: "Earn passively as your matrix fills up." },
    { icon: <Wallet size={32} className="text-emerald-600"/>, title: "Leadership Rewards", amount: "Monthly Bonuses", desc: "Top builders enjoy additional monthly incentives." },
    { icon: <Coins size={32} className="text-emerald-600"/>, title: "Global Pool Earnings", amount: "₦3,500 Monthly", desc: "Passive earners get paid from community ventures." }
  ];

  return (
    <section id="earnings" ref={ref} className="animate-section py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-emerald-700 mb-10">Earnings Breakdown</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((it,i)=>(
            <div key={i} className="p-6 border rounded-xl shadow-sm hover:shadow-lg transition bg-emerald-50">
              <div className="w-14 h-14 flex items-center justify-center bg-white rounded-xl shadow mb-4">{it.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800">{it.title}</h3>
              <p className="text-emerald-700 font-bold mt-1">{it.amount}</p>
              <p className="text-gray-600 mt-2">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
