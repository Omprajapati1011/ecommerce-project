import { Link, useLocation } from "react-router-dom";
import {
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  ShoppingBag,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const aboutLinks = [
  { label: "Contact Us", href: "/info/contact" },
  { label: "About Us", href: "/info/about" },
];

const helpLinks = [
  { label: "Payments", href: "/info/payments" },
  { label: "Shipping", href: "/info/shipping" },
  { label: "Cancellation & Returns", href: "/info/returns" },
  { label: "FAQ", href: "/dashboard?tab=support" },
];

const policyLinks = [
  { label: "Terms Of Use", href: "/info/terms" },
  { label: "Security", href: "/info/security" },
  { label: "Privacy", href: "/info/privacy" },
];

const socialLinks = [
  { icon: Twitter, label: "Twitter", href: "#" },
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Facebook, label: "Facebook", href: "#" },
  { icon: Youtube, label: "YouTube", href: "#" },
];

const paymentMethods = [
  "Visa",
  "Mastercard",
  "UPI",
  "PayPal",
  "Rupay",
  "NetBanking",
];

function isFooterLinkActive(href, pathname, search) {
  const [targetPath, targetQueryString = ""] = href.split("?");
  if (pathname !== targetPath) return false;
  if (!targetQueryString) return true;
  const targetParams = new URLSearchParams(targetQueryString);
  const currentParams = new URLSearchParams(search);
  for (const [key, value] of targetParams.entries()) {
    if (currentParams.get(key) !== value) return false;
  }
  return true;
}

function FooterNavLink({ href, label, pathname, search }) {
  const isActive = isFooterLinkActive(href, pathname, search);
  if (isActive) {
    return (
      <span
        aria-current="page"
        className="cursor-default text-sm font-medium text-amber-600 dark:text-amber-400"
      >
        {label}
      </span>
    );
  }
  return (
    <Link
      to={href}
      className="text-sm text-gray-500 transition-colors hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
    >
      {label}
    </Link>
  );
}

function Footer() {
  const { pathname, search } = useLocation();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white dark:border-[#1f2933] dark:bg-[#0f1519]">
      {/* Main footer body */}
      <div className="mx-auto w-full max-w-[1280px] px-4 py-12 md:px-8 lg:px-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2.5fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div className="space-y-5">
            <Link
              to="/"
              className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white shadow-md">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <span className="font-serif text-xl font-semibold text-gray-900 dark:text-slate-100">
                ShopSphere
              </span>
            </Link>

            <p className="text-sm leading-relaxed text-gray-500 dark:text-slate-400">
              Curated products across electronics, fashion, gaming, and home
              appliances. Premium shopping, simplified.
            </p>

            <div className="space-y-2 text-sm text-gray-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span>support@shopsphere.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span>1800-123-4567 (Toll Free)</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span>Infocity, Gandhinagar, Gujarat</span>
              </div>
            </div>

            {/* Social icons */}
            <div className="flex gap-2 pt-1">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:border-amber-400 hover:text-amber-600 dark:border-[#1f2933] dark:text-slate-500 dark:hover:border-amber-500 dark:hover:text-amber-400"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* About */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              About
            </h4>
            <ul className="mt-4 space-y-2.5">
              {aboutLinks.map((item) => (
                <li key={item.label}>
                  <FooterNavLink
                    href={item.href}
                    label={item.label}
                    pathname={pathname}
                    search={search}
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              Help
            </h4>
            <ul className="mt-4 space-y-2.5">
              {helpLinks.map((item) => (
                <li key={item.label}>
                  <FooterNavLink
                    href={item.href}
                    label={item.label}
                    pathname={pathname}
                    search={search}
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* Consumer Policy */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              Consumer Policy
            </h4>
            <ul className="mt-4 space-y-2.5">
              {policyLinks.map((item) => (
                <li key={item.label}>
                  <FooterNavLink
                    href={item.href}
                    label={item.label}
                    pathname={pathname}
                    search={search}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200 dark:border-[#1f2933]">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-4 px-4 py-5 md:flex-row md:justify-between md:px-8 lg:px-12">
          <p className="text-xs text-gray-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} ShopSphere, Inc. All rights
            reserved.
          </p>

          {/* Payment methods */}
          <div className="flex flex-wrap items-center gap-1.5">
            {paymentMethods.map((method) => (
              <span
                key={method}
                className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:border-[#1f2933] dark:bg-[#151e22] dark:text-slate-500"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
