import { useState } from "react";

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
  const [showSignup, setShowSignup] = useState(false);

  const openSignup = () => setShowSignup(true);
  const closeSignup = () => setShowSignup(false);

  return (
    <div className="w-full overflow-x-hidden bg-white text-gray-800">
      {/* Signup Modal */}
      {showSignup && <SignupModal onClose={closeSignup} />}

      <Navbar onOpenSignup={openSignup} />

      <Hero onOpenSignup={openSignup} />

      <Features />

      <Streams />

      <PremiumInvestment />

      <TopEarners />

      <CommunityImpact />

      <MatrixEarnings />

      <FAQ />

      <Disclaimer />

      <CTA onOpenSignup={openSignup} />

      <Footer />
    </div>
  );
}
