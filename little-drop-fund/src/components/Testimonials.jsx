// src/components/Testimonials.jsx
import useScrollAnimation from "../hooks/useScrollAnimation";
import { Quote } from "lucide-react";
import SectionCard from './SectionCard'; 

export default function Testimonials() {
 // Assuming useScrollAnimation hook is available and working
 const ref = useScrollAnimation ? useScrollAnimation() : null; 

 const quotes = [
 {
 quote: "The Masterclass alone is worth the ₦5,000. The earning potential is just a huge bonus.",
 name: "Aisha M.",
 location: "Lagos, NG",
 initial: "A",
 bgColor: "bg-gray-200"
 },
 {
 quote: "I didn't recruit anyone my first month and was amazed to receive the Global Pool payout.",
 name: "Tunde O.",
 location: "Abuja, NG",
 initial: "T",
 bgColor: "bg-amber-100" // Subtle use of amber/gold
 },
 {
 quote: "The Masterclass is worth more than the #5,000. The earning potential is just a huge bonus.",
 name: "Nkechi P.",
 location: "Port Harcourt, NG",
 initial: "N",
 bgColor: "bg-[--emerald]/10" // Subtle use of emerald
 },
 ];

 return (
 <section id="testimonials" ref={ref} className="animate-section py-20 px-6 bg-white">
 <div className="max-w-6xl mx-auto text-center">
 <h2 className="text-3xl md:text-4xl font-extrabold text-[--dark] mb-12">
 Impactful Quotes
 </h2>

 <div className="grid md:grid-cols-3 gap-8">
 {quotes.map((q, index) => (
 <SectionCard 
 key={index}
 className="p-8 text-left h-full flex flex-col" // Added flex-col for flex-grow to work
 borderEmphasis="left" // Correctly pass attributes
 > {/* 🛑 FIX: SectionCard is opened here */}
 <Quote size={24} className="text-[--emerald] mb-3" /> {/* 🛑 FIX: Quote component correctly rendered */}
 
 <p className="text-gray-700 italic mb-6 leading-relaxed flex-grow">
 "{q.quote}"
 </p>
 
<div className="flex items-center space-x-4 mt-auto"> 
 {/* Initial Avatar (Retained custom colors) */}
 <div className={`w-10 h-10 flex items-center justify-center rounded-full text-lg font-bold text-[--dark] ${q.bgColor}`}>
 {q.initial}
 </div>

 {/* Name and Location */}
 <div>
 <h4 className="font-semibold text-[--dark]">{q.name}</h4>
 <p className="text-sm text-gray-500">{q.location}</p>
 </div>
 </div>
 </SectionCard>
 ))}
 </div>
</div>
 </section>
);
}