import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; // Added for routing fix
import { 
    User, Banknote, Lock, Mail, Phone, Save, 
    Loader2, AlertCircle, CheckCircle, Wallet 
} from 'lucide-react';
import { settingsService, dashboardService } from '../../api/services';

// --- HELPER COMPONENTS ---
const TabButton = ({ label, tab, activeTab, setActiveTab, icon: Icon }) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`flex items-center px-4 py-2 text-sm font-semibold transition-colors border-b-2 
            ${activeTab === tab
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
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
                      'border-gray-300 focus:border-green-600 focus:ring-1 focus:ring-green-600'
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
        setFormError(null); setFormSuccess(null);
        setIsSaving(true);
        try {
            await onSubmit();
            setFormSuccess(`${title} updated successfully!`);
            setTimeout(() => setFormSuccess(null), 5000);
        } catch (err) {
            setFormError(err.response?.data?.message || err.message || 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">{title}</h3>
            {formSuccess && (
                <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center">
                    <CheckCircle size={16} className="mr-2" /> {formSuccess}
                </div>
            )}
            {formError && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium flex items-center">
                    <AlertCircle size={16} className="mr-2" /> {formError}
                </div>
            )}
            {children}
            <button
                type="submit"
                disabled={isSaving}
                className={`w-full py-3 text-white font-bold rounded-lg shadow-md transition flex items-center justify-center ${
                    isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800'
                }`}
            >
                {isSaving ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
        </form>
    );
};

// --- MAIN SETTINGS COMPONENT ---
export default function SettingsPage() {
    // 1. URL Parameter Logic (Fixes the redirection 404/linking issue)
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'profile';
    const [activeTab, setActiveTab] = useState(initialTab);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [balance, setBalance] = useState(0); // Added funds display
    
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
                const [profile, stats] = await Promise.all([
                    dashboardService.getProfile(),
                    dashboardService.getStats()
                ]);

                setProfileData({
                    username: profile?.username || '',
                    firstName: profile?.firstName || '',
                    lastName: profile?.lastName || '',
                    email: profile?.email || '',
                    phone: profile?.phone || '',
                    referralCode: profile?.referralCode || ''
                });

                setBalance(stats?.totalWithdrawable || 0);

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

    // Sync activeTab with URL
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    if (loading) return (
        <div className="flex flex-col justify-center items-center h-64">
            <Loader2 size={36} className="animate-spin text-green-600" />
            <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
    );

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Account Settings</h2>
                    <p className="text-gray-500 text-sm">Manage your profile and security</p>
                </div>

                {/* VISUAL FUNDS BOX */}
                <div className="bg-white px-5 py-3 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                        <Wallet size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Available Balance</p>
                        <p className="text-lg font-black text-gray-900">₦{balance.toLocaleString()}</p>
                    </div>
                </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-100 bg-gray-50/50 p-2">
                    <TabButton label="Profile" tab="profile" activeTab={activeTab} setActiveTab={handleTabChange} icon={User} />
                    <TabButton label="Bank Details" tab="bank" activeTab={activeTab} setActiveTab={handleTabChange} icon={Banknote} />
                    <TabButton label="Security" tab="security" activeTab={activeTab} setActiveTab={handleTabChange} icon={Lock} />
                </div>

                <div className="p-6 md:p-10">
                    {activeTab === 'profile' && (
                        <SettingsForm title="Profile Information" onSubmit={() => settingsService.updateProfile(profileData)}>
                            <InputField label="Username" value={profileData.username} icon={User} readOnly />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField label="First Name" value={profileData.firstName} icon={User} onChange={(e) => setProfileData({...profileData, firstName: e.target.value})} />
                                <InputField label="Last Name" value={profileData.lastName} icon={User} onChange={(e) => setProfileData({...profileData, lastName: e.target.value})} />
                            </div>
                            <InputField label="Email Address" value={profileData.email} icon={Mail} type="email" onChange={(e) => setProfileData({...profileData, email: e.target.value})} />
                            <InputField label="Phone (WhatsApp)" value={profileData.phone} icon={Phone} type="tel" onChange={(e) => setProfileData({...profileData, phone: e.target.value})} />
                        </SettingsForm>
                    )}

                    {activeTab === 'bank' && (
                        <SettingsForm title="Bank Details" onSubmit={() => settingsService.updateBankDetails(bankData)}>
                            <div className={`p-4 rounded-xl text-sm mb-6 flex items-center gap-3 font-medium ${bankData.isSet ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                {bankData.isSet ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
                                {bankData.isSet ? 'Bank details are active and verified.' : 'Please set your bank details to enable withdrawals.'}
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