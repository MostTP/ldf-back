import useScrollAnimation from "../hooks/useScrollAnimation";

export default function JoinNow() {
  const ref = useScrollAnimation();

  return (
    <section id="join" ref={ref} className="animate-section py-20 px-6 bg-neutral-950">
      <div className="max-w-4xl mx-auto text-center">

        <h2 className="text-3xl md:text-4xl font-extrabold text-yellow-400">
          Get Started Today
        </h2>

        <p className="text-gray-300 mt-3">
          Activate your account with ₦3,000 and start earning immediately.
        </p>

        <a href="/signup">
          <button className="mt-8 bg-yellow-400 text-black font-bold px-14 py-4 rounded-xl text-lg hover:bg-yellow-500 transition">
            Join Now
          </button>
        </a>

      </div>
    </section>
  );
}
