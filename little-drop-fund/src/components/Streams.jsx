// src/components/Streams.jsx (Refactored for Uniformity)
import React from 'react';
import SectionCard from './SectionCard'; // 🛑 NEW IMPORT for uniform styling
import { DollarSign, CheckSquare, Zap, TrendingUp, Users } from 'lucide-react'; 

// Define the StepCard component here, using SectionCard for styling
const StepCard = ({ number, title, description, value, icon, color }) => (
    // Use SectionCard for the uniform look (shadow, rounded corners, white background)
    <SectionCard 
        className="p-6 text-left h-full flex flex-col hover:transform hover:scale-[1.02] duration-300" 
        borderEmphasis="left" // Consistent left border for flair
    >
        <div className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold mb-4 shrink-0 ${color}`}>
            {icon}
        </div>
        <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Step {number}</p>
        <h3 className="text-xl font-bold text-[--dark] mb-3">{title}</h3>
        <p className="text-gray-600 mb-4 flex-grow text-sm">{description}</p>
        
        {value && (
            <p className="mt-auto text-xs font-medium text-[--emerald] border-t pt-3 border-gray-100 italic">
                {value}
            </p>
        )}
    </SectionCard>
);

export default function GrowthStreams() {
 const stepsData = [
 {
 number: 1,
 title: 'Register & Unlock',
 description: 'Register and unlock the LDF Financial Freedom Starter Kit (Masterclass) for just ₦5,000.',
 value: 'Value: Premium Advance Courses and Income Generator Portal',
      icon: <CheckSquare size={20} />,
      color: 'bg-blue-600',
 },
 {
 number: 2,
 title: 'Activate Account',
 description: 'Activate your account securely using a unique coupon code provided by your sponsor or the platform.',
 value: '100% Secure Activation', 
      icon: <Zap size={20} />,
      color: 'bg-red-600',
 },
 {
 number: 3,
 title: 'Engage & Share',
 description: 'Choose to be a Community Builder (₦2,500 instant Affiliate Income) or an Active Learner (eligible for Global Pool).',
 value: 'Choose Your Income Path',
      icon: <Users size={20} />,
      color: 'bg-yellow-600',
},
 {
 number: 4,
 title: 'Earn & Grow',
 description: 'Earn through AFFILIATE ICOME, Global Pool dividends and other source of income on this learning platform',
 value: 'Multiple Income Streams',
      icon: <DollarSign size={20} />,
      color: 'bg-[--emerald]',
 },
 ];

 return (
 <section id="how-it-works" className="py-16 md:py-24 bg-gray-50">
 <div className="max-w-6xl mx-auto px-6">

 {/* Main Title */}
 <h2 className="text-3xl md:text-4xl font-extrabold text-center text-[--dark] mb-12">
 4 Simple Steps to Financial Growth
 </h2>
 
 {/* Steps Grid: Now using consistent gap-8 */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
 {stepsData.map((step) => (
 <StepCard
 key={step.number}
 {...step}
 />
 ))}
 </div>
 
 </div>
 </section>
 );
}