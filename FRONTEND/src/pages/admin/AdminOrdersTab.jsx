/**
 * @component AdminOrdersTab
 * @description Orders and payments management tab for the admin dashboard.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Toast } from "primereact/toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { Divider } from "primereact/divider";
import { Search, Package, Truck, CheckCircle, Clock } from "lucide-react";
import { getAdminOrder, findOrderItems } from "../../redux/slices/orderSlice";
import api from "../../../api/api";
import {
  fetchCancelRequests,
  reviewCancelRequest,
} from "../../../api/adminOrdersApi";
import {
  getAvailableOrderStatuses,
  getAvailablePaymentStatuses,
  getDisplayPaymentStatus,
  getOrderSeverity,
  getOrderStatusOptions,
  getPaymentSeverity,
  isPaymentStatusEditable,
  isStripeManagedPayment,
} from "./orderStatusUtils";
import "./AdminShared.css";

const orderStatusFilterOptions = [
  { label: "All", value: null },
  ...getOrderStatusOptions(),
];

const formatMoney = (value) => `Rs. ${(Number(value) || 0).toFixed(2)}`;

function AdminOrdersTab() {
  const toast = useRef(null);
  const dispatch = useDispatch();

  const { adminOrders, adminPagination, adminStats, orderItems } = useSelector(
    (state) => state.order || {},
  );
  const tableLoading = useSelector((state) => state.order?.loading);

  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 1,
    sortField: "created_at",
    sortOrder: -1,
    search: "",
  });
  const [statusFilter, setStatusFilter] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [requestsDialogVisible, setRequestsDialogVisible] = useState(false);
  const [cancelRequests, setCancelRequests] = useState([]);
  const [cancelRequestsLoading, setCancelRequestsLoading] = useState(false);
  const [reviewingRequestId, setReviewingRequestId] = useState(null);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [adminNotes, setAdminNotes] = useState({}); // { requestId: note }

  const stats = {
    pending: adminStats?.totalPending || 0,
    processing: adminStats?.totalProcessing || 0,
    shipped: adminStats?.totalShipped || 0,
    delivered: adminStats?.totalDelivered || 0,
    completed: adminStats?.totalCompleted || 0,
  };

  const showToast = useCallback((severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const loadOrders = useCallback(() => {
    dispatch(
      getAdminOrder({
        page: lazyParams.page,
        limit: lazyParams.rows,
        sortField: lazyParams.sortField,
        sortOrder: lazyParams.sortOrder,
        search: lazyParams.search || undefined,
        status: statusFilter || undefined,
      }),
    );
  }, [dispatch, lazyParams, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const loadCancelRequests = useCallback(async () => {
    setCancelRequestsLoading(true);
    try {
      const payload = await fetchCancelRequests();
      setCancelRequests(payload.requests || []);
      setPendingRequestCount(payload.pendingCount || 0);
    } catch (error) {
      showToast(
        "error",
        "Error",
        error?.response?.data?.message || "Failed to load cancellation requests",
      );
    } finally {
      setCancelRequestsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadCancelRequests();
  }, [loadCancelRequests]);

  const patchSelectedOrder = useCallback((orderId, patch) => {
    setSelectedOrder((prev) => {
      if (!prev || prev.order_id !== orderId) return prev;
      return { ...prev, ...patch };
    });
  }, []);

  const handleLazyLoad = useCallback(
    (params) => setLazyParams((prev) => ({ ...prev, ...params })),
    [],
  );

  const handleSearch = useCallback((event) => {
    setLazyParams((prev) => ({
      ...prev,
      first: 0,
      page: 1,
      search: event.target.value,
    }));
  }, []);

  const handleStatusFilter = useCallback((event) => {
    setStatusFilter(event.value);
    setLazyParams((prev) => ({ ...prev, first: 0, page: 1 }));
  }, []);

  const handleViewDetails = useCallback(
    async (order) => {
      setSelectedOrder(order);
      setDetailsModal(true);
      setItemsLoading(true);
      try {
        await dispatch(findOrderItems({ id: order.order_id }));
      } finally {
        setItemsLoading(false);
      }
    },
    [dispatch],
  );

  const handleCloseDetails = useCallback(() => {
    setDetailsModal(false);
    setSelectedOrder(null);
  }, []);

  const handleOpenRequestsDialog = useCallback(async () => {
    setRequestsDialogVisible(true);
    await loadCancelRequests();
  }, [loadCancelRequests]);

  const handleUpdateStatus = useCallback(
    async (order, newStatus) => {
      if (!order?.order_id || newStatus === order.order_status) return;

      setUpdatingId(order.order_id);
      try {
        await api.patch(`/order/changestatus/${order.order_id}`, {
          latestStatus: newStatus,
        });

        patchSelectedOrder(order.order_id, { order_status: newStatus });
        showToast(
          "success",
          "Order Status",
          `Order #${order.order_id} -> ${newStatus}`,
        );
        loadOrders();
      } catch (error) {
        showToast(
          "error",
          "Error",
          error?.response?.data?.message || "Failed to update order status",
        );
      } finally {
        setUpdatingId(null);
      }
    },
    [loadOrders, patchSelectedOrder, showToast],
  );

  const handleUpdatePaymentStatus = useCallback(
    async (order, newStatus) => {
      if (!order?.order_id || newStatus === order.payment_status) return;

      setUpdatingId(order.order_id);
      try {
        const response = await api.patch(`/order/paymentstatus/${order.order_id}`, {
          paymentStatus: newStatus,
        });

        const updatedOrder = response?.data?.data || {};
        patchSelectedOrder(order.order_id, {
          payment_status: updatedOrder.payment_status || newStatus,
          order_status: updatedOrder.order_status || order.order_status,
        });

        showToast(
          "success",
          "Payment Status",
          `Order #${order.order_id} payment -> ${updatedOrder.payment_status || newStatus}`,
        );
        loadOrders();
      } catch (error) {
        showToast(
          "error",
          "Error",
          error?.response?.data?.message || "Failed to update payment status",
        );
      } finally {
        setUpdatingId(null);
      }
    },
    [loadOrders, patchSelectedOrder, showToast],
  );

  const handleReviewCancelRequest = useCallback(
    async (request, action) => {
      if (!request?.request_id || !action) return;

      const adminNote = adminNotes[request.request_id] || "";
      if (action === "reject" && !adminNote.trim()) {
        showToast("error", "Error", "Please provide a reason for rejection.");
        return;
      }

      setReviewingRequestId(request.request_id);
      try {
        const result = await reviewCancelRequest(request.request_id, { 
          action,
          admin_note: adminNote
        });

        showToast(
          "success",
          "Cancellation Request",
          action === "approve"
            ? `Order #${request.order_number || request.order_id} cancellation approved`
            : `Order #${request.order_number || request.order_id} cancellation rejected`,
        );

        setCancelRequests((prev) =>
          prev.map((item) =>
            item.request_id === request.request_id
              ? {
                  ...item,
                  status: action === "approve" ? "approved" : "rejected",
                  reviewed_at: new Date().toISOString(),
                  order_status: result?.order_status || item.order_status,
                }
              : item,
          ),
        );

        if (action === "approve" && request.order_id) {
          patchSelectedOrder(request.order_id, { order_status: "cancelled" });
        }

        loadOrders();
        loadCancelRequests();
      } catch (error) {
        showToast(
          "error",
          "Error",
          error?.response?.data?.message || "Failed to review cancellation request",
        );
      } finally {
        setReviewingRequestId(null);
      }
    },
    [adminNotes, loadCancelRequests, loadOrders, patchSelectedOrder, showToast],
  );

  const statusTemplate = (rowData) => (
    <Dropdown
      value={rowData.order_status}
      options={getAvailableOrderStatuses(rowData)}
      optionLabel="label"
      optionValue="value"
      onChange={(event) => handleUpdateStatus(rowData, event.value)}
      disabled={updatingId === rowData.order_id}
      valueTemplate={(option) =>
        option ? (
          <Tag
            value={option.label}
            severity={getOrderSeverity(option.value)}
            className="w-full justify-center"
          />
        ) : null
      }
      itemTemplate={(option) => (
        <Tag
          value={option.label}
          severity={getOrderSeverity(option.value)}
          className="w-full justify-center"
        />
      )}
      className="admin-table-dropdown w-full"
      style={{ minWidth: "140px" }}
      pt={{
        root: {
          className:
            "admin-dropdown-root admin-table-dropdown-root rounded-lg h-9 flex items-center shadow-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50",
        },
        input: { className: "px-2 py-1 flex items-center justify-center" },
        trigger: {
          className:
            "w-8 text-gray-400 group-hover:text-gray-600 transition-colors",
        },
        panel: {
          className:
            "admin-dropdown-panel admin-table-dropdown-panel rounded-lg shadow-xl mt-1 overflow-hidden border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800",
        },
        wrapper: { className: "p-1 flex flex-col gap-1" },
        item: {
          className:
            "rounded-md transition-colors p-1 focus:bg-gray-50 dark:focus:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50",
        },
      }}
    />
  );

  const paymentTemplate = (rowData) => {
    if (!isPaymentStatusEditable(rowData)) {
      const paymentLabel = getDisplayPaymentStatus(rowData);
      return (
        <Tag
          value={paymentLabel}
          severity={paymentLabel === "N/A" ? "secondary" : getPaymentSeverity(rowData.payment_status)}
          className="w-full justify-center"
        />
      );
    }

    return (
      <Dropdown
        value={rowData.payment_status}
        options={getAvailablePaymentStatuses(rowData)}
        optionLabel="label"
        optionValue="value"
        onChange={(event) => handleUpdatePaymentStatus(rowData, event.value)}
        disabled={
          updatingId === rowData.order_id || !isPaymentStatusEditable(rowData)
        }
        valueTemplate={(option) =>
          option ? (
            <Tag
              value={option.label}
              severity={getPaymentSeverity(option.value)}
              className="w-full justify-center"
            />
          ) : null
        }
        itemTemplate={(option) => (
          <Tag
            value={option.label}
            severity={getPaymentSeverity(option.value)}
            className="w-full justify-center"
          />
        )}
        className="admin-table-dropdown w-full"
        style={{ minWidth: "140px" }}
        tooltip={
          isStripeManagedPayment(rowData)
            ? "Stripe-managed payment status is view only"
            : undefined
        }
        pt={{
          root: {
            className:
              "admin-dropdown-root admin-table-dropdown-root rounded-lg h-9 flex items-center shadow-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50",
          },
          input: { className: "px-2 py-1 flex items-center justify-center" },
          trigger: {
            className:
              "w-8 text-gray-400 group-hover:text-gray-600 transition-colors",
          },
          panel: {
            className:
              "admin-dropdown-panel admin-table-dropdown-panel rounded-lg shadow-xl mt-1 overflow-hidden border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800",
          },
          wrapper: { className: "p-1 flex flex-col gap-1" },
          item: {
            className:
              "rounded-md transition-colors p-1 focus:bg-gray-50 dark:focus:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50",
          },
        }}
      />
    );
  };

  const amountTemplate = (rowData) => (
    <span className="font-mono font-semibold">{formatMoney(rowData.total_amount)}</span>
  );

  const dateTemplate = (rowData) => (
    <span>
      {rowData.created_at ? new Date(rowData.created_at).toLocaleDateString() : "-"}
    </span>
  );

  return (
    <div className="admin-products-container animate-fade-in flex-1 flex flex-col min-h-0">
      <Toast ref={toast} position="top-right" />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-4">
        {[
          {
            label: "Pending",
            count: stats.pending,
            icon: <Clock size={22} className="text-yellow-500" />,
          },
          {
            label: "Processing",
            count: stats.processing,
            icon: <Package size={22} className="text-blue-500" />,
          },
          {
            label: "Shipped",
            count: stats.shipped,
            icon: <Truck size={22} className="text-purple-500" />,
          },
          {
            label: "Delivered",
            count: stats.delivered,
            icon: <CheckCircle size={22} className="text-green-500" />,
          },
          {
            label: "Completed",
            count: stats.completed,
            icon: <CheckCircle size={22} className="text-emerald-600" />,
          },
        ].map(({ label, count, icon }) => (
          <Card key={label} className="!p-0">
            <div className="flex items-center justify-between p-3">
              <div>
                <p className="text-xs text-muted mb-0.5">{label}</p>
                <p className="text-2xl font-bold leading-none">{count}</p>
              </div>
              {icon}
            </div>
          </Card>
        ))}
      </div>

      <div className="admin-products-card flex-1 flex flex-col min-h-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Dropdown
              value={statusFilter}
              options={orderStatusFilterOptions}
              optionLabel="label"
              optionValue="value"
              onChange={handleStatusFilter}
              placeholder="Filter by Status"
              className="admin-filter-dropdown w-full sm:w-44"
              pt={{
                root: {
                  className:
                    "admin-dropdown-root rounded-xl h-10 flex items-center shadow-none border border-gray-200 dark:border-gray-700",
                },
                input: {
                  className: "px-3 text-sm",
                },
                trigger: { className: "w-8" },
                panel: {
                  className: "admin-dropdown-panel rounded-lg shadow-xl mt-1",
                },
              }}
            />

            <Button
              type="button"
              label={
                pendingRequestCount > 0
                  ? `Requests (${pendingRequestCount})`
                  : "Requests"
              }
              icon="pi pi-bell"
              onClick={handleOpenRequestsDialog}
              className="w-full sm:w-auto"
              outlined
            />

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <InputText
                type="search"
                value={lazyParams.search}
                onChange={handleSearch}
                placeholder="Search orders..."
                className="admin-search-input w-full pl-10 border border-gray-200 dark:border-gray-700 rounded-xl h-10 text-sm transition-all outline-none"
              />
            </div>
          </div>
        </div>

        <div className="admin-products-table-wrapper flex-1 flex flex-col min-h-0">
          <DataTable
            value={adminOrders || []}
            lazy
            paginator
            first={lazyParams.first}
            rows={lazyParams.rows}
            totalRecords={adminPagination?.totalItems || 0}
            onPage={handleLazyLoad}
            onSort={handleLazyLoad}
            sortField={lazyParams.sortField}
            sortOrder={lazyParams.sortOrder}
            loading={tableLoading}
            scrollable
            scrollHeight="flex"
            emptyMessage="No orders found"
            className="admin-products-table"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            rowsPerPageOptions={[10, 25, 50]}
          >
            <Column
              field="order_id"
              header="Order"
              sortable
              style={{ minWidth: "110px" }}
              body={(row) => (
                <div>
                  <p className="font-mono text-xs font-semibold">
                    {row.order_number || `#${row.order_id}`}
                  </p>
                  <p className="text-xs text-muted">#{row.order_id}</p>
                </div>
              )}
            />
            <Column
              field="customer_name"
              header="Customer"
              sortable
              style={{ minWidth: "140px" }}
            />
            <Column
              field="created_at"
              header="Date"
              sortable
              body={dateTemplate}
              style={{ minWidth: "110px" }}
            />
            <Column
              field="total_amount"
              header="Amount"
              sortable
              body={amountTemplate}
              style={{ minWidth: "100px" }}
            />
            <Column
              field="order_status"
              header="Order Status"
              body={statusTemplate}
              style={{ minWidth: "155px" }}
            />
            <Column
              field="payment_status"
              header="Payment Status"
              body={paymentTemplate}
              style={{ minWidth: "150px" }}
            />
            <Column
              header="Items"
              style={{ minWidth: "70px", textAlign: "center" }}
              body={(rowData) => (
                <Button
                  icon="pi pi-eye"
                  className="p-button-rounded p-button-text p-button-sm"
                  onClick={() => handleViewDetails(rowData)}
                  tooltip="View order items"
                />
              )}
            />
          </DataTable>
        </div>

        <Dialog
          visible={requestsDialogVisible}
          onHide={() => setRequestsDialogVisible(false)}
          header="Cancellation Requests"
          style={{ width: "820px", maxWidth: "96vw" }}
          modal
        >
          {cancelRequestsLoading ? (
            <div className="flex justify-center py-8">
              <ProgressSpinner style={{ width: "34px", height: "34px" }} strokeWidth="4" />
            </div>
          ) : cancelRequests.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted">
              No cancellation requests found.
            </div>
          ) : (
            <div className="space-y-3">
              {cancelRequests.map((request) => {
                const isPending = request.status === "pending";
                return (
                  <div
                    key={request.request_id}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900/40"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">
                            {request.order_number || `Order #${request.order_id}`}
                          </p>
                          <Tag
                            value={request.status}
                            severity={
                              request.status === "approved"
                                ? "success"
                                : request.status === "rejected"
                                  ? "danger"
                                  : "warning"
                            }
                          />
                        </div>
                        <p className="text-sm text-muted">
                          {request.customer_name || "Customer"}{" "}
                          {request.customer_email ? `• ${request.customer_email}` : ""}
                        </p>
                        <p className="text-sm text-muted">
                          Requested on{" "}
                          {request.created_at
                            ? new Date(request.created_at).toLocaleString()
                            : "-"}
                        </p>
                        <p className="text-sm">
                          Current order status:{" "}
                          <span className="font-medium">{request.order_status || "-"}</span>
                        </p>
                        <p className="text-sm">
                          Reason:{" "}
                          <span className="text-muted">
                            {request.reason?.trim() || "No reason provided by user."}
                          </span>
                        </p>
                        
                        {isPending && (
                          <div className="mt-3">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1 block">
                              Admin Note / Rejection Reason
                            </label>
                            <InputText 
                              value={adminNotes[request.request_id] || ""}
                              onChange={(e) => setAdminNotes(prev => ({ ...prev, [request.request_id]: e.target.value }))}
                              placeholder="Write a note or reason for rejection..."
                              className="admin-search-input w-full text-sm py-1.5"
                            />
                          </div>
                        )}
                        
                        {!isPending && request.admin_note && (
                          <p className="text-sm mt-2">
                            <span className="font-semibold">Admin Note:</span>{" "}
                            <span className="text-muted italic">{request.admin_note}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <Button
                          type="button"
                          label="Approve"
                          icon="pi pi-check"
                          size="small"
                          disabled={!isPending || reviewingRequestId === request.request_id}
                          loading={
                            reviewingRequestId === request.request_id &&
                            isPending
                          }
                          onClick={() =>
                            handleReviewCancelRequest(request, "approve")
                          }
                        />
                        <Button
                          type="button"
                          label="Reject"
                          icon="pi pi-times"
                          size="small"
                          severity="danger"
                          outlined
                          disabled={!isPending || reviewingRequestId === request.request_id}
                          onClick={() =>
                            handleReviewCancelRequest(request, "reject")
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Dialog>

        <Dialog
          visible={detailsModal}
          onHide={handleCloseDetails}
          header={
            selectedOrder
              ? `${selectedOrder.order_number || `Order #${selectedOrder.order_id}`} - ${selectedOrder.customer_name || ""}`
              : "Order Details"
          }
          style={{ width: "560px" }}
          modal
          footer={
            <Button
              label="Close"
              icon="pi pi-times"
              onClick={handleCloseDetails}
              className="p-button-text"
            />
          }
        >
          {selectedOrder && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted mb-0.5 uppercase tracking-wide">
                    Customer
                  </p>
                  <p className="font-semibold">{selectedOrder.customer_name || "-"}</p>
                  <p className="text-muted text-xs">
                    {selectedOrder.customer_email || ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-0.5 uppercase tracking-wide">
                    Order Date
                  </p>
                  <p>
                    {selectedOrder.created_at
                      ? new Date(selectedOrder.created_at).toLocaleString()
                      : "-"}
                  </p>
                </div>
              </div>

              <Divider className="!my-2" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted mb-1 uppercase tracking-wide">
                    Order Status
                  </p>
                  <Dropdown
                    value={selectedOrder.order_status}
                    options={getAvailableOrderStatuses(selectedOrder)}
                    optionLabel="label"
                    optionValue="value"
                    onChange={(event) =>
                      handleUpdateStatus(selectedOrder, event.value)
                    }
                    disabled={updatingId === selectedOrder.order_id}
                    valueTemplate={(option) =>
                      option ? (
                        <Tag
                          value={option.label}
                          severity={getOrderSeverity(option.value)}
                        />
                      ) : null
                    }
                    itemTemplate={(option) => (
                      <Tag
                        value={option.label}
                        severity={getOrderSeverity(option.value)}
                      />
                    )}
                    className="w-full"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted mb-1 uppercase tracking-wide">
                    Payment Status
                  </p>
                  {isPaymentStatusEditable(selectedOrder) ? (
                    <Dropdown
                      value={selectedOrder.payment_status}
                      options={getAvailablePaymentStatuses(selectedOrder)}
                      optionLabel="label"
                      optionValue="value"
                      onChange={(event) =>
                        handleUpdatePaymentStatus(selectedOrder, event.value)
                      }
                      disabled={updatingId === selectedOrder.order_id}
                      valueTemplate={(option) =>
                        option ? (
                          <Tag
                            value={option.label}
                            severity={getPaymentSeverity(option.value)}
                          />
                        ) : null
                      }
                      itemTemplate={(option) => (
                        <Tag
                          value={option.label}
                          severity={getPaymentSeverity(option.value)}
                        />
                      )}
                      className="w-full"
                    />
                  ) : (
                    <Tag
                      value={getDisplayPaymentStatus(selectedOrder)}
                      severity="secondary"
                    />
                  )}
                </div>
              </div>

              <Divider className="!my-2" />

              <div>
                <p className="font-semibold mb-2">Order Items</p>
                {itemsLoading ? (
                  <div className="flex justify-center py-4">
                    <ProgressSpinner
                      style={{ width: "32px", height: "32px" }}
                      strokeWidth="4"
                    />
                  </div>
                ) : !orderItems?.length ? (
                  <p className="text-muted text-center py-3">No items found</p>
                ) : (
                  <div className="space-y-2">
                    {orderItems.map((item) => (
                      <div
                        key={item.order_item_id}
                        className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800/40"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.product_name}</p>
                          {item.portion_value && (
                            <p className="text-xs text-muted">{item.portion_value}</p>
                          )}
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          <p className="text-xs text-muted">qty x {item.quantity}</p>
                          <p className="font-mono font-semibold">
                            {formatMoney(item.total)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Divider className="!my-2" />

              <div className="space-y-1">
                {Number(selectedOrder.discount_amount) > 0 && (
                  <div className="flex justify-between text-muted">
                    <span>Discount</span>
                    <span>- {formatMoney(selectedOrder.discount_amount)}</span>
                  </div>
                )}
                {Number(selectedOrder.tax_amount) > 0 && (
                  <div className="flex justify-between text-muted">
                    <span>Tax</span>
                    <span>{formatMoney(selectedOrder.tax_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-100 dark:border-gray-700">
                  <span>Total</span>
                  <span className="font-mono">
                    {formatMoney(selectedOrder.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </div>
  );
}

export default AdminOrdersTab;
