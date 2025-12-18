// src/pages/Dashboard/MatrixView.jsx

import React, { useState, useEffect } from 'react';
import { User, Maximize2, CheckCircle, Clock, Loader } from 'lucide-react';
import { matrixService } from '../../api/services';

// --- MATRIX VIEW COMPONENT ---
export default function MatrixView() {
    const [matrixData, setMatrixData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadMatrixData = async () => {
            try {
                const data = await matrixService.getMatrixData();
                setMatrixData(data);
            } catch (err) {
                setError(err.message || 'Failed to load matrix data');
            } finally {
                setLoading(false);
            }
        };

        loadMatrixData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader size={36} className="animate-spin text-[--emerald]" />
                <p className="ml-4 text-lg text-gray-600">Loading matrix data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-4xl mx-auto text-red-700 bg-red-100 border border-red-300 rounded-lg mt-10">
                <h2 className="text-xl font-bold mb-2">Error Loading Matrix</h2>
                <p>{error}</p>
            </div>
        );
    }

    // Default data structure if API returns different format
    const data = matrixData || {
        username: "user",
        totalDownline: 0,
        filledSpots: 0,
        potentialEarning: 0,
        matrixLevels: [],
        tree: null
    };

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
                <SummaryStat title="Total Downline" value={data.totalDownline} icon={User} color="text-indigo-600" />
                <SummaryStat title="Filled Spots Status" value={`${data.filledSpots}/62`} icon={Maximize2} color="text-gray-600" />
                <SummaryStat title="Total Matrix Bonus" value={`₦${data.potentialEarning.toLocaleString()}`} icon={CheckCircle} color="text-[--emerald]" />
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
                            {data.matrixLevels.map((level) => (
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
                    <MatrixNode name={data.username} isYou={true} />
                    <div className="w-px h-6 bg-gray-400 my-2"></div>
                    
                    {/* Level 1 Downline (from matrix tree) */}
                    <div className="flex justify-center w-full flex-wrap gap-6">
                        {(data.tree?.level1 || []).length === 0 ? (
                            <p className="text-sm text-gray-500">No direct team members yet. Your first two referrals will appear here.</p>
                        ) : (
                            data.tree.level1.map((member) => (
                                <div key={member.id} className="flex flex-col items-center">
                                    <MatrixNode name={member.displayName} level={1} />
                                    {/* Level 2 children for this member */}
                                    {member.children && member.children.length > 0 && (
                                        <div className="flex justify-center w-full mt-2 gap-4">
                                            {member.children.slice(0, 3).map((child) => (
                                                <MatrixNode
                                                    key={child.id}
                                                    name={child.displayName}
                                                    level={2}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
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