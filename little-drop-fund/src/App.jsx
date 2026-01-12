// src/App.jsx



import { Routes, Route, Navigate } from "react-router-dom"; 

// --- CORE LAYOUT & PAGES ---
import DashboardLayout from "./components/DashboardLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage"; 
import SignupPage from "./pages/SignupPage"; 
import AgentsPage from "./pages/AgentsPage"; 
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions"; 
import BackToTopButton from "./components/BackToTopButton"; 
import ForgotPassword from "./pages/ForgotPassword"; // 🛑 NEW IMPORT FOR PASSWORD RESET

// --- DASHBOARD CONTENT PAGES (Ensure these files exist in src/pages/Dashboard) ---
import DashboardHome from "./pages/Dashboard/DashboardHome";
import MatrixView from "./pages/Dashboard/MatrixView";
import WalletPage from "./pages/Dashboard/WalletPage";
import SettingsPage from "./pages/Dashboard/SettingsPage";
import MasterclassAccess from "./pages/Dashboard/MasterclassAccess";
import AgentDashboard from "./pages/Dashboard/AgentDashboard";


// Authentication check using utility
import { isAuthenticated as checkAuth } from './utils/auth'; 


// Component that handles all Authenticated Routes and applies the Layout
const AppRoutes = () => (
 // Check to redirect unauthorized users
 !checkAuth() ? (
 <Navigate to="/login" replace />
 ) : (
 <DashboardLayout>
{/* All authenticated pages are defined within the layout */}
 <Routes>
 <Route path="/" element={<DashboardHome />} />
 <Route path="matrix" element={<MatrixView />} />
 <Route path="earnings" element={<WalletPage />} /> 
 <Route path="wallet" element={<WalletPage />} /> 
 <Route path="masterclass" element={<MasterclassAccess />} />
 <Route path="settings" element={<SettingsPage />} />
 <Route path="/dashboard" element={<DashboardHome />} />
<Route path="/dashboard/settings" element={<SettingsPage />} />
 <Route path="agent" element={<AgentDashboard />} />
 <Route path="premium" element={<div>Premium Upgrade Page (Coming Soon)</div>} />

 {/* Catch-all for dashboard errors */}
 <Route path="*" element={<div>404 Dashboard Page Not Found</div>} />
 </Routes>
 </DashboardLayout>
 )
);


export default function App() {
 return (
 <div className="w-full overflow-x-hidden bg-white text-gray-800">
 
 <Routes>
 {/* PUBLIC ROUTES */}
 <Route path="/" element={<LandingPage />} /> 
 <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} /> {/* 🛑 NEW ROUTE ADDED */}
 <Route path="/signup" element={<SignupPage />} /> 
 <Route path="/agents" element={<AgentsPage />} /> 
 
 {/* LEGAL ROUTES */}
 <Route path="/privacy" element={<PrivacyPolicy />} /> 
 <Route path="/terms" element={<TermsAndConditions />} /> 
 {/* AUTHENTICATED ROUTES */}
 <Route path="/app/*" element={<AppRoutes />} />
 
 {/* Catch-all for non-existent public pages */}
 <Route path="*" element={<div>404 Page Not Found</div>} />
 </Routes>
 
 <BackToTopButton />

 </div>
 );
}