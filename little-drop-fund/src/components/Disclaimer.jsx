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
      <div className="max-w-4xl mx-auto text-center">

        <div className="flex items-center justify-center mb-4">
          <AlertTriangle className="w-10 h-10 text-amber-600" />
        </div>

        <h2 className="text-3xl font-bold text-amber-700 mb-4">
          Important Disclaimer
        </h2>

        <p className="text-gray-700 leading-relaxed text-lg">
          Little Drop Fund is a community-powered platform where member
          activities determine earnings. No guaranteed income is promised, and
          all contributions are voluntary. Always participate responsibly and
          understand that your earnings depend on your effort, referrals, and
          community growth.
        </p>

        <p className="text-gray-600 mt-4 italic">
          By signing up, you acknowledge that you have read and agree to our
          Terms & Conditions and Privacy Policy.
        </p>
      </div>
    </section>
  );
}
