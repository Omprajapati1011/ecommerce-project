import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Menu,
  Moon,
  Search,
  ShoppingCart,
  Sun,
  UserCircle2,
  X,
} from "lucide-react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Sidebar } from "primereact/sidebar";
import { ScrollPanel } from "primereact/scrollpanel";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../redux/slices/authSlice";
import { useTheme } from "../../context/ThemeContext";
import api from "../../../api/api";
import { getAllCategories } from "../../services/categoryApi";

const extractCategoryTree = (response) => {
  const data = response?.data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

function Navbar() {
  const { darkMode, toggleDarkMode } = useTheme();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.auth);
  const [itemCount, setItemCount] = useState(0);
  const dashboardPath =
    currentUser?.role === "admin" ? "/admin/dashboard" : "/dashboard";
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [categoryTree, setCategoryTree] = useState([]);

  const fetchCartCount = useCallback(async () => {
    if (!currentUser) {
      setItemCount(0);
      return;
    }
    try {
      const res = await api.get("/cart");
      const items = res.data?.data?.items || [];
      const total = items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0,
      );
      setItemCount(total);
    } catch {
      setItemCount(0);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchCartCount();
    window.addEventListener("cart:updated", fetchCartCount);
    return () => window.removeEventListener("cart:updated", fetchCartCount);
  }, [fetchCartCount]);

  useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      try {
        const response = await getAllCategories();
        if (!active) return;
        setCategoryTree(extractCategoryTree(response));
      } catch {
        if (!active) return;
        setCategoryTree([]);
      }
    };

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  const parentCategories = useMemo(() => categoryTree, [categoryTree]);
  const childMap = useMemo(() => {
    const map = new Map();
    categoryTree.forEach((category) => {
      map.set(category.category_id, category.children || []);
    });
    return map;
  }, [categoryTree]);

  const topNavLinks = useMemo(
    () => [
      { label: "Shop", href: "/shop" },
      {
        label: "Today's Deals",
        href: "/shop?sortField=price&sortOrder=asc",
      },
      { label: "New Releases", href: "/#new-releases" },
      { label: "Electronics", href: "/shop?search=electronics" },
      { label: "Fashion", href: "/shop?search=fashion" },
      {
        label: "Customer Service",
        href: currentUser ? `${dashboardPath}?tab=support` : "/login",
      },
    ],
    [currentUser, dashboardPath],
  );

  const menuSections = useMemo(
    () => [
      {
        title: "Trending",
        items: [
          { label: "Bestsellers", href: "/#bestsellers" },
          { label: "New Releases", href: "/#new-releases" },
          {
            label: "Top Deals",
            href: "/shop?sortField=price&sortOrder=asc",
          },
        ],
      },
      {
        title: "Support",
        items: [
          {
            label: "Customer Service",
            href: currentUser ? `${dashboardPath}?tab=support` : "/login",
          },
          {
            label: "Returns & Orders",
            href: currentUser ? "/orders" : "/login",
          },
        ],
      },
    ],
    [currentUser, dashboardPath],
  );

  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && menuOpen) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [menuOpen]);

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleLogout = () => {
    setMenuOpen(false);
    dispatch(logoutUser());
    navigate("/");
  };

  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const query = searchText.trim();
      navigate(
        query
          ? `/shop?search=${encodeURIComponent(query)}`
          : "/shop",
      );
      setMenuOpen(false);
    },
    [navigate, searchText],
  );

  const handleCategoryNavigate = useCallback(
    (categoryId) => {
      navigate(`/shop?category=${categoryId}`);
      setMenuOpen(false);
    },
    [navigate],
  );

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b shadow-[0_10px_26px_-22px_rgba(15,23,42,0.6)] backdrop-blur ${
          darkMode
            ? "border-[#1f2933] bg-[#151e22]/95"
            : "border-amber-200/70 bg-[#fff8ee]/95"
        }`}
      >
        <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3 px-4 py-4 md:gap-6 md:px-8 lg:px-12">
          <Button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={`!inline-flex !items-center !gap-2 !rounded-lg !border !bg-transparent !px-3 !py-2 !text-sm !font-medium !shadow-none ${
              darkMode
                ? "!border-[#1f2933] !text-slate-200 hover:!border-amber-400 hover:!bg-[#1a2327] hover:!text-amber-300"
                : "!border-gray-200 !text-gray-700 hover:!border-amber-200 hover:!bg-amber-50 hover:!text-amber-700"
            }`}
          >
            <Menu className="h-4 w-4" />
            <span className="hidden sm:inline">All</span>
          </Button>

          <Link
            to="/"
            className={`inline-flex items-center gap-2 font-serif text-2xl font-semibold tracking-tight ${darkMode ? "text-slate-100" : "text-gray-900"}`}
          >
            <img src="/logo.svg" alt="ShopSphere" className="h-8 w-8" />
            <span>ShopSphere</span>
          </Link>

          <form
            onSubmit={handleSearchSubmit}
            className={`hidden flex-1 items-center rounded-lg border px-3 py-2 md:flex ${darkMode ? "border-[#1f2933] bg-[#151e22]" : "border-amber-200/80 bg-[#fff8ee]"}`}
          >
            <Search
              className={`h-4 w-4 ${darkMode ? "text-slate-400" : "text-gray-500"}`}
            />
            <InputText
              placeholder="Search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className={`ml-2 w-full border-0 bg-transparent p-0 text-sm shadow-none focus:shadow-none ${darkMode ? "text-slate-100 placeholder:text-slate-400" : "text-gray-900 placeholder:text-gray-500"}`}
            />
          </form>

          <nav className="ml-auto flex items-center gap-3 font-accent text-sm font-medium md:gap-4">
            <Button
              type="button"
              onClick={toggleDarkMode}
              className={`!inline-flex !items-center !justify-center !rounded-lg !border !bg-transparent !px-2.5 !py-2 !text-xs !font-semibold !shadow-none ${
                darkMode
                  ? "!border-[#1f2933] !text-amber-300 hover:!border-amber-400 hover:!bg-[#1a2327]"
                  : "!border-amber-200 !text-amber-700 hover:!bg-amber-50"
              }`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            <Link
              to="/shop"
              className={`hidden transition md:inline-flex ${darkMode ? "text-slate-200 hover:text-amber-300" : "text-gray-700 hover:text-amber-600"}`}
            >
              Shop
            </Link>
            <Link
              to="/cart"
              className={`relative transition ${darkMode ? "text-slate-200 hover:text-amber-300" : "text-gray-700 hover:text-amber-600"}`}
              aria-label="Cart"
              id="shopsphere-cart-link"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-600 px-1 font-accent text-xs font-semibold text-white">
                  {itemCount}
                </span>
              )}
            </Link>

            {currentUser ? (
              <>
                <Link
                  to={dashboardPath}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 transition ${
                    darkMode
                      ? "border-[#1f2933] text-slate-200 hover:border-amber-400 hover:bg-[#1a2327] hover:text-amber-300"
                      : "border-gray-200 text-gray-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                  }`}
                  aria-label="Open profile dashboard"
                >
                  <UserCircle2 className="h-4 w-4" />
                  <span className="hidden md:inline">Profile</span>
                </Link>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-amber-600/20 transition-all hover:bg-amber-700 hover:shadow-lg"
              >
                Login
              </Link>
            )}
          </nav>
        </div>

        <div
          className={`hidden border-t md:block ${
            darkMode
              ? "border-[#1f2933] bg-[#1a2327]"
              : "border-amber-200/70 bg-[#f5ecde]"
          }`}
        >
          <nav className="relative mx-auto flex w-full max-w-[1600px] items-center gap-2 overflow-hidden px-4 py-1.5 md:px-8 lg:px-12">
            <span
              className={`pointer-events-none absolute -left-12 top-1/2 h-14 w-14 -translate-y-1/2 rounded-full blur-2xl animate-pulse ${
                darkMode ? "bg-amber-300/20" : "bg-amber-400/25"
              }`}
            />
            <span
              className={`pointer-events-none absolute right-10 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full blur-xl animate-pulse ${
                darkMode ? "bg-teal-300/15" : "bg-orange-300/25"
              }`}
            />
            {topNavLinks.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`relative z-10 rounded-md px-2 py-1 font-accent text-[13px] font-semibold transition ${
                  darkMode
                    ? "text-slate-300 hover:text-amber-300"
                    : "text-gray-700 hover:text-amber-700"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div
          className={`border-t px-4 py-3 md:hidden ${darkMode ? "border-[#1f2933]" : "border-amber-200/70"}`}
        >
          <form
            onSubmit={handleSearchSubmit}
            className={`flex items-center rounded-lg border px-3 py-2 ${darkMode ? "border-[#1f2933] bg-[#151e22]" : "border-amber-200/80 bg-[#fff8ee]"}`}
          >
            <Search
              className={`h-4 w-4 ${darkMode ? "text-slate-400" : "text-gray-500"}`}
            />
            <InputText
              placeholder="Search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className={`ml-2 w-full border-0 bg-transparent p-0 text-sm shadow-none focus:shadow-none ${darkMode ? "text-slate-100 placeholder:text-slate-400" : "text-gray-900 placeholder:text-gray-500"}`}
            />
          </form>
        </div>
      </header>

      <Sidebar
        visible={menuOpen}
        onHide={() => setMenuOpen(false)}
        position="left"
        showCloseIcon={false}
        blockScroll
        className={`shopsphere-sidebar ${darkMode ? "bg-[#151e22] text-slate-100" : "bg-[#fff8ee] text-gray-900"} !w-[86vw] !max-w-[380px]`}
        pt={{
          content: { className: "flex h-full flex-col p-0" },
        }}
      >
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2927] to-[#163b36] px-4 py-4 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,184,138,0.08),transparent_60%)]" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c9b88a]/15 ring-1 ring-[#c9b88a]/20">
                <UserCircle2 className="h-[18px] w-[18px] text-[#c9b88a]" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight text-white/90">
                  {currentUser?.email?.split("@")[0] || "Guest"}
                </p>
                <p className="font-accent text-[9px] font-medium uppercase tracking-[0.15em] text-[#c9b88a]/50">
                  My Account
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="rounded-md p-1.5 text-white/25 transition hover:bg-white/[0.08] hover:text-white/50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1" style={{ minHeight: 0 }}>
          <ScrollPanel
            style={{ width: "100%", height: "100%" }}
            className={`sidebar-scrollpanel ${darkMode ? "bg-[#151e22]" : "bg-[#f5ecde]"}`}
          >
            <section
              className={`mx-4 mt-5 rounded-2xl border px-4 py-4 ${darkMode ? "border-[#1f2933] bg-[#1a2327]" : "border-gray-100/80 bg-white/70"}`}
            >
              <h3
                className={`font-accent text-[10px] font-semibold uppercase tracking-[0.2em] ${darkMode ? "text-slate-400" : "text-gray-400"}`}
              >
                Categories
              </h3>
              <div className="mt-3 space-y-2">
                {parentCategories.map((parent) => {
                  const hasChildren =
                    (childMap.get(parent.category_id) || []).length > 0;
                  const open = expandedCategories[parent.category_id];

                  return (
                    <div
                      key={parent.category_id}
                      className={`rounded-xl border ${darkMode ? "border-[#1f2933] bg-[#0b1114]/40" : "border-gray-100 bg-[#fdf6ea]/60"}`}
                    >
                      <Button
                        type="button"
                        onClick={() =>
                          hasChildren
                            ? toggleCategory(parent.category_id)
                            : handleCategoryNavigate(parent.category_id)
                        }
                        className={`!flex !w-full !items-center !justify-between !rounded-xl !bg-transparent !px-3 !py-2.5 !text-left !text-sm !font-medium !shadow-none ${darkMode ? "!text-slate-200 hover:!bg-[#1a2327] hover:!text-amber-300" : "!text-gray-700 hover:!bg-amber-50 hover:!text-amber-700"}`}
                      >
                        <span>{parent.category_name}</span>
                        {hasChildren ? (
                          <ChevronDown
                            className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
                          />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>

                      {hasChildren && open ? (
                        <div className="px-2 pb-2">
                          {(childMap.get(parent.category_id) || []).map(
                            (child) => (
                              <button
                                key={child.category_id}
                                type="button"
                                onClick={() =>
                                  handleCategoryNavigate(child.category_id)
                                }
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                                  darkMode
                                    ? "text-slate-300 hover:bg-[#1a2327] hover:text-amber-300"
                                    : "text-gray-600 hover:bg-amber-50 hover:text-amber-700"
                                }`}
                              >
                                <span>{child.category_name}</span>
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            ),
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="mx-4 mb-6 mt-4 space-y-3">
              {menuSections.map((section) => (
                <section
                  key={section.title}
                  className={`rounded-2xl border px-4 py-4 ${darkMode ? "border-[#1f2933] bg-[#1a2327]" : "border-gray-100/80 bg-white/70"}`}
                >
                  <h3
                    className={`font-accent text-[10px] font-semibold uppercase tracking-[0.2em] ${darkMode ? "text-slate-400" : "text-gray-400"}`}
                  >
                    {section.title}
                  </h3>
                  <div className="mt-3 space-y-1">
                    {section.items.map((item) => (
                      <Link
                        key={item.label}
                        to={
                          item.href === "/dashboard" ? dashboardPath : item.href
                        }
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center justify-between rounded-lg px-2 py-2.5 text-sm font-medium transition ${darkMode ? "text-slate-200 hover:bg-[#1a2327] hover:text-amber-300" : "text-gray-700 hover:bg-amber-50/80 hover:text-amber-700"}`}
                      >
                        <span>{item.label}</span>
                        <ChevronRight
                          className={`h-4 w-4 ${darkMode ? "text-slate-500" : "text-gray-300"}`}
                        />
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </ScrollPanel>
        </div>

        {currentUser && (
          <div
            className={`border-t px-4 py-4 ${darkMode ? "border-[#1f2933] bg-[#10171b]" : "border-amber-200/70 bg-[#fff3df]"}`}
          >
            <Button
              type="button"
              onClick={handleLogout}
              icon="pi pi-sign-out"
              label="Logout"
              className={`!w-full !justify-center !rounded-xl !border !px-4 !py-3 !text-sm !font-semibold !shadow-none transition-all ${
                darkMode
                  ? "!border-[#c9b88a]/45 !bg-gradient-to-r !from-[#1f2a2f] !to-[#26333a] !text-amber-300 hover:!from-[#26333a] hover:!to-[#30424a] hover:!shadow-[0_10px_25px_-12px_rgba(201,184,138,0.7)]"
                  : "!border-amber-300/80 !bg-gradient-to-r !from-amber-50 !to-[#fff1dc] !text-amber-800 hover:!from-amber-100 hover:!to-[#ffe7bf] hover:!shadow-[0_10px_20px_-12px_rgba(217,119,6,0.6)]"
              }`}
            />
          </div>
        )}
      </Sidebar>
    </>
  );
}

export default Navbar;
