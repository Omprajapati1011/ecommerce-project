import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { Tag } from "primereact/tag";
import { formatCurrency, formatDate, orderSeverity } from "../utils";

const normalizeStatus = (status) => String(status || "").toLowerCase();

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
  !["cancelled", "delivered", "completed", "returned"].includes(
    normalizeStatus(status),
  );

const canReturn = (status) =>
  ["delivered", "completed"].includes(normalizeStatus(status));

const getStatusMeta = (order) => {
  const status = normalizeStatus(order?.order_status);
  const statusDate = order?.updated_at || order?.created_at || order?.placed_at;

  if (status === "shipped") {
    return {
      title: "Your order has been shipped",
      subtitle: `Expected delivery by ${formatDate(statusDate)}`,
      dotClassName: "bg-emerald-500",
    };
  }

  if (["delivered", "completed"].includes(status)) {
    return {
      title: `Delivered on ${formatDate(statusDate)}`,
      subtitle: "Your item has been delivered.",
      dotClassName: "bg-emerald-500",
    };
  }

  if (status === "cancelled") {
    return {
      title: "This order was cancelled",
      subtitle: "You can still view order details.",
      dotClassName: "bg-rose-500",
    };
  }

  if (status === "returned") {
    return {
      title: "Return request submitted",
      subtitle: "We are processing your return request.",
      dotClassName: "bg-amber-500",
    };
  }

  return {
    title: "Order is being processed",
    subtitle: "Track full updates inside order details.",
    dotClassName: "bg-amber-500",
  };
};

function ItemThumb({ item }) {
  const fallbackSrc = buildFallbackImage(item?.product_name);
  const imageUrl = getItemImage(item) || fallbackSrc;
  return (
    <img
      src={imageUrl}
      alt={item?.product_name || "Order item"}
      className="h-16 w-16 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
      loading="lazy"
      onError={(event) => {
        event.currentTarget.src = fallbackSrc;
      }}
    />
  );
}

function OrderCard({
  actionLoading,
  onCancelOrder,
  onOpenOrder,
  onReturnOrder,
  order,
}) {
  const summaryItems = Array.isArray(order?.summaryItems) ? order.summaryItems : [];
  const firstItem = summaryItems[0];
  const itemCount = summaryItems.length;
  const statusMeta = getStatusMeta(order);
  const cancelEnabled = canCancel(order?.order_status);
  const returnEnabled = canReturn(order?.order_status);
  const isCanceling = actionLoading?.cancelingId === Number(order?.order_id);
  const isReturning = actionLoading?.returningId === Number(order?.order_id);

  return (
    <article
      className="cursor-pointer rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_12px_20px_-24px_rgba(15,23,42,1)] transition-all hover:-translate-y-[1px] hover:border-[#b8c8cd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6ea7a6]/40 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-slate-500"
      onClick={() => onOpenOrder(order)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenOrder(order);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="grid gap-3 sm:grid-cols-[76px_minmax(0,1fr)_auto] sm:items-center">
        <ItemThumb item={firstItem} />

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {firstItem?.product_name || `Order ${order?.order_number || `#${order?.order_id}`}`}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {firstItem?.portion_value || "Default variant"}
            {firstItem?.modifier_value ? ` | ${firstItem.modifier_value}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Tag
              value={order?.order_status || "unknown"}
              severity={orderSeverity(order?.order_status)}
              className="!text-[11px]"
            />
            <Tag
              value={`${itemCount} item${itemCount === 1 ? "" : "s"}`}
              severity="secondary"
              className="!text-[11px]"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {order?.order_number || `#${order?.order_id}`}
            </span>
          </div>
        </div>

        <div className="space-y-1 text-left sm:text-right">
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {formatCurrency(order?.total_amount)}
          </p>
          <div className="flex items-center gap-1 sm:justify-end">
            <span className={`inline-block h-2 w-2 rounded-full ${statusMeta.dotClassName}`} />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
              {statusMeta.title}
            </p>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {statusMeta.subtitle}
          </p>
        </div>
      </div>

      <div
        className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-3 dark:border-slate-700"
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          type="button"
          size="small"
          icon="pi pi-eye"
          label="View Details"
          className="!rounded-lg !border !border-slate-300 !bg-white !px-3 !py-2 !text-xs !font-semibold !text-slate-700 hover:!border-amber-400 hover:!text-slate-900 dark:!border-slate-600 dark:!bg-slate-900 dark:!text-slate-200"
          onClick={() => onOpenOrder(order)}
        />
        <Button
          type="button"
          size="small"
          icon="pi pi-times-circle"
          label="Cancel"
          outlined
          severity="danger"
          disabled={!cancelEnabled || isCanceling}
          loading={isCanceling}
          className="!rounded-lg !px-3 !py-2 !text-xs"
          onClick={() => onCancelOrder(order)}
        />
        <Button
          type="button"
          size="small"
          icon="pi pi-replay"
          label="Return"
          outlined
          severity="warning"
          disabled={!returnEnabled || isReturning}
          loading={isReturning}
          className="!rounded-lg !px-3 !py-2 !text-xs"
          onClick={() => onReturnOrder(order)}
        />
      </div>
    </article>
  );
}

function OrdersTable({
  actionLoading,
  loading,
  onCancelOrder,
  onOpenOrder,
  onReturnOrder,
  onSearchTermChange,
  orders,
  searchTerm,
  totalOrders,
}) {
  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_20px_36px_-30px_rgba(15,23,42,0.8)] dark:border-[#1f2933] dark:bg-[#151e22]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100">
            My Orders
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Click any order card to open full order summary.
          </p>
        </div>
        <Tag value={`${totalOrders || 0} orders`} severity="secondary" />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="relative w-full">
          <i className="pi pi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400" />
          <InputText
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search your orders here"
            className="w-full !rounded-xl !border-slate-300 !pl-10 dark:!border-slate-700"
          />
        </div>
        <Button
          type="button"
          icon="pi pi-search"
          label="Search Orders"
          className="!rounded-xl !bg-[#2f9f95] !px-4 !py-2 !text-sm !font-semibold !text-white hover:!bg-[#26847c]"
          onClick={() => onSearchTermChange(searchTerm)}
        />
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <ProgressSpinner style={{ width: "18px", height: "18px" }} strokeWidth="5" />
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <Message severity="info" text="No matching orders found." className="mt-4 w-full" />
      ) : (
        <div className="mt-4 grid gap-3">
          {orders.map((order) => (
            <OrderCard
              key={order?.order_id}
              order={order}
              actionLoading={actionLoading}
              onOpenOrder={onOpenOrder}
              onCancelOrder={onCancelOrder}
              onReturnOrder={onReturnOrder}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

export default OrdersTable;
