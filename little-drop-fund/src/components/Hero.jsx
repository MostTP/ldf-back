import useScrollAnimation from "../hooks/useScrollAnimation";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Hero(){
  const ref = useScrollAnimation();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      const hero = document.getElementById("home");
      if (!hero) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      hero.style.setProperty("--px", `${x}px`);
      hero.style.setProperty("--py", `${y}px`);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <section id="home" ref={ref} className="animate-section relative overflow-hidden pt-24 pb-20" style={{ background: "linear-gradient(180deg,#0b1221 0%, #071427 40%, #052227 100%)" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-600/10 opacity-40 blur-3xl transform" style={{ transform: "translate(var(--px,0), var(--py,0))" }} />
        <div className="absolute -bottom-24 -left-28 w-80 h-80 rounded-full bg-yellow-400/6 opacity-30 blur-3xl transform" style={{ transform: "translate(calc(var(--px,0)*-0.6), calc(var(--py,0)*-0.6))" }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-8 items-center z-10 relative">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Turning Little Drops into <span style={{background:'linear-gradient(90deg,#FACC15,#A3E635)', WebkitBackgroundClip:'text', color:'transparent'}}>Streams of Wealth</span>
          </h1>
          <p className="mt-4 text-gray-300 text-lg max-w-xl">
            Join a community-first platform that converts small efforts into sustainable income — referral bonuses, matrix earnings, and community profit sharing.
          </p>

          <div className="mt-6 flex gap-4 flex-wrap">
            <button onClick={() => navigate("/signup")} className="px-6 py-3 bg-yellow-400 text-black rounded-xl font-semibold shadow hover:bg-yellow-300 transition">Join Now — ₦3,000</button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({behavior:'smooth'})} className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/5 transition">How It Works</button>
          </div>

          <div className="mt-6 flex gap-6 text-sm text-gray-300">
            <div><strong className="text-yellow-400">₦1,500</strong> direct referral</div>
            <div><strong className="text-yellow-400">5 levels</strong> matrix</div>
            <div><strong className="text-yellow-400">₦3,500</strong> monthly pool</div>
          </div>
        </div>

        <div className="hidden md:flex justify-center">
          <div className="bg-white/5 rounded-3xl p-6 w-96 transform transition-all hover:-translate-y-2 shadow-xl">
            <div className="w-full h-56 bg-gradient-to-br from-emerald-500 to-yellow-400 rounded-lg mb-4" />
            <h4 className="font-bold text-lg text-white">Start with ₦3,000</h4>
            <p className="text-gray-300 mt-2">Activate your account and get a coupon to join the community. Invite friends and start earning.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
