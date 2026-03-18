/**
 * @component AdminDashboardPage
 * @description Main admin dashboard with collapsible sidebar navigation
 * and lazy-loaded tab content.
 *
 * Architecture:
 *  - Sidebar: Renders `adminNav` config with collapsible "Products" submenu.
 *             Persists open/closed state in localStorage.
 *  - Tabs:   Hash-based routing (#products-list, #orders, etc.) enables
 *            browser back/forward and deep-linking.
 *  - Content: Each tab is React.lazy() code-split; wrapped in <Suspense>
 *             with a skeleton fallback.
 *
 * UI libraries: PrimeReact (Button, Card, Skeleton), lucide-react icons
 * State: Redux (auth/currentUser), ThemeContext (dark mode)
 *
 * Consumed by: AdminLayout → <Outlet /> renders this page
 */
import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Skeleton } from "primereact/skeleton";
import {
  BarChart3,
  CreditCard,
  Gift,
  LogOut,
  Moon,
  Package,
  Star,
  Sun,
  Users,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { logoutUser } from "../../redux/slices/authSlice";
import { useTheme } from "../../context/ThemeContext";
import "./AdminDashboard.css";

const adminNav = [
  { key: "users", label: "Users", icon: Users },
  {
    key: "products",
    label: "Products",
    icon: Package,
    children: [
      { key: "products-list", label: "Products" },
      { key: "products-categories", label: "Categories" },
      { key: "products-portions", label: "Portions" },
      { key: "products-modifiers", label: "Modifiers" },
    ],
  },
  { key: "orders", label: "Orders & Payments", icon: CreditCard },
  { key: "offers", label: "Offers", icon: Gift },
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "reports", label: "Reports", icon: BarChart3 },
];

const AdminProductsTab = lazy(() => import("./AdminProductsTab"));
const AdminCategoriesTab = lazy(() => import("./AdminCategoriesTab"));
const AdminPortionsTab = lazy(() => import("./AdminPortionsTab"));
const AdminModifiersTab = lazy(() => import("./AdminModifiersTab"));
const AdminUsersTab = lazy(() => import("./AdminUsersTab"));
const AdminOrdersTab = lazy(() => import("./AdminOrdersTab"));
const AdminReportsTab = lazy(() => import("./AdminReportsTab"));
const AdminReviewsTab = lazy(() => import("./AdminReviewsTab"));
const AdminOffersTab = lazy(() => import("./AdminOffersTab"));

// Collect all valid tab keys for hash validation
const validTabKeys = new Set(
  adminNav.flatMap((item) =>
    item.children ? item.children.map((c) => c.key) : [item.key],
  ),
);

const DEFAULT_TAB = "users";

/** Read tab key from URL hash, fallback to default */
function getTabFromHash() {
  const hash = window.location.hash.replace("#", "");
  return validTabKeys.has(hash) ? hash : DEFAULT_TAB;
}

const TabLoader = () => (
  <div className="space-y-4">
    <div className="flex gap-4">
      <Skeleton width="10rem" height="2rem" />
      <Skeleton width="10rem" height="2rem" />
    </div>
    <Skeleton width="100%" height="20rem" />
  </div>
);

const SidebarContent = ({
  currentUser,
  darkMode,
  toggleDarkMode,
  handleLogout,
  adminNav,
  activeTab,
  setActiveTab,
  productsOpen,
  setProductsOpen,
  onNavClick,
}) => (
  <>
    <div className="flex-shrink-0 relative overflow-hidden rounded-2xl bg-[#163332] px-6 py-8 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.06),transparent_70%)]" />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-3 flex items-center gap-2">
          <img src="/logo.svg" alt="ShopSphere" className="h-10 w-10" />
          <span className="font-serif text-2xl font-semibold tracking-tight text-white">
            ShopSphere
          </span>
        </div>
        <p className="font-serif text-xs font-medium tracking-[0.2em] text-[#c9b88a]">
          ADMIN PANEL
        </p>
        <h1
          className="mt-2 w-full truncate font-sans text-lg font-medium tracking-tight text-white/80 antialiased"
          title={currentUser?.email}
        >
          {currentUser?.email}
        </h1>
      </div>
    </div>

    <nav className="admin-sidebar-nav mt-4 space-y-1 flex-1 overflow-y-auto min-h-0">
      {adminNav.map((item) => {
        const Icon = item.icon;
        const isActive = item.key === activeTab;
        const hasChildren = Boolean(item.children?.length);

        if (!hasChildren) {
          return (
            <Button
              key={item.key}
              type="button"
              onClick={() => {
                setActiveTab(item.key);
                onNavClick?.();
              }}
              className={`!flex !w-full !items-center !gap-3 !rounded-xl !px-3 !py-3 !text-left !text-sm !font-medium !shadow-none ${isActive ? "!bg-amber-600 !text-white !shadow-lg !shadow-amber-600/20" : "!bg-transparent !text-gray-700 hover:!bg-amber-50 hover:!text-amber-700 dark:!text-slate-300 dark:hover:!bg-slate-800 dark:hover:!text-amber-300"}`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Button>
          );
        }

        const childActive = item.children.some(
          (child) => child.key === activeTab,
        );

        return (
          <div key={item.key} className="space-y-1">
            <Button
              type="button"
              onClick={() => setProductsOpen((prev) => !prev)}
              className={`!flex !w-full !items-center !justify-between !rounded-xl !px-3 !py-3 !text-left !text-sm !font-medium !shadow-none ${childActive ? "!bg-amber-600 !text-white !shadow-lg !shadow-amber-600/20" : "!bg-transparent !text-gray-700 hover:!bg-amber-50 hover:!text-amber-700 dark:!text-slate-300 dark:hover:!bg-slate-800 dark:hover:!text-amber-300"}`}
            >
              <span className="inline-flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition ${productsOpen ? "rotate-180" : ""}`}
              />
            </Button>

            {productsOpen && (
              <div className="ml-8 space-y-1">
                {item.children.map((child) => (
                  <Button
                    key={child.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(child.key);
                      onNavClick?.();
                    }}
                    className={`!flex !w-full !items-center !rounded-lg !px-3 !py-2 !text-left !text-sm !font-medium !shadow-none ${activeTab === child.key ? "!bg-amber-100 !text-amber-800 dark:!bg-amber-500/20 dark:!text-amber-200" : "!bg-transparent !text-gray-600 hover:!bg-amber-50 hover:!text-amber-700 dark:!text-slate-400 dark:hover:!bg-slate-800 dark:hover:!text-amber-300"}`}
                  >
                    {child.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>

    <div className="flex-shrink-0 mt-4 border-t border-gray-200 pt-4 dark:border-gray-700 space-y-1">
      <Button
        type="button"
        onClick={toggleDarkMode}
        className="!flex !w-full !items-center !gap-3 !rounded-xl !px-3 !py-3 !text-left !text-sm !font-medium !shadow-none !bg-transparent !text-gray-700 hover:!bg-amber-50 hover:!text-amber-700 dark:!text-slate-300 dark:hover:!bg-slate-800 dark:hover:!text-amber-300"
      >
        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        {darkMode ? "Light Mode" : "Dark Mode"}
      </Button>
      <Button
        type="button"
        onClick={handleLogout}
        className="!flex !w-full !items-center !gap-3 !rounded-xl !px-3 !py-3 !text-left !text-sm !font-medium !shadow-none !bg-transparent !text-red-600 hover:!bg-red-50 dark:!text-red-400 dark:hover:!bg-red-500/10"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </div>
  </>
);

function AdminDashboardPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.auth);
  const { darkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTabState] = useState(getTabFromHash);
  const [productsOpen, setProductsOpen] = useState(() => {
    // Auto-expand products section if a product child tab is active
    const tab = getTabFromHash();
    return (
      adminNav
        .find((item) => item.children)
        ?.children.some((c) => c.key === tab) ?? true
    );
  });

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const stored = localStorage.getItem("admin-sidebar-open");
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("admin-sidebar-open", String(next));
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  // Wrap setActiveTab to also update the URL hash
  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    window.location.hash = tab;
  }, []);

  const handleLogout = useCallback(() => {
    dispatch(logoutUser());
    navigate("/login");
  }, [dispatch, navigate]);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const onHashChange = () => {
      const tab = getTabFromHash();
      setActiveTabState(tab);
      // Auto-expand products section if navigating to a child tab
      const productsNav = adminNav.find((item) => item.children);
      if (productsNav?.children.some((c) => c.key === tab)) {
        setProductsOpen(true);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const activeLabel = useMemo(() => {
    for (const item of adminNav) {
      if (item.key === activeTab) return item.label;
      for (const child of item.children || []) {
        if (child.key === activeTab) return `${item.label} - ${child.label}`;
      }
    }
    return "Dashboard";
  }, [activeTab]);

  useEffect(() => {
    if (mobileSidebarOpen) {
      setMobileSidebarOpen(false);
    }
  }, [activeTab]);

  return (
    <div
      className={`admin-dashboard-grid grid items-start gap-6 p-6 ${sidebarOpen ? "lg:grid-cols-[290px_1fr]" : "lg:grid-cols-1"}`}
    >
      <div
        className={`rounded-3xl border border-gray-100 bg-white p-4 dark:border-[#1f2933] dark:bg-[#151e22] max-h-[calc(100vh-3rem)] sticky top-6 overflow-hidden flex-col transition-all duration-300 hidden lg:flex ${sidebarOpen ? "opacity-100" : "lg:hidden"}`}
      >
        <SidebarContent
          currentUser={currentUser}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          handleLogout={handleLogout}
          adminNav={adminNav}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          productsOpen={productsOpen}
          setProductsOpen={setProductsOpen}
        />
      </div>

      <section className="min-w-[0] min-h-0 h-full">
        <Card
          className="rounded-2xl border border-gray-100 bg-white pt-6 px-6 pb-1 dark:border-[#1f2933] dark:bg-[#151e22] shadow-sm h-full overflow-hidden"
          pt={{
            body: { className: "p-0 h-full flex flex-col" },
            content: {
              className:
                "admin-tab-content p-0 flex-1 flex flex-col min-h-0 overflow-y-auto",
            },
          }}
        >
          <div className="mb-4 flex items-center gap-3">
            <Button
              type="button"
              onClick={() => setMobileSidebarOpen((prev) => !prev)}
              className="!flex lg:!hidden !items-center !justify-center !w-9 !h-9 !p-0 !rounded-lg !shadow-none !bg-transparent !text-gray-500 hover:!bg-gray-100 hover:!text-gray-700 dark:!text-gray-400 dark:hover:!bg-gray-800 dark:hover:!text-gray-200 !transition-colors !border-none"
              aria-label={mobileSidebarOpen ? "Close menu" : "Open menu"}
            >
              {mobileSidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeft className="h-5 w-5" />
              )}
            </Button>

            <Button
              type="button"
              onClick={toggleSidebar}
              className="!hidden lg:!flex !items-center !justify-center !w-9 !h-9 !p-0 !rounded-lg !shadow-none !bg-transparent !text-gray-500 hover:!bg-gray-100 hover:!text-gray-700 dark:!text-gray-400 dark:hover:!bg-gray-800 dark:hover:!text-gray-200 !transition-colors !border-none"
              tooltip={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              tooltipOptions={{ position: "right" }}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeft className="h-5 w-5" />
              )}
            </Button>
            <div>
              <h3 className="font-serif text-2xl text-gray-900 dark:text-slate-100">
                {activeLabel}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                Manage {activeLabel.toLowerCase()} here.
              </p>
            </div>
          </div>

          <Suspense fallback={<TabLoader />}>
            <div className="admin-tab-content flex-1 overflow-y-auto min-h-0">
              {activeTab === "products-list" ? (
                <AdminProductsTab />
              ) : activeTab === "products-categories" ? (
                <AdminCategoriesTab />
              ) : activeTab === "products-portions" ? (
                <AdminPortionsTab />
              ) : activeTab === "products-modifiers" ? (
                <AdminModifiersTab />
              ) : activeTab === "users" ? (
                <AdminUsersTab />
              ) : activeTab === "orders" ? (
                <AdminOrdersTab />
              ) : activeTab === "reviews" ? (
                <AdminReviewsTab />
              ) : activeTab === "offers" ? (
                <AdminOffersTab />
              ) : activeTab === "reports" ? (
                <AdminReportsTab />
              ) : (
                <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {activeLabel} view is ready for backend/API integration.
                  </p>
                </div>
              )}
            </div>
          </Suspense>
        </Card>
      </section>

      {mobileSidebarOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-[1100] bg-black/40 lg:hidden"
          />

          <div className="fixed inset-y-0 left-0 z-[1110] w-[300px] max-w-[88vw] p-3 lg:hidden">
            <div className="rounded-3xl border border-gray-100 bg-white p-4 dark:border-[#1f2933] dark:bg-[#151e22] h-full overflow-hidden flex flex-col shadow-xl">
              <SidebarContent
                currentUser={currentUser}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                handleLogout={handleLogout}
                adminNav={adminNav}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                productsOpen={productsOpen}
                setProductsOpen={setProductsOpen}
                onNavClick={() => setMobileSidebarOpen(false)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboardPage;
