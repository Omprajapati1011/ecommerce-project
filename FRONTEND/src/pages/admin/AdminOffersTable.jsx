import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputSwitch } from "primereact/inputswitch";
import { Tag } from "primereact/tag";
import { getOfferLifecycleMeta } from "./offerLifecycle";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
};

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return Number(value).toLocaleString();
};

function AdminOffersTable({
  offers,
  loading,
  sortField,
  sortOrder,
  onSort,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewUsage,
}) {
  const headerClass =
    "!bg-transparent !text-gray-700 dark:!text-slate-200 !border-0 !text-[0.875rem] !leading-5 !font-semibold !px-4 !py-4";
  const bodyClass =
    "!bg-transparent !text-gray-700 dark:!text-slate-200 !border-0 !text-[0.875rem] !leading-5 !font-normal !px-4 !py-4";

  const typeBody = (rowData) => (
    <Tag
      value={String(rowData.offer_type || "").replaceAll("_", " ")}
      className="!font-medium !text-xs !px-2 !py-1 !rounded-full !bg-amber-100 !text-amber-800 dark:!bg-amber-900/40 dark:!text-amber-200"
    />
  );

  const nameBody = (rowData) => (
    <span className="text-[0.875rem] leading-5 font-medium text-gray-900 dark:text-gray-100">
      {rowData.offer_name}
    </span>
  );

  const discountBody = (rowData) => (
    <span className="text-[0.875rem] leading-5 font-medium text-gray-900 dark:text-gray-100">
      {rowData.discount_type === "percentage"
        ? `${formatNumber(rowData.discount_value)}%`
        : `Rs ${formatNumber(rowData.discount_value)}`}
    </span>
  );

  const maxDiscountBody = (rowData) => (
    <span className="text-[0.875rem] leading-5 font-normal text-gray-700 dark:text-gray-300">
      {rowData.maximum_discount_amount != null
        ? `Rs ${formatNumber(rowData.maximum_discount_amount)}`
        : "-"}
    </span>
  );

  const dateRangeBody = (rowData) => (
    <span className="text-[0.875rem] leading-5 font-normal text-gray-600 dark:text-gray-400">
      {formatDate(rowData.start_date)} - {formatDate(rowData.end_date)}
    </span>
  );

  const statusBody = (rowData) => (
    <div className="flex items-center gap-2">
      <InputSwitch
        checked={Boolean(rowData.is_active)}
        onChange={() => onToggleStatus(rowData)}
        className="admin-status-switch"
      />
      <span
        className={`text-xs font-medium ${
          rowData.is_active
            ? "text-green-600 dark:text-green-400"
            : "text-gray-500 dark:text-gray-400"
        }`}
      >
        {rowData.is_active ? "Active" : "Inactive"}
      </span>
    </div>
  );

  const lifecycleBody = (rowData) => {
    const lifecycle = getOfferLifecycleMeta(rowData);
    return (
      <Tag
        value={lifecycle.label}
        className={`!font-medium !text-xs !px-2 !py-1 !rounded-full ${lifecycle.className}`}
      />
    );
  };

  const actionBody = (rowData) => (
    <div className="flex gap-2 items-center">
      <Button
        type="button"
        rounded
        text
        severity="contrast"
        icon="pi pi-eye"
        className="admin-action-btn h-9 w-9 p-0 flex items-center justify-center"
        onClick={() => onView(rowData)}
        tooltip="View offer details"
        tooltipOptions={{ position: "top" }}
      />
      <Button
        type="button"
        rounded
        text
        severity="help"
        icon="pi pi-chart-bar"
        className="admin-action-btn h-9 w-9 p-0 flex items-center justify-center"
        onClick={() => onViewUsage(rowData)}
        tooltip="View offer usage"
        tooltipOptions={{ position: "top" }}
      />
      <Button
        type="button"
        rounded
        text
        severity="info"
        icon="pi pi-pencil"
        className="admin-action-btn h-9 w-9 p-0 flex items-center justify-center"
        onClick={() => onEdit(rowData)}
        tooltip="Edit offer"
        tooltipOptions={{ position: "top" }}
      />
      <Button
        type="button"
        rounded
        text
        severity="danger"
        icon="pi pi-trash"
        className="admin-action-btn h-9 w-9 p-0 flex items-center justify-center"
        onClick={() => onDelete(rowData)}
        tooltip="Delete offer"
        tooltipOptions={{ position: "top" }}
      />
    </div>
  );

  return (
    <div className="admin-products-table-wrapper flex-1 flex flex-col min-h-0">
      <DataTable
        value={offers}
        dataKey="offer_id"
        loading={loading}
        scrollable
        paginator
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={onSort}
        rows={10}
        rowsPerPageOptions={[10, 20, 50]}
        emptyMessage="No offers found."
        className="admin-products-table"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        tableStyle={{ minWidth: "110rem" }}
      >
        <Column
          field="offer_id"
          header="ID"
          sortable
          style={{ width: "5rem" }}
          headerClassName={headerClass}
          bodyClassName={bodyClass}
        />
        <Column
          field="offer_name"
          header="Offer Name"
          sortable
          body={nameBody}
          style={{ minWidth: "14rem" }}
          headerClassName={headerClass}
          bodyClassName={bodyClass}
        />
        <Column
          field="offer_type"
          header="Offer Type"
          body={typeBody}
          style={{ minWidth: "10rem" }}
          headerClassName={headerClass}
          bodyClassName={bodyClass}
        />
        <Column
          field="scope_name"
          header="Product / Category"
          body={(rowData) => <span>{rowData.scope_name || "-"}</span>}
          style={{ minWidth: "14rem" }}
          headerClassName={headerClass}
          bodyClassName={bodyClass}
        />
        <Column
          header="Discount"
          body={discountBody}
          style={{ minWidth: "9rem" }}
          headerClassName={headerClass}
          bodyClassName={bodyClass}
        />
        <Column
          field="maximum_discount_amount"
          header="Max Discount"
          body={maxDiscountBody}
          style={{ minWidth: "10rem" }}
          headerClassName={headerClass}
          bodyClassName={bodyClass}
        />
        <Column
          header="Date Range"
          body={dateRangeBody}
          style={{ minWidth: "13rem" }}
          headerClassName={headerClass}
          bodyClassName={bodyClass}
        />
        <Column
          header="Lifecycle"
          body={lifecycleBody}
          style={{ minWidth: "9rem" }}
          headerClassName={headerClass}
          bodyClassName={bodyClass}
        />
        <Column
          field="is_active"
          header="Status"
          body={statusBody}
          style={{ minWidth: "10rem" }}
          headerClassName={headerClass}
          bodyClassName={bodyClass}
        />
        <Column
          header="Actions"
          body={actionBody}
          style={{ minWidth: "14rem" }}
          headerClassName={headerClass}
          bodyClassName={bodyClass}
        />
      </DataTable>
    </div>
  );
}

export default AdminOffersTable;
