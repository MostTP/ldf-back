// src/pages/LoginPage.jsx
import { Lock, Mail, ChevronRight } from "lucide-react";

export default function LoginPage() {
  const handleLogin = (e) => {
    e.preventDefault();
    // ⚠️ IMPORTANT: In a real application, you would make an API call here 
    // using your new src/api/authService.js to validate credentials.
    
    console.log("Attempting login...");
    
    // For now, we simulate a successful login and redirect to the dashboard
    // Once the token is successfully received from the backend, 
    // you would store it (e.g., in localStorage) and then redirect.
    window.location.href = '/dashboard'; 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl border-t-4 border-t-[--emerald]">
        
        <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-[--dark] mb-2">Welcome Back!</h1>
            <p className="text-gray-500">Sign in to access your LDF Dashboard.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          
          <div className="relative">
            <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              placeholder="Email or Username"
              required
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:border-[--emerald] focus:ring-1 focus:ring-[--emerald] outline-none transition"
            />
          </div>
          
          <div className="relative">
            <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              required
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:border-[--emerald] focus:ring-1 focus:ring-[--emerald] outline-none transition"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[--emerald] text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-fast flex items-center justify-center"
          >
            Log In <ChevronRight size={20} className="ml-2" />
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
            {/* Placeholder for Forgot Password route */}
            <a href="/forgot-password" className="text-gray-500 hover:text-[--emerald] transition-colors">Forgot Password?</a>
        </div>
      </div>
    </div>
  );
}