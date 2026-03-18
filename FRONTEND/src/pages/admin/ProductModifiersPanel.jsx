import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

import { useToast } from "../../context/ToastContext";

const currencyFormat = (val) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(val) || 0);

const getApiErrorMessage = (err) =>
  err?.response?.data?.message || err?.message || "Something went wrong";

import { fetchProductPortions } from "../../../api/adminPortionsApi";
import { fetchModifiers } from "../../../api/adminModifiersApi";
import {
  fetchCombinationsByPortion,
  fetchCombinationsByProduct,
  createCombination,
  updateCombination,
  deleteCombination,
} from "../../../api/adminModifiersApi";

// ─────────────────────────────────────────────────────────────────────────────
export default function ProductModifiersPanel({ product, onMutate }) {
  const showToast = useToast();

  /* product has no portions flag */
  const noPortions = !product?.has_portions;

  /* Product-portions for the selector dropdown */
  const [productPortions, setProductPortions] = useState([]);
  const [selectedPPId, setSelectedPPId] = useState(null);

  /* All modifier_master rows (for add-combo builder) */
  const [allModifiers, setAllModifiers] = useState([]);

  /* Combinations currently assigned to the selected portion/product */
  const [combinations, setCombinations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingCombos, setLoadingCombos] = useState(false);

  /* ── Combination Builder state ── */
  // { [modifier_type]: modifier_id }  — one selection per group
  const [builderSelections, setBuilderSelections] = useState({});
  const [builderPrice, setBuilderPrice] = useState(null);
  const [builderStock, setBuilderStock] = useState(null);
  const [adding, setAdding] = useState(false);

  /* ── Inline edit state ── */
  const [editingRows, setEditingRows] = useState({});  // { [combination_id]: { additional_price, stock } }
  const [savingRows, setSavingRows] = useState({});
  const [deletingRows, setDeletingRows] = useState({});

  // ── Load initial data ──
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [portions, mods] = await Promise.all([
          noPortions ? [] : fetchProductPortions(product.product_id),
          fetchModifiers(),
        ]);
        setProductPortions(portions);
        setAllModifiers(mods);
        if (noPortions) {
          await loadCombinationsForProduct();
        }
      } catch (err) {
        showToast("error", "Error", getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [product.product_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCombinationsForProduct = useCallback(async () => {
    setLoadingCombos(true);
    try {
      const data = await fetchCombinationsByProduct(product.product_id);
      setCombinations(data);
    } catch (err) {
      showToast("error", "Error", getApiErrorMessage(err));
    } finally {
      setLoadingCombos(false);
    }
  }, [product.product_id, showToast]);

  const loadCombinationsForPortion = useCallback(async (ppId) => {
    setLoadingCombos(true);
    try {
      const data = await fetchCombinationsByPortion(ppId);
      setCombinations(data);
    } catch (err) {
      showToast("error", "Error", getApiErrorMessage(err));
    } finally {
      setLoadingCombos(false);
    }
  }, [showToast]);

  // Reload when portion changes
  useEffect(() => {
    if (!noPortions && selectedPPId) {
      loadCombinationsForPortion(selectedPPId);
    }
  }, [selectedPPId, noPortions, loadCombinationsForPortion]);

  // ── Derived: group modifiers by type ──
  const modifiersByGroup = useMemo(() => {
    const groups = {};
    allModifiers.forEach((m) => {
      const type = m.modifier_type || m.modifier_name || "Options";
      if (!groups[type]) groups[type] = [];
      groups[type].push(m);
    });
    return groups;
  }, [allModifiers]);

  // Auto-init builder selections when groups load or combos refresh
  useEffect(() => {
    if (Object.keys(modifiersByGroup).length === 0) return;

    setBuilderSelections((prev) => {
      const next = { ...prev };
      
      // 1. Identify groups already in use by existing combinations
      const usedGroups = new Set();
      combinations.forEach(c => {
        (c.modifiers || []).forEach(m => usedGroups.add(m.modifier_type));
      });

      // 2. Refresh selections
      Object.entries(modifiersByGroup).forEach(([type, mods]) => {
        // If it's already in usedGroups, ensure it's "On"
        if (usedGroups.has(type)) {
          if (next[type] == null) {
            next[type] = mods[0]?.modifier_id ?? null;
          }
        } 
        // If no combinations exist yet, just turn on the first available group
        else if (combinations.length === 0 && Object.keys(next).length === 0) {
          next[type] = mods[0]?.modifier_id ?? null;
        }
        // Otherwise, if it wasn't already manually turned "On", leave it "Off"
        // (This prevents new global types from suddenly appearing "On" for existing products)
      });

      return next;
    });
  }, [modifiersByGroup, combinations]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Portion dropdown options ──
  const ppOptions = productPortions.map((pp) => ({
    label: `${pp.portion_value} — ${currencyFormat(pp.price)}`,
    value: pp.product_portion_id,
  }));

  // ── Add Combination ──
  const handleAddCombination = async () => {
    const selectedEntries = Object.entries(builderSelections).filter(([, id]) => id != null);
    if (selectedEntries.length === 0) {
      showToast("warn", "Warning", "Select at least one modifier option");
      return;
    }
    if (!noPortions && !selectedPPId) {
      showToast("warn", "Warning", "Please select a portion first");
      return;
    }

    setAdding(true);
    try {
      const modifierIds = selectedEntries.map(([, id]) => id);
      const selectedPortion = productPortions.find((p) => p.product_portion_id === selectedPPId);

      await createCombination({
        product_id: product.product_id,
        product_portion_id: noPortions ? null : selectedPPId,
        modifier_ids: modifierIds,
        additional_price: builderPrice || 0,
        stock: builderStock || 0,
      });

      onMutate?.();
      showToast("success", "Success", "Combination added");
      setBuilderPrice(null);
      setBuilderStock(null);

      if (noPortions) {
        await loadCombinationsForProduct();
      } else {
        await loadCombinationsForPortion(selectedPPId);
      }
    } catch (err) {
      showToast("error", "Error", getApiErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  // ── Inline edit helpers ──
  const startEdit = (row) =>
    setEditingRows((prev) => ({
      ...prev,
      [row.combination_id]: {
        additional_price: Number(row.additional_price) || 0,
        stock: Number(row.stock) || 0,
      },
    }));

  const cancelEdit = (id) =>
    setEditingRows((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

  const updateField = (id, field, value) =>
    setEditingRows((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));

  const handleRowSave = async (row) => {
    const edited = editingRows[row.combination_id];
    if (!edited) return;
    setSavingRows((prev) => ({ ...prev, [row.combination_id]: true }));
    try {
      await updateCombination(row.combination_id, {
        additional_price: edited.additional_price,
        stock: edited.stock,
      });
      onMutate?.();
      showToast("success", "Success", "Combination updated");
      cancelEdit(row.combination_id);
      if (noPortions) await loadCombinationsForProduct();
      else await loadCombinationsForPortion(selectedPPId);
    } catch (err) {
      showToast("error", "Error", getApiErrorMessage(err));
    } finally {
      setSavingRows((prev) => ({ ...prev, [row.combination_id]: false }));
    }
  };

  const handleRowDelete = async (row) => {
    setDeletingRows((prev) => ({ ...prev, [row.combination_id]: true }));
    try {
      await deleteCombination(row.combination_id);
      onMutate?.();
      showToast("success", "Success", "Combination removed");
      if (noPortions) await loadCombinationsForProduct();
      else await loadCombinationsForPortion(selectedPPId);
    } catch (err) {
      showToast("error", "Error", getApiErrorMessage(err));
    } finally {
      setDeletingRows((prev) => ({ ...prev, [row.combination_id]: false }));
    }
  };

  // ── Column Templates ──
  const nameBodyTemplate = (row) => (
    <div>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{row.name}</p>
      <div className="flex flex-wrap gap-1 mt-1">
        {(row.modifiers || []).map((m) => (
          <span
            key={m.modifier_id}
            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30"
          >
            <span className="opacity-60">{m.modifier_type}:</span> {m.modifier_value}
          </span>
        ))}
      </div>
    </div>
  );

  const priceBodyTemplate = (row) => {
    const id = row.combination_id;
    const edited = editingRows[id];
    if (edited) {
      return (
        <InputNumber
          value={edited.additional_price}
          onValueChange={(e) => updateField(id, "additional_price", e.value ?? 0)}
          mode="currency"
          currency="INR"
          locale="en-IN"
          className="admin-inputnumber-wrap"
          pt={{ input: { className: "admin-input rounded-lg h-8 px-2 text-sm w-28" } }}
        />
      );
    }
    const price = Number(row.additional_price);
    return (
      <span className={price > 0 ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-400"}>
        {price > 0 ? `+${currencyFormat(price)}` : "—"}
      </span>
    );
  };

  const stockBodyTemplate = (row) => {
    const id = row.combination_id;
    const edited = editingRows[id];
    if (edited) {
      return (
        <InputNumber
          value={edited.stock}
          onValueChange={(e) => updateField(id, "stock", e.value ?? 0)}
          min={0}
          className="admin-inputnumber-wrap"
          pt={{ input: { className: "admin-input rounded-lg h-8 px-2 text-sm w-24" } }}
        />
      );
    }
    const stock = Number(row.stock);
    return (
      <span className={stock > 0 ? "text-gray-800 dark:text-gray-200 font-medium" : "text-red-500 font-medium"}>
        {stock > 0 ? stock : "Out"}
      </span>
    );
  };

  const actionBodyTemplate = (row) => {
    const id = row.combination_id;
    const edited = editingRows[id];
    const isSaving = savingRows[id];
    const isDeleting = deletingRows[id];

    if (edited) {
      return (
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleRowSave(row); }}
            disabled={isSaving}
            className="p-1.5 rounded-lg bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 hover:bg-green-200 transition"
          >
            {isSaving ? <span className="text-[10px]">…</span> : <Check className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); cancelEdit(id); }}
            className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); startEdit(row); }}
          disabled={isDeleting}
          className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-200 transition"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleRowDelete(row); }}
          disabled={isDeleting}
          className="p-1.5 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 hover:bg-red-200 transition"
        >
          {isDeleting ? <span className="text-[10px]">…</span> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    );
  };

  const showForm = noPortions || selectedPPId;

  return (
    <div className="flex flex-col gap-4 mt-2">
      {/* ── Portion Selector ── */}
      {!noPortions && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Select Product-Portion
          </label>
          <Dropdown
            value={selectedPPId}
            onChange={(e) => setSelectedPPId(e.value)}
            options={ppOptions}
            placeholder="Choose a portion to manage its combinations…"
            loading={loading}
            className="admin-dropdown w-full max-w-md"
            pt={{
              root: { className: "admin-dropdown-root rounded-lg h-10 flex items-center shadow-none" },
              input: { className: "px-3 text-sm" },
              trigger: { className: "w-10" },
              panel: { className: "admin-dropdown-panel rounded-lg shadow-xl mt-1" },
            }}
          />
        </div>
      )}

      {showForm && (
        <>
          {/* ── Combination Builder ── */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Add Combination
            </p>

            {Object.keys(modifiersByGroup).length === 0 ? (
              <p className="text-sm text-gray-400 italic">No modifiers found. Add modifiers first.</p>
            ) : (
              <div className="space-y-3">
                {/* One row per modifier type group */}
                {Object.entries(modifiersByGroup).map(([type, mods]) => (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 w-24 shrink-0">
                      {type}
                    </span>
                    <div className={`flex-1 transition-opacity ${builderSelections[type] == null ? "opacity-40 grayscale" : "opacity-100"}`}>
                      <Dropdown
                        value={builderSelections[type] ?? null}
                        onChange={(e) =>
                          setBuilderSelections((prev) => ({ ...prev, [type]: e.value }))
                        }
                        options={mods.map((m) => ({
                          label: `${m.modifier_value}${Number(m.additional_price) > 0 ? ` (+₹${Number(m.additional_price).toLocaleString("en-IN")})` : ""}`,
                          value: m.modifier_id,
                        }))}
                        placeholder={`Select ${type}…`}
                        disabled={builderSelections[type] == null}
                        className="admin-dropdown w-full"
                        pt={{
                          root: { className: "admin-dropdown-root rounded-lg h-9 flex items-center shadow-none" },
                          input: { className: "px-3 text-sm" },
                          trigger: { className: "w-9" },
                          panel: { className: "admin-dropdown-panel rounded-lg shadow-xl mt-1" },
                        }}
                      />
                    </div>
                    {/* Toggle to exclude from combination */}
                    <button
                      type="button"
                      onClick={() =>
                        setBuilderSelections((prev) => {
                          const next = { ...prev };
                          if (next[type] != null) delete next[type];
                          else next[type] = mods[0]?.modifier_id ?? null;
                          return next;
                        })
                      }
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition uppercase tracking-tighter shrink-0 ${
                        builderSelections[type] != null
                          ? "border-amber-400 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10"
                          : "border-gray-300 text-gray-400 bg-white dark:bg-gray-700"
                      }`}
                    >
                      {builderSelections[type] != null ? "Active" : "Ignore"}
                    </button>
                  </div>
                ))}

                {/* Price + Stock + Add */}
                <div className="flex items-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Add. Price</label>
                    <InputNumber
                      value={builderPrice}
                      onValueChange={(e) => setBuilderPrice(e.value)}
                      mode="currency"
                      currency="INR"
                      locale="en-IN"
                      placeholder="0"
                      className="admin-inputnumber-wrap"
                      pt={{ input: { className: "admin-input rounded-lg h-9 px-3 text-sm w-32" } }}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Stock</label>
                    <InputNumber
                      value={builderStock}
                      onValueChange={(e) => setBuilderStock(e.value)}
                      min={0}
                      placeholder="0"
                      className="admin-inputnumber-wrap"
                      pt={{ input: { className: "admin-input rounded-lg h-9 px-3 text-sm w-24" } }}
                    />
                  </div>

                  {/* Preview tags */}
                  <div className="flex-1 flex flex-wrap gap-1 items-center">
                    {Object.entries(builderSelections)
                      .filter(([, id]) => id != null)
                      .map(([type, id]) => {
                        const m = modifiersByGroup[type]?.find((x) => x.modifier_id === id);
                        return m ? (
                          <span key={type} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            {m.modifier_value}
                          </span>
                        ) : null;
                      })}
                  </div>

                  <Button
                    type="button"
                    className="admin-btn-primary flex items-center gap-1.5 px-4 h-9 rounded-lg text-sm font-medium shadow-sm shrink-0"
                    onClick={handleAddCombination}
                    disabled={adding || Object.values(builderSelections).every((v) => v == null)}
                  >
                    <Plus className="h-4 w-4" />
                    <span>{adding ? "Adding…" : "Add Combination"}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Combinations Table ── */}
          <div style={{ maxHeight: "280px", overflowY: "auto" }}>
            <DataTable
              key={`dt-${Object.keys(editingRows).join("-")}`}
              value={[...combinations]}
              dataKey="combination_id"
              loading={loadingCombos}
              emptyMessage="No combinations yet. Use the builder above to create some."
              className="admin-products-table"
              tableStyle={{ minWidth: "36rem" }}
            >
              <Column
                header="Name / Modifiers"
                body={nameBodyTemplate}
                style={{ minWidth: "14rem" }}
              />
              <Column
                header="Add. Price"
                body={priceBodyTemplate}
                style={{ minWidth: "9rem" }}
              />
              <Column
                header="Stock"
                body={stockBodyTemplate}
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
        </>
      )}
    </div>
  );
}
