import { Target, HeartHandshake, Sparkles } from "lucide-react";

const aboutSections = [
  {
    icon: Target,
    title: "Our Mission",
    description:
      "ShopSphere is built to make online shopping simple, reliable, and enjoyable for every customer.",
  },
  {
    icon: HeartHandshake,
    title: "Customer First",
    description:
      "We focus on trusted product quality, fair policies, and responsive support across the shopping journey.",
  },
  {
    icon: Sparkles,
    title: "What We Offer",
    description:
      "Curated collections in electronics, fashion, gaming, and home essentials with a clean, modern experience.",
  },
];

function AboutInfoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-8">
      <h1 className="font-serif text-4xl text-gray-900 dark:text-slate-100">
        About Us
      </h1>
      <p className="mt-3 text-base text-gray-500 dark:text-slate-400">
        Learn about ShopSphere and what drives our platform.
      </p>

      <div className="mt-10 space-y-4">
        {aboutSections.map((section) => {
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

export default AboutInfoPage;
