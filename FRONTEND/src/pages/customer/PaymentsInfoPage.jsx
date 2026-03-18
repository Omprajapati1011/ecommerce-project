import { CreditCard, Smartphone, Landmark, ShieldCheck } from "lucide-react";

const methods = [
  {
    icon: CreditCard,
    title: "Credit & Debit Cards",
    description:
      "We accept all major cards — Visa, Mastercard, RuPay, and American Express. Payments are encrypted and processed securely.",
  },
  {
    icon: Smartphone,
    title: "UPI",
    description:
      "Pay instantly using any UPI app — Google Pay, PhonePe, Paytm, BHIM, and more. No extra charges.",
  },
  {
    icon: Landmark,
    title: "Net Banking",
    description:
      "Use your bank's internet banking portal to complete the payment. Supported for all major Indian banks.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Checkout",
    description:
      "All transactions are SSL-encrypted. We never store your card details on our servers.",
  },
];

function PaymentsInfoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-8">
      <h1 className="font-serif text-4xl text-gray-900 dark:text-slate-100">
        Payment Methods
      </h1>
      <p className="mt-3 text-base text-gray-500 dark:text-slate-400">
        ShopSphere supports multiple secure payment options for a smooth
        checkout experience.
      </p>

      <div className="mt-10 space-y-4">
        {methods.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.title}
              className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 dark:border-[#1f2933] dark:bg-[#151e22]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <Icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                  {m.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  {m.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PaymentsInfoPage;
