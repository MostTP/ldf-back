import React, { useState } from 'react';
import { BookOpen, PlayCircle, FileText, CheckCircle, Clock, Lock, Send, AlertTriangle } from 'lucide-react';

// --- 1. UPDATED DATA WITH TELEGRAM LINKS ---
const masterclassModules = [
    { 
        id: 1, 
        title: "Course 1: Foundations of Financial Freedom", 
        duration: "Month 1", 
        type: "Video", 
        completed: true, 
        monthRequired: 1,
        telegramLink: "https://t.me/+YOUR_MONTH_1_LINK",
        content: "Welcome! Access your first month of training directly on our private Telegram channel for secure viewing."
    },
    { 
        id: 2, 
        title: "Course 2: Advanced Growth Strategies", 
        duration: "Month 2", 
        type: "Video", 
        completed: false, 
        monthRequired: 2,
        telegramLink: "https://t.me/+YOUR_MONTH_2_LINK",
        content: "Unlock deep-dive strategies into market analysis and compound growth once your second month begins."
    },
    { 
        id: 3, 
        title: "Course 3: Professional Investment", 
        duration: "Month 3", 
        type: "Video", 
        completed: false, 
        monthRequired: 3,
        telegramLink: "https://t.me/+YOUR_MONTH_3_LINK",
        content: "Detailed modules on institutional-grade investment vehicles and risk management."
    },
    { 
        id: 4, 
        title: "Course 4: Master Wealth Management", 
        duration: "Month 4", 
        type: "Video", 
        completed: false, 
        monthRequired: 4,
        telegramLink: "https://t.me/+YOUR_MONTH_4_LINK",
        content: "The final tier of the LDF Masterclass focusing on legacy building and tax-efficient wealth management."
    },
];

export default function MasterClassAccess() {
    // --- SIMULATED USER DATA ---
    // Change 'userSubscribedMonths' to 1, 2, 3, or 4 to test the unlocking logic
    const userSubscribedMonths = 1; 

    const [selectedModule, setSelectedModule] = useState(masterclassModules[0]);

    const totalModules = masterclassModules.length;
    // Progress based on month access rather than individual "completed" check
    const completionPercentage = Math.round((userSubscribedMonths / totalModules) * 100);

    return (
        <div className="space-y-8 max-w-6xl mx-auto p-4 md:p-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold text-[--dark]">Masterclass Portal</h2>
                <div className="bg-emerald-50 text-[--emerald] px-4 py-2 rounded-lg border border-emerald-100 flex items-center gap-2">
                    <CheckCircle size={18} />
                    <span className="font-bold text-sm">Active Subscription: Month {userSubscribedMonths}</span>
                </div>
            </div>
            
            {/* Progress Bar */}
            <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-[--dark]">Program Completion</h3>
                    <span className="text-xl font-bold text-[--emerald]">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div 
                        className="bg-[--emerald] h-3 rounded-full transition-all duration-700 ease-out" 
                        style={{ width: `${completionPercentage}%` }}
                    ></div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Module List (Sidebar) */}
                <div className="lg:col-span-1 space-y-3">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Curriculum</h4>
                    {masterclassModules.map((module) => (
                        <ModuleItem 
                            key={module.id} 
                            module={module} 
                            isUnlocked={userSubscribedMonths >= module.monthRequired}
                            isSelected={module.id === selectedModule.id}
                            onClick={() => setSelectedModule(module)}
                        />
                    ))}
                </div>

                {/* Content Player Area */}
                <div className="lg:col-span-2">
                    <ContentPlayer 
                        module={selectedModule} 
                        isUnlocked={userSubscribedMonths >= selectedModule.monthRequired}
                    />
                </div>
            </div>
        </div>
    );
}

// --- HELPER COMPONENTS ---

const ModuleItem = ({ module, isSelected, isUnlocked, onClick }) => (
    <div
        onClick={onClick}
        className={`flex items-center p-4 rounded-xl cursor-pointer transition-all border-2 mb-2 
            ${isSelected 
                ? 'bg-white border-[--emerald] shadow-md transform scale-[1.02]' 
                : 'bg-white border-transparent hover:bg-gray-50 opacity-90'
            } ${!isUnlocked && 'grayscale-[0.5] bg-gray-50'}`}
    >
        <div className="flex-shrink-0 mr-4">
            {!isUnlocked ? (
                <div className="bg-gray-200 p-2 rounded-lg text-gray-400">
                    <Lock size={20} />
                </div>
            ) : (
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-100 text-[--emerald]' : 'bg-gray-100 text-gray-500'}`}>
                    <PlayCircle size={20} />
                </div>
            )}
        </div>
        <div className="flex-grow">
            <p className={`text-sm font-bold ${isSelected ? 'text-[--dark]' : 'text-gray-600'}`}>
                {module.title}
            </p>
            <p className="text-xs text-gray-400 font-medium">{module.duration}</p>
        </div>
        {isUnlocked && <CheckCircle size={16} className="text-[--emerald] ml-2" />}
    </div>
);

const ContentPlayer = ({ module, isUnlocked }) => {
    return (
        <div className="bg-white p-8 rounded-2xl shadow-soft border border-gray-100">
            <h3 className="text-2xl font-black text-[--dark] mb-6">{module.title}</h3>
            
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gray-900 flex items-center justify-center mb-8 group">
                {!isUnlocked ? (
                    <div className="text-center px-6">
                        <div className="bg-white/10 p-4 rounded-full inline-block mb-4 backdrop-blur-md">
                            <Lock size={40} className="text-white" />
                        </div>
                        <h4 className="text-white font-bold text-lg">Content Locked</h4>
                        <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">
                            This course unlocks automatically after your Month {module.monthRequired} subscription renewal.
                        </p>
                    </div>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-[--emerald] rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                            <Send size={32} className="text-white ml-1" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-white font-bold text-xl tracking-tight">Access Course on Telegram</p>
                            <a 
                                href={module.telegramLink} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-block px-8 py-3 bg-[--emerald] text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg"
                            >
                                Join Private Channel
                            </a>
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t border-gray-100 pt-6">
                <h4 className="text-lg font-bold text-[--dark] mb-2 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-500" />
                    Security Notice
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                    Our masterclass videos are delivered via Telegram Private Channels to ensure high-speed streaming and content protection. 
                    {isUnlocked 
                        ? " Please do not share your unique invite link. Our system monitors member lists daily to match them with active subscriptions." 
                        : " Once you renew your subscription for the required period, a unique entry link will appear above."}
                </p>
            </div>
        </div>
    );
};