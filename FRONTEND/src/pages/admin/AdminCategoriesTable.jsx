/**
 * @component AdminCategoriesTable
 * @description PrimeReact DataTable for displaying category_master records.
 *
 * Columns: ID, Name, Parent Category, Actions (edit/delete).
 * Shows skeleton placeholders while loading.
 *
 * Props: categories, loading, onEdit, onDelete
 * Consumed by: AdminCategoriesTab
 */
import { useMemo } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import { Pencil, Trash2, FolderOpen, Folder } from "lucide-react";

function AdminCategoriesTable({ categories, loading, onEdit, onDelete }) {
  // Build id → name map for parent lookup
  const parentMap = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => map.set(c.category_id, c.category_name));
    return map;
  }, [categories]);

  const nameBodyTemplate = (rowData) => (
    <div className="flex items-center gap-2">
      {rowData.parent_id ? (
        <Folder className="h-4 w-4 text-amber-500 flex-shrink-0" />
      ) : (
        <FolderOpen className="h-4 w-4 text-amber-600 flex-shrink-0" />
      )}
      <span className="font-medium text-gray-900 dark:text-gray-100">
        {rowData.category_name}
      </span>
    </div>
  );

  const parentBodyTemplate = (rowData) => {
    if (!rowData.parent_id) {
      return (
        <Tag value="Root" severity="info" className="text-xs font-medium" />
      );
    }
    const parentName = parentMap.get(rowData.parent_id);
    return (
      <span className="text-gray-600 dark:text-gray-400 text-sm">
        {parentName ?? `ID: ${rowData.parent_id}`}
      </span>
    );
  };

  const actionBodyTemplate = (rowData) => (
    <div className="flex gap-2">
      <Button
        type="button"
        rounded
        text
        severity="info"
        className="admin-action-btn h-9 w-9 p-0 flex items-center justify-center"
        onClick={() => onEdit(rowData)}
        tooltip="Edit category"
        tooltipOptions={{ position: "top" }}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        rounded
        text
        severity="danger"
        className="admin-action-btn h-9 w-9 p-0 flex items-center justify-center"
        onClick={() => onDelete(rowData)}
        tooltip="Delete category"
        tooltipOptions={{ position: "top" }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  // Skeleton templates
  const skeletonTemplate = () => (
    <Skeleton height="1.25rem" className="w-[80%]" />
  );
  const skeletonActionTemplate = () => (
    <div className="flex gap-2">
      <Skeleton shape="circle" size="2.25rem" />
      <Skeleton shape="circle" size="2.25rem" />
    </div>
  );

  const skeletonData = Array.from({ length: 6 }, (_, i) => ({
    category_id: `skeleton-${i}`,
  }));

  return (
    <div className="admin-products-table-wrapper flex-1 flex flex-col min-h-0">
      <DataTable
        value={loading ? skeletonData : categories}
        dataKey="category_id"
        scrollable
        scrollHeight="calc(100vh - 18rem)"
        paginator={!loading && categories.length > 5}
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
        stateStorage="local"
        stateKey="admin-categories-dt-state"
        emptyMessage="No categories found."
        className="admin-products-table"
        tableStyle={{ minWidth: "40rem" }}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      >
        <Column
          field="category_id"
          header="ID"
          body={loading ? skeletonTemplate : null}
          style={{ width: "5rem" }}
          sortable={!loading}
        />
        <Column
          field="category_name"
          header="Name"
          body={loading ? skeletonTemplate : nameBodyTemplate}
          style={{ minWidth: "14rem" }}
          sortable={!loading}
        />
        <Column
          field="parent_id"
          header="Parent Category"
          body={loading ? skeletonTemplate : parentBodyTemplate}
          style={{ minWidth: "14rem" }}
        />
        <Column
          header="Actions"
          body={loading ? skeletonActionTemplate : actionBodyTemplate}
          exportable={false}
          style={{ minWidth: "7rem" }}
        />
      </DataTable>
    </div>
  );
}

export default AdminCategoriesTable;
