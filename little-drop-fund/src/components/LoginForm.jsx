// src/components/LoginForm.jsx
import { useState } from "react";
import { Lock, User, CheckCircle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../api/services";
import { setAuth } from "../utils/auth";

// =========================================================================
// 1. HELPER COMPONENT (Reusing the InputField style from SignupForm)
// =========================================================================

// Helper component for styled input fields (Must match style of SignupForm)
const InputField = ({ icon, placeholder, name, type = 'text', required = false, onChange, value }) => (
 <div>
 <div className="relative">
 <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">{icon}</span>
 <input
 type={type}
 name={name}
 placeholder={placeholder}
 required={required}
 onChange={onChange} 
 value={value} 
 className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-[--emerald] focus:ring-1 focus:ring-[--emerald] outline-none transition"
 />
 </div>
 </div>
);

// =========================================================================
// 2. MAIN LOGIN FORM LOGIC
// =========================================================================

export default function LoginForm({ onLoginSuccess }) {
 const navigate = useNavigate();
 const [formData, setFormData] = useState({ username: '', password: '' }); 
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState(null); 
 const [success, setSuccess] = useState(false);

 const handleInputChange = (e) => {
 const { name, value } = e.target;
 setFormData({ ...formData, [name]: value });
 };

 const handleSubmit = async (e) => { 
 e.preventDefault();
 setError(null);
 
 // Simple validation
 if (!formData.username || !formData.password) {
 setError("Please enter both username/email and password.");
 return;
 }

try {
setIsLoading(true);

// Real API call
const response = await authService.login(formData.username, formData.password);
const token = response.token;

if (token && response.success && response.user) {
// Store token and user data
setAuth(token, response.user);
setSuccess(true);

// Navigate to the main protected application hub
setTimeout(() => navigate('/app'), 1500);

} else {
// Handle case where API succeeds but no token is returned
setError(response.message || 'Login failed. Please try again.');
}

 } catch (err) {
 console.error("Login Failed:", err);
 
 // Use the error message from the backend if available
 const errorMessage = err.response 
 ? err.response.data.message || 'Invalid credentials or service unavailable.' 
 : 'Network error or service unavailable.';
 
 setError(errorMessage);

 } finally {
 setIsLoading(false); 
 }
 };

 return (
 <>
 {success ? (
 <div className="text-center py-10 flex flex-col items-center">
 <CheckCircle className="w-12 h-12 text-[--emerald] mb-3" />
 <h3 className="text-2xl font-bold text-[--emerald]">Welcome Back!</h3>
 <p className="text-gray-600 mt-2">Logging you into your dashboard...</p>
 </div>
 ) : (
 <form onSubmit={handleSubmit}>
 {/* Display Error Message */}
 {error && (
 <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
 {error}
 </div>
)}
 
 {/* Username/Email Field */}
 <div className="mb-4">
 <InputField 
 icon={<User size={18} />} 
 placeholder="Username or Email" 
 name="username" 
 required 
 type="text" 
 onChange={handleInputChange} 
 value={formData.username}
 />
 </div>

 {/* Password Field */}
 <div className="mb-6">
 <InputField 
 icon={<Lock size={18} />} 
 placeholder="Password" 
 name="password" 
 required 
 type="password" 
 onChange={handleInputChange} 
 value={formData.password}
 />
 </div>

 {/* Submit Button */}
 <button 
 type="submit"
 disabled={isLoading} 
 className={`w-full py-3 text-white font-bold rounded-lg shadow-md transition-fast flex items-center justify-center 
 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[--emerald] hover:bg-green-700'}`}
 >
 {isLoading ? 'Logging In...' : 'LOG IN TO DASHBOARD'}
 </button>

 {/* 🛑 FIX: Forgot Password Link */}
 <div className="text-center mt-4 text-sm text-gray-600">
 <Link to="/forgot-password" className="text-gray-500 hover:text-[--dark] hover:underline">
                            Forgot Password?
                        </Link>
 </div>
 </form>
 )}
 
 {/* 🛑 FIX: Sign Up Link */}
 <div className="text-center mt-6 text-sm text-gray-600">
 Don't have an account? 
                <Link to="/signup" className="text-[--emerald] hover:underline font-medium cursor-pointer ml-1">
                    Sign Up
                </Link>
 </div>
 </>
 );
}