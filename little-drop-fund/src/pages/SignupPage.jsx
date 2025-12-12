// src/pages/SignupPage.jsx
import React from 'react';
import SignupForm from '../components/SignupForm'; // 🛑 NEW FORM COMPONENT
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SignupPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            
            {/* Back Button */}
            <button 
                onClick={() => navigate('/')} 
                className="absolute top-6 left-6 text-gray-600 hover:text-[--dark] flex items-center transition-fast"
            >
                <ArrowLeft className="w-5 h-5 mr-1" /> Back to Home
            </button>

            {/* Main Form Card Wrapper */}
            <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl p-8 md:p-10 border border-gray-100 mt-10 mb-6">
                
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-[--dark] mb-2">
                        LDF Registration
                    </h2>
                    <p className="text-gray-500 text-sm">
                        Create your account and unlock the starter kit.
                    </p>
                </div>

                <SignupForm /> 
                
            </div>
        </div>
    );
}