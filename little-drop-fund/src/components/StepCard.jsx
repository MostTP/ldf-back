// src/components/StepCard.jsx
import React from 'react';

// Props:
// number: The step number (1, 2, 3, 4)
// title: The step title (e.g., "Register & Unlock")
// description: The main description text
// value: The small text at the bottom (e.g., "Value: Stock Market Investing Guide")
const StepCard = ({ number, title, description, value }) => {
  // Use a simple array to map the number to a Tailwind color (e.g., text-orange-500)
  const colorClasses = [
    'text-orange-500',
    'text-amber-500',
    'text-green-500',
    'text-emerald-500',
  ];
  const numberColor = colorClasses[number - 1] || 'text-gray-500';

  return (
    <div className="flex-1 min-w-[200px] p-6 bg-white border border-gray-100 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
      
      {/* Step Number */}
      <div className={`text-4xl font-extrabold mb-3 ${numberColor}`}>
        {number}.
      </div>

      {/* Title & Description */}
      <h3 className="text-xl font-bold text-[--dark] mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      
      {/* Value/Value-Add Text */}
      {value && (
        <div className="border-t border-gray-100 pt-3 mt-auto">
          <p className="text-xs text-gray-500 font-semibold">{value}</p>
        </div>
      )}
    </div>
  );
};

export default StepCard;