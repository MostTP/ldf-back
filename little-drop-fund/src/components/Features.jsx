// src/components/Features.jsx
import useScrollAnimation from "../hooks/useScrollAnimation";
import { CheckCircle } from 'lucide-react'; 

// 🛑 Separating the data for unique layout treatment
const CORE_FEATURES = [
 { 
 title: "Real Product Value", 
 description: "Low ₦5,000 entry cost includes high-value, actionable Masterclass content.", 
 },
 { 
 title: "Sustainable Earnings", 
 description: "Income is supported by affiliate sales and monthly subscription not just recruitment fees",
 },
 { 
 title: "Safety Net Payout", 
 description: "Provides a variable monthly dividend (₦3,000 – ₦10,000) for members who have not emjoyed the benefits of partnership.", 
 },
 { 
 
 description: "... and many more to unveil",
 },
];


// Updated FeatureCard remains the same
const FeatureCard = ({ title, description }) => (
 <div className="p-6 rounded-xl bg-white shadow-soft transition-fast hover:shadow-lg text-left border border-gray-100">
 <div className="flex items-center mb-2">
 <CheckCircle className="text-[--gold] shrink-0 w-6 h-6" /> 
 <h3 className="ml-2 text-lg font-semibold text-[--dark]">{title}</h3> 
 </div>
 <p className="text-gray-600 text-sm pl-8 leading-relaxed">{description}</p> 
 </div>
);

export default function Features() {
 const ref = useScrollAnimation(); 
 return (
 <section id="features" ref={ref} className="animate-section py-20 px-6 bg-white">
 <div className="max-w-7xl mx-auto text-center">
 <h2 className="text-3xl md:text-4xl font-extrabold text-[--dark] mb-12">
 These are the features below but not limited to
 </h2>
 
 {/* Main Grid Container */}
 <div className="grid md:grid-cols-2 gap-8">
 
 {/* 1. RENDER CORE FEATURES (Takes 4 slots, 2x2 grid) */}
 {CORE_FEATURES.map((feature, index) => (
 <FeatureCard key={index} {...feature} />
 ))}

 {/* 2. RENDER PREMIUM ROI (Spans both columns) */}
 <div className="md:col-span-2"> 
 </div>
 </div>
 </div>
 </section>
 );
}