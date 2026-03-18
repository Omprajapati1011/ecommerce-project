/**
 * @component AdminProductsTab
 * @description Orchestrator for the Products management tab.
 *
 * Owns all product-related state (data, pagination, search, filters, modals)
 * and delegates rendering to child components:
 *  - AdminProductsToolbar  → search input, status filter, "New Product" button
 *  - AdminProductsTable    → PrimeReact lazy DataTable with sorting & pagination
 *  - ProductFormModal      → Create/Edit dialog with 4 tabs (Info, Portions, Modifiers, Images)
 *  - ProductDeleteDialog   → Confirmation dialog for safe deletion
 *
 * Data flow: Server-side pagination via adminProductsApi → loadProducts()
 * Pattern:   Optimistic UI updates for status toggles; pessimistic for CRUD.
 *
 * API: adminProductsApi (fetchAdminProducts, createAdminProduct, updateAdminProduct,
 *      updateProductStatus, deleteAdminProduct)
 */
import { useState, useEffect, useCallback } from "react";
import { useToast } from "../../context/ToastContext";
import AdminProductsToolbar from "./AdminProductsToolbar";
import AdminProductsTable from "./AdminProductsTable";
import ProductFormModal from "./ProductFormModal";
import ProductDeleteDialog from "./ProductDeleteDialog";
import {
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  updateProductStatus,
  deleteAdminProduct,
} from "../../../api/adminProductsApi";
import getApiErrorMessage from "../../utils/apiError";
import "./AdminShared.css";

const PRODUCTS_TABLE_STORAGE_KEY = "admin-products-table-state";
const DEFAULT_LAZY_PARAMS = {
  first: 0,
  rows: 10,
  page: 1,
  sortField: null,
  sortOrder: null,
  search: "",
};

function normalizeProductsTableState(state) {
  const rows = Number(state?.lazyParams?.rows) || DEFAULT_LAZY_PARAMS.rows;
  const first = Math.max(0, Number(state?.lazyParams?.first) || 0);

  return {
    lazyParams: {
      first,
      rows,
      page: Math.floor(first / rows) + 1,
      sortField: state?.lazyParams?.sortField || null,
      sortOrder:
        state?.lazyParams?.sortOrder === 1 ||
        state?.lazyParams?.sortOrder === -1
          ? state.lazyParams.sortOrder
          : null,
      search: state?.lazyParams?.search || "",
    },
    statusFilter:
      typeof state?.statusFilter === "boolean" ? state.statusFilter : null,
  };
}

function getStoredProductsTableState() {
  try {
    const raw = sessionStorage.getItem(PRODUCTS_TABLE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return normalizeProductsTableState(JSON.parse(raw));
  } catch {
    return null;
  }
}

function getUrlProductsTableState() {
  try {
    const params = new URLSearchParams(window.location.search);
    const hasProductsState =
      params.has("productsFirst") ||
      params.has("productsRows") ||
      params.has("productsSortField") ||
      params.has("productsSortOrder") ||
      params.has("productsSearch") ||
      params.has("productsStatus");

    if (!hasProductsState) {
      return null;
    }

    const statusValue = params.get("productsStatus");

    return normalizeProductsTableState({
      lazyParams: {
        first: params.get("productsFirst"),
        rows: params.get("productsRows"),
        sortField: params.get("productsSortField"),
        sortOrder: Number(params.get("productsSortOrder")),
        search: params.get("productsSearch") || "",
      },
      statusFilter:
        statusValue === "active"
          ? true
          : statusValue === "inactive"
            ? false
            : null,
    });
  } catch {
    return null;
  }
}

function syncProductsTableStateToUrl({ lazyParams, statusFilter }) {
  try {
    const url = new URL(window.location.href);

    url.searchParams.set("productsFirst", String(lazyParams.first));
    url.searchParams.set("productsRows", String(lazyParams.rows));

    if (lazyParams.sortField) {
      url.searchParams.set("productsSortField", lazyParams.sortField);
    } else {
      url.searchParams.delete("productsSortField");
    }

    if (lazyParams.sortOrder === 1 || lazyParams.sortOrder === -1) {
      url.searchParams.set("productsSortOrder", String(lazyParams.sortOrder));
    } else {
      url.searchParams.delete("productsSortOrder");
    }

    if (lazyParams.search) {
      url.searchParams.set("productsSearch", lazyParams.search);
    } else {
      url.searchParams.delete("productsSearch");
    }

    if (statusFilter === true) {
      url.searchParams.set("productsStatus", "active");
    } else if (statusFilter === false) {
      url.searchParams.set("productsStatus", "inactive");
    } else {
      url.searchParams.delete("productsStatus");
    }

    window.history.replaceState(window.history.state, "", url.toString());
  } catch {
    // noop
  }
}

/**
 * AdminProductsTab - Main orchestrator component for product management
 * Manages state for pagination, search, filtering, and product data
 */
function AdminProductsTab() {
  const showToast = useToast();
  const initialTableState =
    getUrlProductsTableState() ||
    getStoredProductsTableState() ||
    normalizeProductsTableState({
      lazyParams: DEFAULT_LAZY_PARAMS,
      statusFilter: null,
    });

  // Product data state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalAll, setTotalAll] = useState(0);
  const [totalActive, setTotalActive] = useState(0);

  // Lazy loading parameters
  const [lazyParams, setLazyParams] = useState(
    () => initialTableState.lazyParams,
  );

  // Status filter state
  const [statusFilter, setStatusFilter] = useState(
    () => initialTableState.statusFilter,
  );

  // Modal states
  const [productModal, setProductModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [initialTab, setInitialTab] = useState(0);
  const [productModalDirty, setProductModalDirty] = useState(false);

  // Operation states
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Extract error message from API error
  const getErrorMessage = (error) => {
    return getApiErrorMessage(
      error,
      "An unexpected error occurred. Please try again.",
    );
  };

  // Fetch products from API
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data,
        total,
        totalAll: fetchedAll,
        totalActive: fetchedActive,
      } = await fetchAdminProducts({
        page: lazyParams.page,
        limit: lazyParams.rows,
        search: lazyParams.search,
        sortField: lazyParams.sortField,
        sortOrder: lazyParams.sortOrder,
        isActive: statusFilter,
      });
      setProducts(data);
      setTotalRecords(total);
      setTotalAll(fetchedAll);
      setTotalActive(fetchedActive);
    } catch (error) {
      console.error("Failed to load products:", error);
      showToast("error", "Error", getErrorMessage(error));
      setProducts([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [lazyParams, statusFilter, showToast]);

  // Load products on mount and when parameters change
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const normalizedState = normalizeProductsTableState({
      lazyParams,
      statusFilter,
    });

    try {
      sessionStorage.setItem(
        PRODUCTS_TABLE_STORAGE_KEY,
        JSON.stringify({
          lazyParams: normalizedState.lazyParams,
          statusFilter: normalizedState.statusFilter,
        }),
      );
    } catch {
      // noop
    }

    syncProductsTableStateToUrl(normalizedState);
  }, [lazyParams, statusFilter]);

  // Handle lazy loading events (pagination, sorting)
  const handleLazyLoad = useCallback((params) => {
    setLazyParams((prev) => ({
      ...prev,
      ...params,
    }));
  }, []);

  // Handle search
  const handleSearch = useCallback((searchValue) => {
    setLazyParams((prev) => ({
      ...prev,
      first: 0,
      page: 1,
      search: searchValue,
    }));
  }, []);

  // Handle status filter change
  const handleStatusFilter = useCallback((value) => {
    setStatusFilter(value);
    setLazyParams((prev) => ({
      ...prev,
      first: 0,
      page: 1,
    }));
  }, []);

  // Handle opening add product modal
  const handleAddProduct = useCallback(() => {
    setSelectedProduct(null);
    setInitialTab(0);
    setProductModalDirty(false);
    setProductModal(true);
  }, []);

  // Handle opening edit product modal
  const handleEditProduct = useCallback((product) => {
    setSelectedProduct(product);
    setInitialTab(0);
    setProductModalDirty(false);
    setProductModal(true);
  }, []);

  // Reload only after a real mutation to avoid unnecessary requests on open/close.
  const handleCloseProductModal = useCallback(() => {
    setProductModal(false);
    setSelectedProduct(null);
    if (productModalDirty) {
      loadProducts();
    }
    setProductModalDirty(false);
  }, [loadProducts, productModalDirty]);

  const handleProductModalMutate = useCallback(() => {
    setProductModalDirty(true);
  }, []);

  // Handle saving product (create or update)
  const handleSaveProduct = useCallback(
    async (formData) => {
      setSaving(true);
      try {
        if (selectedProduct) {
          // Update existing product
          await updateAdminProduct(selectedProduct.product_id, formData);
          setProductModalDirty(true);
          showToast("success", "Success", "Product updated successfully");
          // Refresh data maintaining current page
          await loadProducts();
          handleCloseProductModal();
        } else {
          // Create new product
          const result = await createAdminProduct(formData);
          const newProductId = result?.data?.product_id;
          setProductModalDirty(true);
          showToast(
            "success",
            "Success",
            "Product created! You can now add portions and modifiers.",
          );
          // Transition modal to edit mode with the new product
          setSelectedProduct({
            product_id: newProductId,
            ...formData,
          });
          // Refresh list in background to show new product
          setLazyParams((prev) => ({
            ...prev,
            first: 0,
            page: 1,
          }));
        }
      } catch (error) {
        console.error("Failed to save product:", error);
        showToast("error", "Error", getErrorMessage(error));
      } finally {
        setSaving(false);
      }
    },
    [selectedProduct, loadProducts, handleCloseProductModal, showToast],
  );

  // Handle opening delete confirmation dialog
  const handleDeleteClick = useCallback((product) => {
    setSelectedProduct(product);
    setDeleteDialog(true);
  }, []);

  // Handle closing delete dialog
  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialog(false);
    setSelectedProduct(null);
  }, []);

  // Handle confirming product deletion
  const handleConfirmDelete = useCallback(
    async (product) => {
      if (!product) return;

      setDeleting(true);
      try {
        await deleteAdminProduct(product.product_id);
        showToast("success", "Success", "Product deleted successfully");
        handleCloseDeleteDialog();

        // Handle edge case: if deleting last item on page, go to previous page
        if (products.length === 1 && lazyParams.page > 1) {
          setLazyParams((prev) => ({
            ...prev,
            first: prev.first - prev.rows,
            page: prev.page - 1,
          }));
        } else {
          await loadProducts();
        }
      } catch (error) {
        console.error("Failed to delete product:", error);
        showToast("error", "Error", getErrorMessage(error));
      } finally {
        setDeleting(false);
      }
    },
    [
      products.length,
      lazyParams.page,
      loadProducts,
      handleCloseDeleteDialog,
      showToast,
    ],
  );

  // Handle toggling product status
  const handleToggleStatus = useCallback(
    async (product, newStatus) => {
      // Optimistically update UI
      setProducts((prev) =>
        prev.map((p) =>
          p.product_id === product.product_id
            ? { ...p, is_active: newStatus }
            : p,
        ),
      );
      // Optimistically update stats
      setTotalActive((prev) => prev + (newStatus ? 1 : -1));

      try {
        await updateProductStatus(product.product_id, newStatus);
        showToast(
          "success",
          "Success",
          `Product ${newStatus ? "activated" : "deactivated"} successfully`,
        );
      } catch (error) {
        console.error("Failed to update product status:", error);
        // Revert optimistic updates on failure
        setProducts((prev) =>
          prev.map((p) =>
            p.product_id === product.product_id
              ? { ...p, is_active: !newStatus }
              : p,
          ),
        );
        setTotalActive((prev) => prev + (newStatus ? -1 : 1));
        showToast("error", "Error", getErrorMessage(error));
      }
    },
    [showToast],
  );

  return (
    <div className="admin-products-container animate-fade-in flex-1 flex flex-col min-h-0">
      <div className="admin-products-card flex-1 flex flex-col min-h-0">
        <AdminProductsToolbar
          onSearch={handleSearch}
          onStatusFilter={handleStatusFilter}
          statusFilter={statusFilter}
          onAddProduct={handleAddProduct}
          totalAll={totalAll}
          totalActive={totalActive}
        />

        <AdminProductsTable
          products={products}
          loading={loading}
          totalRecords={totalRecords}
          lazyParams={lazyParams}
          onLazyLoad={handleLazyLoad}
          onEdit={handleEditProduct}
          onDelete={handleDeleteClick}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      <ProductFormModal
        visible={productModal}
        onHide={handleCloseProductModal}
        product={selectedProduct}
        onSave={handleSaveProduct}
        onMutate={handleProductModalMutate}
        saving={saving}
        initialTab={initialTab}
      />

      <ProductDeleteDialog
        visible={deleteDialog}
        onHide={handleCloseDeleteDialog}
        product={selectedProduct}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />
    </div>
  );
}

export default AdminProductsTab;
