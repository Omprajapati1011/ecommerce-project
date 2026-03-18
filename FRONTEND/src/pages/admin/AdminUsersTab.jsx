import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Toast } from "primereact/toast";
import {
  fetchAllUsers,
  fetchUserProfileById,
  blockUserByAdmin,
  unblockUserByAdmin,
  deleteUserByAdmin,
  createUserByAdmin,
} from "../../redux/slices/userSlice";
import AdminUsersToolbar from "./AdminUsersToolbar";
import AdminUsersTable from "./AdminUsersTable";
import UserDeleteDialog from "./UserDeleteDialog";
import UserDetailsDialog from "./UserDetailsDialog";
import AdminUserCreateDialog from "./AdminUserCreateDialog";
import getApiErrorMessage from "../../utils/apiError";
import "./AdminShared.css";

function AdminUsersTab() {
  const dispatch = useDispatch();
  const toast = useRef(null);

  const { users, loading, actionLoading, pagination, selectedProfile, profileLoading } = useSelector(
    (state) => state.users
  );

  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 1,
    sortField: "created_at",
    sortOrder: -1,
    search: "",
  });

  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = useCallback((severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const toApiSortOrder = useCallback((sortOrder) => (sortOrder === 1 ? "asc" : "desc"), []);

  const loadUsers = useCallback(async () => {
    await dispatch(
      fetchAllUsers({
        page: lazyParams.page,
        limit: lazyParams.rows,
        search: lazyParams.search,
        role: roleFilter === "all" ? "" : roleFilter,
        status: statusFilter === "all" ? "" : statusFilter,
        sortField: lazyParams.sortField || "created_at",
        sortOrder: toApiSortOrder(lazyParams.sortOrder),
      })
    );
  }, [dispatch, lazyParams, roleFilter, statusFilter, toApiSortOrder]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleLazyLoad = useCallback((params) => {
    setLazyParams((prev) => ({ ...prev, ...params }));
  }, []);

  const handleSearch = useCallback((searchValue) => {
    setLazyParams((prev) => ({
      ...prev,
      first: 0,
      page: 1,
      search: searchValue,
    }));
  }, []);

  const handleRoleFilter = useCallback((value) => {
    setRoleFilter(value);
    setLazyParams((prev) => ({ ...prev, first: 0, page: 1 }));
  }, []);

  const handleStatusFilter = useCallback((value) => {
    setStatusFilter(value);
    setLazyParams((prev) => ({ ...prev, first: 0, page: 1 }));
  }, []);

  const handleViewUser = useCallback(
    async (user) => {
      setSelectedUser(user);
      setDetailsDialog(true);
      try {
        await dispatch(fetchUserProfileById(Number(user.user_id))).unwrap();
      } catch (error) {
        showToast(
          "error",
          "Error",
          getApiErrorMessage(error, "We could not load this user profile."),
        );
      }
    },
    [dispatch, showToast]
  );

  const handleToggleBlock = useCallback(
    async (user) => {
      try {
        if (Number(user.is_blocked) === 1) {
          await dispatch(unblockUserByAdmin(Number(user.user_id))).unwrap();
          showToast("success", "Success", "User unblocked successfully");
        } else {
          await dispatch(blockUserByAdmin(Number(user.user_id))).unwrap();
          showToast("success", "Success", "User blocked successfully");
        }
        await loadUsers();
      } catch (error) {
        showToast(
          "error",
          "Error",
          getApiErrorMessage(error, "We could not update this user right now."),
        );
      }
    },
    [dispatch, loadUsers, showToast]
  );

  const handleDeleteClick = useCallback((user) => {
    setSelectedUser(user);
    setDeleteDialog(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialog(false);
    setSelectedUser(null);
  }, []);

  const handleConfirmDelete = useCallback(
    async (user) => {
      if (!user) return;

      setDeleting(true);
      try {
        await dispatch(deleteUserByAdmin(Number(user.user_id))).unwrap();
        showToast("success", "Success", "User deleted successfully");
        handleCloseDeleteDialog();

        if (users.length === 1 && lazyParams.page > 1) {
          setLazyParams((prev) => ({
            ...prev,
            first: Math.max(prev.first - prev.rows, 0),
            page: prev.page - 1,
          }));
        } else {
          await loadUsers();
        }
      } catch (error) {
        showToast(
          "error",
          "Error",
          getApiErrorMessage(error, "We could not delete this user right now."),
        );
      } finally {
        setDeleting(false);
      }
    },
    [dispatch, handleCloseDeleteDialog, lazyParams.page, loadUsers, users.length, showToast]
  );

  const handleCreateUser = useCallback(
    async (payload) => {
      try {
        await dispatch(createUserByAdmin(payload)).unwrap();
        showToast("success", "Success", "User created successfully.");
        setCreateDialog(false);
        await loadUsers();
      } catch (error) {
        showToast(
          "error",
          "Error",
          getApiErrorMessage(error, "We could not create the user right now."),
        );
      }
    },
    [dispatch, loadUsers, showToast],
  );

  const totalAll = pagination?.totalItems || 0;
  const totalBlocked = useMemo(
    () => users.filter((user) => Number(user.is_blocked) === 1).length,
    [users]
  );
  const totalAdmins = useMemo(
    () => users.filter((user) => user.role === "admin").length,
    [users]
  );

  return (
    <div className="admin-products-container animate-fade-in flex-1 flex flex-col min-h-0">
      <Toast ref={toast} position="top-right" />

      <div className="admin-products-card flex-1 flex flex-col min-h-0">
        <AdminUsersToolbar
          onSearch={handleSearch}
          onRoleFilter={handleRoleFilter}
          onStatusFilter={handleStatusFilter}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          totalAll={totalAll}
          totalBlocked={totalBlocked}
          totalAdmins={totalAdmins}
          onCreate={() => setCreateDialog(true)}
        />

        <AdminUsersTable
          users={users}
          loading={loading}
          totalRecords={totalAll}
          lazyParams={lazyParams}
          onLazyLoad={handleLazyLoad}
          onView={handleViewUser}
          onToggleBlock={handleToggleBlock}
          onDelete={handleDeleteClick}
          actionLoading={actionLoading}
        />
      </div>

      <UserDeleteDialog
        visible={deleteDialog}
        onHide={handleCloseDeleteDialog}
        user={selectedUser}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />

      <UserDetailsDialog
        visible={detailsDialog}
        onHide={() => setDetailsDialog(false)}
        user={{ ...(selectedUser || {}), ...(selectedProfile || {}) }}
        profileLoading={profileLoading}
      />

      <AdminUserCreateDialog
        visible={createDialog}
        onHide={() => setCreateDialog(false)}
        onSubmit={handleCreateUser}
        loading={actionLoading}
      />
    </div>
  );
}

export default AdminUsersTab;
