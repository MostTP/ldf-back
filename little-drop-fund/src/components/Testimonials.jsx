import { useEffect, useState, useRef } from "react";
import useScrollAnimation from "../hooks/useScrollAnimation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Testimonials(){
  const ref = useScrollAnimation();
  const slides = [
    { name: "Grace A.", text: "Before LDF, I struggled with financial planning. Now I earn monthly." },
    { name: "Samuel O.", text: "The matrix passive earnings surprised me — steady payouts each week." },
    { name: "Bisi Taiwo", text: "Referral rewards covered my activation fee within days." }
  ];

  const [index, setIndex] = useState(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    timeoutRef.current = setInterval(() => setIndex(i => (i+1)%slides.length), 5000);
    return () => clearInterval(timeoutRef.current);
  }, []);

  return (
    <section id="testimonials" ref={ref} className="animate-section py-20 px-6 bg-emerald-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-emerald-700 mb-8">What Members Say</h2>

        <div className="relative overflow-hidden rounded-xl">
          <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${index * 100}%)` }}>
            {slides.map((s,i)=>(
              <div key={i} className="min-w-full p-8 bg-white border border-gray-100">
                <p className="text-gray-700 italic mb-6">“{s.text}”</p>
                <div className="font-semibold">{s.name}</div>
              </div>
            ))}
          </div>

          <button onClick={() => setIndex((i)=> (i-1+slides.length)%slides.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow">
            <ChevronLeft size={18}/>
          </button>
          <button onClick={() => setIndex((i)=> (i+1)%slides.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow">
            <ChevronRight size={18}/>
          </button>

          <div className="flex justify-center gap-2 mt-4">
            {slides.map((_,i)=> <button key={i} onClick={() => setIndex(i)} className={`w-3 h-3 rounded-full ${i===index? 'bg-emerald-700':'bg-gray-300'}`}/>)}
          </div>
        </div>
      </div>
    </section>
  );
}
