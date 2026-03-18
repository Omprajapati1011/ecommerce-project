import {
  HelpCircle,
  LayoutDashboard,
  MapPin,
  Package,
  Star,
  Shield,
  User,
} from "lucide-react";

export const cardPt = {
  body: { className: "p-0" },
  content: { className: "p-0" },
};

export const panelCardClassName =
  "rounded-2xl border border-[#ddcfb7] bg-[#f8f3ea] p-6 dark:border-[#1f2933] dark:bg-[#151e22]";

export const metricCardClassName =
  "rounded-2xl border border-[#ddcfb7] bg-[#f3ecdf] p-5 dark:border-[#1f2933] dark:bg-[#151e22]";

export const sidebarCardClassName =
  "h-fit rounded-3xl border border-[#ddcfb7] bg-[#f8f3ea] p-4 dark:border-[#1f2933] dark:bg-[#151e22]";

export const pageHeaderCardClassName =
  "rounded-3xl border border-[#ddcfb7] bg-[#f8f3ea] p-6 dark:border-[#1f2933] dark:bg-[#151e22]";

export const profileNav = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "profile", label: "Profile", icon: User },
  { key: "orders", label: "Orders", icon: Package },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "security", label: "Login & Security", icon: Shield },
  { key: "support", label: "Help & Support", icon: HelpCircle },
];

export const dashboardPlaceholderContent = {
  wishlist: {
    title: "Wishlist",
    text: "Wishlist UI is ready. Next step is wiring product save/remove endpoints.",
  },
  security: {
    title: "Login & Security",
    text: "Password update endpoint already exists; this section can be wired next for account security actions.",
  },
  support: {
    title: "Help & Support",
    text: "Support tickets and FAQ integration can be added in this section.",
  },
};

export const initialAddressForm = {
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India",
  is_default: false,
};
