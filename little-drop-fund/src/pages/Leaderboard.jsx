import { useNavigate } from "react-router-dom";


export default function Leaderboard() {
  const navigate = useNavigate();
  
  return (
    <section className="min-h-screen bg-[--dark] text-white px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">
          Top Earners Leaderboard
        </h1>

        <p className="text-gray-400 mb-10">
          See the highest earners in the Little Drop Fund community.
        </p>

        {/* Placeholder for leaderboard table */}
        <div className="bg-gray-900 rounded-xl p-6">
          <p className="text-gray-400 text-center">
            Leaderboard data coming soon...
          </p>
        </div>

        {/* Back to Home button */}
      <button
        onClick={() => navigate("/")} // <- goes back to home
        className="px-6 py-3 bg-[--emerald] text-white font-bold rounded-lg hover:opacity-90 transition"
      >
        ← Back to Home
      </button>

      </div>
    </section>
  );
}
