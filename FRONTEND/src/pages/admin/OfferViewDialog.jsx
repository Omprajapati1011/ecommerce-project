import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { getOfferLifecycleMeta } from "./offerLifecycle";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return num.toLocaleString();
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  return `Rs ${num.toLocaleString()}`;
};

const formatDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return "-";
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "-";
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.floor((end - start) / msPerDay) + 1;
  if (diff <= 0) return "-";
  return `${diff} day${diff > 1 ? "s" : ""}`;
};

const formatTime = (value, kind) => {
  if (value) return value;
  if (kind === "start") return "Not set (starts at beginning of day)";
  return "Not set (ends at 11:59 PM)";
};

function OfferViewDialog({ visible, onHide, offer }) {
  const lifecycle = offer ? getOfferLifecycleMeta(offer) : null;

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

  const infoItem = (label, value, className = "") => (
    <div
      className={`rounded-xl border border-gray-200 bg-white/60 p-4 dark:border-gray-700 dark:bg-slate-900/40 ${className}`}
    >
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <div className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
        {value}
      </div>
    </div>
  );

  return (
    <Dialog
      header={offer ? `Offer Details - ${offer.offer_name}` : "Offer Details"}
      visible={visible}
      onHide={onHide}
      draggable={false}
      style={{ width: "min(58rem, 95vw)" }}
      footer={footer}
      dismissableMask
      className="admin-dialog"
      pt={{
        root: { className: "admin-dialog rounded-2xl overflow-hidden" },
        header: { className: "admin-dialog-header px-6 py-4 border-b" },
        title: {
          className: "text-xl font-serif text-gray-900 dark:text-slate-100",
        },
        content: { className: "p-6 font-sans admin-offer-view-scroll" },
        footer: {
          className: "admin-dialog-footer px-6 py-4 border-t rounded-b-2xl",
        },
      }}
    >
      {offer ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {infoItem("Offer ID", offer.offer_id ?? "-")}
            {infoItem(
              "Offer Type",
              <Tag
                value={String(offer.offer_type || "").replaceAll("_", " ")}
                className="!font-medium !text-xs !px-2 !py-1 !rounded-full !bg-amber-100 !text-amber-800 dark:!bg-amber-900/40 dark:!text-amber-200"
              />,
            )}
            {infoItem("Offer Name", offer.offer_name || "-")}
            {infoItem("Product / Category", offer.scope_name || "-")}
            {infoItem(
              "Description",
              offer.description?.trim() || "No description provided.",
              "md:col-span-2",
            )}
            {infoItem(
              "Lifecycle",
              <Tag
                value={lifecycle.label}
                className={`!font-medium !text-xs !px-2 !py-1 !rounded-full ${lifecycle.className}`}
              />,
            )}
            {infoItem(
              "Status",
              <span
                className={
                  offer.is_active
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-500 dark:text-gray-400"
                }
              >
                {offer.is_active ? "Active" : "Inactive"}
              </span>,
            )}
            {infoItem("Discount Type", offer.discount_type || "-")}
            {infoItem(
              "Maximum Discount Amount",
              formatCurrency(offer.maximum_discount_amount),
            )}
            {infoItem(
              "Minimum Purchase Amount",
              formatCurrency(offer.min_purchase_amount),
            )}
            {infoItem(
              "Usage Limit Per User",
              formatNumber(offer.usage_limit_per_user),
            )}
            {infoItem(
              "Duration",
              formatDuration(offer.start_date, offer.end_date),
            )}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {infoItem("Start Date", formatDate(offer.start_date))}
              {infoItem("End Date", formatDate(offer.end_date))}
              {infoItem("Start Time", formatTime(offer.start_time, "start"))}
              {infoItem("End Time", formatTime(offer.end_time, "end"))}
            </div>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

export default OfferViewDialog;
