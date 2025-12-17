// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authService } from '../api/services';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        
        try {
            await authService.forgotPassword(email);
            setIsSuccess(true);
            setMessage(`If an account with ${email} exists, a password reset link has been sent to your email address.`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // 🛑 Full-screen wrapper for a standalone page
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8">
                
                <h1 className="text-3xl font-extrabold text-[--dark] mb-2">
                    Forgot Password?
                </h1>
                <p className="text-gray-600 mb-6">
                    Enter your email address below and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-md">
                            <p className="font-medium">{error}</p>
                        </div>
                    )}
                    {isSuccess ? (
                        <div className="p-4 bg-green-50 border-l-4 border-[--emerald] text-green-800 rounded-md">
                            <p className="font-medium">{message}</p>
                            <Link to="/login" className="text-[--emerald] hover:underline mt-2 inline-block text-sm">
                                Return to Login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <Mail size={18} />
                                </span>
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-[--emerald] focus:ring-1 focus:ring-[--emerald] outline-none transition disabled:bg-gray-100"
                                />
                            </div>
                            
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-3 text-white font-bold rounded-lg shadow-md transition-fast ${
                                    isLoading 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-[--emerald] hover:bg-green-700'
                                }`}
                            >
                                {isLoading ? 'Sending...' : 'SEND RESET LINK'}
                            </button>
                        </>
                    )}
                </form>

                <div className="mt-8 text-center">
                    <Link 
                        to="/login" 
                        className="text-sm font-medium text-gray-500 hover:text-[--dark] transition flex items-center justify-center"
                    >
                        <ArrowLeft size={16} className="mr-1" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}