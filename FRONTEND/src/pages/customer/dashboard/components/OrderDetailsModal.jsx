import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { Tag } from "primereact/tag";
import {
  displayPaymentStatus,
  formatCurrency,
  formatDate,
  orderSeverity,
  paymentSeverity,
} from "../utils";

const normalizeStatus = (status) => String(status || "").toLowerCase();

const cardPt = {
  body: { className: "!p-0" },
  content: { className: "!p-0" },
};

const buildFallbackImage = (name = "Product") => {
  const letter = String(name || "P").trim().charAt(0).toUpperCase() || "P";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
          <stop stop-color="#e2e8f0"/>
          <stop offset="1" stop-color="#cbd5e1"/>
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="12" fill="url(#g)"/>
      <text x="48" y="56" text-anchor="middle" fill="#475569" font-family="Arial, sans-serif" font-size="34" font-weight="700">${letter}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const getItemImage = (item) =>
  item?.image_url ||
  item?.image ||
  item?.imageUrl ||
  item?.product_image ||
  item?.productImage ||
  "";

const canCancel = (status) =>
  ["pending", "processing"].includes(normalizeStatus(status));

const canReturn = (status) =>
  ["delivered", "completed"].includes(normalizeStatus(status));

const canDownloadInvoice = (status) =>
  ["delivered", "completed"].includes(normalizeStatus(status));

const getStepIndex = (status) => {
  const normalized = normalizeStatus(status);

  if (normalized === "pending") return 0;
  if (normalized === "processing") return 1;
  if (normalized === "shipped") return 2;
  if (["delivered", "completed"].includes(normalized)) return 3;

  return 0;
};

function TimelineRow({
  active = false,
  completed = false,
  label,
  showLine = false,
  subline,
}) {
  return (
    <div className="relative flex gap-3 pb-4 last:pb-0">
      {showLine ? (
        <span
          className={`absolute left-[9px] top-6 h-[calc(100%-12px)] w-px ${
            completed ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
          }`}
        />
      ) : null}
      <span
        className={`mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border ${
          completed || active
            ? "border-emerald-600 bg-emerald-600 text-white"
            : "border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-900"
        }`}
      >
        {completed || active ? (
          <i className="pi pi-check text-[10px]" />
        ) : (
          <i className="pi pi-circle-fill text-[6px]" />
        )}
      </span>
      <div>
        <p
          className={`text-sm font-medium ${
            active || completed
              ? "text-slate-900 dark:text-slate-100"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {label}
        </p>
        {subline ? (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subline}</p>
        ) : null}
      </div>
    </div>
  );
}

function OrderDetailsModal({
  actionLoading,
  address,
  error,
  items,
  loading,
  onBack,
  onCancelOrder,
  onDownloadInvoice,
  onReturnOrder,
  order,
  payment,
}) {
  const currentStep = getStepIndex(order?.order_status);
  const currentStatus = normalizeStatus(order?.order_status);
  const isCanceling = actionLoading?.cancelingId === Number(order?.order_id);
  const isReturning = actionLoading?.returningId === Number(order?.order_id);
  const paymentMethod = payment?.payment_method || "-";
  const paymentStatus = displayPaymentStatus(
    payment?.status || order?.payment_status || "-",
    order,
  );

  const timeline = [
    {
      label: `Order confirmed, ${formatDate(order?.created_at || order?.placed_at)}`,
      subline: "We have received your order.",
    },
    {
      label: "Packed and processing",
      subline: "Your items are being prepared.",
    },
    {
      label: "Shipped",
      subline: "Your package is on the way.",
    },
    {
      label: `Delivered, ${formatDate(order?.updated_at || order?.created_at)}`,
      subline: "Package delivered to your address.",
    },
  ];

  return (
    <div className="space-y-4">
      <Card
        pt={cardPt}
        className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_30px_-28px_rgba(15,23,42,0.9)] dark:border-[#1f2933] dark:bg-[#151e22]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              type="button"
              icon="pi pi-arrow-left"
              label="Back to Orders"
              outlined
              className="!rounded-lg !border-slate-300 !text-slate-700 dark:!border-slate-600 dark:!text-slate-200"
              onClick={onBack}
            />
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                Order
              </p>
              <h3 className="font-serif text-xl text-slate-900 dark:text-slate-100">
                {order?.order_number || `#${order?.order_id}`}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Tag value={order?.order_status || "unknown"} severity={orderSeverity(order?.order_status)} />
            <Tag
              value={paymentStatus}
              severity={
                paymentStatus === "N/A"
                  ? "secondary"
                  : paymentSeverity(paymentStatus)
              }
            />
            <Tag value={formatCurrency(order?.total_amount)} severity="secondary" />
          </div>
        </div>
      </Card>

      {error ? <Message severity="error" text={error} className="w-full" /> : null}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Card
            pt={cardPt}
            className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_30px_-30px_rgba(15,23,42,1)] dark:border-[#1f2933] dark:bg-[#151e22]"
          >
            {loading ? (
              <div className="flex items-center gap-3 p-5">
                <ProgressSpinner style={{ width: "24px", height: "24px" }} strokeWidth="4" />
                <p className="text-sm text-slate-600 dark:text-slate-300">Loading order summary...</p>
              </div>
            ) : (
              <div className="space-y-3 p-4 sm:p-5">
                {items.length === 0 ? (
                  <Message severity="info" text="No items found for this order." className="w-full" />
                ) : (
                  items.map((item, index) => (
                    <div
                      key={`${item?.order_item_id || item?.product_id || "item"}-${index}`}
                      className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_10px_16px_-18px_rgba(15,23,42,1)] dark:border-slate-700 dark:bg-slate-800/60"
                    >
                      <div className="flex gap-3">
                        <img
                          src={getItemImage(item) || buildFallbackImage(item?.product_name)}
                          alt={item?.product_name || "Order item"}
                          className="h-16 w-16 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.src = buildFallbackImage(item?.product_name);
                          }}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {item?.product_name || `Product #${item?.product_id}`}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {item?.portion_value || "Default variant"}
                            {item?.modifier_value ? ` | ${item.modifier_value}` : ""}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                            <span>Qty: {Number(item?.quantity) || 0}</span>
                            <span>Price: {formatCurrency(item?.price)}</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              Total: {formatCurrency(item?.total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>

          <Card
            pt={cardPt}
            className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_30px_-30px_rgba(15,23,42,1)] dark:border-[#1f2933] dark:bg-[#151e22]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 p-5">
              <h4 className="font-serif text-xl text-slate-900 dark:text-slate-100">
                Order Timeline
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Last update: {formatDate(order?.updated_at || order?.created_at)}
              </span>
            </div>
            <Divider className="!my-0" />
            <div className="p-5">
              {timeline.map((step, index) => (
                <TimelineRow
                  key={step.label}
                  label={step.label}
                  subline={step.subline}
                  completed={index < currentStep}
                  active={index === currentStep && !["cancelled", "returned"].includes(currentStatus)}
                  showLine={index < timeline.length - 1}
                />
              ))}

              {currentStatus === "cancelled" ? (
                <TimelineRow
                  label={`Cancelled, ${formatDate(order?.updated_at || order?.created_at)}`}
                  subline="This order was cancelled."
                  active
                />
              ) : null}

              {currentStatus === "returned" ? (
                <TimelineRow
                  label={`Return requested, ${formatDate(order?.updated_at || order?.created_at)}`}
                  subline="Return request has been submitted."
                  active
                />
              ) : null}
            </div>
          </Card>
        </div>

        <div className="space-y-4 xl:sticky xl:top-4">
          <Card
            pt={cardPt}
            className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_30px_-30px_rgba(15,23,42,1)] dark:border-[#1f2933] dark:bg-[#151e22]"
          >
            <div className="p-5">
              <h4 className="font-serif text-xl text-slate-900 dark:text-slate-100">
                Delivery Details
              </h4>
              <Divider className="!my-4" />
              {address ? (
                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {address?.full_name || "-"}
                  </p>
                  <p>{address?.phone || "-"}</p>
                  <p>{address?.address_line1 || "-"}</p>
                  {address?.address_line2 ? <p>{address.address_line2}</p> : null}
                  <p>
                    {address?.city || "-"}, {address?.state || "-"}
                  </p>
                  <p>{address?.postal_code || "-"}</p>
                  {address?.country ? <p>{address.country}</p> : null}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Delivery address not found.
                </p>
              )}
            </div>
          </Card>

          <Card
            pt={cardPt}
            className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_30px_-30px_rgba(15,23,42,1)] dark:border-[#1f2933] dark:bg-[#151e22]"
          >
            <div className="p-5">
              <h4 className="font-serif text-xl text-slate-900 dark:text-slate-100">
                Price Details
              </h4>
              <Divider className="!my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order?.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Tax</span>
                  <span>{formatCurrency(order?.tax_amount)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Shipping</span>
                  <span>{formatCurrency(order?.shipping_amount)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Discount</span>
                  <span>-{formatCurrency(order?.discount_amount)}</span>
                </div>
              </div>

              <Divider className="!my-4" />

              <div className="flex items-center justify-between text-base font-semibold text-slate-900 dark:text-slate-100">
                <span>Total Amount</span>
                <span>{formatCurrency(order?.total_amount)}</span>
              </div>

              <div className="mt-4 rounded-lg border border-slate-200/80 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Payment
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {String(paymentMethod).replaceAll("_", " ")}
                  </p>
                  <Tag
                    value={paymentStatus}
                    severity={
                      paymentStatus === "N/A"
                        ? "secondary"
                        : paymentSeverity(paymentStatus)
                    }
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {canDownloadInvoice(order?.order_status) ? (
                  <Button
                    type="button"
                    icon="pi pi-download"
                    label="Download Invoice"
                    className="!w-full !rounded-xl !bg-[#2f9f95] !py-2 !font-semibold !text-white hover:!bg-[#26847c]"
                    onClick={() => onDownloadInvoice(order)}
                  />
                ) : null}

                <Button
                  type="button"
                  icon="pi pi-times-circle"
                  label="Cancel Order"
                  outlined
                  severity="danger"
                  disabled={!canCancel(order?.order_status) || isCanceling}
                  loading={isCanceling}
                  className="!w-full !rounded-xl !py-2 !font-semibold"
                  onClick={() => onCancelOrder(order)}
                />
                <Button
                  type="button"
                  icon="pi pi-replay"
                  label="Return Order"
                  outlined
                  severity="warning"
                  disabled={!canReturn(order?.order_status) || isReturning}
                  loading={isReturning}
                  className="!w-full !rounded-xl !py-2 !font-semibold"
                  onClick={() => onReturnOrder(order)}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailsModal;
