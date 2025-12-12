// src/pages/LandingPage.jsx
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Testimonials from "../components/Testimonials"; 
import Features from "../components/Features";
import Streams from "../components/Streams";
import MatrixEarnings from "../components/MatrixEarnings";
import PremiumInvestment from "../components/PremiumInvestment";
import TopEarners from "../components/TopEarners";
import CommunityImpact from "../components/CommunityImpact";
import FAQ from "../components/FAQ";
import Disclaimer from "../components/Disclaimer";
import CTA from "../components/CTA";
import Footer from "../components/Footer";
import { useNavigate } from 'react-router-dom'; // 🛑 NEW IMPORT

export default function LandingPage() { 
    // 🛑 Removed { onOpenSignup } prop
    const navigate = useNavigate();
    
    // Function to navigate to the dedicated Signup Page
    const handleOpenSignup = () => {
        navigate('/signup');
    };

  return (
    <>
      {/* Pass the new navigation function to Navbar and CTA */}
      <Navbar onOpenSignup={handleOpenSignup} />
      <Hero onOpenSignup={handleOpenSignup} />
      
      {/* Ensure Streams is before Features */}
      <Streams /> 
      <Features />
      
      <MatrixEarnings />
      <PremiumInvestment />
      <TopEarners />
      <Testimonials />
      <CommunityImpact />
      <FAQ />
      <Disclaimer />
      <CTA onOpenSignup={handleOpenSignup} />
      <Footer />
    </>
  );
}