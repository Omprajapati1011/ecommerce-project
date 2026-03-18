/**
 * @component AdminLayout
 * @description Root layout wrapper for the admin route tree.
 *
 * Provides a full-screen container with dark/light theming that wraps
 * all admin pages via React Router's <Outlet />.
 *
 * Uses:
 *  - ThemeContext for dark-mode class toggling
 *  - React Router <Outlet /> for nested route rendering
 *
 * Route: /admin/* (defined in App router)
 */
import { Outlet } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { ScrollPanel } from "primereact/scrollpanel";

function AdminLayout() {
  const { darkMode } = useTheme();

  return (
    <div
      className={`flex h-screen flex-col overflow-hidden font-sans ${darkMode ? "bg-[#0b1114] text-slate-200" : "bg-gray-50 text-gray-900"}`}
    >
      <ScrollPanel
        className="app-scrollpanel flex-1"
        style={{ width: "100%", height: "100%" }}
      >
        <main className="mx-auto w-full max-w-[1600px] px-4 py-8 md:px-8 lg:px-12">
          <Outlet />
        </main>
      </ScrollPanel>
    </div>
  );
}

export default AdminLayout;
