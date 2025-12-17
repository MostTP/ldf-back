// src/pages/AgentsPage.jsx
import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, User, Code } from 'lucide-react';

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
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M16 31C23.732 31 30 24.732 30 17C30 9.26801 23.732 3 16 3C8.26801 3 2 9.26801 2 17C2 19.5109 2.661 21.8674 3.81847 23.905L2 31L9.31486 29.3038C11.3014 30.3854 13.5789 31 16 31ZM16 28.8462C22.5425 28.8462 27.8462 23.5425 27.8462 17C27.8462 10.4576 22.5425 5.15385 16 5.15385C9.45755 5.15385 4.15385 10.4576 4.15385 17C4.15385 19.5261 4.9445 21.8675 6.29184 23.7902L5.23077 27.7692L9.27993 26.7569C11.1894 28.0746 13.5046 28.8462 16 28.8462Z" fill="#BFC8D0"></path> <path d="M28 16C28 22.6274 22.6274 28 16 28C13.4722 28 11.1269 27.2184 9.19266 25.8837L5.09091 26.9091L6.16576 22.8784C4.80092 20.9307 4 18.5589 4 16C4 9.37258 9.37258 4 16 4C22.6274 4 28 9.37258 28 16Z" fill="url(#paint0_linear_87_7264)"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M16 30C23.732 30 30 23.732 30 16C30 8.26801 23.732 2 16 2C8.26801 2 2 8.26801 2 16C2 18.5109 2.661 20.8674 3.81847 22.905L2 30L9.31486 28.3038C11.3014 29.3854 13.5789 30 16 30ZM16 27.8462C22.5425 27.8462 27.8462 22.5425 27.8462 16C27.8462 9.45755 22.5425 4.15385 16 4.15385C9.45755 4.15385 4.15385 9.45755 4.15385 16C4.15385 18.5261 4.9445 20.8675 6.29184 22.7902L5.23077 26.7692L9.27993 25.7569C11.1894 27.0746 13.5046 27.8462 16 27.8462Z" fill="white"></path> <path d="M12.5 9.49989C12.1672 8.83131 11.6565 8.8905 11.1407 8.8905C10.2188 8.8905 8.78125 9.99478 8.78125 12.05C8.78125 13.7343 9.52345 15.578 12.0244 18.3361C14.438 20.9979 17.6094 22.3748 20.2422 22.3279C22.875 22.2811 23.4167 20.0154 23.4167 19.2503C23.4167 18.9112 23.2062 18.742 23.0613 18.696C22.1641 18.2654 20.5093 17.4631 20.1328 17.3124C19.7563 17.1617 19.5597 17.3656 19.4375 17.4765C19.0961 17.8018 18.4193 18.7608 18.1875 18.9765C17.9558 19.1922 17.6103 19.083 17.4665 19.0015C16.9374 18.7892 15.5029 18.1511 14.3595 17.0426C12.9453 15.6718 12.8623 15.2001 12.5959 14.7803C12.3828 14.4444 12.5392 14.2384 12.6172 14.1483C12.9219 13.7968 13.3426 13.254 13.5313 12.9843C13.7199 12.7145 13.5702 12.305 13.4803 12.05C13.0938 10.953 12.7663 10.0347 12.5 9.49989Z" fill="white"></path> <defs> <linearGradient id="paint0_linear_87_7264" x1="26.5" y1="7" x2="4" y2="28" gradientUnits="userSpaceOnUse"> <stop stop-color="#5BD066"></stop> <stop offset="1" stop-color="#27B43E"></stop> </linearGradient> </defs> </g></svg>
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