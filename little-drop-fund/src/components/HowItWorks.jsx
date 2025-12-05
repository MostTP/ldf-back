import useScrollAnimation from "../hooks/useScrollAnimation";
import { UserPlus, BadgeCheck, Share2, Wallet } from "lucide-react";

export default function HowItWorks(){
  const ref = useScrollAnimation();
  const steps = [
    { icon: <UserPlus size={30} className="text-emerald-600"/>, title: "Create an Account", desc: "Register easily using your phone and basic details." },
    { icon: <BadgeCheck size={30} className="text-emerald-600"/>, title: "Activate with Coupon", desc: "Use a ₦3,000 coupon code to activate your account immediately." },
    { icon: <Share2 size={30} className="text-emerald-600"/>, title: "Invite & Earn", desc: "Earn ₦1,500 per direct referral and team bonuses automatically." },
    { icon: <Wallet size={30} className="text-emerald-600"/>, title: "Withdraw Earnings", desc: "Request payouts securely and receive immediate credit." }
  ];

  return (
    <section id="how-it-works" ref={ref} className="animate-section py-20 px-6 bg-emerald-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-emerald-700 mb-10">How It Works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s,i)=>(
            <div key={i} className="bg-white p-6 rounded-xl shadow-md border hover:shadow-xl transition">
              <div className="w-14 h-14 flex items-center justify-center bg-emerald-100 rounded-xl mb-4">{s.icon}</div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="text-gray-600 mt-2">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
