// src/components/Disclaimer.jsx
import useScrollAnimation from "../hooks/useScrollAnimation";
import { AlertTriangle } from "lucide-react";

export default function Disclaimer() {
  const ref = useScrollAnimation();

  return (
    <section 
      id="disclaimer" 
      ref={ref} 
      className="animate-section py-16 px-6 bg-amber-50 border-t border-amber-200"
    >
      <div className="max-w-5xl mx-auto text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <AlertTriangle size={36} className="text-amber-600" />
          <h2 className="text-2xl md:text-3xl font-extrabold text-amber-700">
            Important Risk Disclaimer
          </h2>
        </div>

        <p className="text-amber-800 text-base leading-relaxed max-w-4xl mx-auto">
          Little Drop Fund is an **educational and community platform**, not an investment firm or financial institution. 
          It is **not a get-rich-quick scheme.** All potential rewards are generated from the activity and growth of the community, not passive financial investments. 
          <br /><br />
          **Active Earnings (Referrals/Matrix) are strictly performance-based** and depend on personal participation and team activity. Passive rewards (Global Dividend Pool) are variable and depend on the success and ROI of the community-managed ventures; therefore, payouts are not guaranteed. The optional Premium Investment Tier carries inherent risks, and past performance is not indicative of future results. Participate responsibly.
        </p>
      </div>
    </section>
  );
}