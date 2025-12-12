// src/pages/AgentsPage.jsx
import { Mail, Phone, MapPin } from 'lucide-react';

export default function AgentsPage() {
    return (
        // Added pt-20 to ensure content is below the fixed Navbar
        <div className="min-h-screen bg-gray-50 pt-20 px-4 sm:px-6 lg:px-8"> 
            <div className="max-w-4xl mx-auto py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-[--dark] mb-3">
                        Official Coupon Code Agents List
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Connect with one of our trusted agents below to securely purchase your LDF Activation Coupon Code (₦3,000).
                    </p>
                </div>

                {/* Agent Cards (Placeholder Content) */}
                <div className="space-y-6">
                    {/* Agent 1 */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-t-[--emerald]">
                        <h2 className="text-xl font-bold text-[--emerald] mb-1">Agent Daniel E.</h2>
                        <p className="text-gray-700 mb-4">Official LDF Distributor - Abuja, FCT</p>
                        <div className="flex items-center space-x-6 text-sm">
                            <span className="flex items-center text-gray-600"><Phone size={16} className="mr-2 text-blue-500" /> +234 801 234 5678</span>
                            <span className="flex items-center text-gray-600"><Mail size={16} className="mr-2 text-red-500" /> daniel@ldfagents.com</span>
                            <span className="flex items-center text-gray-600"><MapPin size={16} className="mr-2 text-gray-500" /> Available Online</span>
                        </div>
                    </div>

                    {/* Agent 2 */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-t-gray-400">
                        <h2 className="text-xl font-bold text-[--dark] mb-1">Agent Funke T.</h2>
                        <p className="text-gray-700 mb-4">Certified Enrollment Partner - Lagos, Island</p>
                        <div className="flex items-center space-x-6 text-sm">
                            <span className="flex items-center text-gray-600"><Phone size={16} className="mr-2 text-blue-500" /> +234 901 987 6543</span>
                            <span className="flex items-center text-gray-600"><Mail size={16} className="mr-2 text-red-500" /> funke@ldfagents.com</span>
                            <span className="flex items-center text-gray-600"><MapPin size={16} className="mr-2 text-gray-500" /> Office Hours: M-F, 9am-4pm</span>
                        </div>
                    </div>
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