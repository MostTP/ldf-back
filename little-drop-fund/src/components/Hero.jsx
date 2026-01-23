// src/components/Hero.jsx
import useScrollAnimation from "../hooks/useScrollAnimation";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Hero(){
 const ref = useScrollAnimation();
 const navigate = useNavigate();

 useEffect(() => {
 // ... (useEffect logic remains the same)
 }, []);

 return (
 <section id="home" ref={ref} className="animate-section relative overflow-hidden pt-24 pb-20" style={{ background: "linear-gradient(180deg,#0b1221 0%, #071427 40%, #052227 100%)" }}>
 <div className="absolute inset-0 pointer-events-none">
 {/* ... (Blur background elements remain the same) */}
 </div>

 {/* Grid container */}
 <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-8 items-center z-10 relative">
 
 {/* 🛑 Text Content: Now comes first by default (no order class needed) */}
 <div>
<h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
 Turning Little Drops into <span style={{background:'linear-gradient(90deg,#FACC15,#A3E635)', WebkitBackgroundClip:'text', color:'transparent'}}>Streams of Wealth</span>
 </h1>
 <p className="mt-4 text-gray-300 text-lg max-w-xl">
 Join a community-first platform that converts small efforts into sustainable income — referral bonuses, matrix earnings, and community profit sharing.
 </p>

 <div className="mt-6 flex gap-4 flex-wrap">
 <button onClick={() => navigate("/signup")} className="px-6 py-3 bg-yellow-400 text-black rounded-xl font-semibold shadow hover:bg-yellow-300 transition">Join Now — ₦5,000</button>
 <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({behavior:'smooth'})} className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/5 transition">How It Works</button>
 </div>
 </div>

 {/* 🛑 Visual Card: Set to order-last (mobile) and remove order on md (which defaults to grid order 2) */}
 <div className="flex justify-center md:justify-end order-last pt-10 md:pt-0"> 
 <div className="bg-white/5 rounded-3xl p-6 w-full max-w-xs sm:max-w-sm lg:max-w-md transform transition-all shadow-xl"> 
 <div className="w-full h-56 bg-gradient-to-br from-emerald-500 to-yellow-400 rounded-lg mb-4" />
 <h4 className="font-bold text-lg text-white">Start with ₦5,000</h4>
 <p className="text-gray-300 mt-2">Activate your account and get a coupon to join the community. Invite friends and start earning.</p>
 </div>
 </div>
 </div>
 </section>
 );
}