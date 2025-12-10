// src/App.jsx

import { useState } from "react";
import { Routes, Route } from "react-router-dom"; 
import SignupModal from "./components/SignupModal";

// --- CORE LAYOUT & PAGES ---
import DashboardLayout from "./components/DashboardLayout";
import LandingPage from "./pages/LandingPage"; // Public Content
import LoginPage from "./pages/LoginPage"; // Auth Page

// --- DASHBOARD CONTENT PAGES (New Pages) ---
import DashboardHome from "./pages/Dashboard/DashboardHome";
import MatrixView from "./pages/Dashboard/MatrixView";
import WalletPage from "./pages/Dashboard/WalletPage"; // Assuming you named it WalletPage.jsx
import SettingsPage from "./pages/Dashboard/SettingsPage"; // Assuming you named it SettingsPage.jsx
import MasterclassAccess from "./pages/Dashboard/MasterclassAccess";


// Component that handles all Dashboard Routes and applies the Layout
const DashboardRoutes = () => (
  <DashboardLayout>
    {/* All authenticated pages are defined within the layout */}
    <Routes>
      <Route index element={<DashboardHome />} />
      <Route path="matrix" element={<MatrixView />} />
      <Route path="earnings" element={<WalletPage />} /> {/* Using WalletPage for earnings/payouts */}
      <Route path="wallet" element={<WalletPage />} /> {/* Duplicating for Wallet route */}
      <Route path="masterclass" element={<MasterclassAccess />} />
      <Route path="settings" element={<SettingsPage />} />
      
      {/* Premium Upgrade is a simplified placeholder for now */}
      <Route path="premium" element={<div>Premium Upgrade Page (Coming Soon)</div>} />

      {/* Catch-all for dashboard errors */}
      <Route path="*" element={<div>404 Dashboard Page Not Found</div>} />
    </Routes>
  </DashboardLayout>
);


export default function App() {
  const [showSignup, setShowSignup] = useState(false);

  const openSignup = () => setShowSignup(true);
  const closeSignup = () => setShowSignup(false);

  return (
    <div className="w-full overflow-x-hidden bg-white text-gray-800">
      
      {/* Signup Modal (Renders globally outside router) */}
      {showSignup && <SignupModal onClose={closeSignup} />}

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<LandingPage onOpenSignup={openSignup} />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* AUTHENTICATED DASHBOARD ROUTES */}
        <Route path="/dashboard/*" element={<DashboardRoutes />} />
        
        {/* Catch-all for non-existent public pages */}
        <Route path="*" element={<div>404 Page Not Found</div>} />
      </Routes>
    </div>
  );
}