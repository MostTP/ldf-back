// src/pages/Dashboard/MatrixView.jsx

import React, { useState } from 'react';
import { User, Maximize2, CheckCircle, Clock } from 'lucide-react';

// --- DUMMY DATA ---
// Matrix figures based on 5x5 structure (2^n) and project brief payout
const matrixData = {
    username: "sarahjmoney",
    totalDownline: 154,
    // Total spots in a 2x5 matrix: 2+4+8+16+32 = 62
    filledSpots: 28, 
    potentialEarning: 550000,
    matrixLevels: [
        { level: 1, required: 2, current: 2, status: 'Completed', bonus: 120 }, // ₦120 payout
        { level: 2, required: 4, current: 4, status: 'Completed', bonus: 100 }, // ₦100 payout
        { level: 3, required: 8, current: 8, status: 'Completed', bonus: 60 },  // ₦60 payout
        { level: 4, required: 16, current: 10, status: 'In Progress', bonus: 100 }, // ₦100 payout
        { level: 5, required: 32, current: 4, status: 'Open', bonus: 120 }, // ₦120 payout
    ]
};

// --- MATRIX VIEW COMPONENT ---
export default function MatrixView() {

    // Helper function to render status icon
    const StatusIcon = ({ status }) => {
        if (status === 'Completed') return <CheckCircle size={20} className="text-[--emerald]" />;
        if (status === 'In Progress') return <Clock size={20} className="text-yellow-500" />;
        return <Maximize2 size={20} className="text-gray-400" />;
    };

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-[--dark]">My Team Matrix & Earnings Breakdown</h2>
            
            {/* --- A. Matrix Summary Card --- */}
            <div className="grid md:grid-cols-3 bg-white p-6 rounded-xl shadow-soft border border-gray-200 divide-x divide-gray-100">
                <SummaryStat title="Total Downline" value={matrixData.totalDownline} icon={User} color="text-indigo-600" />
                <SummaryStat title="Filled Spots Status" value={`${matrixData.filledSpots}/62`} icon={Maximize2} color="text-gray-600" />
                <SummaryStat title="Total Matrix Bonus" value={`₦${matrixData.potentialEarning.toLocaleString()}`} icon={CheckCircle} color="text-[--emerald]" />
            </div>

            {/* --- B. Level Breakdown Table --- */}
            <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-200">
                <h3 className="text-xl font-semibold text-[--dark] mb-4">Matrix Level Status</h3>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required Spots</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Fill</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bonus Per Spot</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {matrixData.matrixLevels.map((level) => (
                                <tr key={level.level} className={level.status === 'Completed' ? 'bg-green-50/50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[--dark]">Level {level.level}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{level.required}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{level.current}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 flex items-center">
                                        <StatusIcon status={level.status} />
                                        <span className="ml-2">{level.status}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[--emerald]">₦{level.bonus.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- C. Simple Downline Visualization (Placeholder) --- */}
            <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-200">
                <h3 className="text-xl font-semibold text-[--dark] mb-4">Team Visualization (L1 & L2)</h3>
                
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <MatrixNode name={matrixData.username} isYou={true} />
                    <div className="w-px h-6 bg-gray-400 my-2"></div>
                    
                    {/* Level 1 Downline */}
                    <div className="flex justify-center w-full space-x-8">
                        <MatrixNode name="Direct Member 1" level={1} />
                        <MatrixNode name="Direct Member 2" level={1} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- HELPER COMPONENTS ---
const SummaryStat = ({ title, value, icon: Icon, color }) => (
    <div className="p-4 text-center">
        <Icon size={28} className={`mx-auto mb-2 ${color}`} />
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-extrabold text-[--dark] mt-1">{value}</p>
    </div>
);

const MatrixNode = ({ name, isYou = false, level }) => (
    <div className={`flex flex-col items-center w-1/3`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold mb-1 ${
            isYou ? 'bg-[--emerald] border-4 border-green-200 shadow-lg' : 'bg-indigo-500 border-2 border-indigo-300'
        }`}>
            <User size={20} />
        </div>
        <p className={`text-xs font-semibold whitespace-nowrap ${isYou ? 'text-[--dark]' : 'text-gray-600'}`}>
            {name}
        </p>
        {level && <p className="text-xs text-gray-500">L{level}</p>}
    </div>
);