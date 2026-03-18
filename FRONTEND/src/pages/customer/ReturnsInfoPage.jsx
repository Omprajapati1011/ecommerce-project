import { RotateCcw, PackageX, Clock, Phone } from "lucide-react";

const details = [
  {
    icon: RotateCcw,
    title: "Return Policy",
    description:
      "Most items can be returned within 7 days of delivery. The product must be unused, in original packaging, and with all tags intact.",
  },
  {
    icon: PackageX,
    title: "Non-Returnable Items",
    description:
      "Perishable goods, digital products, personalized items, and items marked as non-returnable on the product page are not eligible for return.",
  },
  {
    icon: Clock,
    title: "Refund Timeline",
    description:
      "Once your return is received and inspected, refunds are processed within 5–7 business days to your original payment method.",
  },
  {
    icon: Phone,
    title: "How to Request",
    description:
      "Go to Dashboard → Orders, select your order, and choose Return or Replacement. You can also contact our support team for help.",
  },
];

function ReturnsInfoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-8">
      <h1 className="font-serif text-4xl text-gray-900 dark:text-slate-100">
        Cancellation &amp; Returns
      </h1>
      <p className="mt-3 text-base text-gray-500 dark:text-slate-400">
        Our hassle-free return and cancellation policy — shop with confidence.
      </p>

      <div className="mt-10 space-y-4">
        {details.map((item) => {
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

export default ReturnsInfoPage;
