import { useState } from "react";

// Components
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Streams from "./components/Streams";
import PremiumInvestment from "./components/PremiumInvestment";
import TopEarners from "./components/TopEarners";
import CommunityImpact from "./components/CommunityImpact";
import MatrixEarnings from "./components/MatrixEarnings";
import FAQ from "./components/FAQ";
import Disclaimer from "./components/Disclaimer";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import SignupModal from "./components/SignupModal";

export default function App() {
  // MODAL CONTROL
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  const openSignup = () => setIsSignupOpen(true);
  const closeSignup = () => setIsSignupOpen(false);

  return (
    <div className="font-sans bg-white text-gray-900">

      {/* NAVBAR (Pass openSignup to handle Sign Up button) */}
      <Navbar openSignup={openSignup} />

      {/* HERO */}
      <Hero openSignup={openSignup} />

      {/* FEATURES */}
      <Features />

      {/* 3 STREAMS OF INCOME */}
      <Streams />

      {/* PREMIUM INVESTMENT SECTION */}
      <PremiumInvestment />

      {/* TOP EARNERS */}
      <TopEarners />

      {/* COMMUNITY IMPACT */}
      <CommunityImpact />

      {/* MATRIX & EARNINGS */}
      <MatrixEarnings />

      {/* FAQ */}
      <FAQ />

      {/* DISCLAIMER */}
      <Disclaimer />

      {/* CTA SECTION */}
      <CTA openSignup={openSignup} />

      {/* FOOTER */}
      <Footer />

      {/* SIGNUP MODAL */}
      <SignupModal isOpen={isSignupOpen} onClose={closeSignup} />
    </div>
  );
}
