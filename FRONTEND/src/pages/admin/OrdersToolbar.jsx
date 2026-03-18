import { useRef, useCallback, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Search } from "lucide-react";

const orderStatusOptions = [
  { label: "All Orders", value: null },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Refunded", value: "refunded" },
];

const paymentStatusOptions = [
  { label: "All Payments", value: null },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
];

const paymentMethodOptions = [
  { label: "All Methods", value: null },
  { label: "Stripe", value: "stripe" },
  { label: "COD", value: "cash_on_delivery" },
  { label: "Credit Card", value: "credit_card" },
  { label: "Debit Card", value: "debit_card" },
  { label: "PayPal", value: "paypal" },
  { label: "Bank Transfer", value: "bank_transfer" },
];

const dropdownPt = {
  root: {
    className:
      "admin-dropdown-root rounded-xl h-10 flex items-center shadow-none border border-gray-200 dark:border-gray-700",
  },
  input: { className: "px-3 text-sm" },
  trigger: { className: "w-8" },
  panel: {
    className: "admin-dropdown-panel rounded-lg shadow-xl mt-1",
  },
};

function OrdersToolbar({
  onSearch,
  filters,
  onFilterChange,
  stats,
}) {
  const debounceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onSearch(value), 300);
    },
    [onSearch]
  );

  const totalOrders = Number(stats?.totalOrders) || 0;
  const totalPending = Number(stats?.totalPending) || 0;
  const totalDelivered = Number(stats?.totalDelivered) || 0;

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Top row: Stats + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Stats */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{totalOrders}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
            <span className="text-xs text-amber-600 dark:text-amber-400">Pending</span>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{totalPending}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40">
            <span className="text-xs text-green-600 dark:text-green-400">Delivered</span>
            <span className="text-xs font-bold text-green-700 dark:text-green-300">{totalDelivered}</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <InputText
            type="search"
            onChange={handleSearchChange}
            placeholder="Search order #, customer..."
            className="admin-search-input w-full pl-10 border border-gray-200 dark:border-gray-700 rounded-xl h-10 text-sm transition-all outline-none"
          />
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-3 items-center">
        <Dropdown
          value={filters.orderStatus}
          onChange={(e) => onFilterChange("orderStatus", e.value)}
          options={orderStatusOptions}
          placeholder="Order Status"
          className="admin-filter-dropdown w-full sm:w-40"
          pt={dropdownPt}
        />
        <Dropdown
          value={filters.paymentStatus}
          onChange={(e) => onFilterChange("paymentStatus", e.value)}
          options={paymentStatusOptions}
          placeholder="Payment Status"
          className="admin-filter-dropdown w-full sm:w-40"
          pt={dropdownPt}
        />
        <Dropdown
          value={filters.paymentMethod}
          onChange={(e) => onFilterChange("paymentMethod", e.value)}
          options={paymentMethodOptions}
          placeholder="Payment Method"
          className="admin-filter-dropdown w-full sm:w-40"
          pt={dropdownPt}
        />

        {/* Date range */}
        <input
          type="date"
          value={filters.dateFrom || ""}
          onChange={(e) => onFilterChange("dateFrom", e.target.value || null)}
          className="admin-date-filter h-10 px-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent dark:text-gray-200 outline-none"
          title="From date"
        />
        <span className="text-xs text-gray-400">to</span>
        <input
          type="date"
          value={filters.dateTo || ""}
          onChange={(e) => onFilterChange("dateTo", e.target.value || null)}
          className="admin-date-filter h-10 px-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent dark:text-gray-200 outline-none"
          title="To date"
        />
      </div>
    </div>
  );
}

export default OrdersToolbar;
