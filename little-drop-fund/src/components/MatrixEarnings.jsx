import { Table } from "lucide-react";

export default function MatrixEarnings() {
  const levels = [
    { level: 1, people: 5, earning: "₦1,000" },
    { level: 2, people: 25, earning: "₦2,500" },
    { level: 3, people: 125, earning: "₦12,500" },
    { level: 4, people: 625, earning: "₦62,500" },
    { level: 5, people: 3125, earning: "₦312,500" },
  ];

  return (
    <section id="matrix" className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-emerald-700 mb-6">
          Matrix Earnings Breakdown
        </h2>

        <p className="text-gray-600 max-w-2xl mx-auto mb-10">
          Earn automatically as your matrix fills across five levels through team activity and referrals.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-xl shadow-md overflow-hidden">
            <thead className="bg-emerald-600 text-white">
              <tr>
                <th className="p-4 text-left">Level</th>
                <th className="p-4 text-left">People</th>
                <th className="p-4 text-left">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((row, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-semibold">{row.level}</td>
                  <td className="p-4">{row.people.toLocaleString()}</td>
                  <td className="p-4 text-emerald-700 font-semibold">{row.earning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
