import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  findOrderItems,
  updateOrderStatusLocally,
} from "../../../redux/slices/orderSlice";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import OrderSummaryComponent from "./OrderSummaryComponent";
import { CalendarDays, PackageCheck, ReceiptIndianRupee } from "lucide-react";
import api from "../../../../api/api";

const ADMIN_ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];
const USER_CANCELABLE_STATUSES = new Set(["pending", "processing"]);
const USER_RETURNABLE_STATUSES = new Set(["delivered"]);

const formatINR = (value) => {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function OrderDetailComponents({
  orderId: orderIdProp,
  orderData: orderDataProp,
  onClose,
  isDialog = false,
  onOrderStatusChange,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const data = location.state?.data;
  const { loading, error, orderItems, itemPagination, orders } = useSelector((state) => state.order || {});
  const { currentUser } = useSelector((state) => state.auth || {});

  const resolvedOrderId = orderIdProp || id;
  const resolvedOrderData =
    orderDataProp ||
    data ||
    orders.find((o) => String(o.order_id) === String(resolvedOrderId));
  const [first, setFirst] = useState(0);
  const [currentOrderData, setCurrentOrderData] = useState(resolvedOrderData);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState("");

  const isAdmin = currentUser?.role === "admin";
  const orderData = currentOrderData || resolvedOrderData;
  const canCancelOrder =
    !isAdmin && USER_CANCELABLE_STATUSES.has(orderData?.order_status);
  const canReturnOrder =
    !isAdmin && USER_RETURNABLE_STATUSES.has(orderData?.order_status);

  useEffect(() => {
    setCurrentOrderData(resolvedOrderData);
  }, [resolvedOrderData]);

  useEffect(() => {
    if (!resolvedOrderId) return;
    dispatch(findOrderItems({ id: resolvedOrderId, page: 1, limit: 5 }));
  }, [resolvedOrderId, dispatch]);

  useEffect(() => {
    const currentPage = itemPagination?.currentPage || 1;
    const rows = itemPagination?.itemsPerPage || 5;
    setFirst((currentPage - 1) * rows);
  }, [itemPagination?.currentPage, itemPagination?.itemsPerPage]);

  const onPage = (event) => {
    const page = Math.floor(event.first / event.rows) + 1;
    const limit = event.rows;
    setFirst(event.first);
    dispatch(findOrderItems({ id: resolvedOrderId, page, limit }));
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    navigate("/dashboard/orders");
  };

  const handleStatusChange = async (event) => {
    const nextStatus = event.target.value;
    if (!resolvedOrderId || !nextStatus || nextStatus === orderData?.order_status) return;

    setStatusSaving(true);
    setStatusError("");

    try {
      await api.patch(`/order/changestatus/${resolvedOrderId}`, {
        latestStatus: nextStatus,
      });

      setCurrentOrderData((prev) => ({
        ...(prev || {}),
        order_status: nextStatus,
      }));

      if (onOrderStatusChange) {
        onOrderStatusChange(nextStatus);
      }
    } catch (err) {
      setStatusError(
        err?.response?.data?.message || "Unable to update order status.",
      );
    } finally {
      setStatusSaving(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!resolvedOrderId || !canCancelOrder) return;

    setStatusSaving(true);
    setStatusError("");

    try {
      await api.delete(`/order/cancelorder/${resolvedOrderId}`);

      setCurrentOrderData((prev) => ({
        ...(prev || {}),
        order_status: "cancelled",
      }));
      dispatch(
        updateOrderStatusLocally({
          orderId: resolvedOrderId,
          status: "cancelled",
        }),
      );

      if (onOrderStatusChange) {
        onOrderStatusChange("cancelled");
      }
    } catch (err) {
      setStatusError(
        err?.response?.data?.message || "Unable to cancel this order.",
      );
    } finally {
      setStatusSaving(false);
    }
  };

  const handleReturnOrder = async () => {
    if (!resolvedOrderId || !canReturnOrder) return;

    setStatusSaving(true);
    setStatusError("");

    try {
      await api.patch(`/order/returnorder/${resolvedOrderId}`);

      setCurrentOrderData((prev) => ({
        ...(prev || {}),
        order_status: "returned",
      }));
      dispatch(
        updateOrderStatusLocally({
          orderId: resolvedOrderId,
          status: "returned",
        }),
      );

      if (onOrderStatusChange) {
        onOrderStatusChange("returned");
      }
    } catch (err) {
      setStatusError(
        err?.response?.data?.message || "Unable to return this order.",
      );
    } finally {
      setStatusSaving(false);
    }
  };

  if (!orderData && !loading) {
    return (
      <Card
        className="order-flow-card"
        pt={{ body: { className: "p-0" }, content: { className: "p-0" } }}
      >
        <h3 className="order-flow-section-title text-[1.35rem]">
          Order data not found
        </h3>
        <p className="order-flow-section-copy">
          Open this order from the orders list again.
        </p>
        {!isDialog && (
          <Button
            className="order-flow-secondary-button mt-4"
            label="Back to Orders"
            icon="pi pi-arrow-left"
            onClick={handleClose}
          />
        )}
      </Card>
    );
  }

  return (
    <div className={isDialog ? "" : "orders-page-wrapper animate-fade-in"}>
      {error && (
        <div className="order-flow-alert mb-4 border-red-300/70 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </div>
      )}
      {statusError && (
        <div className="order-flow-alert mb-4 border-red-300/70 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
          {statusError}
        </div>
      )}

      <section className={`${isDialog ? "mb-4" : "order-flow-hero mb-6"}`}>
        <div className={isDialog ? "flex flex-wrap items-start justify-between gap-3" : "order-flow-hero-content flex flex-wrap items-start justify-between gap-4"}>
          <div>
            <p className="order-flow-eyebrow">Order Details</p>
            <h2 className="order-flow-title">
            Order #{orderData?.order_number || resolvedOrderId}
            </h2>
            <p className="order-flow-text">
              Review item-level pricing, tax, and the final order summary in the same
              style used across the rest of the storefront.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {canCancelOrder && (
              <Button
                label={statusSaving ? "Cancelling..." : "Cancel Order"}
                icon="pi pi-times"
                outlined
                onClick={handleCancelOrder}
                disabled={statusSaving}
                className="order-flow-secondary-button !border-red-300 !text-red-700 hover:!bg-red-50 dark:!border-red-500/40 dark:!text-red-300 dark:hover:!bg-red-500/10"
              />
            )}
            {canReturnOrder && (
              <Button
                label={statusSaving ? "Processing..." : "Return Order"}
                icon="pi pi-replay"
                outlined
                onClick={handleReturnOrder}
                disabled={statusSaving}
                className="order-flow-secondary-button !border-amber-300 !text-amber-700 hover:!bg-amber-50 dark:!border-amber-500/40 dark:!text-amber-300 dark:hover:!bg-amber-500/10"
              />
            )}
            {!isDialog && (
              <Button
                label="Back to Orders"
                icon="pi pi-arrow-left"
                outlined
                onClick={handleClose}
                className="order-flow-secondary-button"
              />
            )}
          </div>
        </div>
      </section>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="order-flow-stat" pt={{ body: { className: "p-0" }, content: { className: "p-0" } }}>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <p className="order-flow-stat-label">Order Date</p>
              <p className="order-flow-stat-value text-xl">
              {formatDate(orderData?.created_at)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="order-flow-stat" pt={{ body: { className: "p-0" }, content: { className: "p-0" } }}>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              <ReceiptIndianRupee className="h-5 w-5" />
            </span>
            <div>
              <p className="order-flow-stat-label">Order Total</p>
              <p className="order-flow-stat-value text-xl">
              {formatINR(orderData?.total_amount)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="order-flow-stat" pt={{ body: { className: "p-0" }, content: { className: "p-0" } }}>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              <PackageCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="order-flow-stat-label">Items</p>
              <p className="order-flow-stat-value text-xl">
                {itemPagination?.totalItems || orderItems?.length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <Card
            className="order-flow-card"
            pt={{ body: { className: "p-0" }, content: { className: "p-0" } }}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <h3 className="order-flow-section-title text-[1.45rem]">Order Items</h3>
                <p className="order-flow-section-copy mt-1">
                  Item-level totals, taxes, and quantity for this order.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {isAdmin && (
                  <label className="flex flex-col items-end gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">
                      Order Status
                    </span>
                    <select
                      value={orderData?.order_status || "pending"}
                      onChange={handleStatusChange}
                      disabled={statusSaving}
                      className="min-w-[180px] rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 outline-none transition-all focus:border-amber-500 dark:border-[#334155] dark:bg-[#10171b] dark:text-slate-100"
                    >
                      {ADMIN_ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <span className="order-flow-badge">
                  {itemPagination?.totalItems || orderItems?.length || 0} item(s)
                </span>
              </div>
            </div>
            <Divider />

            <div
              className={
                isDialog
                  ? "order-items-scroll max-h-[52vh] overflow-y-auto pr-1"
                  : ""
              }
            >
              <DataTable
                value={orderItems}
                lazy
                paginator
                rows={itemPagination?.itemsPerPage || 5}
                first={first}
                rowsPerPageOptions={[5, 10, 25, 50]}
                responsiveLayout="stack"
                breakpoint="960px"
                stripedRows
                tableStyle={{ width: "100%" }}
                paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                currentPageReportTemplate="{first} to {last} of {totalRecords}"
                totalRecords={itemPagination?.totalItems || 0}
                onPage={onPage}
                dataKey="order_item_id"
                loading={loading}
                className="order-items-table"
                emptyMessage="No items found."
              >
                <Column field="order_item_id" sortable header="ID" />
                <Column field="product_name" sortable header="Product" />
                <Column field="quantity" sortable header="Qty" />
                <Column
                  field="price"
                  header="Price"
                  body={(row) => formatINR(row.price)}
                />
                <Column
                  field="tax_amount"
                  header="Tax"
                  body={(row) => formatINR(row.tax_amount)}
                />
                <Column
                  field="total"
                  header="Total"
                  body={(row) => formatINR(row.total)}
                />
              </DataTable>
            </div>
          </Card>
        </div>

        <div className={isDialog ? "lg:sticky lg:top-0 self-start" : ""}>
          <OrderSummaryComponent title="Order Summary" orderData={orderData} />
        </div>
      </div>
    </div>
  );
}
