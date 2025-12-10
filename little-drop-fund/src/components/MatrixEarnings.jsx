// src/components/MatrixEarnings.jsx
import React from 'react';

const MatrixTable = () => {
  const levels = ['L1', 'L2', 'L3', 'L4', 'L5'];
  // Assuming a consistent ₦500 total matrix payout for the 5 levels
  const payouts = ['₦150', '₦120', '₦60', '₦120', '₦50']; // Adjusted L5 to ₦50 to total ₦500

  return (
    <div className="flex-1 min-w-[300px]">
      <div className="text-lg font-bold text-[var(--emerald)]">
        5 Levels <span className="text-gray-500 font-normal text-sm">/ Deep</span>
      </div>
      <div className="text-gray-700 mb-3">Matrix Income (₦500 Total)</div>

      {/* Styled Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Header Row */}
        <div className="flex justify-around bg-gray-100 font-bold py-3 text-sm text-[var(--dark)]">
          {levels.map(level => <div key={level} className="w-1/5 text-center">LEVEL {level}</div>)}
        </div>
        {/* Payout Row */}
        <div className="flex justify-around bg-white py-3 text-sm text-gray-700">
          {payouts.map((payout, index) => <div key={index} className="w-1/5 text-center text-[var(--emerald)] font-medium">{payout}</div>)}
        </div>
      </div>
    </div>
  );
};

export default function MatrixEarnings() {
  return (
    <section id="matrix-earnings" className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6">
        
        <div className="bg-white rounded-xl border-l-4 border-l-[var(--emerald)] shadow-soft p-8">
          <h3 className="text-center text-xl font-bold p-3 mb-6 bg-[var(--emerald)] text-white rounded-md shadow-md">
            A. Active Income (Affiliate & Team Growth)
          </h3>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Direct Referral Bonus */}
            <div className="md:border-r border-gray-200 md:pr-8 pb-4 md:pb-0 flex-1">
              <div className="text-4xl font-extrabold text-[--emerald] leading-snug">
                ₦1,000 
                <span className="text-lg text-gray-500 font-medium ml-2">/ Referral</span>
              </div>
              <h4 className="text-lg font-bold text-[--dark] mt-1 mb-3">Direct Referral Bonus</h4>
              <p className="text-gray-600 text-sm">
                Paid instantly for every person who purchases the LDF Starter Kit through your unique link.
              </p>
            </div>
            
            {/* Matrix Table */}
            <MatrixTable />
          </div>
        </div>
      </div>
    </section>
  );
}