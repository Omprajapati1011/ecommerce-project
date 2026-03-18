import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { useSelector } from "react-redux";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { useCustomerDashboard } from "./dashboard/useCustomerDashboard";
import DashboardContent from "./dashboard/components/DashboardContent";
import DashboardSidebar from "./dashboard/components/DashboardSidebar";
import EditAddressDialog from "./dashboard/components/EditAddressDialog";
import OrderDetailsDialog from "./dashboard/components/OrderDetailsDialog";
import { profileNav } from "./dashboard/constants";
import "../admin/AdminDashboard.css";

const dashboardTabSet = new Set(profileNav.map((item) => item.key));

const getDashboardPathForTab = (tab) => {
  if (!tab || tab === "dashboard") {
    return "/dashboard";
  }

  return `/dashboard?tab=${encodeURIComponent(tab)}`;
};

function DashboardPage() {
  const { currentUser } = useSelector((state) => state.auth || {});
  const dashboard = useCustomerDashboard();
  const { activeTab, setActiveTab } = dashboard;
  const navigate = useNavigate();
  const location = useLocation();
  const toastRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const stored = localStorage.getItem("customer-sidebar-open");
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("customer-sidebar-open", String(next));
      } catch {
        // no-op
      }
      return next;
    });
  }, []);

  const showToast = useCallback((severity, summary, detail) => {
    if (!detail) {
      return;
    }

    toastRef.current?.show({
      severity,
      summary,
      detail,
      life: 3000,
    });
  }, []);

  useEffect(() => {
    const isOrdersPath = location.pathname.startsWith("/dashboard/orders");

    if (isOrdersPath) {
      if (activeTab !== "orders") {
        setActiveTab("orders");
      }

      const targetPath = getDashboardPathForTab("orders");

      if (`${location.pathname}${location.search}` !== targetPath) {
        navigate(targetPath, { replace: true });
      }
    }
  }, [activeTab, location.pathname, location.search, navigate, setActiveTab]);

  useEffect(() => {
    const queryTab = new URLSearchParams(location.search).get("tab");

    if (!queryTab || !dashboardTabSet.has(queryTab)) {
      return;
    }

    setActiveTab(queryTab);
  }, [location.search, setActiveTab]);

  const handleTabChange = useCallback(
    (nextTab) => {
      setActiveTab(nextTab);
      const targetPath = getDashboardPathForTab(nextTab);

      if (`${location.pathname}${location.search}` !== targetPath) {
        navigate(targetPath);
      }
    },
    [location.pathname, location.search, navigate, setActiveTab],
  );

  const activeLabel = useMemo(() => {
    const active = profileNav.find((entry) => entry.key === activeTab);
    return active?.label || "Dashboard";
  }, [activeTab]);

  return (
    <div
      className={`admin-dashboard-grid grid items-start gap-6 p-6 ${sidebarOpen ? "lg:grid-cols-[290px_1fr]" : "lg:grid-cols-1"}`}
    >
      <DashboardSidebar
        activeTab={activeTab}
        currentUser={currentUser}
        sidebarOpen={sidebarOpen}
        onTabChange={handleTabChange}
      />

      <section className="admin-main-panel min-w-[0] min-h-0 h-full">
        <Card
          className="rounded-2xl border border-gray-100 bg-white pt-6 px-6 pb-1 dark:border-[#1f2933] dark:bg-[#151e22] shadow-sm h-full overflow-hidden"
          pt={{
            body: { className: "p-0 h-full flex flex-col" },
            content: { className: "p-0 flex-1 flex flex-col min-h-0" },
          }}
        >
          <div className="mb-4 flex items-center gap-3">
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

          <div className="admin-main-scroll flex-1 min-h-0 overflow-y-auto pr-1">
            <DashboardContent
              currentUser={currentUser}
              dashboard={dashboard}
              showToast={showToast}
            />
          </div>
        </Card>
      </section>

      <Toast
        ref={toastRef}
        position="top-right"
        baseZIndex={100000}
        appendTo={typeof document !== "undefined" ? document.body : undefined}
        className="customer-dashboard-toast app-toast-offset"
      />

      <OrderDetailsDialog
        visible={dashboard.orderItemsDialogVisible}
        selectedOrder={dashboard.selectedOrder}
        selectedOrderItems={dashboard.selectedOrderItems}
        loading={dashboard.orderItemsLoading}
        error={dashboard.orderItemsError}
        onHide={dashboard.handleCloseOrderDetails}
        showToast={showToast}
      />

      <EditAddressDialog
        visible={dashboard.editAddressDialogVisible}
        form={dashboard.editAddressForm}
        updating={dashboard.updatingAddress}
        onHide={dashboard.closeEditAddressDialog}
        onChange={dashboard.handleEditAddressInputChange}
        onSubmit={dashboard.handleUpdateAddress}
      />
    </div>
  );
}

export default DashboardPage;
