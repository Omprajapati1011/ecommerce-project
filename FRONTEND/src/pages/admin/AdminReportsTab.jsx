/**
 * @component AdminReportsTab
 * @description Comprehensive analytics and reporting dashboard
 *
 * Features:
 *  - Overview statistics cards with trends
 *  - Revenue chart (daily/weekly/monthly)
 *  - Order status distribution pie chart
 *  - Top selling products table
 *  - Category sales bar chart
 *  - Payment method distribution
 *  - User registration trend
 *  - Offer usage statistics
 *  - Low stock alerts
 *  - Recent orders list
 *  - Export functionality
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Toast } from "primereact/toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";
import { Dropdown } from "primereact/dropdown";
import { TabView, TabPanel } from "primereact/tabview";
import { Chip } from "primereact/chip";
import {
  TrendingUp,
  IndianRupee,
  Users,
  Package,
  ShoppingCart,
  AlertTriangle,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  CreditCard,
  Gift,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  Boxes,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { fetchDashboardData } from "../../../api/analyticsApi";
import "./AdminShared.css";

// Chart colors matching the theme
const CHART_COLORS = {
  primary: "#d97706",
  secondary: "#0d9488",
  tertiary: "#8b5cf6",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  palette: ["#d97706", "#0d9488", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899"],
};

// Time period options
const TIME_PERIODS = [
  { label: "Last 7 Days", value: 7 },
  { label: "Last 30 Days", value: 30 },
  { label: "Last 90 Days", value: 90 },
  { label: "Last Year", value: 365 },
];

function AdminReportsTab() {
  const toast = useRef(null);
  const { darkMode } = useTheme();

  // Data state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [timePeriod, setTimePeriod] = useState(30);

  // Fetch all dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchDashboardData(timePeriod);
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load analytics data",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [timePeriod]);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.current?.show({
      severity: "success",
      summary: "Refreshed",
      detail: "Analytics data updated",
      life: 2000,
    });
  }, [loadDashboardData]);

  // Export data to CSV
  const handleExport = useCallback(() => {
    if (!dashboardData) return;

    const { overview, topProducts, recentOrders, charts } = dashboardData;

    // Prepare data for export
    const exportData = {
      exportDate: new Date().toISOString(),
      period: `${timePeriod} days`,
      overview: {
        totalRevenue: overview?.total_revenue || 0,
        totalOrders: overview?.total_orders || 0,
        totalCustomers: overview?.total_customers || 0,
        activeProducts: overview?.active_products || 0,
        pendingOrders: overview?.pending_orders || 0,
        deliveredOrders: overview?.delivered_orders || 0,
        activeOffers: overview?.active_offers || 0,
      },
      topProducts: topProducts || [],
      recentOrders: recentOrders || [],
      categorySales: charts?.categorySales || [],
      orderStatus: charts?.orderStatus || [],
    };

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Overview section
    csvContent += "ANALYTICS REPORT\n";
    csvContent += `Export Date:,${exportData.exportDate}\n`;
    csvContent += `Period:,${exportData.period}\n\n`;
    
    csvContent += "OVERVIEW STATISTICS\n";
    csvContent += "Metric,Value\n";
    csvContent += `Total Revenue,${formatCurrency(exportData.overview.totalRevenue)}\n`;
    csvContent += `Total Orders,${exportData.overview.totalOrders}\n`;
    csvContent += `Total Customers,${exportData.overview.totalCustomers}\n`;
    csvContent += `Active Products,${exportData.overview.activeProducts}\n`;
    csvContent += `Pending Orders,${exportData.overview.pendingOrders}\n`;
    csvContent += `Delivered Orders,${exportData.overview.deliveredOrders}\n`;
    csvContent += `Active Offers,${exportData.overview.activeOffers}\n\n`;

    // Top Products
    if (exportData.topProducts.length > 0) {
      csvContent += "TOP SELLING PRODUCTS\n";
      csvContent += "Product Name,Units Sold,Revenue\n";
      exportData.topProducts.forEach(p => {
        csvContent += `"${p.display_name || p.name}",${p.total_sold},${p.total_revenue}\n`;
      });
      csvContent += "\n";
    }

    // Category Sales
    if (exportData.categorySales.length > 0) {
      csvContent += "CATEGORY SALES\n";
      csvContent += "Category,Items Sold,Revenue\n";
      exportData.categorySales.forEach(c => {
        csvContent += `"${c.category_name}",${c.items_sold},${c.revenue}\n`;
      });
      csvContent += "\n";
    }

    // Order Status Distribution
    if (exportData.orderStatus.length > 0) {
      csvContent += "ORDER STATUS DISTRIBUTION\n";
      csvContent += "Status,Count\n";
      exportData.orderStatus.forEach(s => {
        csvContent += `${s.order_status},${s.count}\n`;
      });
      csvContent += "\n";
    }

    // Recent Orders
    if (exportData.recentOrders.length > 0) {
      csvContent += "RECENT ORDERS\n";
      csvContent += "Order Number,Customer,Amount,Status,Date\n";
      exportData.recentOrders.forEach(o => {
        csvContent += `${o.order_number},"${o.customer_name}",${o.total_amount},${o.order_status},${new Date(o.created_at).toLocaleDateString()}\n`;
      });
    }

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.current?.show({
      severity: "success",
      summary: "Exported",
      detail: "Analytics report downloaded successfully",
      life: 3000,
    });
  }, [dashboardData, timePeriod]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  // Format number with commas
  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-IN").format(value || 0);
  };

  // Format percentage
  const formatPercent = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  // Get trend icon
  const getTrendIcon = (trend) => {
    if (trend > 0) return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (trend < 0) return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return null;
  };

  // Order status badge
  const orderStatusTemplate = (rowData) => {
    const statusColors = {
      pending: "warning",
      processing: "info",
      shipped: "info",
      delivered: "success",
      cancelled: "danger",
    };
    return (
      <Tag
        value={rowData.order_status?.toUpperCase()}
        severity={statusColors[rowData.order_status] || "secondary"}
        className="!text-xs"
      />
    );
  };

  // Payment status badge
  const paymentStatusTemplate = (rowData) => {
    const statusColors = {
      completed: "success",
      processing: "info",
      pending: "warning",
      failed: "danger",
      refunded: "secondary",
    };
    return (
      <Tag
        value={rowData.payment_status?.toUpperCase()}
        severity={statusColors[rowData.payment_status] || "secondary"}
        className="!text-xs"
      />
    );
  };

  // Stats card component
  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = "primary" }) => {
    const colorClasses = {
      primary: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
      secondary: "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400",
      tertiary: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
      success: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
      warning: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
      danger: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    };

    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 truncate">{title}</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
              {typeof value === "number" && title.toLowerCase().includes("revenue")
                ? formatCurrency(value)
                : formatNumber(value)}
            </p>
            {trendValue !== undefined && (
              <div className="mt-2 flex items-center gap-1">
                {getTrendIcon(trend)}
                <span className={`text-xs font-semibold ${trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-500"}`}>
                  {trend > 0 ? "+" : ""}{formatPercent(trendValue)}
                </span>
              </div>
            )}
          </div>
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
    );
  };

  // Mini stat card for secondary stats
  const MiniStatCard = ({ title, value, icon: Icon, valueColor = "text-gray-900" }) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{title}</p>
          <p className={`text-lg font-bold ${valueColor}`}>{formatNumber(value)}</p>
        </div>
      </div>
    </div>
  );

  // Simple bar chart component (CSS-based)
  const SimpleBarChart = ({ data, valueKey, labelKey, height = 200 }) => {
    if (!data || data.length === 0) return <div className="text-center text-gray-400 py-8">No data available</div>;

    const maxValue = Math.max(...data.map((d) => d[valueKey] || 0));

    return (
      <div className="space-y-2" style={{ height }}>
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? ((item[valueKey] || 0) / maxValue) * 100 : 0;
          return (
            <div key={index} className="flex items-center gap-3">
              <div className="w-24 text-xs text-gray-600 dark:text-gray-400 truncate">
                {item[labelKey]}
              </div>
              <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: CHART_COLORS.palette[index % CHART_COLORS.palette.length],
                  }}
                />
              </div>
              <div className="w-20 text-xs text-gray-700 dark:text-gray-300 text-right font-medium">
                {typeof item[valueKey] === "number" && item[valueKey] > 1000
                  ? formatCurrency(item[valueKey])
                  : formatNumber(item[valueKey])}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Simple pie chart component (CSS-based)
  const SimplePieChart = ({ data, valueKey, labelKey }) => {
    if (!data || data.length === 0) return <div className="text-center text-gray-400 py-8">No data available</div>;

    const total = data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);

    return (
      <div className="flex items-center gap-6">
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {data.map((item, index) => {
              const percentage = total > 0 ? ((item[valueKey] || 0) / total) * 100 : 0;
              const offset = data.slice(0, index).reduce((sum, d) => {
                const prevPercentage = total > 0 ? ((d[valueKey] || 0) / total) * 100 : 0;
                return sum + (prevPercentage / 100) * 360;
              }, 0);
              const strokeDasharray = `${percentage * 3.6} 1000`;
              const strokeDashoffset = -offset * (100 / 360);

              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  strokeWidth="20"
                  stroke={CHART_COLORS.palette[index % CHART_COLORS.palette.length]}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(total)}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CHART_COLORS.palette[index % CHART_COLORS.palette.length] }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{item[labelKey]}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{formatNumber(item[valueKey])}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Loading skeleton
  const reportWindowLabel = useMemo(() => {
    const selected = TIME_PERIODS.find((period) => period.value === timePeriod);
    return selected?.label || `Last ${timePeriod} Days`;
  }, [timePeriod]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="!p-4">
              <Skeleton width="60%" height="1rem" className="mb-2" />
              <Skeleton width="80%" height="2rem" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="!p-4">
            <Skeleton width="100%" height="20rem" />
          </Card>
          <Card className="!p-4">
            <Skeleton width="100%" height="20rem" />
          </Card>
        </div>
      </div>
    );
  }

  const { overview, charts, topProducts, recentOrders, offerUsage, lowStock } =
    dashboardData || {};

  return (
    <div className="admin-products-container space-y-6">
      <Toast ref={toast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-amber-600" />
            Analytics & Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Live business insights and performance metrics for {reportWindowLabel.toLowerCase()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:justify-end">
          <Dropdown
            value={timePeriod}
            options={TIME_PERIODS}
            onChange={(e) => setTimePeriod(e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Select Period"
            className="!w-48"
            pt={{
              root: { className: "!rounded-xl" },
              input: { className: "!py-2 !px-3 !text-sm !rounded-xl" },
              trigger: { className: "!rounded-xl" },
              panel: { className: "!rounded-xl" },
              item: { className: "!text-sm" },
            }}
          />
          <Button
            icon={<RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />}
            label="Refresh"
            onClick={handleRefresh}
            className="!bg-teal-600 !border-teal-600 hover:!bg-teal-700 !text-white !rounded-xl !px-4 !py-2"
            pt={{
              icon: { className: "!mr-2" },
              label: { className: "!text-sm !font-semibold" },
            }}
            disabled={refreshing}
          />
          <Button
            icon={<Download className="w-4 h-4" />}
            label="Export"
            onClick={handleExport}
            className="!bg-amber-600 !border-amber-600 hover:!bg-amber-700 !text-white !rounded-xl !px-4 !py-2"
            pt={{
              icon: { className: "!mr-2" },
              label: { className: "!text-sm !font-semibold" },
            }}
          />
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={overview?.total_revenue}
          icon={IndianRupee}
          color="primary"
        />
        <StatCard
          title="Total Orders"
          value={overview?.total_orders}
          icon={ShoppingCart}
          color="secondary"
        />
        <StatCard
          title="Total Customers"
          value={overview?.total_customers}
          icon={Users}
          color="tertiary"
        />
        <StatCard
          title="Active Products"
          value={overview?.active_products}
          icon={Package}
          color="success"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MiniStatCard title="Pending Orders" value={overview?.pending_orders} icon={Clock} valueColor="text-amber-600" />
        <MiniStatCard title="Delivered" value={overview?.delivered_orders} icon={CheckCircle} valueColor="text-green-600" />
        <MiniStatCard title="Active Offers" value={overview?.active_offers} icon={Gift} valueColor="text-purple-600" />
        <MiniStatCard title="Total Users" value={overview?.total_users} icon={Users} valueColor="text-blue-600" />
        <MiniStatCard title="Categories" value={overview?.total_categories} icon={Boxes} valueColor="text-teal-600" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              Revenue Trend
            </h3>
          </div>
          <div className="p-5">
            <SimpleBarChart
              data={charts?.revenue?.slice(-10) || []}
              valueKey="revenue"
              labelKey="date"
              height={200}
            />
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-teal-600" />
              Order Status Distribution
            </h3>
          </div>
          <div className="p-5">
            <SimplePieChart
              data={charts?.orderStatus || []}
              valueKey="count"
              labelKey="order_status"
            />
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Sales */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Top Categories by Revenue
            </h3>
          </div>
          <div className="p-5">
            <SimpleBarChart
              data={charts?.categorySales?.slice(0, 6) || []}
              valueKey="revenue"
              labelKey="category_name"
              height={180}
            />
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              Payment Methods
            </h3>
          </div>
          <div className="p-5">
            <SimplePieChart
              data={charts?.paymentMethods || []}
              valueKey="count"
              labelKey="payment_method"
            />
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              Top Selling Products
            </h3>
          </div>
          <div className="p-5">
            <DataTable
              value={topProducts || []}
              className="admin-products-table"
              emptyMessage="No products data"
            >
              <Column
                field="display_name"
                header="Product"
                className="!text-sm"
                body={(rowData) => (
                  <span className="font-medium text-gray-900 dark:text-white">
                    {rowData.display_name || rowData.name}
                  </span>
                )}
              />
              <Column
                field="total_sold"
                header="Sold"
                className="!text-sm !text-center"
                body={(rowData) => formatNumber(rowData.total_sold)}
              />
              <Column
                field="total_revenue"
                header="Revenue"
                className="!text-sm !text-right"
                body={(rowData) => formatCurrency(rowData.total_revenue)}
              />
            </DataTable>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-teal-600" />
              Recent Orders
            </h3>
          </div>
          <div className="p-5">
            <DataTable
              value={recentOrders || []}
              className="admin-products-table"
              emptyMessage="No recent orders"
            >
              <Column
                field="order_number"
                header="Order"
                className="!text-sm"
                body={(rowData) => (
                  <span className="font-mono text-amber-600">{rowData.order_number}</span>
                )}
              />
              <Column
                field="customer_name"
                header="Customer"
                className="!text-sm"
              />
              <Column
                field="total_amount"
                header="Amount"
                className="!text-sm !text-right"
                body={(rowData) => formatCurrency(rowData.total_amount)}
              />
              <Column
                field="order_status"
                header="Status"
                className="!text-sm"
                body={orderStatusTemplate}
              />
            </DataTable>
          </div>
        </div>
      </div>

      {/* Alerts & Usage Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Low Stock Alerts
            </h3>
          </div>
          <div className="p-5">
            {lowStock && lowStock.length > 0 ? (
              <div className="space-y-3">
                {lowStock.slice(0, 5).map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {product.display_name || product.name}
                      </p>
                      <p className="text-xs text-gray-500">ID: {product.product_id}</p>
                    </div>
                    <Tag
                      value={`${product.stock} left`}
                      severity="danger"
                      className="!text-xs"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>All products are well stocked</p>
              </div>
            )}
          </div>
        </div>

        {/* Offer Usage Stats */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-600" />
              Top Offer Usage
            </h3>
          </div>
          <div className="p-5">
            {offerUsage && offerUsage.length > 0 ? (
              <div className="space-y-3">
                {offerUsage.slice(0, 5).map((offer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{offer.offer_name}</p>
                      <p className="text-xs text-gray-500">{offer.offer_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">{formatNumber(offer.total_usage)} uses</p>
                      <p className="text-xs text-gray-500">{formatCurrency(offer.total_discount_given)} saved</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Gift className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No offer usage data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Registration Trend */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            User Registration Trend
          </h3>
        </div>
        <div className="p-5">
          <SimpleBarChart
            data={charts?.userTrend?.slice(-14) || []}
            valueKey="new_users"
            labelKey="date"
            height={150}
          />
        </div>
      </div>
    </div>
  );
}

export default AdminReportsTab;
