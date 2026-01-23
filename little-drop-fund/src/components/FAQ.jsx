// src/components/FAQ.jsx
import useScrollAnimation from "../hooks/useScrollAnimation";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function FAQ() {
  const ref = useScrollAnimation();
  const [openIndex, setOpenIndex] = useState(null);

  const faq = [
    {
      question: "What is Little Drop Fund?",
      answer:
        "Little Drop Fund is a community-driven earning platform where members earn through referrals, matrix bonuses, and community profit sharing, backed by a high-value Stock Market Masterclass."
    },
    {
      question: "How much is activation?",
      answer:
        "You activate your account with a one-time ₦5,000 coupon. This is the only cost, and it grants you lifetime access to the product and earning system."
    },
    {
      question: "How do I earn?",
      answer:
        "You earn through three main streams: 1) Direct Referrals (₦2,500 instant bonus), 2) Matrix Bonuses (up to 5 levels deep), and 3) Global Pool Payouts (monthly dividends for all active members)."
    },
    {
      question: "Is this a loan or investment company?",
      answer:
        "No. LDF is a digital affiliate community. It is not an investment, loan, or get-rich-quick scheme. Earnings are based solely on participation, team building, and community activity."
    },
    {
      question: "Can I join without referring?",
      answer:
      "Yes. While referrals unlock the fastest income stream, members who do not refer can still earn matrix spillover and monthly dividends from the community business pool."
    },
    {
      question: "How do I withdraw?",
      answer:
        "All withdrawals are processed automatically to your registered bank account once you meet the minimum threshold, typically within 24-48 hours."
    }
  ];

  const toggle = (i) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section
      id="faq"
      ref={ref}
      className="animate-section py-20 px-6 bg-gray-50"
    >
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-[--dark] mb-12">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faq.map((item, i) => (
            <div
              key={i}
              // Enhanced card styling
              className="bg-white border border-gray-100 rounded-xl shadow-soft hover:shadow-lg transition-fast overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between p-5 text-left"
                onClick={() => toggle(i)}
              >
                <span className="text-lg font-semibold text-[--dark]">
                  {item.question}
                </span>
                <ChevronDown
                  className={`w-6 h-6 text-[--emerald] transition-transform duration-300 ${
                    openIndex === i ? "rotate-180" : "rotate-0"
                  }`}
                />
              </button>

              {/* Conditional Answer Display with smoother transition appearance */}
              <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                  <div className="px-5 pb-5 text-gray-600 leading-relaxed border-t border-gray-50/50 pt-2">
                    {item.answer}
                  </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}