// src/components/Streams.jsx

import React from 'react';
import StepCard from './StepCard'; // Import the helper component

export default function GrowthStreams() {
  const stepsData = [
    {
      number: 1,
      title: 'Register & Unlock',
      description: 'Register and unlock the LDF Financial Freedom Starter Kit (Masterclass) for just ₦3,000.',
      value: 'Value: Stock Market Investing Guide',
    },
    {
      number: 2,
      title: 'Activate Account',
      description: 'Activate your account securely using a unique coupon code provided by your sponsor or the platform.',
      value: '', // No value text for this step
    },
    {
      number: 3,
      title: 'Engage',
      description: 'Choose to be a Team Builder (₦1,000 instant referral bonus) or an Active Learner (eligible for Global Pool).',
      value: '', // No value text for this step
    },
    {
      number: 4,
      title: 'Earn & Grow',
      description: 'Earn through direct referrals, matrix level bonuses, Global Pool dividends, or Premium Investment ROI.',
      value: '', // No value text for this step
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Main Title */}
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-[--dark] mb-12">
          4 Simple Steps to Financial Growth
        </h2>
        
        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stepsData.map((step) => (
            <StepCard
              key={step.number}
              number={step.number}
              title={step.title}
              description={step.description}
              value={step.value}
            />
          ))}
        </div>
        
      </div>
    </section>
  );
}