import { Medal } from "lucide-react";

export default function TopEarners() {
  const earners = [
    { name: "Sarah Johnson", amount: "₦150,000", rank: 1 },
    { name: "Emeka Daniels", amount: "₦124,500", rank: 2 },
    { name: "Aisha Bello", amount: "₦110,200", rank: 3 },
  ];

  return (
    <section id="topEarners" className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-emerald-700 mb-12">
          Top Earners of the Month
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {earners.map((e, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 shadow-md rounded-xl p-8 hover:shadow-xl transition"
            >
              <div className="flex justify-center mb-3">
                <Medal
                  size={40}
                  className={
                    e.rank === 1
                      ? "text-yellow-500"
                      : e.rank === 2
                      ? "text-gray-400"
                      : "text-amber-700"
                  }
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{e.name}</h3>
              <p className="text-emerald-700 font-bold mt-1">{e.amount}</p>
              <p className="text-gray-500 text-sm mt-2">Rank #{e.rank}</p>
            </div>
          ))}
        </div>

        <button className="mt-8 px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md">
          View Full Leaderboard
        </button>
      </div>
    </section>
  );
}
