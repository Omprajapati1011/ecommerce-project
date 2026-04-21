import { useDispatch, useSelector } from "react-redux";
import { fetchOrders } from "../../../../redux/slices/orderSlice";
import { useEffect, useMemo, useRef, useState } from "react";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import OrderDetailComponents from "./OrderDetailComponents";
import {
  displayPaymentStatus,
  formatDate,
  orderSeverity,
  paymentSeverity,
} from "../utils";
import "../../../admin/AdminShared.css";

const DEFAULT_ORDER_PAGE = 1;
const DEFAULT_ORDER_ROWS = 5;
const DEFAULT_ORDER_SORT_FIELD = "created_at";
const DEFAULT_ORDER_SORT_ORDER = -1;

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

// component name should be capitalized so React treats it as a component
export default function OrdersPage({ showToast }) {
  const dispatch = useDispatch();
  // the reducer is registered under "order" in the store, not "orders".
  // provide a default object to avoid destructure errors when state is undefined.
  const [globalValue, setGlobalValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    order_number: { value: null, matchMode: FilterMatchMode.CONTAINS },
    order_status: { value: null, matchMode: FilterMatchMode.CONTAINS },
    payment_status: { value: null, matchMode: FilterMatchMode.CONTAINS },
    created_at: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const { orders, loading, error, pagination } = useSelector(
    (state) => state.order || {},
  );
  const orderCount = Array.isArray(orders) ? orders.length : 0;
  const [first, setFirst] = useState(0);
  const [sortField, setSortField] = useState(DEFAULT_ORDER_SORT_FIELD);
  const [sortOrder, setSortOrder] = useState(DEFAULT_ORDER_SORT_ORDER);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const ordersTopRef = useRef(null);
  const skipInitialFetchRef = useRef(
    sortField === DEFAULT_ORDER_SORT_FIELD &&
      sortOrder === DEFAULT_ORDER_SORT_ORDER &&
      orderCount > 0,
  );

  const refreshOrders = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      return;
    }

    dispatch(
      fetchOrders({
        page: DEFAULT_ORDER_PAGE,
        limit: DEFAULT_ORDER_ROWS,
        sortField,
        sortOrder,
      }),
    );
  }, [dispatch, sortField, sortOrder, refreshTrigger]);

  useEffect(() => {
    if (!error) {
      return;
    }

    showToast?.("error", "Error", error);
  }, [error, showToast]);

  useEffect(() => {
    const currentPage = pagination?.currentPage || 1;
    const rows = pagination?.itemsPerPage || DEFAULT_ORDER_ROWS;
    setFirst((currentPage - 1) * rows);
  }, [pagination?.currentPage, pagination?.itemsPerPage]);

  const onPage = (event) => {
    // PrimeReact sometimes doesn't populate `page`; safer to compute from first/rows
    const page = Math.floor(event.first / event.rows) + 1;
    const limit = event.rows;
    setFirst(event.first);
    dispatch(fetchOrders({ page, limit, sortField, sortOrder }));
    scrollToOrdersTop();
  };

  const onSort = (event) => {
    setSortField(event.sortField || DEFAULT_ORDER_SORT_FIELD);
    setSortOrder(event.sortOrder || DEFAULT_ORDER_SORT_ORDER);
    setFirst(0);
  };

  const handleOrderDialogClose = () => {
    setShowOrderDialog(false);
    setSelectedOrder(null);
  };
  
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    
    setFilters(_filters);
    setGlobalValue(value);
  };
  
  const sortedOrders = useMemo(() => {
    const rows = Array.isArray(orders) ? [...orders] : [];
    const direction = sortOrder === 1 ? 1 : -1;
    
    return rows.sort((a, b) => {
      const left = a?.[sortField];
      const right = b?.[sortField];
      
      if (sortField === "created_at") {
        return (new Date(left).getTime() - new Date(right).getTime()) * direction;
      }
      
      if (sortField === "total_amount" || sortField === "order_id") {
        return ((Number(left) || 0) - (Number(right) || 0)) * direction;
      }
      
      return String(left ?? "").localeCompare(String(right ?? "")) * direction;
    });
  }, [orders, sortField, sortOrder]);

  const totalRecords = pagination?.totalItems || orderCount || 0;
  const rowsPerPage = pagination?.itemsPerPage || DEFAULT_ORDER_ROWS;
  const canGoPrevious = first > 0;
  const canGoNext = first + rowsPerPage < totalRecords;

  const openOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderDialog(true);
  };

  const scrollToOrdersTop = () => {
    requestAnimationFrame(() => {
      ordersTopRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  if (loading && !orderCount) {
    return <div className="order-flow-empty">Loading your orders...</div>;
  }

  const statusBodyTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.order_status?.toUpperCase() || "PENDING"}
        severity={orderSeverity(rowData.order_status)}
        className="text-xs uppercase px-3 py-1 bg-opacity-20 translate-y-[1px]"
      />
    );
  };

  const paymentStatusBodyTemplate = (rowData) => {
    const paymentLabel = displayPaymentStatus(rowData);
    return (
      <Tag
        value={paymentLabel}
        severity={
          paymentLabel === "N/A"
            ? "secondary"
            : paymentSeverity(rowData.payment_status)
        }
        className="text-xs uppercase px-3 py-1 bg-opacity-20 translate-y-[1px]"
      />
    );
  };

  const header = (
    <div className="orders-header-flex">
      <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
        <div className="orders-search-container">
          <i className="pi pi-search orders-search-icon" />
          <InputText
            value={globalValue}
            onChange={onGlobalFilterChange}
            placeholder="Search all orders..."
            className="orders-search-input admin-search-input"
          />
        </div>
        <div className="order-flow-card-muted min-w-[190px] px-4 py-3 text-left">
          <p className="order-flow-stat-label">Total Orders</p>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-slate-100">
            {totalRecords}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={ordersTopRef} className="orders-page-wrapper animate-fade-in">
      <div className="orders-card admin-products-table-wrapper flex-1 flex flex-col min-h-0">
        <div className="orders-mobile-list md:hidden">
          {header}
          <div className="mt-4 space-y-3">
            {sortedOrders.length === 0 ? (
              <div className="order-flow-empty">No Order found.</div>
            ) : (
              sortedOrders.map((order) => (
                <button
                  key={order.order_id}
                  type="button"
                  onClick={() => openOrder(order)}
                  className="orders-mobile-card w-full rounded-2xl border border-[#ddcfb7] bg-[#f8f3ea] p-4 text-left shadow-[0_14px_24px_-24px_rgba(15,23,42,0.9)] dark:border-[#243440] dark:bg-[#10171b]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">
                        Order
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-gray-900 dark:text-slate-100">
                        {order.order_number || `#${order.order_id}`}
                      </p>
                    </div>
                    {statusBodyTemplate(order)}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-slate-400">
                        Date
                      </p>
                      <p className="mt-1 font-semibold text-gray-900 dark:text-slate-100">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-slate-400">
                        Total
                      </p>
                      <p className="mt-1 font-semibold text-gray-900 dark:text-slate-100">
                        {formatINR(order.total_amount)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-slate-400">
                        Payment
                      </p>
                      <div className="mt-1">{paymentStatusBodyTemplate(order)}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {totalRecords > rowsPerPage ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              <Button
                type="button"
                label="Previous"
                disabled={!canGoPrevious || loading}
                onClick={() =>
                  onPage({
                    first: Math.max(0, first - rowsPerPage),
                    rows: rowsPerPage,
                  })
                }
                className="!rounded-xl !border !border-gray-200 !bg-white !px-4 !py-2 !text-sm !text-gray-700 disabled:!opacity-50 dark:!border-[#243440] dark:!bg-[#151e22] dark:!text-slate-200"
              />
              <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                {Math.floor(first / rowsPerPage) + 1} / {Math.max(1, Math.ceil(totalRecords / rowsPerPage))}
              </span>
              <Button
                type="button"
                label="Next"
                disabled={!canGoNext || loading}
                onClick={() =>
                  onPage({
                    first: first + rowsPerPage,
                    rows: rowsPerPage,
                  })
                }
                className="!rounded-xl !border !border-gray-200 !bg-white !px-4 !py-2 !text-sm !text-gray-700 disabled:!opacity-50 dark:!border-[#243440] dark:!bg-[#151e22] dark:!text-slate-200"
              />
            </div>
          ) : null}
        </div>

        <div className="hidden md:block">
          <DataTable
            value={sortedOrders}
            lazy
            paginator
            scrollable
            scrollHeight="52vh"
            rows={rowsPerPage}
            first={first}
            rowsPerPageOptions={[5, 10, 25, 50]}
            responsiveLayout="stack"
            breakpoint="960px"
            stripedRows
            tableStyle={{ width: "100%" }}
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            totalRecords={totalRecords}
            onPage={onPage}
            onSort={onSort}
            sortField={sortField}
            sortOrder={sortOrder}
            dataKey="order_id"
            filterDisplay="row"
            filters={filters}
            loading={loading}
            onRowClick={(e) => openOrder(e.data)}
            className="cursor-pointer admin-products-table orders-main-table-scrollable"
            globalFilterFields={[
              "order_number",
              "order_status",
              "payment_status",
              "created_at",
            ]}
            header={header}
            emptyMessage="No Order found."
          >
            <Column field="order_id" sortable header="ID" />

            <Column field="order_number" sortable header="Order Number" />

            <Column
              field="order_status"
              header="Order Status"
              sortable
              body={statusBodyTemplate}
            />

            <Column
              field="payment_status"
              header="Payment Status"
              sortable
              body={paymentStatusBodyTemplate}
            />
            <Column
              field="created_at"
              sortable
              header="Order Date"
              body={(row) => formatDate(row.created_at)}
            />

            <Column
              field="total_amount"
              sortable
              header="Total Amount"
              body={(row) => formatINR(row.total_amount)}
            />
          </DataTable>
        </div>
      </div>

      <Dialog
        header={null}
        showHeader={false}
        closable={false}
        visible={showOrderDialog}
        onHide={handleOrderDialogClose}
        style={{ width: "min(1100px, 95vw)" }}
        breakpoints={{ "960px": "95vw", "640px": "100vw" }}
        modal
        draggable={false}
        resizable={false}
        className="order-detail-dialog"
      >
        {selectedOrder && (
          <OrderDetailComponents
            orderId={selectedOrder.order_id}
            orderData={selectedOrder}
            onClose={handleOrderDialogClose}
            onRefresh={refreshOrders}
            isDialog
            showToast={showToast}
          />
        )}
      </Dialog>
    </div>
  );
}
