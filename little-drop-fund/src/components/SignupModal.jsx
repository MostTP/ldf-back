import { X, Lock, Mail, User, Phone, Code } from "lucide-react";
import { useState } from "react";

export default function SignupModal({ onClose }) {
 // Simple state management for form inputs
 const [formData, setFormData] = useState({}); 

 // Handler for all standard text/number inputs
 const handleInputChange = (e) => {
 const { name, value } = e.target;
 setFormData({ ...formData, [name]: value });
 };

 const handleCheckboxChange = (e) => {
 setFormData({ ...formData, [e.target.name]: e.target.checked });
 };

 const handleSubmit = (e) => {
 e.preventDefault();
 
 // Client-side check for demonstration
 if (!formData.agreeTerms || !formData.agreeRisk || !formData.acknowledgeRefund) {
 console.error("Please agree to all terms and acknowledgements.");
 return;
 }
 
 console.log("Form Submitted (No API Call):", formData);
 onClose(); 
 };

 return (
 // Overlay backdrop
 <div className="fixed inset-0 z-[60] bg-black bg-opacity-70 flex items-center justify-center p-4" onClick={onClose}>
 
 {/* Modal Container */}
 <div 
 className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 relative animate-fade-in overflow-y-auto max-h-[90vh]" 
 onClick={(e) => e.stopPropagation()}
 >
 
 {/* Header */}
 <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
 <h3 className="text-2xl font-extrabold text-[--dark]">
 Start Your Journey Today!
 </h3>
 <button onClick={onClose} className="text-gray-400 hover:text-[--dark] transition">
 <X size={24} />
 </button>
 </div>

 <p className="text-sm text-gray-600 mb-6">
 Unlock the Masterclass and your opportunity for multiple streams of income—activated by your coupon code. </p>

 {/* Form Fields */}
 <form onSubmit={handleSubmit}>
 {/* Row 1: First Name / Last Name */}
 <div className="grid grid-cols-2 gap-4 mb-4">
 <InputField icon={<User size={18} />} placeholder="First Name *" name="firstName" required type="text" onChange={handleInputChange} value={formData.firstName || ''} />
 <InputField icon={<User size={18} />} placeholder="Last Name *" name="lastName" required type="text" onChange={handleInputChange} value={formData.lastName || ''} />
</div>

 {/* Row 2: Email / Phone */}
<div className="grid grid-cols-2 gap-4 mb-4">
 <InputField icon={<Mail size={18} />} placeholder="Email Address *" name="email" required type="email" onChange={handleInputChange} value={formData.email || ''} />
<InputField icon={<Phone size={18} />} placeholder="Phone Number (Whats.)" name="phone" type="tel" onChange={handleInputChange} value={formData.phone || ''} />
</div>

 {/* Desired Username */}
 <div className="mb-6">
<InputField icon={<User size={18} />} placeholder="Desired Username *" name="username" required type="text" onChange={handleInputChange} hint="Must be unique, 6-15 characters." value={formData.username || ''} />
</div>
          
          {/* LDF-Starter Code (Affiliate/Sponsor) */}
          <div className="mb-4">
 <InputField 
 icon={<Code size={18} />} 
 placeholder="LDF-Starter" 
 name="ldfStarterCode" 
 type="text" 
 onChange={handleInputChange}
 hint="Auto-filled from an affiliate link." 
 value={formData.ldfStarterCode || ''}
 />
 </div>

 {/* Activation Coupon Code (₦3,000) */}
 <div className="mb-6">
 <InputField icon={<Code size={18} />} placeholder="Activation Coupon Code (₦3,000) *" name="coupon" required type="text" onChange={handleInputChange} hint="The ₦3,000 coupon code purchased from your sponsor." value={formData.coupon || ''} />
 </div>

 {/* Password Fields */}
 <div className="space-y-4 mb-8">
 <InputField icon={<Lock size={18} />} placeholder="Password *" name="password" required type="password" onChange={handleInputChange} hint="Minimum 8 characters." value={formData.password || ''} />
 <InputField icon={<Lock size={18} />} placeholder="Confirm Password *" name="confirmPassword" required type="password" onChange={handleInputChange} value={formData.confirmPassword || ''} />
 </div>


 {/* Legal & Compliance Acceptance */}
 <div className="border border-gray-200 p-4 rounded-lg bg-gray-50 mb-8 space-y-3">
 <h4 className="font-semibold text-[--dark] mb-2">Legal & Compliance Acceptance</h4>
 
 <CheckboxField name="agreeTerms" onChange={handleCheckboxChange} checked={!!formData.agreeTerms}>
 I have read and agree to the <a href="#" className="text-[--emerald] hover:underline font-medium">Terms & Conditions</a>.
 </CheckboxField>
 
 <CheckboxField name="agreeRisk" onChange={handleCheckboxChange} checked={!!formData.agreeRisk}>
 I have read and understand the <a href="#" className="text-amber-600 hover:underline font-medium">Risk Disclosure Statement</a> regarding the non-guaranteed nature of earnings.
 </CheckboxField>
 
 <CheckboxField name="acknowledgeRefund" onChange={handleCheckboxChange} checked={!!formData.acknowledgeRefund}>
 I acknowledge that the coupon grants access to the LDF Digital Masterclass, is non-refundable, and that any earnings are performance-based.
 </CheckboxField>
 </div>

 {/* Submit Button */}
 <button 
 type="submit"
 disabled={!formData.agreeTerms || !formData.agreeRisk || !formData.acknowledgeRefund} 
 className={`w-full py-3 text-white font-bold rounded-lg shadow-md transition-fast flex items-center justify-center 
 ${(!formData.agreeTerms || !formData.agreeRisk || !formData.acknowledgeRefund) ? 'bg-gray-400 cursor-not-allowed' : 'bg-[--emerald] hover:bg-green-700'}`}>
 CREATE AND ACTIVATE ACCOUNT
 </button>

 </form>

 </div>
 </div>
 );
}

// =========================================================================
// 2. HELPER COMPONENTS 
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
 className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-[--emerald] focus:ring-1 focus:ring-[--emerald] outline-none transition" />
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
      checked={checked}      className="mt-1 mr-2 appearance-none w-4 h-4 border border-gray-300 rounded checked:bg-[--emerald] checked:border-transparent focus:outline-none transition-fast shrink-0"
    />
 {children}
  </label>
);