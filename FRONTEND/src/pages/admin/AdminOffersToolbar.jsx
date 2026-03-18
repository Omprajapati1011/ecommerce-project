import { useEffect, useRef, useCallback } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Plus } from "lucide-react";

const statusOptions = [
  { label: "All Status", value: null },
  { label: "Active", value: true },
  { label: "Inactive", value: false },
];

const offerTypeOptions = [
  { label: "All Types", value: null },
  { label: "Flat Discount", value: "flat_discount" },
  { label: "Product Discount", value: "product_discount" },
  { label: "Category Discount", value: "category_discount" },
  { label: "Time Based", value: "time_based" },
  { label: "First Order", value: "first_order" },
];

function AdminOffersToolbar({
  onSearch,
  onStatusFilter,
  statusFilter,
  onOfferTypeFilter,
  offerTypeFilter,
  onAddOffer,
  totalAll,
  totalActive,
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
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onSearch(value);
      }, 300);
    },
    [onSearch],
  );

  return (
    <div className="admin-products-toolbar flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <IconField iconPosition="left" className="w-full sm:w-72">
          <InputIcon className="pi pi-search text-gray-400" />
          <InputText
            type="search"
            onChange={handleSearchChange}
            placeholder="Search offers..."
            className="admin-search-input w-full pl-10 pr-3 h-10 rounded-xl border border-gray-200 dark:border-gray-700 text-sm transition-all outline-none"
          />
        </IconField>

        <Dropdown
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.value ?? null)}
          options={statusOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Filter by Status"
          className="admin-filter-dropdown w-full sm:w-44"
          pt={{
            root: {
              className:
                "admin-dropdown-root rounded-xl h-10 flex items-center shadow-none border border-gray-200 dark:border-gray-700",
            },
            input: { className: "px-3 text-sm" },
            trigger: { className: "w-8" },
            panel: {
              className: "admin-dropdown-panel rounded-lg shadow-xl mt-1",
            },
          }}
        />

        <Dropdown
          value={offerTypeFilter}
          onChange={(e) => onOfferTypeFilter(e.value ?? null)}
          options={offerTypeOptions}
          optionLabel="label"
          optionValue="value"
          placeholder="Filter by Offer Type"
          className="admin-filter-dropdown w-full sm:w-52"
          pt={{
            root: {
              className:
                "admin-dropdown-root rounded-xl h-10 flex items-center shadow-none border border-gray-200 dark:border-gray-700",
            },
            input: { className: "px-3 text-sm" },
            trigger: { className: "w-8" },
            panel: {
              className: "admin-dropdown-panel rounded-lg shadow-xl mt-1",
            },
          }}
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Total
            </span>
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
              {totalAll}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40">
            <span className="text-xs text-green-600 dark:text-green-400">
              Active
            </span>
            <span className="text-xs font-bold text-green-700 dark:text-green-300">
              {totalActive}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">
            <span className="text-xs text-red-500 dark:text-red-400">
              Inactive
            </span>
            <span className="text-xs font-bold text-red-600 dark:text-red-300">
              {totalAll - totalActive}
            </span>
          </div>
        </div>

        <Button
          type="button"
          className="admin-btn-primary flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all"
          onClick={onAddOffer}
        >
          <Plus className="h-4 w-4" />
          <span>New Offer</span>
        </Button>
      </div>
    </div>
  );
}

export default AdminOffersToolbar;
