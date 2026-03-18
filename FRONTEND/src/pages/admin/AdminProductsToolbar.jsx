/**
 * @component AdminProductsToolbar
 * @description Toolbar bar above the products DataTable.
 *
 * Contains:
 *  - "New Product" button (primary action)
 *  - Stats badges (Total, Active, Inactive counts)
 *  - Status filter dropdown (All / Active / Inactive)
 *  - Debounced search input (300ms delay)
 *
 * Props: onSearch, onStatusFilter, statusFilter, onAddProduct, totalAll, totalActive
 * Consumed by: AdminProductsTab
 */
import { useRef, useCallback, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Search, Plus } from "lucide-react";

// Status filter options
const statusOptions = [
  { label: "All Status", value: null },
  { label: "Active", value: true },
  { label: "Inactive", value: false },
];

/**
 * AdminProductsToolbar - Top bar with search, filters, and "New Product" button
 * @param {Object} props
 * @param {Function} props.onSearch - Callback when search value changes (debounced)
 * @param {Function} props.onStatusFilter - Callback when status filter changes
 * @param {*} props.statusFilter - Current status filter value
 * @param {Function} props.onAddProduct - Callback when "New Product" button is clicked
 */
function AdminProductsToolbar({ onSearch, onStatusFilter, statusFilter, onAddProduct, totalAll, totalActive }) {
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

      // Clear existing timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Set new timeout for debounce (300ms)
      debounceRef.current = setTimeout(() => {
        onSearch(value);
      }, 300);
    },
    [onSearch]
  );

  return (
    <div className="admin-products-toolbar flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      {/* Left side: New Product button */}
      <Button
        type="button"
        className="admin-btn-primary flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all"
        onClick={onAddProduct}
      >
        <Plus className="h-4 w-4" />
        <span>New Product</span>
      </Button>

      {/* Right side: Stats + Filters + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Stats badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{totalAll}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40">
            <span className="text-xs text-green-600 dark:text-green-400">Active</span>
            <span className="text-xs font-bold text-green-700 dark:text-green-300">{totalActive}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">
            <span className="text-xs text-red-500 dark:text-red-400">Inactive</span>
            <span className="text-xs font-bold text-red-600 dark:text-red-300">{totalAll - totalActive}</span>
          </div>
        </div>

        {/* Status Filter */}
        <Dropdown
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.value)}
          options={statusOptions}
          placeholder="Filter by Status"
          className="admin-filter-dropdown w-full sm:w-40"
          pt={{
            root: {
              className: "admin-dropdown-root rounded-xl h-10 flex items-center shadow-none border border-gray-200 dark:border-gray-700",
            },
            input: {
              className: "px-3 text-sm",
            },
            trigger: { className: "w-8" },
            panel: {
              className: "admin-dropdown-panel rounded-lg shadow-xl mt-1",
            },
          }}
        />

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <InputText
            type="search"
            onChange={handleSearchChange}
            placeholder="Search products..."
            className="admin-search-input w-full pl-10 border border-gray-200 dark:border-gray-700 rounded-xl h-10 text-sm transition-all outline-none"
          />
        </div>
      </div>
    </div>
  );
}

export default AdminProductsToolbar;