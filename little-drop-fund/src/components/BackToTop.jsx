import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop(){
  const [visible, setVisible] = useState(false);
  useEffect(()=> {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if(!visible) return null;
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed right-6 bottom-8 bg-emerald-600 text-white p-3 rounded-full back-to-top hover:scale-105 transition">
      <ArrowUp size={18}/>
    </button>
  );
}
