import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const faqs = [
  {
    question: "How can I track my order?",
    answer:
      "Once your order is shipped, you will receive a tracking link via email. You can also visit the Orders section in your dashboard to see live order status and tracking details.",
  },
  {
    question: "What if my payment failed but amount got deducted?",
    answer:
      "If your payment failed but the amount was deducted from your account, it will typically be refunded within 5–7 business days. You can also contact our support team at care@shopsphere.com for faster resolution.",
  },
  {
    question: "How do I request a return or replacement?",
    answer:
      "Go to your Orders section, select the item you want to return or replace, and click 'Request Return'. Our team will review your request and arrange a pickup within 2–3 business days.",
  },
  {
    question: "How quickly will support respond?",
    answer:
      "Our support team typically responds within 24 hours on business days. For urgent issues, you can reach us by phone at +91 98765 43210 during business hours (Mon–Sat, 9 AM – 6 PM IST).",
  },
  {
    question: "Can I change or cancel my order after placing it?",
    answer:
      "Orders can be cancelled or modified within 1 hour of placing them. After that, the order may already be processed for shipping. Visit the Orders tab in your dashboard and click 'Cancel Order' if the option is still available.",
  },
  {
    question: "How do I update my delivery address?",
    answer:
      "You can manage your saved addresses in the Addresses section of your dashboard. If an order is already placed, contact support immediately to request an address update before it ships.",
  },
];

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="support-faq-item rounded-xl border border-gray-100 bg-white overflow-hidden dark:border-[#1f2933] dark:bg-[#151e22]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="support-faq-button w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
          {question}
        </span>
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-gray-400 dark:text-slate-500 transition-transform duration-200 ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>

      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

function HelpSupportPage() {
  const navigate = useNavigate();

  return (
    <div className="support-page-shell space-y-6 min-w-0">
      {/* Contact Us + About Us Cards */}
      <div className="support-cards-grid grid gap-4 lg:gap-5 xl:grid-cols-2">
        {/* Contact Us */}
        <div className="support-info-card rounded-2xl border border-gray-100 bg-white p-6 dark:border-[#1f2933] dark:bg-[#151e22]">
          <h2 className="font-serif text-xl text-gray-900 dark:text-slate-100">
            Contact Us
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Need help with orders, account, or payments? Reach out to our
            support team.
          </p>
          <button
            type="button"
            onClick={() => navigate("/info/contact")}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#1a3b35] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#224a42] dark:bg-[#1e4038] dark:hover:bg-[#265449]"
          >
            Go To Contact Page
          </button>
        </div>

        {/* About Us */}
        <div className="support-info-card rounded-2xl border border-gray-100 bg-white p-6 dark:border-[#1f2933] dark:bg-[#151e22]">
          <h2 className="font-serif text-xl text-gray-900 dark:text-slate-100">
            About Us
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Learn more about ShopSphere, our mission, and how we support our
            customers.
          </p>
          <button
            type="button"
            onClick={() => navigate("/info/about")}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#1a3b35] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#224a42] dark:bg-[#1e4038] dark:hover:bg-[#265449]"
          >
            Go To About Page
          </button>
        </div>
      </div>

      {/* FAQs Section */}
      <div className="support-faq-shell rounded-2xl border border-gray-100 bg-white p-6 dark:border-[#1f2933] dark:bg-[#151e22]">
        <h2 className="font-serif text-xl text-gray-900 dark:text-slate-100">
          FAQs
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Quick answers for orders, payments, and returns.
        </p>

        <div className="mt-4 space-y-2">
          {faqs.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default HelpSupportPage;
