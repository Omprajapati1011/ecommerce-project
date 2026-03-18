import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { ProgressSpinner } from "primereact/progressspinner";
import { Tag } from "primereact/tag";

const formatCurrency = (value, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: String(currency || "INR").toUpperCase(),
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const statusSeverity = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "completed") return "success";
  if (["failed", "cancelled"].includes(normalized)) return "danger";
  if (normalized === "refunded") return "warning";
  if (["processing", "pending"].includes(normalized)) return "info";
  return "secondary";
};

const paymentMethodLabel = (value) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "cash_on_delivery") return "Cash on Delivery";
  if (!normalized) return "-";
  return normalized.replace(/_/g, " ");
};

function PaymentsTable({ loading, onViewDetails, payments }) {
  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-[0_20px_36px_-30px_rgba(15,23,42,0.8)] dark:border-[#1f2933] dark:bg-[#151e22]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-2 pt-3 sm:px-5">
        <div>
          <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100">
            Payments History
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Track all payment attempts and transaction statuses.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <i className="pi pi-credit-card text-[11px]" />
          {payments.length} Payments
        </span>
      </div>

      <div className="space-y-3 px-3 pb-3 pt-1 md:hidden">
        {loading ? (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <ProgressSpinner style={{ width: "18px", height: "18px" }} strokeWidth="5" />
            Loading payments...
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            No payment history found.
          </div>
        ) : (
          payments.map((row) => (
            <div
              key={row.payment_id}
              className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                    Transaction ID
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {row.transaction_id || `PAY-${row.payment_id}`}
                  </p>
                </div>
                <Tag value={String(row.status || "pending")} severity={statusSeverity(row.status)} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                <p>
                  <span className="font-medium">Order:</span>{" "}
                  <span className="text-slate-900 dark:text-slate-100">
                    {row.order_number || `#${row.order_id}`}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Method:</span>{" "}
                  <span className="text-slate-900 dark:text-slate-100">
                    {paymentMethodLabel(row.payment_method)}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Amount:</span>{" "}
                  <span className="text-slate-900 dark:text-slate-100">
                    {formatCurrency(row.amount, row.currency)}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Currency:</span>{" "}
                  <span className="text-slate-900 dark:text-slate-100">
                    {String(row.currency || "INR").toUpperCase()}
                  </span>
                </p>
              </div>

              <Button
                type="button"
                label="View Details"
                icon="pi pi-eye"
                size="small"
                outlined
                className="!mt-3 !w-full !rounded-lg"
                onClick={() => onViewDetails(row)}
              />
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block">
        <DataTable
          value={payments}
          loading={loading}
          className="mt-1"
          stripedRows
          emptyMessage="No payment history found."
          rows={10}
          responsiveLayout="scroll"
          pt={{
            wrapper: {
              className: "rounded-xl border border-slate-200/70 dark:border-slate-700",
            },
          }}
        >
          <Column
            field="transaction_id"
            header="Transaction ID"
            body={(row) => row.transaction_id || `PAY-${row.payment_id}`}
          />
          <Column
            field="order_number"
            header="Order Number"
            body={(row) => row.order_number || `#${row.order_id}`}
          />
          <Column
            field="payment_method"
            header="Payment Method"
            body={(row) => paymentMethodLabel(row.payment_method)}
          />
          <Column
            field="amount"
            header="Amount"
            body={(row) => formatCurrency(row.amount, row.currency)}
          />
          <Column
            field="currency"
            header="Currency"
            body={(row) => String(row.currency || "INR").toUpperCase()}
          />
          <Column
            field="status"
            header="Status"
            body={(row) => (
              <Tag
                value={String(row.status || "pending")}
                severity={statusSeverity(row.status)}
              />
            )}
          />
          <Column
            header="Actions"
            body={(row) => (
              <Button
                type="button"
                label="View Details"
                icon="pi pi-eye"
                size="small"
                outlined
                className="!rounded-lg"
                onClick={() => onViewDetails(row)}
              />
            )}
          />
        </DataTable>
      </div>
    </Card>
  );
}

export default PaymentsTable;
