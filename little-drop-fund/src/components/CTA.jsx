export default function CTA({ openSignup }) {
  return (
    <section className="py-20 bg-emerald-700 text-white text-center">
      <div className="max-w-4xl mx-auto px-6">

        <h2 className="text-4xl font-extrabold mb-4">
          Start Your Journey Today
        </h2>

        <p className="text-lg opacity-90 mb-8">
          Join thousands already building streams of income with Little Drop Fund.
          A one-time activation can unlock lifetime opportunities.
        </p>

        <button
          onClick={openSignup}
          className="px-10 py-4 bg-white text-emerald-700 font-bold rounded-xl shadow-lg text-lg hover:bg-emerald-50 transition"
        >
          Join Now
        </button>
      </div>
    </section>
  );
}
