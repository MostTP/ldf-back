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
        "Little Drop Fund is a community-driven earning platform where members earn through referrals, matrix bonuses, and community profit sharing."
    },
    {
      question: "How much is activation?",
      answer:
        "You activate your account with a one-time ₦3,000 coupon. No renewal fees are required."
    },
    {
      question: "How do I earn?",
      answer:
        "You earn through direct referrals (₦1,500 each), indirect matrix bonuses, leadership rewards, and community monthly pool distribution."
    },
    {
      question: "Is this a loan or investment company?",
      answer:
        "No. LDF is not a loan, investment, or get-rich-quick scheme. Earnings depend on participation and teamwork."
    },
    {
      question: "Can I join without referring?",
      answer:
        "Yes. Members who do not refer can still earn monthly from the community business pool."
    },
    {
      question: "How do I withdraw?",
      answer:
        "All withdrawals are processed automatically to your registered account once you meet the minimum threshold."
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
        <h2 className="text-3xl font-bold text-center text-emerald-700 mb-10">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faq.map((item, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl shadow-sm"
            >
              <button
                className="w-full flex items-center justify-between p-5 text-left"
                onClick={() => toggle(i)}
              >
                <span className="text-lg font-semibold text-gray-800">
                  {item.question}
                </span>
                <ChevronDown
                  className={`w-6 h-6 text-emerald-600 transition-transform ${
                    openIndex === i ? "rotate-180" : "rotate-0"
                  }`}
                />
              </button>

              {openIndex === i && (
                <div className="px-5 pb-5 text-gray-600 leading-relaxed">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
