import useScrollAnimation from "../hooks/useScrollAnimation";
import { Users, Wallet, Trophy, Coins } from "lucide-react";

export default function MatrixEarnings() {
  const ref = useScrollAnimation();

  const matrix = [
    { level: "Level 1", members: "5", earning: "₦120 × 5 = ₦600" },
    { level: "Level 2", members: "25", earning: "₦100 × 25 = ₦2,500" },
    { level: "Level 3", members: "125", earning: "₦60 × 125 = ₦7,500" },
    { level: "Level 4", members: "625", earning: "₦100 × 625 = ₦62,500" },
    { level: "Level 5", members: "3125", earning: "₦120 × 3125 = ₦375,000" },
  ];

  return (
    <section
      id="matrix"
      ref={ref}
      className="animate-section py-20 px-6 bg-white"
    >
      <div className="max-w-6xl mx-auto">

        <h2 className="text-3xl font-bold text-center text-emerald-700 mb-8">
          Matrix Earnings Breakdown
        </h2>

        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm">
            <Users className="w-10 h-10 text-emerald-600 mb-3" />
            <h3 className="text-xl font-semibold">Direct Referral</h3>
            <p className="text-emerald-700 font-bold text-2xl">₦1,500</p>
          </div>

          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm">
            <Wallet className="w-10 h-10 text-emerald-600 mb-3" />
            <h3 className="text-xl font-semibold">Matrix Bonus</h3>
            <p className="text-emerald-700 font-bold text-2xl">₦448,100+</p>
          </div>

          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm">
            <Coins className="w-10 h-10 text-emerald-600 mb-3" />
            <h3 className="text-xl font-semibold">Monthly Pool</h3>
            <p className="text-emerald-700 font-bold text-2xl">₦3,500</p>
          </div>

          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm">
            <Trophy className="w-10 h-10 text-emerald-600 mb-3" />
            <h3 className="text-xl font-semibold">Leadership Bonus</h3>
            <p className="text-emerald-700 font-bold text-2xl">Up to ₦50,000</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse shadow rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-emerald-600 text-white">
                <th className="p-4 text-left">Level</th>
                <th className="p-4 text-left">Members</th>
                <th className="p-4 text-left">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={i} className="border-b bg-white">
                  <td className="p-4 font-semibold">{row.level}</td>
                  <td className="p-4">{row.members}</td>
                  <td className="p-4 text-emerald-700 font-bold">{row.earning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </section>
  );
}
