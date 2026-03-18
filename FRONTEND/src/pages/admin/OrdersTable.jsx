import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";
import { Eye, CreditCard, Banknote, Landmark, RotateCcw } from "lucide-react";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(price || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const relativeTime = (dateStr) => {
  if (!dateStr) return "";
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return "";
};

const ORDER_STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  refunded: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

const PAYMENT_STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  refunded: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

const METHOD_LABELS = {
  stripe: "Stripe",
  cash_on_delivery: "COD",
  credit_card: "Card",
  debit_card: "Debit",
  paypal: "PayPal",
  bank_transfer: "Bank",
};

const MethodIcon = ({ method }) => {
  const cls = "w-3 h-3";
  if (method === "stripe" || method === "credit_card" || method === "debit_card")
    return <CreditCard className={cls} />;
  if (method === "cash_on_delivery") return <Banknote className={cls} />;
  if (method === "bank_transfer") return <Landmark className={cls} />;
  return <CreditCard className={cls} />;
};

function OrdersTable({
  orders,
  loading,
  totalRecords,
  lazyParams,
  onLazyLoad,
  onViewDetail,
}) {
  // Order number
  const orderNumberTemplate = (row) => (
    <span className="font-semibold text-gray-900 dark:text-gray-100">
      {row.order_number}
    </span>
  );

  // Customer
  const customerTemplate = (row) => (
    <div className="flex flex-col">
      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
        {row.customer_name || "—"}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {row.customer_email || ""}
      </span>
    </div>
  );

  // Items count
  const itemCountTemplate = (row) => (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300">
      {row.item_count || 0}
    </span>
  );

  // Total
  const totalTemplate = (row) => (
    <span className="font-medium text-green-600 dark:text-green-400">
      {formatPrice(row.total_amount)}
    </span>
  );

  // Order status badge
  const orderStatusTemplate = (row) => {
    const status = row.order_status || "pending";
    return (
      <span
        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${ORDER_STATUS_STYLES[status] || ORDER_STATUS_STYLES.pending}`}
      >
        {status}
      </span>
    );
  };

  // Payment column (status + method + refund)
  const paymentTemplate = (row) => {
    const pStatus = row.payment_status || "pending";
    const method = row.payment_method;
    const isRefunded = row.is_refunded === 1;
    return (
      <div className="flex flex-col gap-1">
        <span
          className={`inline-block w-fit px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${PAYMENT_STATUS_STYLES[pStatus] || PAYMENT_STATUS_STYLES.pending}`}
        >
          {pStatus}
        </span>
        {method && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <MethodIcon method={method} />
            {METHOD_LABELS[method] || method}
          </span>
        )}
        {isRefunded && (
          <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
            <RotateCcw className="w-3 h-3" />
            Refunded {row.refund_amount ? formatPrice(row.refund_amount) : ""}
          </span>
        )}
      </div>
    );
  };

  // Date
  const dateTemplate = (row) => (
    <div className="flex flex-col">
      <span className="text-sm text-gray-800 dark:text-gray-200">{formatDate(row.created_at)}</span>
      <span className="text-xs text-gray-400">{relativeTime(row.created_at)}</span>
    </div>
  );

  // Actions
  const actionTemplate = (row) => (
    <Button
      type="button"
      rounded
      text
      severity="info"
      className="admin-action-btn h-9 w-9 p-0 flex items-center justify-center"
      onClick={() => onViewDetail(row)}
      tooltip="View details"
      tooltipOptions={{ position: "top" }}
    >
      <Eye className="h-4 w-4" />
    </Button>
  );

  // Skeleton helpers
  const skeletonTemplate = () => <Skeleton height="1.25rem" className="w-[80%]" />;
  const skeletonBadgeTemplate = () => <Skeleton width="5rem" height="1.5rem" borderRadius="9999px" />;
  const skeletonCircleTemplate = () => <Skeleton shape="circle" size="1.75rem" />;
  const skeletonActionTemplate = () => <Skeleton shape="circle" size="2.25rem" />;

  const skeletonData = Array.from({ length: lazyParams.rows || 5 }, (_, i) => ({
    order_id: `skeleton-${i}`,
  }));

  const handlePage = (event) => {
    onLazyLoad({
      ...lazyParams,
      first: event.first,
      rows: event.rows,
      page: Math.floor(event.first / event.rows) + 1,
    });
  };

  const handleSort = (event) => {
    onLazyLoad({
      ...lazyParams,
      first: 0,
      page: 1,
      sortField: event.sortField,
      sortOrder: event.sortOrder,
    });
  };

  return (
    <div className="admin-products-table-wrapper flex-1 flex flex-col min-h-0">
      <DataTable
        value={loading ? skeletonData : orders}
        lazy
        paginator
        first={lazyParams.first}
        rows={lazyParams.rows}
        totalRecords={totalRecords}
        onPage={handlePage}
        onSort={handleSort}
        sortField={lazyParams.sortField}
        sortOrder={lazyParams.sortOrder}
        dataKey="order_id"
        scrollable
        emptyMessage="No orders found."
        className="admin-products-table"
        rowsPerPageOptions={[5, 10, 25, 50]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        tableStyle={{ minWidth: "60rem" }}
      >
        <Column field="order_number" header="Order #" sortable body={loading ? skeletonTemplate : orderNumberTemplate} style={{ minWidth: "8rem" }} />
        <Column field="customer_name" header="Customer" sortable body={loading ? skeletonTemplate : customerTemplate} style={{ minWidth: "12rem" }} />
        <Column field="item_count" header="Items" body={loading ? skeletonCircleTemplate : itemCountTemplate} style={{ width: "5rem" }} />
        <Column field="total_amount" header="Total" sortable body={loading ? skeletonTemplate : totalTemplate} style={{ minWidth: "8rem" }} />
        <Column field="order_status" header="Order Status" sortable body={loading ? skeletonBadgeTemplate : orderStatusTemplate} style={{ minWidth: "8rem" }} />
        <Column field="payment_status" header="Payment" sortable body={loading ? skeletonBadgeTemplate : paymentTemplate} style={{ minWidth: "9rem" }} />
        <Column field="created_at" header="Date" sortable body={loading ? skeletonTemplate : dateTemplate} style={{ minWidth: "8rem" }} />
        <Column header="Actions" body={loading ? skeletonActionTemplate : actionTemplate} exportable={false} style={{ width: "5rem" }} />
      </DataTable>
    </div>
  );
}

export default OrdersTable;
