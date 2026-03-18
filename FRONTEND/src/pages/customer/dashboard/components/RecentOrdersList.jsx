import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { Tag } from "primereact/tag";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const orderSeverity = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (["delivered", "completed"].includes(normalized)) return "success";
  if (["cancelled", "failed"].includes(normalized)) return "danger";
  if (["returned", "refunded"].includes(normalized)) return "warning";
  if (["processing", "pending", "shipped"].includes(normalized)) return "info";
  return "secondary";
};

function RecentOrdersList({ loading, orders }) {
  return (
    <Card className="rounded-2xl border border-[#ddcfb7] bg-[#f8f3ea] p-2 shadow-[0_20px_34px_-30px_rgba(15,23,42,0.8)] dark:border-[#1f2933] dark:bg-[#151e22]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-2 pt-3 sm:px-5">
        <div>
          <h3 className="font-serif text-2xl text-slate-900 dark:text-slate-100">
            Recent Orders
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Latest purchases from your account activity.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#ddcfb7] bg-[#f3ecdf] px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <i className="pi pi-clock text-[11px]" />
          Updated
        </span>
      </div>

      <div className="space-y-3 px-3 pb-3 pt-1 md:hidden">
        {loading ? (
          <div className="flex items-center gap-2 rounded-xl border border-[#ddcfb7] bg-[#f3ecdf] px-3 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <ProgressSpinner style={{ width: "18px", height: "18px" }} strokeWidth="5" />
            Loading recent orders...
          </div>
        ) : orders.length === 0 ? (
          <Message severity="info" text="No recent orders found." className="w-full" />
        ) : (
          orders.map((row) => (
            <div
              key={row.order_id}
              className="rounded-xl border border-[#ddcfb7] bg-[#f3ecdf] p-3 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                    Order Number
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {row.order_number || `#${row.order_id}`}
                  </p>
                </div>
                <Tag
                  value={row.order_status || "unknown"}
                  severity={orderSeverity(row.order_status)}
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                <p>
                  <span className="font-medium">Total:</span>{" "}
                  <span className="text-slate-900 dark:text-slate-100">
                    {formatCurrency(row.total_amount)}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Date:</span>{" "}
                  <span className="text-slate-900 dark:text-slate-100">
                    {formatDate(row.created_at || row.placed_at)}
                  </span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block">
        <DataTable
          value={orders}
          loading={loading}
          className="mt-1 recent-orders-table"
          stripedRows
          rows={5}
          emptyMessage="No recent orders found."
          pt={{
            wrapper: {
              className:
                "rounded-xl border border-[#ddcfb7] bg-[#f8f3ea] dark:border-slate-700 dark:bg-[#151e22]",
            },
            table: { className: "bg-transparent" },
            thead: { className: "bg-[#efe7d8] dark:bg-slate-800" },
            headerRow: { className: "bg-[#efe7d8] dark:bg-slate-800" },
            bodyRow: {
              className: "bg-transparent odd:bg-[#f8f3ea] even:bg-[#f2eadc] dark:odd:bg-[#151e22] dark:even:bg-[#192328]",
            },
          }}
        >
          <Column
            field="order_number"
            header="Order Number"
            body={(row) => row.order_number || `#${row.order_id}`}
          />
          <Column
            field="total_amount"
            header="Total Amount"
            body={(row) => formatCurrency(row.total_amount)}
          />
          <Column
            field="order_status"
            header="Order Status"
            body={(row) => (
              <Tag
                value={row.order_status || "unknown"}
                severity={orderSeverity(row.order_status)}
              />
            )}
          />
          <Column
            field="created_at"
            header="Order Date"
            body={(row) => formatDate(row.created_at || row.placed_at)}
          />
        </DataTable>
      </div>
    </Card>
  );
}

export default RecentOrdersList;
