// src/components/TopEarners.jsx
import { Medal } from "lucide-react";
import useScrollAnimation from "../hooks/useScrollAnimation";

export default function TopEarners() {
  const ref = useScrollAnimation();

  const earners = [
    { 
      name: "Sarah Johnson", 
      amount: "₦150,000", 
      rank: 1, 
      iconColor: 'text-[--gold]',
      borderColor: 'border-b-[--gold]', // Gold bottom border for Rank 1
      bgColor: 'bg-white', // Use white background for all
    },
    { 
      name: "Emeka Daniels", 
      amount: "₦124,500", 
      rank: 2, 
      iconColor: 'text-gray-400',
      borderColor: 'border-b-gray-300', // Light gray/silver bottom border for Rank 2
      bgColor: 'bg-white', 
    },
    { 
      name: "Aisha Bello", 
      amount: "₦110,200", 
      rank: 3, 
      iconColor: 'text-amber-700',
      borderColor: 'border-b-amber-300', // Bronze/Amber bottom border for Rank 3
      bgColor: 'bg-white', 
    },
  ];

  return (
    <section id="topEarners" ref={ref} className="animate-section py-20 px-6 bg-gray-100">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[--dark] mb-12">
          Top Earners of the Month
        </h2>
        <p className="text-gray-600 mb-10 max-w-2xl mx-auto">
          See the results of active participation and community growth. These figures represent total commissions and pool payouts in the last 30 days.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {earners.map((e, index) => (
            <div
              key={index}
              // Conditional styling for border color and shadow based on rank
              className={`
                ${e.bgColor} p-8 rounded-xl transition-all duration-300 border-b-4 
                ${e.borderColor} 
                ${e.rank === 1 ? 'scale-[1.05] shadow-xl' : 'shadow-soft'}
              `}
            >
              <div className="flex justify-center mb-4">
                <Medal size={48} className={e.iconColor} />
              </div>
              <p className="text-gray-500 text-sm font-semibold uppercase mb-1">Rank #{e.rank}</p>
              <h3 className="text-2xl font-bold text-[--dark]">{e.name}</h3>
              
              {/* Highlight the earning amount with Emerald */}
              <p className="text-3xl font-extrabold text-[--emerald] mt-2">{e.amount}</p>
            </div>
          ))}
        </div>

        {/* CTA Button styled with Emerald */}
        <button className="mt-12 px-8 py-3 rounded-lg bg-[--emerald] hover:bg-green-700 text-white font-semibold shadow-lg shadow-green-500/30 transition-fast">
          View Full Leaderboard
        </button>
      </div>
    </section>
  );
}