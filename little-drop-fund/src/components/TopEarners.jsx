import useScrollAnimation from "../hooks/useScrollAnimation";
import { Crown } from "lucide-react";

export default function TopEarners() {
  const ref = useScrollAnimation();

  const earners = [
    { name: "Abdulrahman Yusuf", amount: "₦150,000", rank: "1st" },
    { name: "Blessing Chioma", amount: "₦120,000", rank: "2nd" },
    { name: "Samuel Daniel", amount: "₦95,000", rank: "3rd" },
  ];

  return (
    <section id="top-earners" ref={ref} className="animate-section py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">

        <h2 className="text-3xl font-bold text-center text-emerald-700 mb-8">
          Top Earners of the Month
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {earners.map((e, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{e.name}</h3>
                  <p className="text-gray-600 mt-1">{e.amount}</p>
                </div>
                <Crown className={`w-8 h-8 ${
                  i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : "text-amber-700"
                }`} />
              </div>

              <p className="text-sm text-right text-gray-500 mt-3">
                Rank: <span className="font-bold">{e.rank}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow">
            View Full Ranking
          </button>
        </div>
      </div>
    </section>
  );
}
