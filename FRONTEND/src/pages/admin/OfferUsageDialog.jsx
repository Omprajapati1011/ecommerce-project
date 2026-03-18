import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function OfferUsageDialog({
  visible,
  onHide,
  offer,
  usageRows = [],
  loading,
}) {
  const footer = (
    <div className="flex justify-end">
      <Button
        type="button"
        label="Close"
        onClick={onHide}
        className="admin-btn-secondary px-4 py-2 rounded-lg font-medium transition-colors"
      />
    </div>
  );

  return (
    <Dialog
      header={offer ? `Offer Usage - ${offer.offer_name}` : "Offer Usage"}
      visible={visible}
      onHide={onHide}
      draggable={false}
      style={{ width: "min(64rem, 96vw)" }}
      footer={footer}
      dismissableMask
      className="admin-dialog"
      pt={{
        root: { className: "admin-dialog rounded-2xl overflow-hidden" },
        header: { className: "admin-dialog-header px-6 py-4 border-b" },
        title: { className: "text-xl font-serif text-gray-900 dark:text-slate-100" },
        content: { className: "p-6 font-sans" },
        footer: { className: "admin-dialog-footer px-6 py-4 border-t rounded-b-2xl" },
      }}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800/50">
          <span className="text-gray-500 dark:text-gray-400">Offer ID</span>
          <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
            {offer?.offer_id ?? "-"}
          </span>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800/50">
          <span className="text-gray-500 dark:text-gray-400">Total Usage</span>
          <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
            {usageRows.length}
          </span>
        </div>
      </div>

      <div className="admin-products-table-wrapper flex flex-col min-h-0">
        <DataTable
          value={usageRows}
          loading={loading}
          dataKey="order_id"
          scrollable
          paginator
          rows={10}
          rowsPerPageOptions={[10, 20, 50]}
          emptyMessage="No usage found for this offer."
          className="admin-products-table"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          tableStyle={{ minWidth: "52rem" }}
        >
          <Column
            header="User ID"
            body={(rowData) => rowData.user_id ?? "-"}
            style={{ minWidth: "8rem" }}
          />
          <Column
            header="Username"
            body={(rowData) => rowData.username || rowData.user_name || rowData.name || "-"}
            style={{ minWidth: "12rem" }}
          />
          <Column
            header="Order ID"
            body={(rowData) => rowData.order_id ?? "-"}
            style={{ minWidth: "8rem" }}
          />
          <Column
            header="Discount Amount"
            body={(rowData) => formatCurrency(rowData.discount_amount)}
            style={{ minWidth: "10rem" }}
          />
          <Column
            field="created_at"
            header="Used At"
            body={(rowData) => formatDateTime(rowData.created_at)}
            style={{ minWidth: "12rem" }}
          />
        </DataTable>
      </div>
    </Dialog>
  );
}

export default OfferUsageDialog;
