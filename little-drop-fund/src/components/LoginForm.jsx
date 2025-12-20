import { useState } from "react";
import { Lock, User, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../api/services";
import { setAuth } from "../utils/auth";

// =========================================================================
// 1. HELPER COMPONENT (Fully synchronized with SignupForm)
// =========================================================================

const InputField = ({ icon, placeholder, name, type = 'text', required = false, onChange, value, error }) => (
  <div>
    <div className="relative">
      <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${error ? 'text-red-500' : 'text-gray-400'}`}>
        {icon}
      </span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        onChange={onChange} 
        value={value} 
        className={`w-full pl-10 pr-4 py-3 border rounded-lg outline-none transition ${
          error 
            ? 'border-red-500 bg-red-50 focus:border-red-600 focus:ring-1 focus:ring-red-600' 
            : 'border-gray-300 focus:border-[--emerald] focus:ring-1 focus:ring-[--emerald]'
        }`}
      />
    </div>
    {error && (
      <p className="text-red-500 text-xs mt-1 ml-1 flex items-center">
        <AlertCircle size={12} className="mr-1" /> {error}
      </p>
    )}
  </div>
);

// =========================================================================
// 2. MAIN LOGIN FORM
// =========================================================================

export default function LoginForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' }); 
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({}); // Field-specific errors
  const [error, setError] = useState(null);   // Global/API error
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) setError(null);
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.username) newErrors.username = "Username or Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => { 
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const response = await authService.login(formData.username, formData.password);

      if (response.token && response.success && response.user) {
        setAuth(response.token, response.user);
        setSuccess(true);
        // Quick delay for the success animation
        setTimeout(() => navigate('/app'), 1500);
      } else {
        setError(response.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      const errorMessage = err.response 
        ? err.response.data.message || 'Invalid credentials.' 
        : 'Network error. Please try again later.';
      setError(errorMessage);
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <>
      {success ? (
        <div className="text-center py-10 flex flex-col items-center">
          <CheckCircle className="w-16 h-16 text-[--emerald] mb-4 animate-bounce" />
          <h3 className="text-2xl font-bold text-[--emerald]">Welcome Back!</h3>
          <p className="text-gray-600 mt-2">Opening your dashboard...</p>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Global API Error */}
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium flex items-center">
                <AlertCircle size={16} className="mr-2" /> {error}
              </div>
            )}
            
            <InputField 
              icon={<User size={18} />} 
              placeholder="Username or Email" 
              name="username" 
              onChange={handleInputChange} 
              value={formData.username}
              error={errors.username}
            />

            <InputField 
              icon={<Lock size={18} />} 
              placeholder="Password" 
              name="password" 
              type="password" 
              onChange={handleInputChange} 
              value={formData.password}
              error={errors.password}
            />

            <div className="text-right">
              <Link to="/forgot-password" virtual="true" className="text-xs text-gray-500 hover:text-[--emerald] transition-colors">
                Forgot Password?
              </Link>
            </div>

            <button 
              type="submit"
              disabled={isLoading} 
              className={`w-full py-3 text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center 
              ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800 active:scale-[0.98]'}`}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Authenticating...</>
              ) : (
                'LOG IN TO DASHBOARD'
              )}
            </button>
          </form>

          <div className="text-center mt-8 text-sm text-gray-600">
            Don't have an account? 
            <Link to="/signup" className="text-[--emerald] hover:underline font-bold ml-1">
              Sign Up
            </Link>
          </div>
        </>
      )}
    </>
  );
}