// src/pages/AgentsPage.jsx
import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, User, Code } from 'lucide-react';
import whatsapp from '../assets/whatsapp.svg';

// =========================================================================
// MOCK DATA & HELPERS
// =========================================================================

// Mock data to simulate the API response from the backend
const mockAgents = [
    // phone number should include country code without '+', e.g., 23480...
    { id: 1, name: "Agent Daniel E.", city: "Abuja, FCT", phone: "2348012345678", email: "daniel@ldfagents.com", couponBalance: 15 },
    { id: 2, name: "Agent Funke T.", city: "Lagos, Island", phone: "2349019876543", email: "funke@ldfagents.com", couponBalance: 0 },
    { id: 3, name: "Agent Blessing E.", city: "Port Harcourt", phone: "2348123456789", email: "blessing@ldfagents.com", couponBalance: 7 },
    { id: 4, name: "Agent Michael O.", city: "Kano", phone: "2347066667777", email: "michael@ldfagents.com", couponBalance: 22 },
];

// Helper component for the WhatsApp link button
const WhatsAppButton = ({ phone }) => {
    const whatsappLink = `https://wa.me/${phone}?text=Hello%2C%20I%20need%20to%20purchase%20a%20Little%20Drop%20Fund%20Activation%20Coupon%20Code.`;

    return (
        <a 
            href={whatsappLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center justify-center p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition shadow-md"
            aria-label={`Chat with agent on WhatsApp: ${phone}`}
        >
            <img src={whatsapp} alt="WhatsApp" className="h-4 md:h-5 w-auto"/>
        </a>
    );
};

// Function to determine the visual style of the balance tag
const getBalanceStyle = (balance) => {
    if (balance > 10) return 'text-white bg-green-600';
    if (balance > 0) return 'text-white bg-yellow-600';
    return 'text-gray-600 bg-gray-200';
};

// =========================================================================
// MAIN COMPONENT
// =========================================================================

export default function AgentsPage() {
    const [agents, setAgents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Simulate fetching data from the API
    useEffect(() => {
        
        setTimeout(() => {
            // Sort by highest balance first
            const sortedAgents = mockAgents.sort((a, b) => b.couponBalance - a.couponBalance);
            setAgents(sortedAgents); 
            setIsLoading(false);
        }, 1000); 
    }, []);

    const availableAgents = agents.filter(agent => agent.couponBalance > 0);
    const outOfStockAgents = agents.filter(agent => agent.couponBalance === 0);

    if (isLoading) {
        return <div className="min-h-screen bg-gray-50 pt-20 flex justify-center items-center"><p className="text-xl text-gray-600">Loading authorized agents...</p></div>;
    }

    if (error) {
        return <div className="min-h-screen bg-gray-50 pt-20 flex justify-center items-center"><p className="text-xl text-red-600">Error loading agent list. Please check your connection.</p></div>;
    }

    return (
 <div className="min-h-screen bg-gray-50 pt-20 px-4 sm:px-6 lg:px-8"> 
 <div className="max-w-4xl mx-auto py-12">
 <div className="text-center mb-12">
 <h1 className="text-4xl font-extrabold text-[--dark] mb-3">
 Official Coupon Code Agents List
 </h1>
 <p className="text-lg text-gray-600 max-w-2xl mx-auto">
 Connect with one of our trusted agents below to securely purchase your LDF Activation Coupon Code (₦3,000). Agents are sorted by stock level.
 </p>
                    <p className="mt-2 text-sm text-red-500 font-medium">
                        **Important:** Agents showing "Out of Stock" cannot provide codes. Please contact an available agent.
                    </p>
 </div>

 {/* Agent Cards (Dynamic Content) */}
 <div className="space-y-6">
                    
                    {/* Render Available Agents */}
                    {availableAgents.map((agent) => (
                        <div 
                            key={agent.id} 
                            className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-t-[--emerald] flex flex-col md:flex-row justify-between items-start md:items-center"
                        >
                            {/* Left Side: Agent Details */}
                            <div className="mb-4 md:mb-0">
                                <h2 className="text-xl font-bold text-[--emerald] mb-1">{agent.name}</h2>
                                <p className="text-gray-700 mb-2">Official LDF Distributor - {agent.city}</p>
                                <div className="flex flex-wrap items-center space-x-4 text-sm">
                                    <a href={`tel:${agent.phone}`} className="flex items-center text-gray-600 hover:text-blue-500 transition">
                                        <Phone size={16} className="mr-2 text-blue-500" /> {agent.phone}
                                    </a>
                                    <a href={`mailto:${agent.email}`} className="flex items-center text-gray-600 hover:text-red-500 transition">
                                        <Mail size={16} className="mr-2 text-red-500" /> {agent.email}
                                    </a>
                                    <span className="flex items-center text-gray-600">
                                        <MapPin size={16} className="mr-2 text-gray-500" /> {agent.city}
                                    </span>
                                </div>
                            </div>

                            {/* Right Side: Wallet Balance & WhatsApp */}
                            <div className="flex items-center space-x-4">
                                <span className={`px-4 py-2 text-sm font-bold rounded-full ${getBalanceStyle(agent.couponBalance)} flex items-center`}>
                                    <Code size={16} className="mr-2" />
                                    Stock: {agent.couponBalance}
                                </span>
                                <WhatsAppButton phone={agent.phone} />
                            </div>
                        </div>
                    ))}

                    {/* Render Out of Stock Agents */}
                    {outOfStockAgents.map((agent) => (
                        <div 
                            key={agent.id} 
                            className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-t-gray-400 opacity-60 flex flex-col md:flex-row justify-between items-start md:items-center"
                        >
                            {/* Left Side: Agent Details */}
                            <div className="mb-4 md:mb-0">
                                <h2 className="text-xl font-bold text-[--dark] mb-1">{agent.name}</h2>
                                <p className="text-gray-700 mb-2">Official LDF Distributor - {agent.city}</p>
                                <div className="flex flex-wrap items-center space-x-4 text-sm">
                                    <span className="flex items-center text-gray-600">
                                        <Phone size={16} className="mr-2 text-blue-500" /> {agent.phone}
                                    </span>
                                    <span className="flex items-center text-gray-600">
                                        <Mail size={16} className="mr-2 text-red-500" /> {agent.email}
                                    </span>
                                    <span className="flex items-center text-gray-600">
                                        <MapPin size={16} className="mr-2 text-gray-500" /> {agent.city}
                                    </span>
                                </div>
                            </div>

                            {/* Right Side: Wallet Balance & WhatsApp */}
                            <div className="flex items-center space-x-4">
                                <span className={`px-4 py-2 text-sm font-bold rounded-full ${getBalanceStyle(agent.couponBalance)}`}>
                                    Out of Stock
                                </span>
                                <WhatsAppButton phone={agent.phone} />
                            </div>
                        </div>
                    ))}
                    
                    {/* Fallback for no agents */}
                    {agents.length === 0 && !isLoading && (
                        <div className="text-center p-10 bg-blue-50 rounded-lg">
                            <p className="text-xl font-semibold text-blue-700">No Agents Currently Available</p>
                            <p className="text-gray-600 mt-2">Please check back later or contact support.</p>
                        </div>
                    )}

 </div>

<div className="mt-12 p-6 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg text-center">
 <p className="font-medium">
 <span className="font-bold">Important:</span> Only purchase codes from agents listed on this official page.
 </p>
 </div>
 </div>
 </div>
 );
}