// src/components/Features.jsx
import useScrollAnimation from "../hooks/useScrollAnimation";
import { CheckCircle } from 'lucide-react'; 

// 🛑 Separating the data for unique layout treatment
const CORE_FEATURES = [
 { 
 title: "Real Product Value", 
 description: "Low ₦3,000 entry cost includes high-value, actionable Stock Market Investing Masterclass content.", 
 },
 { 
 title: "Sustainable Earnings", 
 description: "Income is supported by affiliate sales and ROI from community-managed ventures, not just recruitment fees.",
 },
 { 
 title: "Safety Net Payout", 
 description: "Provides a variable monthly dividend (₦1,250 – ₦3,500) for members who have not yet earned actively.", 
 },
 { 
 title: "Automated Matrix", 
 description: "Earn up to 5 levels deep from team growth with an overflow (spillover) system to benefit passive learners.",
 },
];

const PREMIUM_ROI_FEATURE = {
    title: "Optional Premium ROI",
    description: "Opportunity for members to invest separately (min. ₦10,000) for high-yield, proportional returns from LDF Capital Pool.", 
};


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
 Key Features & Value Proposition
 </h2>
 
 {/* Main Grid Container */}
 <div className="grid md:grid-cols-2 gap-8">
 
 {/* 1. RENDER CORE FEATURES (Takes 4 slots, 2x2 grid) */}
 {CORE_FEATURES.map((feature, index) => (
 <FeatureCard key={index} {...feature} />
 ))}

 {/* 2. RENDER PREMIUM ROI (Spans both columns) */}
          <div className="md:col-span-2"> 
 <FeatureCard {...PREMIUM_ROI_FEATURE} />
 </div>
 </div>
 </div>
 </section>
 );
}