/**
 * @component ProductPortionsPanel
 * @description Tab panel for assigning portion variants to a product.
 *
 * Features:
 *  - Dropdown to select from available (unassigned) portions
 *  - Inline row editing for price, discounted price, stock, and active status
 *  - Stock accounting: tracks total product stock vs. assigned portion stock
 *  - Optimistic UI: DataTable rows enriched with _editing/_saving/_deleting state
 *
 * API: adminPortionsApi (fetchPortions, fetchProductPortions,
 *      createProductPortion, updateProductPortion, deleteProductPortion)
 *
 * Props: product, onCountChange, onMutate
 * Consumed by: ProductFormModal (Portions tab)
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import { Plus, Save, Pencil, Trash2, X } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import {
  fetchPortions,
  fetchProductPortions,
  createProductPortion,
  updateProductPortion,
  deleteProductPortion,
} from "../../../api/adminPortionsApi";
import getApiErrorMessage from "../../utils/apiError";

const currencyFormat = (val) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(val) || 0,
  );

function ProductPortionsPanel({ product, onCountChange, onMutate }) {
  const showToast = useToast();
  const [allPortions, setAllPortions] = useState([]);
  const [productPortions, setProductPortions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // New portion form
  const [newPortionId, setNewPortionId] = useState(null);
  const [newPrice, setNewPrice] = useState(null);
  const [newDiscountedPrice, setNewDiscountedPrice] = useState(null);
  const [newStock, setNewStock] = useState(null);

  // Inline editing state keyed by product_portion_id
  const [editingRows, setEditingRows] = useState({});
  const [savingRows, setSavingRows] = useState({});
  const [deletingRows, setDeletingRows] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [portions, pPortions] = await Promise.all([
        fetchPortions(),
        fetchProductPortions(product.product_id),
      ]);
      setAllPortions(portions);
      setProductPortions(pPortions);
    } catch (error) {
      showToast("error", "Error", getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [product.product_id, showToast]);

  useEffect(() => {
    if (product?.product_id) {
      loadData();
    }
  }, [product?.product_id, loadData]);

  // Report count to parent
  useEffect(() => {
    onCountChange?.(productPortions.length);
  }, [productPortions.length, onCountChange]);

  // Enrich data with editing state so DataTable re-renders when edit state changes
  const tableData = useMemo(
    () =>
      productPortions.map((pp) => ({
        ...pp,
        _editing: editingRows[pp.product_portion_id] || null,
        _saving: savingRows[pp.product_portion_id] || false,
        _deleting: deletingRows[pp.product_portion_id] || false,
      })),
    [productPortions, editingRows, savingRows, deletingRows],
  );

  // Filter out already-assigned portions from dropdown
  const availablePortions = allPortions.filter(
    (p) => !productPortions.some((pp) => pp.portion_id === p.portion_id),
  );

  const portionOptions = availablePortions.map((p) => ({
    label: p.portion_value + (p.description ? ` — ${p.description}` : ""),
    value: p.portion_id,
  }));

  // Stock accounting: total assigned to portions vs product stock
  const productStock = Number(product?.stock) || 0;
  const assignedStock = productPortions.reduce(
    (sum, pp) => sum + (Number(pp.stock) || 0),
    0,
  );
  const remainingStock = productStock - assignedStock;

  // ── Add handler ──
  const handleAdd = async () => {
    if (!newPortionId || newPrice === null || newPrice === undefined) {
      showToast("warn", "Warning", "Please select a portion and enter a price");
      return;
    }
    const stockToAdd = newStock || 0;
    if (stockToAdd > remainingStock) {
      showToast(
        "warn",
        "Stock Exceeded",
        `Only ${remainingStock} units remaining out of ${productStock} total product stock`,
      );
      return;
    }
    setAdding(true);
    try {
      await createProductPortion({
        product_id: product.product_id,
        portion_id: newPortionId,
        price: newPrice,
        discounted_price: newDiscountedPrice || undefined,
        stock: newStock || 0,
      });
      onMutate?.();
      showToast("success", "Success", "Portion assigned successfully");
      setNewPortionId(null);
      setNewPrice(null);
      setNewDiscountedPrice(null);
      setNewStock(null);
      await loadData();
    } catch (error) {
      showToast("error", "Error", getApiErrorMessage(error));
    } finally {
      setAdding(false);
    }
  };

  // ── Inline editing helpers ──
  const startEdit = (rowData) => {
    setEditingRows((prev) => ({
      ...prev,
      [rowData.product_portion_id]: {
        price: Number(rowData.price),
        discounted_price: rowData.discounted_price
          ? Number(rowData.discounted_price)
          : null,
        stock: Number(rowData.stock) || 0,
        is_active: Boolean(rowData.is_active),
      },
    }));
  };

  const cancelEdit = (id) => {
    setEditingRows((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateEditField = (id, field, value) => {
    setEditingRows((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleRowSave = async (rowData) => {
    const edited = editingRows[rowData.product_portion_id];
    if (!edited) return;

    // Check stock doesn't exceed product total (remaining + this row's original stock)
    const originalRowStock = Number(rowData.stock) || 0;
    const maxAllowed = remainingStock + originalRowStock;
    if ((edited.stock || 0) > maxAllowed) {
      showToast(
        "warn",
        "Stock Exceeded",
        `Max ${maxAllowed} units allowed for this portion (${productStock} total product stock)`,
      );
      return;
    }

    setSavingRows((prev) => ({ ...prev, [rowData.product_portion_id]: true }));
    try {
      await updateProductPortion(rowData.product_portion_id, {
        price: edited.price,
        discounted_price: edited.discounted_price,
        stock: edited.stock,
        is_active: edited.is_active ? 1 : 0,
      });
      onMutate?.();
      showToast("success", "Success", "Portion updated successfully");
      cancelEdit(rowData.product_portion_id);
      await loadData();
    } catch (error) {
      showToast("error", "Error", getApiErrorMessage(error));
    } finally {
      setSavingRows((prev) => ({
        ...prev,
        [rowData.product_portion_id]: false,
      }));
    }
  };

  const handleRowDelete = async (rowData) => {
    setDeletingRows((prev) => ({
      ...prev,
      [rowData.product_portion_id]: true,
    }));
    try {
      await deleteProductPortion(rowData.product_portion_id);
      onMutate?.();
      showToast("success", "Success", "Portion removed successfully");
      await loadData();
    } catch (error) {
      showToast("error", "Error", getApiErrorMessage(error));
    } finally {
      setDeletingRows((prev) => ({
        ...prev,
        [rowData.product_portion_id]: false,
      }));
    }
  };

  // ── Column templates (read from enriched rowData._editing etc.) ──
  const portionBodyTemplate = (rowData) => (
    <span className="font-medium text-gray-900 dark:text-gray-100">
      {rowData.portion_value}
    </span>
  );

  const priceBodyTemplate = (rowData) => {
    const id = rowData.product_portion_id;
    const edited = rowData._editing;
    if (edited) {
      return (
        <InputNumber
          value={edited.price}
          onValueChange={(e) => updateEditField(id, "price", e.value)}
          mode="currency"
          currency="INR"
          locale="en-IN"
          className="admin-inputnumber-wrap w-full"
          pt={{
            input: {
              className: "admin-input w-full rounded-lg h-8 px-2 text-xs",
              autoComplete: "off",
            },
          }}
        />
      );
    }
    return (
      <span className="font-medium text-green-600 dark:text-green-400">
        {currencyFormat(rowData.price)}
      </span>
    );
  };

  const discountedPriceBodyTemplate = (rowData) => {
    const id = rowData.product_portion_id;
    const edited = rowData._editing;
    if (edited) {
      return (
        <InputNumber
          value={edited.discounted_price}
          onValueChange={(e) =>
            updateEditField(id, "discounted_price", e.value)
          }
          mode="currency"
          currency="INR"
          locale="en-IN"
          className="admin-inputnumber-wrap w-full"
          pt={{
            input: {
              className: "admin-input w-full rounded-lg h-8 px-2 text-xs",
              autoComplete: "off",
            },
          }}
        />
      );
    }
    const val = Number(rowData.discounted_price) || 0;
    if (val === 0) return <span className="text-gray-400">—</span>;
    return (
      <span className="font-medium text-orange-600 dark:text-orange-400">
        {currencyFormat(val)}
      </span>
    );
  };

  const stockBodyTemplate = (rowData) => {
    const id = rowData.product_portion_id;
    const edited = rowData._editing;
    if (edited) {
      return (
        <InputNumber
          value={edited.stock}
          onValueChange={(e) => updateEditField(id, "stock", e.value)}
          min={0}
          className="admin-inputnumber-wrap w-full"
          pt={{
            input: {
              className: "admin-input w-full rounded-lg h-8 px-2 text-xs",
              autoComplete: "off",
            },
          }}
        />
      );
    }
    return (
      <span className="text-gray-700 dark:text-gray-300">
        {rowData.stock ?? 0}
      </span>
    );
  };

  const statusBodyTemplate = (rowData) => {
    const id = rowData.product_portion_id;
    const edited = rowData._editing;
    if (edited) {
      return (
        <InputSwitch
          checked={edited.is_active}
          onChange={(e) => updateEditField(id, "is_active", e.value)}
          className="admin-status-switch"
        />
      );
    }
    return (
      <span
        className={`text-xs font-medium ${rowData.is_active ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}
      >
        {rowData.is_active ? "Active" : "Inactive"}
      </span>
    );
  };

  const actionBodyTemplate = (rowData) => {
    const id = rowData.product_portion_id;
    const edited = rowData._editing;
    const isSaving = rowData._saving;
    const isDeleting = rowData._deleting;

    return (
      <div
        className="flex gap-1.5"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {edited ? (
          <>
            <button
              type="button"
              className="h-8 w-8 rounded-full flex items-center justify-center text-green-600 hover:bg-green-50 dark:hover:bg-green-500/15 transition-colors disabled:opacity-40"
              onClick={(e) => {
                e.stopPropagation();
                handleRowSave(rowData);
              }}
              disabled={isSaving}
              title="Save"
            >
              <Save className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="h-8 w-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
              onClick={(e) => {
                e.stopPropagation();
                cancelEdit(id);
              }}
              disabled={isSaving}
              title="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            className="h-8 w-8 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/15 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              startEdit(rowData);
            }}
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          className="h-8 w-8 rounded-full flex items-center justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors disabled:opacity-40"
          onClick={(e) => {
            e.stopPropagation();
            handleRowDelete(rowData);
          }}
          disabled={isDeleting || Boolean(edited)}
          title="Remove"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 mt-2">
      {/* ── Stock info ── */}
      <div className="flex items-center gap-4 text-xs font-medium px-1">
        <span className="text-gray-500 dark:text-gray-400">
          Product Stock:{" "}
          <span className="text-gray-800 dark:text-gray-200">
            {productStock}
          </span>
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          Assigned:{" "}
          <span className="text-gray-800 dark:text-gray-200">
            {assignedStock}
          </span>
        </span>
        <span
          className={
            remainingStock < 0
              ? "text-red-600 dark:text-red-400"
              : remainingStock === 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-green-600 dark:text-green-400"
          }
        >
          Remaining: {remainingStock}
        </span>
      </div>

      {/* ── Add portion form ── */}
      <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-1 flex-1 min-w-[10rem]">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            Portion
          </label>
          <Dropdown
            value={newPortionId}
            onChange={(e) => setNewPortionId(e.value)}
            options={portionOptions}
            placeholder="Select portion…"
            className="admin-dropdown w-full"
            pt={{
              root: {
                className:
                  "admin-dropdown-root rounded-lg h-9 flex items-center shadow-none",
              },
              input: { className: "px-3 text-sm" },
              trigger: { className: "w-10" },
              panel: {
                className: "admin-dropdown-panel rounded-lg shadow-xl mt-1",
              },
            }}
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[8rem]">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            Price <span className="text-red-500">*</span>
          </label>
          <InputNumber
            value={newPrice}
            onValueChange={(e) => setNewPrice(e.value)}
            mode="currency"
            currency="INR"
            locale="en-IN"
            className="admin-inputnumber-wrap w-full"
            pt={{
              input: {
                className: "admin-input w-full rounded-lg h-9 px-3 text-sm",
                autoComplete: "off",
              },
            }}
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[8rem]">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            Discounted
          </label>
          <InputNumber
            value={newDiscountedPrice}
            onValueChange={(e) => setNewDiscountedPrice(e.value)}
            mode="currency"
            currency="INR"
            locale="en-IN"
            className="admin-inputnumber-wrap w-full"
            pt={{
              input: {
                className: "admin-input w-full rounded-lg h-9 px-3 text-sm",
                autoComplete: "off",
              },
            }}
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[5rem]">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            Stock{" "}
            <span className="text-gray-400 font-normal">
              (max {Math.max(remainingStock, 0)})
            </span>
          </label>
          <InputNumber
            value={newStock}
            onValueChange={(e) => setNewStock(e.value)}
            min={0}
            className="admin-inputnumber-wrap w-full"
            pt={{
              input: {
                className: "admin-input w-full rounded-lg h-9 px-3 text-sm",
                autoComplete: "off",
              },
            }}
          />
        </div>
        <Button
          type="button"
          className="admin-btn-primary flex items-center gap-1.5 px-4 h-9 rounded-lg text-sm font-medium shadow-sm"
          onClick={handleAdd}
          disabled={adding || !newPortionId || newPrice === null}
        >
          <Plus className="h-4 w-4" />
          <span>{adding ? "Adding…" : "Add"}</span>
        </Button>
      </div>

      {/* ── Assigned portions table ── */}
      <div style={{ maxHeight: "250px", overflowY: "auto" }}>
        <DataTable
          value={tableData}
          dataKey="product_portion_id"
          loading={loading}
          emptyMessage="No portions assigned yet."
          className="admin-products-table"
          tableStyle={{ minWidth: "42rem" }}
        >
          <Column
            field="portion_value"
            header="Portion"
            body={portionBodyTemplate}
            style={{ minWidth: "7rem" }}
          />
          <Column
            field="price"
            header="Price"
            body={priceBodyTemplate}
            style={{ minWidth: "9rem" }}
          />
          <Column
            field="discounted_price"
            header="Disc. Price"
            body={discountedPriceBodyTemplate}
            style={{ minWidth: "9rem" }}
          />
          <Column
            field="stock"
            header="Stock"
            body={stockBodyTemplate}
            style={{ minWidth: "5rem" }}
          />
          <Column
            field="is_active"
            header="Status"
            body={statusBodyTemplate}
            style={{ minWidth: "5rem" }}
          />
          <Column
            header="Actions"
            body={actionBodyTemplate}
            exportable={false}
            style={{ minWidth: "7rem" }}
          />
        </DataTable>
      </div>
    </div>
  );
}

export default ProductPortionsPanel;