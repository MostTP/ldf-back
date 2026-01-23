import { useState, useEffect } from "react";
import { Lock, Mail, User, Phone, Code, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { authService } from "../api/services"; 
import { useNavigate, Link, useSearchParams } from "react-router-dom"; 

// =========================================================================
// 1. HELPER COMPONENTS
// =========================================================================

const InputField = ({ icon, placeholder, name, type = 'text', required = false, hint = '', onChange, value, error }) => (
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
    {error ? (
      <p className="text-red-500 text-xs mt-1 ml-1 flex items-center">
        <AlertCircle size={12} className="mr-1" /> {error}
      </p>
    ) : (
      hint && <p className="text-xs text-gray-500 mt-1 ml-1">{hint}</p>
    )}
  </div>
);

const CheckboxField = ({ children, name, onChange, checked }) => (
  <label className="flex items-start cursor-pointer text-sm">
    <input
      type="checkbox"
      name={name}
      required
      onChange={onChange}
      checked={checked} 
      className="mt-1 mr-2 accent-[--emerald] w-4 h-4 border border-gray-300 rounded checked:bg-[--emerald] checked:border-transparent focus:outline-none transition-fast shrink-0"
    />
    <span className="flex-1 min-w-0">{children}</span>
  </label>
);

// =========================================================================
// 2. MAIN COMPONENT
// =========================================================================

export default function SignupForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({}); 
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({}); 
  const [error, setError] = useState(null); 
  const [success, setSuccess] = useState(false);

  // Regex Definitions
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  // Phone regex for African countries (Nigeria, Ghana, Kenya, South Africa, Uganda, Tanzania, etc.)
  // Accepts: +234, +233, +254, +27, +256, +255, +251, +212, +20, +213, +220, +221, +224, +225, +226, +227, +228, +229, +230, +231, +232, +235, +236, +237, +238, +239, +240, +241, +242, +243, +244, +245, +246, +248, +249, +250, +252, +253, +257, +258, +260, +261, +262, +263, +264, +265, +266, +267, +268, +269, +290, +291, +297, +298
  // Also accepts local formats starting with 0
  const phoneRegex = /^(\+?2[0-9]{2}|0)[1-9]\d{7,9}$/;

  // Read referral code from URL parameter on component mount
  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setFormData(prev => ({ ...prev, ldfStarterCode: refParam.trim() }));
    }
  }, [searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    let currentError = "";

    // Live validation logic
    if (name === 'phone' && value.length > 5) {
      if (!phoneRegex.test(value)) currentError = "Invalid format (use country code +XXX or local format)";
    }

    if (name === 'email' && value.length > 5) {
      if (!emailRegex.test(value)) currentError = "Invalid email address";
    }

    setErrors(prev => ({ ...prev, [name]: currentError }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const validateForm = () => {
    let newErrors = {};
    
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    
    // Final Email Check
    if (!formData.email) {
        newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email";
    }
    
    // Final Phone Check
    if (!formData.phone) {
        newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = "Invalid phone format";
    }

    if (!formData.username || formData.username.length < 6) newErrors.username = "Username must be 6-15 characters";
    if (!formData.password || formData.password.length < 8) newErrors.password = "Minimum 8 characters required";
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.coupon) newErrors.coupon = "Activation coupon is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => { 
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    if (!formData.agreeTerms || !formData.agreeRisk || !formData.acknowledgeRefund) {
      setError("Please agree to all terms and acknowledgements.");
      return;
    }

    try {
      setIsLoading(true);
      await authService.signup({ ...formData });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000); 
    } catch (err) {
      if (err.response && err.response.data) {
        // Show detailed validation errors if available
        if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
          const validationErrors = err.response.data.errors.map(e => e.msg || e.message).join(', ');
          setError(`Validation failed: ${validationErrors}`);
          
          // Also set field-specific errors
          const fieldErrors = {};
          err.response.data.errors.forEach(error => {
            if (error.param) {
              // Map backend field names to frontend field names
              const fieldMap = {
                'firstName': 'firstName',
                'lastName': 'lastName',
                'email': 'email',
                'phone': 'phone',
                'username': 'username',
                'password': 'password',
                'confirmPassword': 'confirmPassword',
                'couponCode': 'coupon',
                'termsAccepted': 'agreeTerms',
                'riskDisclosureAccepted': 'agreeRisk',
                'couponAcknowledged': 'acknowledgeRefund',
              };
              const frontendField = fieldMap[error.param] || error.param;
              fieldErrors[frontendField] = error.msg || error.message;
            }
          });
          setErrors(prev => ({ ...prev, ...fieldErrors }));
        } else {
          setError(err.response.data.message || 'Registration failed.');
        }
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <p className="text-sm text-gray-600 mb-6">
        Unlock the Masterclass and your opportunity for multiple streams of income—activated by your coupon code.
      </p>

      {success ? (
        <div className="text-center py-10 flex flex-col items-center">
          <CheckCircle className="w-12 h-12 text-[--emerald] mb-3" />
          <h3 className="text-2xl font-bold text-[--emerald]">Success!</h3>
          <p className="text-gray-600 mt-2">Account created. Redirecting to Login...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4"> 
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium">{error}</div>}

          <InputField icon={<User size={18} />} placeholder="First Name *" name="firstName" onChange={handleInputChange} value={formData.firstName || ''} error={errors.firstName} />
          <InputField icon={<User size={18} />} placeholder="Last Name *" name="lastName" onChange={handleInputChange} value={formData.lastName || ''} error={errors.lastName} />
          <InputField icon={<Mail size={18} />} placeholder="Email Address *" name="email" type="email" onChange={handleInputChange} value={formData.email || ''} error={errors.email} />
          
          <InputField 
            icon={<Phone size={18} />} 
            placeholder="Phone Number (WhatsApp) *" 
            name="phone" 
            type="tel" 
            onChange={handleInputChange} 
            value={formData.phone || ''} 
            error={errors.phone} 
            hint="Format: Country code +XXX or local format (e.g., +234, +233, +254)"
          />

          <InputField icon={<User size={18} />} placeholder="Desired Username *" name="username" onChange={handleInputChange} hint="Must be unique, 6-15 characters." value={formData.username || ''} error={errors.username} />
          <InputField icon={<Code size={18} />} placeholder="LDF-Starter" name="ldfStarterCode" onChange={handleInputChange} hint="Auto-filled from an affiliate link." value={formData.ldfStarterCode || ''} />

          <div>
            <InputField icon={<Code size={18} />} placeholder="Activation Coupon Code (₦5,000) *" name="coupon" onChange={handleInputChange} value={formData.coupon || ''} error={errors.coupon} />
            <div className="text-right text-sm">
              <Link to="/agents" className="text-[--emerald] hover:underline font-bold">Click here to get your coupon code</Link>
            </div>
          </div>

          <div className="space-y-4">
            <InputField icon={<Lock size={18} />} placeholder="Password *" name="password" type="password" onChange={handleInputChange} hint="Minimum 8 characters." value={formData.password || ''} error={errors.password} />
            <InputField icon={<Lock size={18} />} placeholder="Confirm Password *" name="confirmPassword" type="password" onChange={handleInputChange} value={formData.confirmPassword || ''} error={errors.confirmPassword} />
          </div>

          <div className="border border-gray-200 p-4 rounded-lg bg-gray-50 space-y-3">
            <h4 className="font-semibold text-[--dark] mb-2">Legal & Compliance Acceptance</h4>
            <CheckboxField name="agreeTerms" onChange={handleCheckboxChange} checked={!!formData.agreeTerms}>
              I agree to the <Link to="/terms" target="_blank" className="text-[--emerald] hover:underline font-medium">Terms & Conditions</Link>.
            </CheckboxField>
            <CheckboxField name="agreeRisk" onChange={handleCheckboxChange} checked={!!formData.agreeRisk}>
              I agree to the <Link to="/privacy" target="_blank" className="text-amber-600 hover:underline font-medium">Risk Disclosure</Link>.
            </CheckboxField>
            <CheckboxField name="acknowledgeRefund" onChange={handleCheckboxChange} checked={!!formData.acknowledgeRefund}>
              I acknowledge the coupon is non-refundable.
            </CheckboxField>
          </div>

          <button 
            type="submit"
            disabled={isLoading || !formData.agreeTerms || !formData.agreeRisk || !formData.acknowledgeRefund} 
            className={`w-full py-3 text-white font-bold rounded-lg shadow-md transition-fast flex items-center justify-center 
            ${isLoading || !formData.agreeTerms || !formData.agreeRisk || !formData.acknowledgeRefund ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800'}`}
          >
            {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating Account...</> : 'CREATE AND ACTIVATE ACCOUNT'}
          </button>

          {/* 🛑 Restored Login Link Section */}
          <div className="text-center text-sm text-gray-600 pt-2">
            Already have an account? <Link to="/login" className="text-[--emerald] hover:underline font-medium">Log In</Link>
          </div>
        </form>
      )}
    </>
  );
}