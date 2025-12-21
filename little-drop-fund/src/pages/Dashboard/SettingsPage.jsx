import React, { useState, useEffect } from 'react';
import { User, Banknote, Lock, Mail, Phone, Code, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { settingsService, dashboardService } from '../../api/services';

// =========================================================================
// 1. HELPER COMPONENTS (Moved to top to prevent initialization errors)
// =========================================================================

const TabButton = ({ label, tab, activeTab, setActiveTab, icon: Icon }) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`flex items-center px-4 py-2 text-sm font-semibold transition-colors border-b-2 
            ${activeTab === tab
                ? 'border-[--emerald] text-[--emerald]'
                : 'border-transparent text-gray-500 hover:text-[--dark]'
            }`}
    >
        <Icon size={18} className="mr-2" />
        {label}
    </button>
);

const InputField = ({ label, value = '', icon: Icon, type = 'text', readOnly = false, required = false, onChange, error }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="relative">
            <Icon size={20} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${error ? 'text-red-500' : 'text-gray-400'}`} />
            <input
                type={type}
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                required={required}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg outline-none transition 
                    ${readOnly ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 
                      error ? 'border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500' : 
                      'border-gray-300 focus:border-[--emerald] focus:ring-1 focus:ring-[--emerald]'
                    }`}
            />
        </div>
        {error && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle size={12} className="mr-1"/> {error}</p>}
    </div>
);

const SettingsForm = ({ children, title, onSubmit }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState(null);
    const [formSuccess, setFormSuccess] = useState(null);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        setFormSuccess(null);
        setIsSaving(true);
        try {
            await onSubmit();
            setFormSuccess(`${title} updated successfully!`);
            // Clear success message after 5 seconds
            setTimeout(() => setFormSuccess(null), 5000);
        } catch (err) {
            setFormError(err.response?.data?.message || err.message || 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
            <h3 className="text-2xl font-semibold text-[--dark] mb-6">{title}</h3>
            {formSuccess && (
                <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center">
                    <CheckCircle size={16} className="mr-2" />
                    {formSuccess}
                </div>
            )}
            {formError && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium flex items-center">
                    <AlertCircle size={16} className="mr-2" />
                    {formError}
                </div>
            )}
            {children}
            <button
                type="submit"
                disabled={isSaving}
                className={`w-full py-3 text-white font-bold rounded-lg shadow-md transition-fast flex items-center justify-center ${
                    isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800'
                }`}
            >
                {isSaving ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
        </form>
    );
};

// =========================================================================
// 2. MAIN SETTINGS COMPONENT
// =========================================================================

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Form States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [profileData, setProfileData] = useState({
        username: '', firstName: '', lastName: '', email: '', phone: '', referralCode: ''
    });
    const [bankData, setBankData] = useState({
        bankName: '', accountName: '', accountNumber: '', isSet: false
    });

    useEffect(() => {
        const loadSettingsData = async () => {
            try {
                const profile = await dashboardService.getProfile();
                setProfileData({
                    username: profile?.username || '',
                    firstName: profile?.firstName || '',
                    lastName: profile?.lastName || '',
                    email: profile?.email || '',
                    phone: profile?.phone || '',
                    referralCode: profile?.referralCode || ''
                });
                if (profile?.bankDetails) {
                    setBankData({ ...profile.bankDetails, isSet: true });
                }
            } catch (err) {
                setError(err.message || 'Failed to load settings');
            } finally {
                setLoading(false);
            }
        };
        loadSettingsData();
    }, []);

    if (loading) return (
        <div className="flex flex-col justify-center items-center h-64">
            <Loader2 size={36} className="animate-spin text-[--emerald]" />
            <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
    );

    if (error) return (
        <div className="p-8 max-w-4xl mx-auto text-red-700 bg-red-100 border border-red-300 rounded-lg mt-10">
            <h2 className="text-xl font-bold mb-2">Error Loading Settings</h2>
            <p>{error}</p>
        </div>
    );

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-[--dark]">Account Settings</h2>
            
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                {/* Tabs Navigation */}
                <div className="flex border-b border-gray-200 bg-gray-50/50 p-2">
                    <TabButton label="Profile" tab="profile" activeTab={activeTab} setActiveTab={setActiveTab} icon={User} />
                    <TabButton label="Bank Details" tab="bank" activeTab={activeTab} setActiveTab={setActiveTab} icon={Banknote} />
                    <TabButton label="Security" tab="security" activeTab={activeTab} setActiveTab={setActiveTab} icon={Lock} />
                </div>

                {/* Tab Content */}
                <div className="p-6 md:p-8">
                    {activeTab === 'profile' && (
                        <SettingsForm title="Profile Information" onSubmit={() => settingsService.updateProfile(profileData)}>
                            <InputField label="Username" value={profileData.username} icon={User} readOnly />
                            <InputField label="First Name" value={profileData.firstName} icon={User} onChange={(e) => setProfileData({...profileData, firstName: e.target.value})} />
                            <InputField label="Last Name" value={profileData.lastName} icon={User} onChange={(e) => setProfileData({...profileData, lastName: e.target.value})} />
                            <InputField label="Email Address" value={profileData.email} icon={Mail} type="email" onChange={(e) => setProfileData({...profileData, email: e.target.value})} />
                            <InputField label="Phone (WhatsApp)" value={profileData.phone} icon={Phone} type="tel" onChange={(e) => setProfileData({...profileData, phone: e.target.value})} />
                        </SettingsForm>
                    )}

                    {activeTab === 'bank' && (
                        <SettingsForm title="Bank Details" onSubmit={() => settingsService.updateBankDetails(bankData)}>
                            <div className={`p-3 rounded-lg text-sm mb-4 font-medium ${bankData.isSet ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {bankData.isSet ? '✅ Bank details are active.' : '⚠️ Set bank details to enable withdrawals.'}
                            </div>
                            <InputField label="Bank Name" value={bankData.bankName} icon={Banknote} onChange={(e) => setBankData({...bankData, bankName: e.target.value})} required />
                            <InputField label="Account Name" value={bankData.accountName} icon={User} onChange={(e) => setBankData({...bankData, accountName: e.target.value})} required />
                            <InputField label="Account Number" value={bankData.accountNumber} icon={Banknote} type="number" onChange={(e) => setBankData({...bankData, accountNumber: e.target.value})} required />
                        </SettingsForm>
                    )}

                    {activeTab === 'security' && (
                        <SettingsForm title="Change Password" onSubmit={() => {
                            if (newPassword !== confirmPassword) throw new Error("Passwords don't match");
                            return settingsService.changePassword(currentPassword, newPassword);
                        }}>
                            <InputField label="Current Password" icon={Lock} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                            <InputField label="New Password" icon={Lock} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                            <InputField label="Confirm New Password" icon={Lock} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required 
                                error={newPassword !== confirmPassword && confirmPassword !== '' ? "Passwords do not match" : ""}
                            />
                        </SettingsForm>
                    )}
                </div>
            </div>
        </div>
    );
}