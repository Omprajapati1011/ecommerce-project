import { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { useToast } from "../../context/ToastContext";
import {
  Package,
  User,
  MapPin,
  CreditCard,
  Banknote,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  ArrowDownCircle,
} from "lucide-react";
import {
  fetchAdminOrderDetail,
  updateOrderStatus,
  updatePaymentStatus,
  markCODComplete,
  refundPayment,
} from "../../../api/adminOrdersApi";
import getApiErrorMessage from "../../utils/apiError";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(price || 0);

const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ORDER_STATUSES = [
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Refunded", value: "refunded" },
];

const PAYMENT_STATUSES = [
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
];

const STATUS_STYLES = {
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  processing:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  shipped:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  delivered:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  refunded:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

const normalizeStatus = (value) => String(value || "").toLowerCase();

const getPrimaryPaymentMethod = (currentOrder) =>
  normalizeStatus(
    currentOrder?.payments?.length > 0
      ? currentOrder.payments[0].payment_method
      : currentOrder?.payment_method,
  );

const isStripeManagedPayment = (currentOrder) =>
  getPrimaryPaymentMethod(currentOrder) === "stripe";

const getDisplayPaymentStatus = (currentOrder) =>
  normalizeStatus(currentOrder?.order_status) === "cancelled"
    ? "N/A"
    : currentOrder?.payment_status || "unknown";

const StatusIcon = ({ status }) => {
  const cls = "w-4 h-4";
  switch (status) {
    case "pending":
      return <Clock className={cls} />;
    case "processing":
      return <RefreshCcw className={cls} />;
    case "shipped":
      return <Truck className={cls} />;
    case "delivered":
    case "completed":
      return <CheckCircle2 className={cls} />;
    case "cancelled":
    case "failed":
      return <XCircle className={cls} />;
    case "refunded":
      return <ArrowDownCircle className={cls} />;
    default:
      return <Clock className={cls} />;
  }
};

const dropdownPt = {
  root: {
    className:
      "admin-dropdown-root rounded-lg h-9 flex items-center shadow-none border border-gray-200 dark:border-gray-700",
  },
  input: { className: "px-2 text-sm" },
  trigger: { className: "w-7" },
  panel: { className: "admin-dropdown-panel rounded-lg shadow-xl mt-1" },
};

function OrderDetailModal({ visible, onHide, orderId, onMutate }) {
  const showToast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // payment_id being acted on

  const getAvailableOrderStatuses = (currentOrder) => {
    if (!currentOrder) return ORDER_STATUSES;
    const orderTransitions = {
      pending: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: ["completed", "returned"],
      completed: [],
      cancelled: [],
      refunded: [],
      returned: [],
    };
    const currentStatus = normalizeStatus(currentOrder.order_status) || "pending";
    const paymentMethod = getPrimaryPaymentMethod(currentOrder);

    return ORDER_STATUSES.filter((opt) => {
      if (opt.value === currentStatus) return true;

      const allowedTransitions = orderTransitions[currentStatus] || [];
      if (!allowedTransitions.includes(opt.value)) return false;

      if (
        paymentMethod !== "cash_on_delivery" &&
        ["delivered", "completed"].includes(opt.value)
      ) {
        return normalizeStatus(currentOrder.payment_status) === "completed";
      }

      if (
        paymentMethod === "cash_on_delivery" &&
        opt.value === "completed" &&
        normalizeStatus(currentOrder.payment_status) !== "completed"
      ) {
        return false;
      }

      return true;
    });
  };

  const getAvailablePaymentStatuses = (currentOrder) => {
    if (!currentOrder) return PAYMENT_STATUSES;
    if (normalizeStatus(currentOrder.order_status) === "cancelled") {
      return [];
    }
    if (isStripeManagedPayment(currentOrder)) {
      return PAYMENT_STATUSES.filter(
        (opt) => opt.value === normalizeStatus(currentOrder.payment_status),
      );
    }

    const paymentStages = ["pending", "processing", "completed"];
    const currentIdx = paymentStages.indexOf(currentOrder.payment_status);
    const paymentMethod = getPrimaryPaymentMethod(currentOrder);

    let options = PAYMENT_STATUSES;
    if (paymentMethod === "cash_on_delivery") {
      options = PAYMENT_STATUSES.filter((opt) =>
        ["pending", "completed", "refunded"].includes(opt.value),
      );
    }

    return options.filter((opt) => {
      // Cannot go backward
      const optIdx = paymentStages.indexOf(opt.value);
      if (currentIdx !== -1 && optIdx !== -1 && optIdx < currentIdx)
        return false;

      if (["failed", "refunded"].includes(currentOrder.payment_status)) {
        if (
          opt.value !== currentOrder.payment_status &&
          opt.value !== "refunded"
        )
          return false;
      }
      return true;
    });
  };

  // Fetch order detail when modal opens
  useEffect(() => {
    if (!visible || !orderId) {
      setOrder(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchAdminOrderDetail(orderId);
        if (!cancelled) setOrder(data);
      } catch (err) {
        console.error("Failed to load order detail:", err);
        if (!cancelled)
          showToast(
            "error",
            "Error",
            getApiErrorMessage(err, "Failed to load order details."),
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [visible, orderId, showToast]);

  // Update order status
  const handleOrderStatusChange = async (newStatus) => {
    if (!order || newStatus === order.order_status) return;
    setUpdatingOrder(true);
    try {
      await updateOrderStatus(order.order_id, newStatus);
      onMutate?.();
      setOrder((prev) => ({ ...prev, order_status: newStatus }));
      showToast("success", "Success", `Order status updated to ${newStatus}`);
    } catch (err) {
      showToast(
        "error",
        "Error",
        getApiErrorMessage(err, "Failed to update order status."),
      );
    } finally {
      setUpdatingOrder(false);
    }
  };

  // Update payment status
  const handlePaymentStatusChange = async (newStatus) => {
    if (!order || newStatus === order.payment_status) return;
    setUpdatingPayment(true);
    try {
      await updatePaymentStatus(order.order_id, newStatus);
      onMutate?.();
      setOrder((prev) => ({ ...prev, payment_status: newStatus }));
      showToast("success", "Success", `Payment status updated to ${newStatus}`);
    } catch (err) {
      showToast(
        "error",
        "Error",
        getApiErrorMessage(err, "Failed to update payment status."),
      );
    } finally {
      setUpdatingPayment(false);
    }
  };

  // Mark COD complete
  const handleCODComplete = async (paymentId) => {
    setActionLoading(paymentId);
    try {
      await markCODComplete(paymentId);
      onMutate?.();
      // Refresh order detail
      const data = await fetchAdminOrderDetail(orderId);
      setOrder(data);
      showToast("success", "Success", "COD payment marked as completed");
    } catch (err) {
      showToast(
        "error",
        "Error",
        getApiErrorMessage(err, "Failed to complete COD payment."),
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Refund payment
  const handleRefund = async (paymentId) => {
    setActionLoading(paymentId);
    try {
      await refundPayment(paymentId);
      onMutate?.();
      const data = await fetchAdminOrderDetail(orderId);
      setOrder(data);
      showToast("success", "Success", "Refund processed successfully");
    } catch (err) {
      showToast(
        "error",
        "Error",
        getApiErrorMessage(err, "Failed to process refund."),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const header = (
    <div className="flex items-center gap-2">
      <Package className="w-5 h-5 text-gray-500" />
      <span>Order Details {order ? `— ${order.order_number}` : ""}</span>
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={header}
      modal
      dismissableMask
      draggable={false}
      style={{ width: "56rem", maxHeight: "90vh" }}
      className="admin-dialog"
      pt={{
        header: { className: "admin-dialog-header" },
        content: { className: "overflow-y-auto" },
      }}
    >
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-teal-600 rounded-full" />
        </div>
      )}

      {!loading && order && (
        <div className="space-y-6 p-2">
          {/* Section 1: Order Summary */}
          <div className="admin-order-detail-section">
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Order Summary
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Order #
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {order.order_number}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Date
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {formatDateTime(order.created_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Order Status
                  </span>
                  <Dropdown
                    value={order.order_status}
                    onChange={(e) => handleOrderStatusChange(e.value)}
                    options={getAvailableOrderStatuses(order)}
                    optionLabel="label"
                    optionValue="value"
                    disabled={updatingOrder}
                    className="admin-filter-dropdown w-36"
                    pt={dropdownPt}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Payment Status
                  </span>
                  {normalizeStatus(order.order_status) === "cancelled" ? (
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {getDisplayPaymentStatus(order)}
                    </span>
                  ) : (
                    <Dropdown
                      value={order.payment_status}
                      onChange={(e) => handlePaymentStatusChange(e.value)}
                      options={getAvailablePaymentStatuses(order)}
                      optionLabel="label"
                      optionValue="value"
                      disabled={updatingPayment || isStripeManagedPayment(order)}
                      className="admin-filter-dropdown w-36"
                      tooltip={
                        isStripeManagedPayment(order)
                          ? "Stripe-managed payment status is view only"
                          : undefined
                      }
                      pt={dropdownPt}
                    />
                  )}
                </div>
              </div>
              <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Subtotal
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {formatPrice(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Tax</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {formatPrice(order.tax_amount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Shipping
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {formatPrice(order.shipping_amount)}
                  </span>
                </div>
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Discount
                    </span>
                    <span className="text-red-500">
                      -{formatPrice(order.discount_amount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <span className="text-gray-900 dark:text-gray-100">
                    Total
                  </span>
                  <span className="text-green-600 dark:text-green-400">
                    {formatPrice(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Customer & Shipping */}
          <div className="admin-order-detail-section grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Customer
              </h4>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {order.customer_name || "—"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {order.customer_email || "—"}
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Shipping Address
              </h4>
              {order.shipping_name ? (
                <div className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-medium">{order.shipping_name}</p>
                  {order.shipping_phone && <p>{order.shipping_phone}</p>}
                  <p>{order.address_line1}</p>
                  {order.address_line2 && <p>{order.address_line2}</p>}
                  <p>
                    {[order.city, order.state, order.postal_code]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {order.country && <p>{order.country}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No address on file</p>
              )}
            </div>
          </div>

          {/* Section 3: Order Items */}
          <div className="admin-order-detail-section">
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" /> Order Items (
              {order.items?.length || 0})
            </h4>
            {order.items?.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Portion</th>
                      <th className="px-4 py-3">Modifier</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Price</th>
                      <th className="px-4 py-3 text-right">Tax</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr
                        key={item.order_item_id}
                        className="border-t border-gray-100 dark:border-gray-800"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                          {item.product_name}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {item.portion_value || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {item.modifiers && item.modifiers.length > 0 ? (
                            <ul className="list-none space-y-1">
                              {item.modifiers.map((mod, idx) => (
                                <li key={idx} className="flex flex-col">
                                  <span>{mod.modifier_value}</span>
                                  {Number(mod.additional_price) > 0 && (
                                    <span className="text-gray-400 text-xs">
                                      (+{formatPrice(Number(mod.additional_price))})
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            item.modifier_value || "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatPrice(item.price)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {formatPrice(item.tax)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">
                          {formatPrice(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">
                No items found
              </p>
            )}
          </div>

          {/* Section 4: Payment History */}
          <div className="admin-order-detail-section">
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Payment History (
              {order.payments?.length || 0})
            </h4>
            {order.payments?.length > 0 ? (
              <div className="space-y-3">
                {order.payments.map((p) => (
                  <div
                    key={p.payment_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        {p.payment_method === "cash_on_delivery" ? (
                          <Banknote className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                            {p.payment_method?.replace(/_/g, " ")}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[p.status] || STATUS_STYLES.pending}`}
                          >
                            <StatusIcon status={p.status} />
                            {p.status}
                          </span>
                          {p.is_refunded === 1 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                              Refunded {formatPrice(p.refund_amount)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            {formatPrice(p.amount)} {p.currency}
                          </span>
                          {p.transaction_id && (
                            <span>ID: {p.transaction_id}</span>
                          )}
                          <span>{formatDateTime(p.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      {/* COD + pending → Mark Complete */}
                      {p.payment_method === "cash_on_delivery" &&
                        p.status !== "completed" &&
                        p.status !== "refunded" && (
                          <Button
                            type="button"
                            size="small"
                            className="admin-btn-primary !px-3 !py-1.5 !text-xs !rounded-lg"
                            loading={actionLoading === p.payment_id}
                            onClick={() => handleCODComplete(p.payment_id)}
                          >
                            Mark Completed
                          </Button>
                        )}
                      {/* Completed + not refunded → Refund */}
                      {p.status === "completed" &&
                        !p.is_refunded &&
                        p.payment_method !== "stripe" && (
                        <Button
                          type="button"
                          size="small"
                          severity="danger"
                          outlined
                          className="!px-3 !py-1.5 !text-xs !rounded-lg"
                          loading={actionLoading === p.payment_id}
                          onClick={() => handleRefund(p.payment_id)}
                        >
                          Refund
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">
                No payment records
              </p>
            )}
          </div>
        </div>
      )}

      {!loading && !order && visible && (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-gray-400">Order not found</p>
        </div>
      )}
    </Dialog>
  );
}

export default OrderDetailModal;
