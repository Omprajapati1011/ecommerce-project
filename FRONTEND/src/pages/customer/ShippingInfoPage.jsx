import { Truck, Clock, MapPin, PackageCheck } from "lucide-react";

const details = [
  {
    icon: Truck,
    title: "Standard Delivery",
    description:
      "Delivered within 5–7 business days. Available across India. Free on orders above Rs. 499.",
  },
  {
    icon: Clock,
    title: "Express Delivery",
    description:
      "Delivered within 1–2 business days for select pin codes. Additional charges may apply.",
  },
  {
    icon: MapPin,
    title: "Delivery Areas",
    description:
      "We ship to 19,000+ pin codes across India. Enter your pin code at checkout to check availability.",
  },
  {
    icon: PackageCheck,
    title: "Order Tracking",
    description:
      "Once shipped, you will receive a tracking link via email. You can also track from Dashboard → Orders.",
  },
];

function ShippingInfoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-8">
      <h1 className="font-serif text-4xl text-gray-900 dark:text-slate-100">
        Shipping Policy
      </h1>
      <p className="mt-3 text-base text-gray-500 dark:text-slate-400">
        Everything you need to know about how we deliver your orders safely and
        on time.
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

export default ShippingInfoPage;
