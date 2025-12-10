// src/pages/Dashboard/MasterclassAccess.jsx
import React, { useState } from 'react';
import { BookOpen, PlayCircle, FileText, CheckCircle, Clock } from 'lucide-react';

// --- 1. DUMMY DATA ---
const masterclassModules = [
    { 
        id: 1, 
        title: "Module 1: Foundations of Financial Freedom", 
        duration: "15 min", 
        type: "Video", 
        completed: true, 
        content: "Welcome to the Masterclass! This module covers budgeting, debt management, and setting realistic financial goals."
    },
    { 
        id: 2, 
        title: "Module 2: Understanding Compound Growth", 
        duration: "22 min", 
        type: "Video", 
        completed: true, 
        content: "Learn how the magic of compounding works, essential for long-term wealth creation. Includes interactive calculator demo."
    },
    { 
        id: 3, 
        title: "Module 3: Introduction to Investment Vehicles", 
        duration: "30 min", 
        type: "Video", 
        completed: false, 
        content: "A detailed look at stocks, bonds, mutual funds, and real estate. Which option is right for you?"
    },
    { 
        id: 4, 
        title: "Module 4: Risk Management & Diversification", 
        duration: "18 min", 
        type: "Document", 
        completed: false, 
        content: "A downloadable PDF guide on minimizing risk and building a truly diversified portfolio."
    },
    { 
        id: 5, 
        title: "Bonus: Q&A Session Recording (2025)", 
        duration: "60 min", 
        type: "Video", 
        completed: false, 
        content: "Access the recording of our live Q&A session covering common challenges and strategies."
    },
];

// --- 2. MASTERCLASS COMPONENT ---
export default function MasterClassAccess() {
    const [selectedModule, setSelectedModule] = useState(masterclassModules[0]);

    const totalModules = masterclassModules.length;
    const completedModules = masterclassModules.filter(m => m.completed).length;
    const completionPercentage = Math.round((completedModules / totalModules) * 100);

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-[--dark]">LDF Digital Masterclass Portal</h2>
            
            {/* Progress Bar */}
            <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-semibold text-[--dark]">Your Progress</h3>
                    <span className="text-2xl font-bold text-[--emerald]">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                        className="bg-[--emerald] h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${completionPercentage}%` }}
                    ></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">{completedModules} of {totalModules} modules completed.</p>
            </div>

            {/* Layout: Sidebar (Modules) and Main Content (Player) */}
            <div className="grid lg:grid-cols-3 gap-8">
                
                {/* Module List (Sidebar) */}
                <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-soft border border-gray-200 h-fit max-h-[70vh] overflow-y-auto">
                    <h4 className="text-lg font-bold text-[--dark] mb-3">Course Modules</h4>
                    
                    {masterclassModules.map((module) => (
                        <ModuleItem 
                            key={module.id} 
                            module={module} 
                            isSelected={module.id === selectedModule.id}
                            onClick={() => setSelectedModule(module)}
                        />
                    ))}
                </div>

                {/* Content Player Area */}
                <div className="lg:col-span-2 space-y-6">
                    <ContentPlayer module={selectedModule} />
                </div>
            </div>
        </div>
    );
}

// --- 3. HELPER COMPONENTS ---

// Helper for the module list items
const ModuleItem = ({ module, isSelected, onClick }) => (
    <div
        onClick={onClick}
        className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors border-l-4 mb-2 
            ${isSelected 
                ? 'bg-green-50 border-l-[--emerald] shadow-sm' 
                : 'bg-white border-l-transparent hover:bg-gray-50'
            }`}
    >
        <div className="flex-shrink-0 mr-3">
            {module.type === 'Video' ? (
                <PlayCircle size={20} className={isSelected ? 'text-[--emerald]' : 'text-gray-500'} />
            ) : (
                <FileText size={20} className={isSelected ? 'text-[--emerald]' : 'text-gray-500'} />
            )}
        </div>
        <div className="flex-grow">
            <p className={`text-sm font-semibold ${isSelected ? 'text-[--dark]' : 'text-gray-700'}`}>
                {module.title}
            </p>
            <p className="text-xs text-gray-500">{module.duration}</p>
        </div>
        
        <div className="ml-2 flex-shrink-0">
            {module.completed ? (
                <CheckCircle size={18} className="text-[--emerald]" title="Completed" />
            ) : (
                <Clock size={18} className="text-gray-400" title="Incomplete" />
            )}
        </div>
    </div>
);

// Helper for the content display area
const ContentPlayer = ({ module }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-200">
            <h3 className="text-2xl font-bold text-[--dark] mb-4">{module.title}</h3>
            
            {/* Simulated Content Area (Video/PDF viewer) */}
            <div className="w-full bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center mb-6" style={{ height: '350px' }}>
                {module.type === 'Video' ? (
                    <div className="text-white text-lg flex flex-col items-center">
                        <PlayCircle size={48} className="text-white/80 mb-2" />
                        <span className="text-sm">Video Player Placeholder</span>
                        <span className="text-xs text-gray-400 mt-1">[{module.duration} content]</span>
                    </div>
                ) : (
                    <div className="text-white text-lg flex flex-col items-center">
                        <FileText size={48} className="text-white/80 mb-2" />
                        <span className="text-sm">PDF/Document Viewer Placeholder</span>
                        <a href="#" className="mt-3 px-4 py-2 bg-[--emerald] text-white rounded-md text-sm hover:bg-green-700">
                            Download Document
                        </a>
                    </div>
                )}
            </div>

            {/* Description / Summary */}
            <h4 className="text-xl font-semibold text-[--dark] mb-2">Module Summary</h4>
            <p className="text-gray-700">{module.content}</p>
        </div>
    );
};