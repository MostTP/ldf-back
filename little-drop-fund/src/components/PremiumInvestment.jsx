import React from 'react';
import { Crown, CheckCircle2, Shield, TrendingUp, Layers } from "lucide-react";
import SectionCard from './SectionCard'; 

export default function PremiumInvestment({ onOpenSignup }) {
    // Standard Global Pool Benefits (Remains focused on the safety net)
    const safetyNetBenefits = [
        "Available to all active members (₦3,000 entry)",
        "Monthly dividend payout (₦1,250 – ₦3,500)",
        "Earn even if you haven't referred anyone yet",
        "Sustainable community-driven profit sharing",
    ];

    // Restructured for Slot-Based Model
    const premiumSlotBenefits = [
        "Investment Unit: ₦10,000 per Slot",
        "Target ROI: 10% – 20% Monthly per slot", 
        "No limit: Purchase multiple slots to scale income",
        "Fully passive: Earnings accrue without recruiting",
        "Priority in matrix placement & payout queues",
    ];

    return (
        <section id="investment-streams" className="py-20 px-6 bg-gray-50">
            <div className="max-w-7xl mx-auto text-center">
                <div className="mb-12">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[--dark] mb-4">
                        Investment Slots & Global Pool
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        LDF offers unique paths to grow your capital. Participate in our community safety net 
                        or scale your wealth through high-yield investment slots.
                    </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    
                    {/* Card B: Global Pool / Safety Net */}
                    <SectionCard className="p-8 text-left h-full bg-white" borderEmphasis="left">
                        <Shield className="w-10 h-10 text-[--emerald] mb-4" />
                        <h3 className="text-2xl font-bold text-[--dark] mb-2">
                            B. Global Pool Payout
                        </h3>
                        <p className="text-gray-600 mb-6 text-sm">
                            Our baseline income stream designed to ensure every active member shares in the community's success.
                        </p>
                        <ul className="space-y-3 text-gray-700 mb-8">
                            {safetyNetBenefits.map((benefit, index) => (
                                <li key={index} className="flex items-start">
                                    <CheckCircle2 className="w-5 h-5 text-[--emerald] shrink-0 mt-0.5 mr-3" />
                                    <span className="text-sm font-medium">{benefit}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={onOpenSignup}
                            className="mt-auto w-full py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
                        >
                            Get Started
                        </button>
                    </SectionCard>

                    {/* Card C: Premium Investment Slots (Restructured) */}
                    <SectionCard className="p-8 text-left h-full bg-neutral-900 text-white shadow-2xl border-2 border-[--gold] relative overflow-hidden">
                        {/* Subtle decorative background icon */}
                        <Layers className="absolute -right-4 -top-4 w-32 h-32 text-white opacity-5 rotate-12" />
                        
                        <div className="relative z-10">
                            <Crown className="w-10 h-10 text-[--gold] mb-4" />
                            <h3 className="text-2xl font-bold mb-2 text-[--gold]">
                                C. Capital Pool Slots
                            </h3>
                            <p className="text-gray-500 mb-6 text-sm">
                                High-performance managed fund. One slot equals ₦10,000. Acquire more slots to multiply your returns.
                            </p> 
                            <ul className="space-y-3 text-gray-600 mb-8">
                                {premiumSlotBenefits.map((benefit, index) => (
                                    <li key={index} className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-[--gold] shrink-0 mt-0.5 mr-3" />
                                        <span className="text-sm font-semibold">{benefit}</span>
                                    </li>
                                ))}
                            </ul> 
                            <button 
                                onClick={onOpenSignup}
                                className="w-full py-4 rounded-xl bg-[--gold] text-black font-black uppercase tracking-wider hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
                            >
                                <TrendingUp size={20} />
                                Acquire Slots (₦10,000/Unit)
                            </button>
                        </div>
                    </SectionCard>

                </div>
            </div>
        </section>
    );
}