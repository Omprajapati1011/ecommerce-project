import { Chip } from "primereact/chip";
import { Skeleton } from "primereact/skeleton";
import { useTheme } from "../../context/ThemeContext";

function SelectedFilters({
  isLoading = false,
  categoryTags = [],
  searchText = "",
  priceTag = "",
  onRemoveCategory,
  onClearSearch,
  onClearPrice,
}) {
  const { darkMode } = useTheme();
  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        <Skeleton
          width="110px"
          height="28px"
          className={`!rounded-full ${darkMode ? "bg-[#1f2933]" : "bg-gray-200"}`}
        />
        <Skeleton
          width="90px"
          height="28px"
          className={`!rounded-full ${darkMode ? "bg-[#1f2933]" : "bg-gray-200"}`}
        />
        <Skeleton
          width="130px"
          height="28px"
          className={`!rounded-full ${darkMode ? "bg-[#1f2933]" : "bg-gray-200"}`}
        />
      </div>
    );
  }

  const hasAny =
    categoryTags.length > 0 || Boolean(searchText) || Boolean(priceTag);
  if (!hasAny) return null;

  return (
    <div className="selected-filters-row flex min-w-0 flex-wrap gap-2">
      {categoryTags.map((tag) => (
        <Chip
          key={tag.id}
          label={tag.label}
          removable
          onRemove={() => onRemoveCategory?.(tag.id)}
          className={darkMode ? "selected-filter-chip selected-filter-chip-dark" : "selected-filter-chip"}
        />
      ))}

      {searchText ? (
        <Chip
          label={`Search: ${searchText}`}
          removable
          onRemove={() => onClearSearch?.()}
          className={darkMode ? "selected-filter-chip selected-filter-chip-dark" : "selected-filter-chip"}
        />
      ) : null}

      {priceTag ? (
        <Chip
          label={priceTag}
          removable
          onRemove={() => onClearPrice?.()}
          className={darkMode ? "selected-filter-chip selected-filter-chip-dark" : "selected-filter-chip"}
        />
      ) : null}
    </div>
  );
}

export default SelectedFilters;
