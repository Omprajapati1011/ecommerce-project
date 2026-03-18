/**
 * @component AdminModifiersTable
 * @description PrimeReact DataTable for displaying modifier_master records.
 *
 * Columns: ID, Name, Value, Additional Price (INR), Status (toggle), Actions.
 * Shows skeleton placeholders while loading. No pagination (full list).
 *
 * Props: modifiers, loading, onEdit, onDelete, onToggleStatus
 * Consumed by: AdminModifiersTab
 */
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputSwitch } from "primereact/inputswitch";
import { Skeleton } from "primereact/skeleton";
import { Pencil, Trash2 } from "lucide-react";

function AdminModifiersTable({
  modifiers,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
  const nameBodyTemplate = (rowData) => (
    <span className="font-medium text-gray-900 dark:text-gray-100">
      {rowData.modifier_name}
    </span>
  );

  const valueBodyTemplate = (rowData) => (
    <span className="text-gray-700 dark:text-gray-300">
      {rowData.modifier_value}
    </span>
  );

  const priceBodyTemplate = (rowData) => {
    const price = Number(rowData.additional_price) || 0;
    if (price === 0) return <span className="text-gray-400">—</span>;
    return (
      <span className="font-medium text-green-600 dark:text-green-400">
        {new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(price)}
      </span>
    );
  };

  const statusBodyTemplate = (rowData) => (
    <div className="flex items-center gap-2">
      <InputSwitch
        checked={Boolean(rowData.is_active)}
        onChange={(e) => onToggleStatus(rowData, e.value)}
        className="admin-status-switch"
      />
      <span
        className={`text-xs font-medium ${rowData.is_active ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}
      >
        {rowData.is_active ? "Active" : "Inactive"}
      </span>
    </div>
  );

  const actionBodyTemplate = (rowData) => (
    <div className="flex gap-2">
      <Button
        type="button"
        rounded
        text
        severity="info"
        className="admin-action-btn h-9 w-9 p-0 flex items-center justify-center"
        onClick={() => onEdit(rowData)}
        tooltip="Edit modifier"
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
        tooltip="Delete modifier"
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
  const skeletonSwitchTemplate = () => (
    <div className="flex items-center gap-2">
      <Skeleton width="2.5rem" height="1.25rem" borderRadius="1rem" />
      <Skeleton width="3rem" height="0.875rem" />
    </div>
  );
  const skeletonActionTemplate = () => (
    <div className="flex gap-2">
      <Skeleton shape="circle" size="2.25rem" />
      <Skeleton shape="circle" size="2.25rem" />
    </div>
  );

  const skeletonData = Array.from({ length: 6 }, (_, i) => ({
    modifier_id: `skeleton-${i}`,
  }));

  return (
    <div className="admin-products-table-wrapper flex-1 flex flex-col min-h-0">
      <DataTable
        value={loading ? skeletonData : modifiers}
        dataKey="modifier_id"
        scrollable
        scrollHeight="calc(100vh - 18rem)"
        paginator={!loading && modifiers.length > 5}
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
        stateStorage="local"
        stateKey="admin-modifiers-dt-state"
        emptyMessage="No modifiers found."
        className="admin-products-table"
        tableStyle={{ minWidth: "45rem" }}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      >
        <Column
          field="modifier_id"
          header="ID"
          body={loading ? skeletonTemplate : null}
          style={{ width: "5rem" }}
          sortable={!loading}
        />
        <Column
          field="modifier_name"
          header="Name"
          body={loading ? skeletonTemplate : nameBodyTemplate}
          style={{ minWidth: "10rem" }}
          sortable={!loading}
        />
        <Column
          field="modifier_value"
          header="Value"
          body={loading ? skeletonTemplate : valueBodyTemplate}
          style={{ minWidth: "10rem" }}
        />
        <Column
          field="additional_price"
          header="Additional Price"
          body={loading ? skeletonTemplate : priceBodyTemplate}
          style={{ minWidth: "10rem" }}
          sortable={!loading}
        />
        <Column
          field="is_active"
          header="Status"
          body={loading ? skeletonSwitchTemplate : statusBodyTemplate}
          style={{ minWidth: "8rem" }}
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

export default AdminModifiersTable;