import { Skeleton } from "primereact/skeleton";
import { InputText } from "primereact/inputtext";
import { useTheme } from "../../context/ThemeContext";

function CategorySearchBar({ isLoading, searchText = "", onSearchChange }) {
  const { darkMode } = useTheme();

  if (isLoading) {
    return <Skeleton height="45px" />;
  }

  return (
    <div
      className={`category-search-bar w-full rounded-xl border p-3 ${
        darkMode
          ? "border-[#1f2933] bg-[#151e22]"
          : "border-gray-200 bg-white"
      }`}
    >
      <span className="p-input-icon-left relative block w-full">
        <i
          className={`pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm ${
            darkMode ? "text-slate-400" : "text-gray-400"
          }`}
        />
        <InputText
          value={searchText}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search products..."
          className={`category-search-input w-full !pl-10 !pr-3 !py-2.5 !rounded-lg !border !shadow-none focus:!ring-0 ${
            darkMode
              ? "!bg-[#0f161a] !border-[#223038] !text-slate-100 placeholder:!text-slate-500 focus:!border-[#2f7a6f]"
              : "!bg-white !border-gray-300 !text-gray-800 placeholder:!text-gray-400 focus:!border-[#2f7a6f]"
          }`}
        />
      </span>
    </div>
  );
}

export default CategorySearchBar;
