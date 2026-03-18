import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAdminOrder } from "../../redux/slices/orderSlice";
import { useEffect, useState } from "react";
import OrderDetailComponents from "../OrderDetailComponents";


import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
// import OrderDetailComponents from "./OrderDetailComponents";
import { Package } from "lucide-react";

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
export default function AdminOrderComponent () {
  const dispatch = useDispatch();
  // the reducer is registered under "order" in the store, not "orders".
  // provide a default object to avoid destructure errors when state is undefined.
  const [globalValue, setGlobalValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    customer_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    order_number: { value: null, matchMode: FilterMatchMode.CONTAINS },
    order_status: { value: null, matchMode: FilterMatchMode.CONTAINS },
    payment_status: { value: null, matchMode: FilterMatchMode.CONTAINS },
    created_at: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const { adminOrders, loading, error, adminPagination  } = useSelector(
    (state) => state.order || {},
  );
  const [first, setFirst] = useState(0);
  const [sortField, setSortField] = useState(DEFAULT_ORDER_SORT_FIELD);
  const [sortOrder, setSortOrder] = useState(DEFAULT_ORDER_SORT_ORDER);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
useEffect(() => {
  dispatch(
    getAdminOrder({
      page: DEFAULT_ORDER_PAGE,
      limit: DEFAULT_ORDER_ROWS,
      sortField,
      sortOrder,
    }),
  );
}, [dispatch, sortField, sortOrder]);

  useEffect(() => {
    const currentPage = adminPagination?.currentPage || 1;
    const rows = adminPagination?.itemsPerPage || DEFAULT_ORDER_ROWS;
    setFirst((currentPage - 1) * rows);
  }, [adminPagination?.currentPage, adminPagination?.itemsPerPage]);

  const onPage = (event) => {
    // PrimeReact sometimes doesn't populate `page`; safer to compute from first/rows
    const page = Math.floor(event.first / event.rows) + 1;
    const limit = event.rows;
    setFirst(event.first);
    dispatch(getAdminOrder({ page, limit, sortField, sortOrder }));
  };

const onSort = (event) => {
  const nextSortField = event.sortField || DEFAULT_ORDER_SORT_FIELD;
  const nextSortOrder = event.sortOrder || DEFAULT_ORDER_SORT_ORDER;

  setSortField(nextSortField);
  setSortOrder(nextSortOrder);
  setFirst(0);
};

  const handleAdminOrderStatusChange = (nextStatus) => {
    setSelectedOrder((prev) =>
      prev ? { ...prev, order_status: nextStatus } : prev,
    );
    dispatch(
      getAdminOrder({
        page: adminPagination?.currentPage || 1,
        limit: adminPagination?.itemsPerPage || DEFAULT_ORDER_ROWS,
        sortField,
        sortOrder,
      }),
    );
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

  

  if (loading && !adminOrders.length) {
    return <div className="order-flow-empty">Loading your orders...</div>;
  }

  const statusBodyTemplate = (rowData) => {
    const status = rowData.order_status?.toLowerCase();
    const severity =
      status === "completed" || status === "delivered"
        ? "success"
        : status === "pending" || status === "processing"
          ? "warning"
          : status === "cancelled"
            ? "danger"
            : "info";

    return (
      <Tag
        value={rowData.order_status}
        severity={severity}
        className="text-xs uppercase px-3 py-1 bg-opacity-20 translate-y-[1px]"
      />
    );
  };

  const paymentStatusBodyTemplate = (rowData) => {
    const status = rowData.payment_status?.toLowerCase();
    const severity =
      status === "paid" || status === "success" || status === "processing"
        ? "success"
        : status === "pending"
          ? "warning"
          : status === "failed"
            ? "danger"
            : "info";

    return (
      <Tag
        value={rowData.payment_status}
        severity={severity}
        className="text-xs uppercase px-3 py-1 bg-opacity-20 translate-y-[1px]"
      />
    );
  };

  const header = (
    <div className="orders-header-flex">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          <Package className="h-6 w-6" />
        </span>
        <div className="orders-title-text">Orders Overview</div>
      </div>
      <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
        <div className="orders-search-container">
          <i className="pi pi-search orders-search-icon" />
          <InputText
            value={globalValue}
            onChange={onGlobalFilterChange}
            placeholder="Search all orders..."
            className="orders-search-input"
          />
        </div>
        <div className="order-flow-card-muted min-w-[190px] px-4 py-3 text-left">
          <p className="order-flow-stat-label">Total Orders</p>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-slate-100">
            {adminPagination?.totalItems || adminOrders.length || 0}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="orders-page-wrapper animate-fade-in">
      {error && (
        <div className="order-flow-alert border-red-300/70 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </div>
      )}
      <div className="orders-card">
        <DataTable
          value={adminOrders}
          lazy
          paginator
          scrollable
          scrollHeight="52vh"
          rows={adminPagination?.itemsPerPage || DEFAULT_ORDER_ROWS}
          first={first}
          rowsPerPageOptions={[5, 10, 25, 50]}
          responsiveLayout="stack"
          breakpoint="960px"
          stripedRows
          tableStyle={{ width: "100%" }}
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="{first} to {last} of {totalRecords}"
          totalRecords={adminPagination?.totalItems || 0}
          onPage={onPage}
          onSort={onSort}
          sortField={sortField}
          sortOrder={sortOrder}
          dataKey="order_id"
          filterDisplay="row"
          filters={filters}
          loading={loading}
          onRowClick={(e) => {
            setSelectedOrder(e.data);
            setShowOrderDialog(true);
          }}
          className="cursor-pointer orders-main-table orders-main-table-scrollable"
          globalFilterFields={[
            "customer_name",
            "order_number",
            "order_status",
            "payment_status",
            "created_at",
          ]}
          header={header}
          emptyMessage="No Order found."
        >
          <Column field="order_id" sortable header="ID" />

          <Column
            field="customer_name"
            sortable
            header="Customer Name"
            body={(row) => row.customer_name || "-"}
          />

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
            body={(row) => new Date(row.created_at).toLocaleDateString()}
          />

          <Column
            field="total_amount"
            sortable
            header="Total Amount"
            body={(row) => formatINR(row.total_amount)}
          />
        </DataTable>
      </div>

      <Dialog
        header={null}
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
            isDialog
            onOrderStatusChange={handleAdminOrderStatusChange}
          />
        )}
      </Dialog>
    </div>
  );
}
