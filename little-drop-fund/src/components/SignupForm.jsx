// src/components/SignupForm.jsx
import { useState } from "react";
import { Lock, Mail, User, Phone, Code, CheckCircle } from "lucide-react";
import { authService } from "../api/services"; 
import { useNavigate, Link } from "react-router-dom"; 

// =========================================================================
// 1. HELPER COMPONENTS (UNCHANGED, BUT CheckboxField FIX APPLIED)
// =========================================================================

// Helper component for styled input fields
const InputField = ({ icon, placeholder, name, type = 'text', required = false, hint = '', onChange, value }) => (
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
{hint && <p className="text-xs text-gray-500 mt-1 ml-1">{hint}</p>}
</div>
);

// Helper component for styled checkboxes
const CheckboxField = ({ children, name, onChange, checked }) => (
<label className="flex items-start cursor-pointer text-sm">
<input
type="checkbox"
name={name}
required
onChange={onChange}
checked={checked} 
className="mt-1 mr-2 appearance-none w-4 h-4 border border-gray-300 rounded checked:bg-[--emerald] checked:border-transparent focus:outline-none transition-fast shrink-0"
/>
    {/* 🛑 FIX: Wrap text in span to control wrapping and prevent double lines */}
    <span className="flex-1 min-w-0"> 
        {children}
    </span>
</label>
);

// =========================================================================
// 2. MAIN SIGNUP FORM LOGIC (FIXED FOR UNIFORM SPACING)
// =========================================================================

export default function SignupForm() {
const navigate = useNavigate();
const [formData, setFormData] = useState({}); 
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null); 
const [success, setSuccess] = useState(false);

const handleInputChange = (e) => {
const { name, value } = e.target;
setFormData({ ...formData, [name]: value });
};

const handleCheckboxChange = (e) => {
const { name, checked } = e.target;
setFormData({ ...formData, [name]: checked });
};

const handleSubmit = async (e) => { 
e.preventDefault();
setError(null);

if (!formData.agreeTerms || !formData.agreeRisk || !formData.acknowledgeRefund) {
setError("Please agree to all terms and acknowledgements.");
return;
}

if (formData.password !== formData.confirmPassword) {
setError("Passwords do not match.");
return;
}

try {
setIsLoading(true);

// Real API call
await authService.signup({
  firstName: formData.firstName,
  lastName: formData.lastName,
  email: formData.email,
  phone: formData.phone,
  username: formData.username,
  password: formData.password,
  coupon: formData.coupon,
  ldfStarterCode: formData.ldfStarterCode,
  agreeTerms: formData.agreeTerms,
  agreeRisk: formData.agreeRisk,
  acknowledgeRefund: formData.acknowledgeRefund
});

setSuccess(true);
setTimeout(() => navigate('/login'), 50); 

} catch (err) {
console.error("Registration Failed (Mocked/Actual):", err);

const errorMessage = err.response 
? err.response.data.message || 'Registration failed due to server error.' 
: 'Network error or service unavailable.';

setError(errorMessage);

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
{/* Display Error Message */}
{error && (
<div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium"> {/* Removed mb-4 */}
{error}
</div>
)}

{/* Form Fields - All now use uniform space-y-4 */}

<InputField icon={<User size={18} />} placeholder="First Name *" name="firstName" required type="text" onChange={handleInputChange} value={formData.firstName || ''} />
<InputField icon={<User size={18} />} placeholder="Last Name *" name="lastName" required type="text" onChange={handleInputChange} value={formData.lastName || ''} />

<InputField icon={<Mail size={18} />} placeholder="Email Address *" name="email" required type="email" onChange={handleInputChange} value={formData.email || ''} />
<InputField icon={<Phone size={18} />} placeholder="Phone Number (Whats.)" name="phone" type="tel" onChange={handleInputChange} value={formData.phone || ''} />

{/* Removed div with pt-2 */}
<InputField icon={<User size={18} />} placeholder="Desired Username *" name="username" required type="text" onChange={handleInputChange} hint="Must be unique, 6-15 characters." value={formData.username || ''} />
 
<InputField 
icon={<Code size={18} />} 
placeholder="LDF-Starter" 
name="ldfStarterCode" 
type="text" 
onChange={handleInputChange}
hint="Auto-filled from an affiliate link." 
value={formData.ldfStarterCode || ''}
/>

{/* Activation Coupon Code (₦3,000) - Grouped input and link */}
    <div>
        <InputField 
        icon={<Code size={18} />} 
        placeholder="Activation Coupon Code (₦3,000) *" 
        name="coupon" 
        required 
        type="text" 
        onChange={handleInputChange} 
        value={formData.coupon || ''} 
        />
        <div className="text-right text-sm -mt-0">
            <Link 
                to="/agents" 
                className="text-[--emerald] hover:text-green-600 hover:underline font-bold" 
            >
                Click here to get your coupon code
            </Link>
        </div>
    </div>


{/* Password Fields - Grouped into one div, now separated by space-y-4 */}
    <div className="space-y-4">
        <InputField icon={<Lock size={18} />} placeholder="Password *" name="password" required type="password" onChange={handleInputChange} hint="Minimum 8 characters." value={formData.password || ''} />
        <InputField icon={<Lock size={18} />} placeholder="Confirm Password *" name="confirmPassword" required type="password" onChange={handleInputChange} value={formData.confirmPassword || ''} />
    </div>


{/* Legal & Compliance Acceptance - Removed mt-8 */}
<div className="border border-gray-200 p-4 rounded-lg bg-gray-50 space-y-3">
<h4 className="font-semibold text-[--dark] mb-2">Legal & Compliance Acceptance</h4>
<CheckboxField name="agreeTerms" onChange={handleCheckboxChange} checked={!!formData.agreeTerms}>
I have read and agree to the <Link to="/terms" target="_blank" className="text-[--emerald] hover:underline font-medium">Terms & Conditions</Link>.
</CheckboxField>
<CheckboxField name="agreeRisk" onChange={handleCheckboxChange} checked={!!formData.agreeRisk}>
I have read and understand the <Link to="/privacy" target="_blank" className="text-amber-600 hover:underline font-medium">Risk Disclosure Statement</Link> regarding the non-guaranteed nature of earnings.
</CheckboxField>
<CheckboxField name="acknowledgeRefund" onChange={handleCheckboxChange} checked={!!formData.acknowledgeRefund}>
I acknowledge that the coupon grants access to the LDF Digital Masterclass, is non-refundable, and that any earnings are performance-based.
</CheckboxField>
</div>

{/* Submit Button */}
<button 
type="submit"
disabled={isLoading || !formData.agreeTerms || !formData.agreeRisk || !formData.acknowledgeRefund} 
className={`w-full py-3 text-white font-bold rounded-lg shadow-md transition-fast flex items-center justify-center 
 ${isLoading || !formData.agreeTerms || !formData.agreeRisk || !formData.acknowledgeRefund 
 ? 'bg-gray-400 cursor-not-allowed' 
 : 'bg-green-700' // 🛑 CHANGED: Using a solid, darker green for better contrast
  }`}
>
{isLoading ? 'Creating Account...' : 'CREATE AND ACTIVATE ACCOUNT'}
</button>

{/* Removed mt-4 */}
<div className="text-center text-sm text-gray-600">
Already have an account? <Link to="/login" className="text-[--emerald] hover:underline font-medium">Log In</Link>
</div>

</form>
)}
</>
);
}