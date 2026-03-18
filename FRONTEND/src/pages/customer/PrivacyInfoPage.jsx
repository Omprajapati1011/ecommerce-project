import { EyeOff, Database, UserCheck } from "lucide-react";

const privacyItems = [
  {
    icon: Database,
    title: "What We Collect",
    description:
      "We collect only necessary information such as account details, order data, and delivery information to serve you better.",
  },
  {
    icon: EyeOff,
    title: "How We Use It",
    description:
      "Your data is used for order processing, customer support, service improvements, and relevant communication.",
  },
  {
    icon: UserCheck,
    title: "Your Control",
    description:
      "You can request profile updates, manage communication preferences, and contact support for privacy-related concerns.",
  },
];

function PrivacyInfoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-8">
      <h1 className="font-serif text-4xl text-gray-900 dark:text-slate-100">
        Privacy
      </h1>
      <p className="mt-3 text-base text-gray-500 dark:text-slate-400">
        We are committed to protecting your information and being transparent
        about how data is used.
      </p>

      <div className="mt-10 space-y-4">
        {privacyItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 dark:border-[#1f2933] dark:bg-[#151e22]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <Icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PrivacyInfoPage;
