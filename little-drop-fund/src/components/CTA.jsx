// src/components/CTA.jsx
import useScrollAnimation from "../hooks/useScrollAnimation";

export default function CTA({ onOpenSignup }) {
  const ref = useScrollAnimation();

  return (
    <section 
      id="cta"
      ref={ref} 
      // Use the dark theme for high contrast before the footer
      className="animate-section py-20 bg-[--dark] text-white text-center"
    >
      <div className="max-w-4xl mx-auto px-6">

        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
          Start Your Journey Today
        </h2>

        <p className="text-lg opacity-80 mb-10 max-w-2xl mx-auto">
          Join thousands already building streams of income with Little Drop Fund.
          A one-time activation of ₦5,000 unlocks lifetime opportunities and product access.
        </p>

        <button
          onClick={onOpenSignup}
          className="px-10 py-4 bg-white text-[--emerald] font-bold rounded-lg shadow-xl shadow-green-500/20 text-xl hover:bg-gray-100 transition-fast"
        >
          Unlock Masterclass & Join Now (₦5,000)
        </button>
      </div>
    </section>
  );
}