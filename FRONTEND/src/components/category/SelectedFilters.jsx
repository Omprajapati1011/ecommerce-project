import { Chip } from "primereact/chip";
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
  if (isLoading) return null;

  const hasAny =
    categoryTags.length > 0 || Boolean(searchText) || Boolean(priceTag);
  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap gap-2">
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
