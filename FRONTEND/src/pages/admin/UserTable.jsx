import { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";
import { Lock, LockOpen, Trash2 } from "lucide-react";
import {
  blockUserByAdmin,
  deleteUserByAdmin,
  fetchAllUsers,
  unblockUserByAdmin,
} from "../../redux/slices/userSlice";
import "./AdminShared.css";

const STATUS_OPTIONS = [
  { label: "All status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Blocked", value: "blocked" },
];

const ROLE_OPTIONS = [
  { label: "All roles", value: "all" },
  { label: "Customer", value: "customer" },
  { label: "Admin", value: "admin" },
];

const INITIAL_LAZY_PARAMS = {
  first: 0,
  rows: 10,
  page: 1,
  sortField: "created_at",
  sortOrder: -1,
};

const toApiSortOrder = (sortOrder) => (sortOrder === 1 ? "asc" : "desc");

const UserTable = () => {
  const dispatch = useDispatch();
  const { users, loading, actionLoading, pagination } = useSelector((state) => state.users);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lazyParams, setLazyParams] = useState(INITIAL_LAZY_PARAMS);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadUsers = useCallback(() => {
    dispatch(
      fetchAllUsers({
        page: lazyParams.page,
        limit: lazyParams.rows,
        search: debouncedSearch || "",
        role: roleFilter === "all" ? "" : roleFilter,
        status: statusFilter === "all" ? "" : statusFilter,
        sortField: lazyParams.sortField || "created_at",
        sortOrder: toApiSortOrder(lazyParams.sortOrder),
      })
    );
  }, [dispatch, lazyParams, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const resetToFirstPage = () => {
    setLazyParams((prev) => ({ ...prev, first: 0, page: 1 }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
    setLazyParams(INITIAL_LAZY_PARAMS);
  };

  const handlePage = (event) => {
    setLazyParams((prev) => ({
      ...prev,
      first: event.first,
      rows: event.rows,
      page: Math.floor(event.first / event.rows) + 1,
    }));
  };

  const handleSort = (event) => {
    setLazyParams((prev) => ({
      ...prev,
      first: 0,
      page: 1,
      sortField: event.sortField,
      sortOrder: event.sortOrder,
    }));
  };

  const statusTemplate = (rowData) => (
    <Tag
      value={Number(rowData.is_blocked) === 1 ? "Blocked" : "Active"}
      className={
        Number(rowData.is_blocked) === 1
          ? "admin-badge admin-badge--blocked"
          : "admin-badge admin-badge--active"
      }
    />
  );

  const roleBodyTemplate = (rowData) => (
    <Tag value={rowData.role || "customer"} className="admin-badge admin-badge--role" />
  );

  const dateBodyTemplate = (rowData) => {
    const raw = rowData.last_login || rowData.updated_at || rowData.created_at;
    if (!raw) return <span className="text-slate-400">-</span>;

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return <span className="text-slate-400">-</span>;

    return (
      <span className="text-sm text-slate-600 dark:text-slate-300">
        {date.toLocaleDateString()}
      </span>
    );
  };

  const userBodyTemplate = (rowData) => {
    const initials = (rowData.name || "U")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d8ede8] text-xs font-semibold text-[#1f5f55] dark:bg-[#24433e] dark:text-[#b5e2d9]">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
            {rowData.name || "Unnamed user"}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">ID: {rowData.user_id}</p>
        </div>
      </div>
    );
  };

  const handleBlockToggle = async (rowData) => {
    const blocked = Number(rowData.is_blocked) === 1;
    const thunk = blocked
      ? unblockUserByAdmin(Number(rowData.user_id))
      : blockUserByAdmin(Number(rowData.user_id));

    await dispatch(thunk);
    loadUsers();
  };

  const handleDelete = async (rowData) => {
    if (!window.confirm(`Delete user "${rowData.name}"?`)) return;

    await dispatch(deleteUserByAdmin(Number(rowData.user_id)));

    if (users.length === 1 && lazyParams.page > 1) {
      setLazyParams((prev) => ({
        ...prev,
        page: prev.page - 1,
        first: Math.max(prev.first - prev.rows, 0),
      }));
      return;
    }

    loadUsers();
  };

  const actionsTemplate = (rowData) => {
    const blocked = Number(rowData.is_blocked) === 1;

    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          rounded
          text
          severity={blocked ? "success" : "warning"}
          className="admin-action-btn h-9 w-9 p-0 flex items-center justify-center"
          disabled={actionLoading}
          onClick={() => handleBlockToggle(rowData)}
          tooltip={blocked ? "Unblock user" : "Block user"}
          tooltipOptions={{ position: "top" }}
        >
          {blocked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        </Button>

        <Button
          type="button"
          rounded
          text
          severity="danger"
          className="admin-action-btn h-9 w-9 p-0 flex items-center justify-center"
          disabled={actionLoading}
          onClick={() => handleDelete(rowData)}
          tooltip="Delete user"
          tooltipOptions={{ position: "top" }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const skeletonUserTemplate = () => (
    <div className="flex items-center gap-3">
      <Skeleton shape="circle" size="2.25rem" />
      <div className="space-y-2">
        <Skeleton width="9rem" height="1rem" />
        <Skeleton width="5rem" height="0.85rem" />
      </div>
    </div>
  );

  const skeletonTemplate = () => <Skeleton height="1.25rem" className="w-[80%]" />;

  const skeletonActionTemplate = () => (
    <div className="flex gap-2">
      <Skeleton shape="circle" size="2.25rem" />
      <Skeleton shape="circle" size="2.25rem" />
    </div>
  );

  const skeletonData = useMemo(
    () => Array.from({ length: lazyParams.rows || 5 }, (_, i) => ({ user_id: `skeleton-${i}` })),
    [lazyParams.rows]
  );

  const header = (
    <div className="admin-table-toolbar space-y-3">
      <div className="grid items-center gap-3 lg:grid-cols-[minmax(320px,1fr)_180px_180px_auto]">
        <span className="p-input-icon-left admin-search">
          <i className="pi pi-search" />
          <InputText
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              resetToFirstPage();
            }}
            placeholder="Search by name, email or role"
          />
        </span>

        <Dropdown
          value={roleFilter}
          options={ROLE_OPTIONS}
          onChange={(e) => {
            setRoleFilter(e.value);
            resetToFirstPage();
          }}
          className="admin-toolbar-select"
        />

        <Dropdown
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={(e) => {
            setStatusFilter(e.value);
            resetToFirstPage();
          }}
          className="admin-toolbar-select"
        />

        <Button type="button" icon="pi pi-filter-slash" label="Reset" outlined onClick={clearFilters} />
      </div>
    </div>
  );

  return (
    <div className="admin-products-table-wrapper flex-1 flex flex-col min-h-0">
      <DataTable
        value={loading ? skeletonData : users}
        lazy
        paginator
        first={lazyParams.first}
        rows={lazyParams.rows}
        totalRecords={pagination?.totalItems || 0}
        onPage={handlePage}
        onSort={handleSort}
        sortField={lazyParams.sortField}
        sortOrder={lazyParams.sortOrder}
        dataKey="user_id"
        scrollable
        emptyMessage="No users found."
        className="admin-products-table"
        rowsPerPageOptions={[5, 10, 25, 50]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        tableStyle={{ minWidth: "70rem" }}
        header={header}
      >
        <Column
          field="name"
          header="User"
          body={loading ? skeletonUserTemplate : userBodyTemplate}
          sortable
          style={{ minWidth: "18rem" }}
        />
        <Column
          field="email"
          header="Email"
          body={loading ? skeletonTemplate : null}
          sortable
          style={{ minWidth: "16rem" }}
        />
        <Column
          field="role"
          header="Role"
          body={loading ? skeletonTemplate : roleBodyTemplate}
          sortable
          style={{ minWidth: "10rem" }}
        />
        <Column
          field="is_blocked"
          header="Status"
          body={loading ? skeletonTemplate : statusTemplate}
          sortable
          style={{ minWidth: "10rem" }}
        />
        <Column
          field="last_login"
          header="Last Activity"
          body={loading ? skeletonTemplate : dateBodyTemplate}
          sortable
          style={{ minWidth: "10rem" }}
        />
        <Column
          header="Actions"
          body={loading ? skeletonActionTemplate : actionsTemplate}
          exportable={false}
          style={{ minWidth: "7rem" }}
        />
      </DataTable>
    </div>
  );
};

export default UserTable;
