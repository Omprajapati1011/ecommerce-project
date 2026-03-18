import { Lock, ShieldCheck, KeyRound } from "lucide-react";

const securityPoints = [
  {
    icon: Lock,
    title: "Secure Data Handling",
    description:
      "We use encryption and security best practices to protect personal and payment-related information.",
  },
  {
    icon: ShieldCheck,
    title: "Protected Transactions",
    description:
      "Checkout flows are protected to reduce fraud risk and keep payment operations safe.",
  },
  {
    icon: KeyRound,
    title: "Account Safety Tips",
    description:
      "Use strong passwords, keep login details private, and report suspicious activity to support immediately.",
  },
];

function SecurityInfoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-8">
      <h1 className="font-serif text-4xl text-gray-900 dark:text-slate-100">
        Security
      </h1>
      <p className="mt-3 text-base text-gray-500 dark:text-slate-400">
        Your privacy and account protection are core priorities at ShopSphere.
      </p>

      <div className="mt-10 space-y-4">
        {securityPoints.map((point) => {
          const Icon = point.icon;
          return (
            <div
              key={point.title}
              className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 dark:border-[#1f2933] dark:bg-[#151e22]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <Icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                  {point.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  {point.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SecurityInfoPage;
