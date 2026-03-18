import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { Tag } from "primereact/tag";

const formatCurrency = (value, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: String(currency || "INR").toUpperCase(),
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusSeverity = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "completed") return "success";
  if (["failed", "cancelled"].includes(normalized)) return "danger";
  if (normalized === "refunded") return "warning";
  if (["processing", "pending"].includes(normalized)) return "info";
  return "secondary";
};

function PaymentDetailsModal({ loading, onHide, payment, visible }) {
  return (
    <Dialog
      header={`Payment Details ${
        payment?.transaction_id ? `| ${payment.transaction_id}` : ""
      }`}
      className="address-dialog payment-dialog !overflow-hidden"
      visible={visible}
      style={{ width: "92vw", maxWidth: "760px" }}
      breakpoints={{ "960px": "94vw", "641px": "96vw" }}
      onHide={onHide}
      dismissableMask
    >
      {loading ? (
        <div className="flex items-center gap-3 py-6">
          <ProgressSpinner style={{ width: "24px", height: "24px" }} strokeWidth="4" />
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Loading payment details...
          </p>
        </div>
      ) : payment ? (
        <Card className="rounded-xl border border-slate-200/80 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                Transaction ID
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {payment.transaction_id || `PAY-${payment.payment_id}`}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                Order Number
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {payment.order_number || `#${payment.order_id}`}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                Payment Method
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {String(payment.payment_method || "-").replace(/_/g, " ")}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                Status
              </p>
              <div className="mt-1">
                <Tag
                  value={payment.status || "pending"}
                  severity={statusSeverity(payment.status)}
                />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                Amount
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(payment.amount, payment.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                Currency
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {String(payment.currency || "INR").toUpperCase()}
              </p>
            </div>
          </div>

          <Divider className="!my-3" />

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                Created At
              </p>
              <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                {formatDateTime(payment.created_at)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                Updated At
              </p>
              <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                {formatDateTime(payment.updated_at)}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Payment details not available.
        </p>
      )}
    </Dialog>
  );
}

export default PaymentDetailsModal;
