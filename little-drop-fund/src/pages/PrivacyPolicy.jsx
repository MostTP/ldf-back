// src/pages/PrivacyPolicy.jsx
import React from 'react';

export default function PrivacyPolicy() {
    // Determine the current date for the effective date
    const effectiveDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    return (
        // Added pt-20 to ensure content is below the fixed Navbar
        <div className="min-h-screen bg-white pt-20 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10 text-center">
                    <h1 className="text-4xl font-extrabold text-[--dark] mb-3">
                        LDF Privacy Policy
                    </h1>
                    <p className="text-lg text-gray-600">
                        Effective Date: {effectiveDate} 
                    </p>
                </header>

                <div className="space-y-8 text-gray-700 leading-relaxed text-base">
                    
                    <p>
                        This Privacy Policy explains how Little Drop Fund ("LDF," "we," "us," or "our") collects, uses, shares, and protects your personal information when you use our website, mobile applications, and services (collectively, the "Platform").
                        By accessing or using the LDF Platform, you agree to the terms of this Privacy Policy.
                    </p>

                    <section>
                        <h2 className="text-2xl font-bold text-[--emerald] mb-3">1. Information We Collect</h2>
                        <p>
                            We collect information necessary to provide our services, manage financial transactions, and maintain the integrity of our affiliate and investment structures.
                        </p>
                        
                        <h3 className="text-xl font-semibold text-[--dark] mt-4 mb-2">1.1. Information You Provide Directly</h3>
                        <ul className="list-disc list-inside ml-4 space-y-2">
                            <li>**Identity Data:** Full name, username, email address, phone number, and physical address.</li>
                            <li>**Account Data:** Password (stored in a hashed format), country of residence, and referral sponsor's username.</li>
                            <li>**Financial Data:** Bank account name, bank name, account number, branch code, and Mobile Money details (for international members) required solely for withdrawal and payout processing.</li>
                            <li>**Investment Data:** The amount of capital you commit to the LDF Capital Pool (LDFCP).</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-[--dark] mt-4 mb-2">1.2. Information We Collect Automatically</h3>
                        <ul className="list-disc list-inside ml-4 space-y-2">
                            <li>**Transactional Data:** Detailed records of every activation, every ₦ payout you receive (Affiliate, Matrix, Coupon Profit, Premium ROI), and every withdrawal request. This forms the essential audit trail.</li>
                            <li>**Usage Data:** Details about how you interact with the Platform, including pages viewed, time spent, and Masterclass progress.</li>
                            <li>**Technical Data:** Internet Protocol (IP) address, device type, browser type, and operating system, primarily for security and fraud prevention.</li>
                            <li>**Network Data:** Your placement within the Matrix structure, including the time and date you were placed and the users positioned above and below you.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-[--emerald] mb-3">2. How We Use Your Information</h2>
                        <p>We use your personal information exclusively for the following purposes:</p>

                        <h3 className="text-xl font-semibold text-[--dark] mt-4 mb-2">2.1. Service Delivery and Account Management</h3>
                        <ul className="list-disc list-inside ml-4 space-y-2">
                            <li>To create and maintain your LDF account and profile.</li>
                            <li>To track your progress through the Stock Market Investing Masterclass.</li>
                            <li>To assign you a unique referral link and determine your position within the Matrix network.</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-[--dark] mt-4 mb-2">2.2. Financial and Payout Integrity</h3>
                        <ul className="list-disc list-inside ml-4 space-y-2">
                            <li>To Process Payouts: To calculate and distribute Matrix Income, Affiliate Bonuses, Coupon Profits, and Premium ROI accurately, in accordance with the LDF Terms.</li>
                            <li>To Process Withdrawals: To verify your identity and send funds to your nominated bank account or mobile money wallet via our payment service providers.</li>
                            <li>Global Pool Eligibility: To monitor your earnings activity to determine eligibility for the monthly Global Pool distribution.</li>
                            <li>Investment Management: To track your committed capital in the LDFCP and calculate your quarterly ROI.</li>
                        </ul>
                        
                        <h3 className="text-xl font-semibold text-[--dark] mt-4 mb-2">2.3. Security and Compliance</h3>
                        <ul className="list-disc list-inside ml-4 space-y-2">
                            <li>To verify the authenticity of coupon codes and prevent fraudulent account activations.</li>
                            <li>To monitor and investigate suspicious activity and potential breaches of our Terms & Conditions.</li>
                            <li>To comply with all applicable local financial laws and regulations, including mandatory reporting.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-[--emerald] mb-3">3. How We Share Your Information</h2>
                        <p>We do not sell your personal data. We share your information only as necessary and under strict conditions:</p>
                        
                        <h3 className="text-xl font-semibold text-[--dark] mt-4 mb-2">3.1. With Other LDF Members (Limited Transparency)</h3>
                        <ul className="list-disc list-inside ml-4 space-y-2">
                            <li>**Referral Transparency:** Your username may be visible to the user whose referral link you used (your upline) and to users you directly refer (your downline) to facilitate team management and support.</li>
                            <li>**Matrix Transparency:** Your position in the matrix structure may be visible to your immediate upline and downline, but detailed personal contact information remains private.</li>
                        </ul>
                        
                        <h3 className="text-xl font-semibold text-[--dark] mt-4 mb-2">3.2. With Payment Service Providers</h3>
                        <p>
                            We share essential Financial Data (name, account number, amount) with trusted, PCI-compliant payment gateways (e.g., Paystack, Flutterwave) solely for the purpose of processing deposits and withdrawals.
                        </p>

                        <h3 className="text-xl font-semibold text-[--dark] mt-4 mb-2">3.3. Legal and Compliance</h3>
                        <p>
                            We may disclose your information if required to do so by law or in the good faith belief that such action is necessary to comply with legal obligations, protect the rights and safety of LDF or our users, or enforce our policies.
                        </p>
                    </section>
                    
                    <section>
                        <h2 className="text-2xl font-bold text-[--emerald] mb-3">4. Data Security and Retention</h2>
                        
                        <h3 className="text-xl font-semibold text-[--dark] mt-4 mb-2">4.1. Security Measures</h3>
                        <p>
                            We implement robust security measures, including data encryption (TLS/SSL), hashed password storage, and mandatory two-factor authentication for administrative access, to protect your data from unauthorized access, alteration, or disclosure.
                        </p>
                        
                        <h3 className="text-xl font-semibold text-[--dark] mt-4 mb-2">4.2. Audit Logging</h3>
                        <p>
                            Due to the financial nature of the Platform, all major transactional activities (payouts, withdrawals, status changes) are logged in a permanent, non-mutable audit trail. This log is essential for proving compliance and maintaining the integrity of the financial ledgers.
                        </p>
                        
                        <h3 className="text-xl font-semibold text-[--dark] mt-4 mb-2">4.3. Data Retention</h3>
                        <p>
                            We will retain your personal data for as long as your account is active and for a mandatory minimum period thereafter as required by financial auditing and regulatory laws. Financial transaction logs are kept indefinitely for audit purposes.
                        </p>
                    </section>
                    
                    <section>
                        <h2 className="text-2xl font-bold text-[--emerald] mb-3">5. Your Privacy Rights</h2>
                        <p>You have the following rights regarding your personal data held by LDF, subject to legal and financial limitations:</p>
                        <ul className="list-disc list-inside ml-4 space-y-2">
                            <li>**Right to Access:** You can request a copy of the personal data we hold about you.</li>
                            <li>**Right to Rectification:** You can request that we correct any inaccurate or incomplete data we hold about you (e.g., updating bank details).</li>
                            <li>**Right to Restriction of Processing:** You can request that we limit the way we use your data, especially if you contest its accuracy.</li>
                            <li>**Right to Deletion (Right to be Forgotten):** You may request that your account and associated personal data be deleted. However, due to legal auditing requirements, we cannot delete transactional or audit log data related to past earnings and withdrawals.</li>
                        </ul>
                    </section>
                    
                    <section>
                        <h2 className="text-2xl font-bold text-[--emerald] mb-3">6. Updates to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new Policy on our website and updating the "Effective Date" at the top of this document.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-[--emerald] mb-3">7. Contact Information</h2>
                        <p>If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:</p>
                        <div className="bg-gray-100 p-4 rounded-lg mt-3 font-medium">
                            <p><strong>LITTLE DROP FUND (LDF)</strong></p>
                            <p>Email: [Privacy Support Email Address, e.g., privacy@[YourDomain].com]</p>
                            <p>Support Portal: [Link to Support Portal]</p>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}