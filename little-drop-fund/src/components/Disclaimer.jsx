import { AlertTriangle } from "lucide-react";

export default function Disclaimer() {
  return (
    <section id="disclaimer" className="py-20 px-6 bg-amber-50 border-t border-amber-200">
      <div className="max-w-5xl mx-auto text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
          <AlertTriangle size={32} className="text-amber-700" />
          <h2 className="text-2xl md:text-3xl font-bold text-amber-800">
            Important Disclaimer
          </h2>
        </div>

        <p className="text-amber-800 text-lg leading-relaxed">
          Little Drop Fund is not an investment platform or financial institution. 
          All rewards are generated from the activity of the community. 
          No guarantees of income are made.  
          Earnings depend solely on participation and team activity.
        </p>
      </div>
    </section>
  );
}
