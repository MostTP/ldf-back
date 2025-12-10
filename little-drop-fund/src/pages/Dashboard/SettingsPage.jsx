// src/pages/Dashboard/Settings.jsx

import React, { useState } from 'react';
import { User, Banknote, Lock, Mail, Phone, Code, Save } from 'lucide-react';

// --- 1. DUMMY DATA ---
const dummyProfile = {
    username: "sarahjmoney",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.j@example.com",
    phone: "0801 234 5678",
    referralCode: "SARAHJMONEY123", // The code people use to sign up under them
};

const dummyBankDetails = {
    bankName: "Guaranty Trust Bank (GTB)",
    accountName: "Sarah Johnson",
    accountNumber: "0123456789",
    isSet: true,
};

// --- 2. SETTINGS COMPONENT ---
export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    
    // State for forms (e.g., used for saving and status)
    const [profileData, setProfileData] = useState(dummyProfile);
    const [bankData, setBankData] = useState(dummyBankDetails);
    const [isSaving, setIsSaving] = useState(false);

    // --- Tab Content Renderers ---

    const renderProfileSettings = () => (
        <SettingsForm title="Profile Information" onSubmit={() => console.log('Saving Profile')}>
            <InputField label="Username (Read Only)" value={profileData.username} icon={User} readOnly />
            <InputField label="Referral Code (Read Only)" value={profileData.referralCode} icon={Code} readOnly />
            <InputField label="First Name" value={profileData.firstName} icon={User} onChange={(e) => setProfileData({...profileData, firstName: e.target.value})} />
            <InputField label="Last Name" value={profileData.lastName} icon={User} onChange={(e) => setProfileData({...profileData, lastName: e.target.value})} />
            <InputField label="Email Address" value={profileData.email} icon={Mail} type="email" onChange={(e) => setProfileData({...profileData, email: e.target.value})} />
            <InputField label="Phone Number (WhatsApp)" value={profileData.phone} icon={Phone} type="tel" onChange={(e) => setProfileData({...profileData, phone: e.target.value})} />
        </SettingsForm>
    );

    const renderBankDetails = () => (
        <SettingsForm title="Bank Details for Payouts" onSubmit={() => console.log('Saving Bank Details')}>
            <div className={`p-3 rounded-lg text-sm mb-4 font-medium ${bankData.isSet ? 'bg-green-100 text-[--emerald]' : 'bg-red-100 text-red-600'}`}>
                {bankData.isSet 
                    ? `Status: Your current bank details are set for payouts.` 
                    : `⚠️ Please set your bank details to receive withdrawals.`}
            </div>
            <InputField label="Bank Name" value={bankData.bankName} icon={Banknote} onChange={(e) => setBankData({...bankData, bankName: e.target.value})} required />
            <InputField label="Account Holder Name" value={bankData.accountName} icon={User} onChange={(e) => setBankData({...bankData, accountName: e.target.value})} required />
            <InputField label="Account Number" value={bankData.accountNumber} icon={Banknote} type="number" onChange={(e) => setBankData({...bankData, accountNumber: e.target.value})} required />
        </SettingsForm>
    );
    
    const renderSecurity = () => (
        <SettingsForm title="Change Password" onSubmit={() => console.log('Changing Password')}>
            <p className="text-sm text-gray-500 mb-4">For security, please enter your current password before setting a new one.</p>
            <InputField label="Current Password" icon={Lock} type="password" required />
            <InputField label="New Password" icon={Lock} type="password" required />
            <InputField label="Confirm New Password" icon={Lock} type="password" required />
        </SettingsForm>
    );

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-[--dark]">Account Settings</h2>
            
            <div className="bg-white rounded-xl shadow-soft border border-gray-200">
                {/* Tabs Navigation */}
                <div className="flex border-b border-gray-200 p-4">
                    <TabButton label="Profile" tab="profile" activeTab={activeTab} setActiveTab={setActiveTab} icon={User} />
                    <TabButton label="Bank Details" tab="bank" activeTab={activeTab} setActiveTab={setActiveTab} icon={Banknote} />
                    <TabButton label="Security" tab="security" activeTab={activeTab} setActiveTab={setActiveTab} icon={Lock} />
                </div>

                {/* Tab Content */}
                <div className="p-6 md:p-8">
                    {activeTab === 'profile' && renderProfileSettings()}
                    {activeTab === 'bank' && renderBankDetails()}
                    {activeTab === 'security' && renderSecurity()}
                </div>
            </div>
        </div>
    );
}

// --- 3. HELPER COMPONENTS ---

// Helper for the navigation tabs
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

// Helper for the form layout
const SettingsForm = ({ children, title, onSubmit }) => {
    const [isSaving, setIsSaving] = useState(false);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSaving(true);
        // Simulate API delay
        setTimeout(() => {
            onSubmit();
            setIsSaving(false);
            alert(`${title} updated successfully!`);
        }, 1500);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
            <h3 className="text-2xl font-semibold text-[--dark] mb-6">{title}</h3>
            {children}
            <button
                type="submit"
                disabled={isSaving}
                className={`w-full py-3 text-white font-bold rounded-lg shadow-md transition-fast flex items-center justify-center ${
                    isSaving 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-[--emerald] hover:bg-green-700'
                }`}
            >
                <Save size={18} className="mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
        </form>
    );
};

// Helper for generic input fields
const InputField = ({ label, value, icon: Icon, type = 'text', readOnly = false, required = false, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="relative">
            <Icon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
                type={type}
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                required={required}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-1 outline-none transition 
                    ${readOnly 
                        ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-default' 
                        : 'border-gray-300 focus:border-[--emerald] focus:ring-[--emerald]'
                    }`}
            />
        </div>
    </div>
);