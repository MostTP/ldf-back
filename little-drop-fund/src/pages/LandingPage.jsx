// src/pages/LandingPage.jsx (Content moved from old App.jsx return)

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Streams from "../components/Streams";
import Testimonials from "../components/Testimonials"; 
import Features from "../components/Features";
import MatrixEarnings from "../components/MatrixEarnings";
import PremiumInvestment from "../components/PremiumInvestment";
import TopEarners from "../components/TopEarners";
import CommunityImpact from "../components/CommunityImpact";
import FAQ from "../components/FAQ";
import Disclaimer from "../components/Disclaimer";
import CTA from "../components/CTA";
import Footer from "../components/Footer";

export default function LandingPage({ onOpenSignup }) {
  return (
    <>
      <Navbar onOpenSignup={onOpenSignup} />
      <Hero onOpenSignup={onOpenSignup} />
      <Streams />
      <Features />
      <MatrixEarnings />
      <PremiumInvestment />
      <TopEarners />
      <Testimonials />
      <CommunityImpact />
      <FAQ />
      <Disclaimer />
      <CTA onOpenSignup={onOpenSignup} />
      <Footer />
    </>
  );
} 