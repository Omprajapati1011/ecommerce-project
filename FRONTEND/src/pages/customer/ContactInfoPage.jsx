import { Mail, Phone, MapPin } from "lucide-react";

const contactSections = [
  {
    icon: Mail,
    title: "General Queries",
    description: "For account, delivery, or general help, write to our support team.",
    value: "support@shopsphere.com",
    href: "mailto:support@shopsphere.com",
  },
  {
    icon: Mail,
    title: "Order or Payment Issues",
    description:
      "If your payment failed, refund is delayed, or order has an issue, contact care.",
    value: "care@shopsphere.com",
    href: "mailto:care@shopsphere.com",
  },
  {
    icon: Phone,
    title: "Phone Support",
    description: "Speak with our support team during business hours.",
    value: "+91 98765 43210",
    href: "tel:+919876543210",
  },
  {
    icon: MapPin,
    title: "Registered Office",
    description: "Official company address for legal and business communication.",
    value: "Gandhinagar, India",
    href: null,
  },
];

function ContactInfoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-8">
      <h1 className="font-serif text-4xl text-gray-900 dark:text-slate-100">
        Contact Us
      </h1>
      <p className="mt-3 text-base text-gray-500 dark:text-slate-400">
        Reach us for orders, payments, account help, and support requests.
      </p>

      <div className="mt-10 space-y-4">
        {contactSections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 dark:border-[#1f2933] dark:bg-[#151e22]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <Icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                  {section.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  {section.description}
                </p>
                {section.href ? (
                  <a
                    href={section.href}
                    className="mt-2 inline-block text-sm font-medium text-gray-900 hover:text-amber-700 dark:text-slate-200 dark:hover:text-amber-300"
                  >
                    {section.value}
                  </a>
                ) : (
                  <p className="mt-2 text-sm font-medium text-gray-900 dark:text-slate-200">
                    {section.value}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ContactInfoPage;
