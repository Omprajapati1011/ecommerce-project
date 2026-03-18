import { FileText, Scale, AlertTriangle } from "lucide-react";

const sections = [
  {
    icon: FileText,
    title: "Acceptance of Terms",
    description:
      "By using ShopSphere, you agree to follow our terms, policies, and applicable laws while browsing or placing orders.",
  },
  {
    icon: Scale,
    title: "User Responsibilities",
    description:
      "Please provide accurate account, shipping, and payment details. Misuse, fraud, or policy abuse may result in account restriction.",
  },
  {
    icon: AlertTriangle,
    title: "Service Availability",
    description:
      "We may update products, pricing, and platform features anytime to improve service quality and customer experience.",
  },
];

function TermsInfoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-8">
      <h1 className="font-serif text-4xl text-gray-900 dark:text-slate-100">
        Terms Of Use
      </h1>
      <p className="mt-3 text-base text-gray-500 dark:text-slate-400">
        These terms explain the rules and responsibilities for using ShopSphere.
      </p>

      <div className="mt-10 space-y-4">
        {sections.map((section) => {
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TermsInfoPage;
