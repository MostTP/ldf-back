// src/components/TopEarners.jsx
import { Medal } from "lucide-react";
import useScrollAnimation from "../hooks/useScrollAnimation";
import SectionCard from './SectionCard'; // 🛑 NEW IMPORT FOR UNIFORMITY

export default function TopEarners() {
  // Assuming useScrollAnimation hook is available and working
  const ref = useScrollAnimation ? useScrollAnimation() : null; 

  const earners = [
    { 
      name: "Sarah Johnson", 
      amount: "₦150,000", 
      rank: 1, 
      iconColor: 'text-[--gold]',
      borderColor: 'border-b-[--gold]', 
      bgColor: 'bg-white',
    },
    { 
      name: "Emeka Daniels", 
      amount: "₦124,500", 
      rank: 2, 
      iconColor: 'text-gray-400',
      borderColor: 'border-b-gray-300', 
      bgColor: 'bg-white', 
    },
    { 
      name: "Aisha Bello", 
      amount: "₦110,200", 
      rank: 3, 
      iconColor: 'text-amber-700',
      borderColor: 'border-b-amber-300', 
      bgColor: 'bg-white', 
    },
  ];

  return (
    <section id="topEarners" ref={ref} className="animate-section py-20 px-6 bg-gray-100">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[--dark] mb-12">
          Top Earners of the Month
        </h2>
        <p className="text-gray-600 mb-10 max-w-2xl mx-auto">
          See the results of active participation and community growth. These figures represent total commissions and pool payouts in the last 30 days.
        </p>

        {/* 🛑 REPLACING CUSTOM WRAPPER WITH SECTIONCARD */}
        <SectionCard className="p-8 mx-auto h-full" borderEmphasis="top">
            
          <div className="flex items-center justify-center mb-8">
            <Medal size={48} className="text-[--emerald]" />
            <h3 className="text-3xl font-bold text-[--dark] ml-3">Leaderboard</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6"> 
            {earners.map((e, index) => (
              <div
                key={index}
                // Internal card styling: remove the redundant shadow/border from the outer SectionCard
                className={`
                  bg-gray-50 p-6 rounded-lg transition-all duration-300 border-b-4 border-t border-r border-l border-gray-100
                  ${e.borderColor} 
                  ${e.rank === 1 ? 'scale-[1.05] shadow-lg' : 'shadow-sm'}
                `}
              >
                <div className="flex justify-center mb-4">
                  <Medal size={48} className={e.iconColor} />
                </div>
                <p className="text-gray-500 text-sm font-semibold uppercase mb-1">Rank #{e.rank}</p>
                <h3 className="text-xl font-bold text-[--dark]">{e.name}</h3>
                
                <p className="text-2xl font-extrabold text-[--emerald] mt-2">{e.amount}</p>
              </div>
            ))}
          </div>

          {/* CTA Button styled with Emerald */}
          <button className="mt-8 px-8 py-3 rounded-lg bg-[--emerald] hover:bg-green-700 text-white font-semibold shadow-lg shadow-green-500/30 transition-fast">
            View Full Leaderboard
          </button>
        </SectionCard>
      </div>
    </section>
  );
}