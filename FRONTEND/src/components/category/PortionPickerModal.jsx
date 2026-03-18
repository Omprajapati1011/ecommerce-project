import { useState, useEffect, useMemo } from "react";
import { X, ShoppingCart, CheckCircle2 } from "lucide-react";
import api from "../../../api/api.js";

const fmt = (v) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(v) || 0);

function PortionPickerModal({ product, onHide, onConfirm }) {
  const [portions, setPortions] = useState([]);
  const [combinations, setCombinations] = useState([]);
  const [rawModifiers, setRawModifiers] = useState([]);
  const [selectedPortion, setSelectedPortion] = useState(null);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [selectedRawModIds, setSelectedRawModIds] = useState({}); // { groupName: modId }
  const [portionsLoading, setPortionsLoading] = useState(true);
  const [combosLoading, setCombosLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // Receive pre-fetched portions from caller via product._portions
  useEffect(() => {
    if (!product) return;
    const initial = Array.isArray(product._portions) ? product._portions : [];
    setPortions(initial);
    setPortionsLoading(false);
    if (initial.length > 0) setSelectedPortion(initial[0]);
  }, [product]);

  // Fetch combinations and raw modifiers whenever selected portion changes (or on load if no portions)
  useEffect(() => {
    // If we have portions but nothing selected yet, wait.
    if (portions.length > 0 && !selectedPortion) return;
    // If no portions and no product yet, wait.
    if (portions.length === 0 && !product) return;

    let active = true;
    setCombosLoading(true);
    setSelectedCombo(null);
    setSelectedRawModIds({});

    const productId = product?.product_id ?? product?.id;
    const comboUrl = selectedPortion
      ? `/modifiers/combinations/by-portion/${selectedPortion.product_portion_id}`
      : `/modifiers/combinations/by-product/${productId}`;

    const rawModUrl = selectedPortion
      ? `/modifiers/by-portion/${selectedPortion.product_portion_id}`
      : `/modifiers/by-product/${productId}`;

    const fetchAll = async () => {
      try {
        const [comboRes, rawModRes] = await Promise.all([
          api.get(comboUrl),
          api.get(rawModUrl)
        ]);

        if (!active) return;

        const primaryCombos = comboRes.data?.data ?? [];
        const primaryComboList = Array.isArray(primaryCombos) ? primaryCombos : [];

        // Some products store combinations/modifiers at product-level even when portions exist.
        // Fallback to by-product when by-portion returns empty.
        let finalCombos = primaryComboList;
        if (selectedPortion && finalCombos.length === 0 && productId) {
          try {
            const fallbackComboRes = await api.get(
              `/modifiers/combinations/by-product/${productId}`,
            );
            const fallback = fallbackComboRes.data?.data ?? [];
            finalCombos = Array.isArray(fallback) ? fallback : [];
          } catch {
            // ignore fallback errors
          }
        }

        setCombinations(finalCombos);
        // Auto-select first in-stock combination
        const firstInStock = finalCombos.find((c) => Number(c.stock) > 0);
        if (firstInStock) setSelectedCombo(firstInStock);
        else if (finalCombos.length > 0) setSelectedCombo(finalCombos[0]);

        const primaryMods = rawModRes.data?.data ?? [];
        const primaryModList = Array.isArray(primaryMods) ? primaryMods : [];

        let finalMods = primaryModList;
        if (
          selectedPortion &&
          finalMods.length === 0 &&
          finalCombos.length === 0 &&
          productId
        ) {
          try {
            const fallbackModRes = await api.get(`/modifiers/by-product/${productId}`);
            const fallbackMods = fallbackModRes.data?.data ?? [];
            finalMods = Array.isArray(fallbackMods) ? fallbackMods : [];
          } catch {
            // ignore fallback errors
          }
        }

        setRawModifiers(finalMods);
      } catch (err) {
        if (active) {
          setCombinations([]);
          setRawModifiers([]);
        }
      } finally {
        if (active) setCombosLoading(false);
      }
    };

    fetchAll();
    return () => { active = false; };
  }, [selectedPortion, product, portions.length]);

  // Group raw modifiers by name (type)
  const groupedRawModifiers = useMemo(() => {
    const groups = {};
    rawModifiers.forEach((m) => {
      const gname = m.modifier_name || "Options";
      if (!groups[gname]) groups[gname] = [];
      groups[gname].push(m);
    });
    return groups;
  }, [rawModifiers]);

  const basePrice = Number(selectedPortion?.discounted_price ?? selectedPortion?.price ?? 0);
  const comboExtra = Number(selectedCombo?.additional_price ?? 0);
  const rawExtra = useMemo(() => {
    const ids = Object.values(selectedRawModIds).filter(Boolean);
    if (!ids.length) return 0;
    const idSet = new Set(ids);
    return rawModifiers.reduce((sum, m) => {
      if (idSet.has(m.modifier_id)) return sum + Number(m.additional_price ?? 0);
      return sum;
    }, 0);
  }, [selectedRawModIds, rawModifiers]);

  const effectivePrice = selectedPortion ? basePrice + comboExtra + rawExtra : null;

  const handleConfirm = async () => {
    setAdding(true);
    const modIds = Object.values(selectedRawModIds).filter(Boolean);
    await onConfirm(
      selectedPortion?.product_portion_id ?? null,
      modIds.length > 0 ? modIds : null,
      selectedCombo?.combination_id ?? null,
    );
    setAdding(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm"
      onClick={onHide}
    >
      <div
        className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#151e22] shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-[#1f2933] p-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Customize
            </p>
            <p className="mt-0.5 truncate font-serif text-lg font-semibold text-gray-900 dark:text-slate-100">
              {product?.display_name || product?.name}
            </p>
          </div>
          <button
            onClick={onHide}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[#1f2933] dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* ── Portion buttons ── */}
          {portionsLoading ? (
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-20 animate-pulse rounded-xl bg-gray-100 dark:bg-[#1f2933]" />
              ))}
            </div>
          ) : portions.length > 0 ? (
            <div>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                Size / Variant
              </p>
              <div className="flex flex-wrap gap-2">
                {portions.map((p) => {
                  const price = p.discounted_price ?? p.price;
                  const isSel = selectedPortion?.product_portion_id === p.product_portion_id;
                  return (
                    <button
                      key={p.product_portion_id}
                      type="button"
                      onClick={() => setSelectedPortion(p)}
                      className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                        isSel
                          ? "border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-500/15 dark:text-amber-300"
                          : "border-gray-200 bg-white text-gray-700 hover:border-amber-400 dark:border-[#1f2933] dark:bg-[#1a252b] dark:text-slate-300"
                      }`}
                    >
                      {p.portion_value}
                      {price ? <span className="ml-1 text-[11px] opacity-70">{fmt(price)}</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* ── Combination cards ── */}
          {combosLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-100 dark:bg-[#1f2933]" />
                  <div className="h-12 animate-pulse rounded-2xl bg-gray-100 dark:bg-[#1f2933]" />
                </div>
              ))}
            </div>
          ) : combinations.length > 0 ? (
            <div>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                Choose Variant
              </p>
              <div className="flex flex-col gap-2">
                {combinations.map((c) => {
                  const inStock = Number(c.stock) > 0;
                  const isSel = selectedCombo?.combination_id === c.combination_id;
                  return (
                    <button
                      key={c.combination_id}
                      type="button"
                      disabled={!inStock}
                      onClick={() => inStock && setSelectedCombo(c)}
                      className={`relative flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                        isSel
                          ? "border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-400/10 shadow-sm"
                          : inStock
                          ? "border-gray-200 bg-white hover:border-amber-400 dark:border-[#1f2933] dark:bg-[#1a252b]"
                          : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed dark:border-[#1f2933] dark:bg-[#151e22]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold truncate ${isSel ? "text-amber-700 dark:text-amber-300" : "text-gray-900 dark:text-slate-100"}`}>
                          {c.name}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {(c.modifiers || []).map((m) => (
                            <span 
                              key={m.modifier_id} 
                              className="inline-block rounded-md bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-500 dark:bg-white/5 dark:text-slate-400"
                            >
                              {m.modifier_value}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                        {Number(c.additional_price) > 0 && (
                          <span className="text-xs font-bold text-green-600 dark:text-green-400">
                            +{fmt(c.additional_price)}
                          </span>
                        )}
                        <span className={`text-[10px] font-medium ${inStock ? "text-gray-400" : "text-red-500"}`}>
                          {inStock ? `${c.stock} active` : "Sold out"}
                        </span>
                        {isSel && <CheckCircle2 className="h-4 w-4 text-amber-500 mt-0.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : Object.keys(groupedRawModifiers).length > 0 ? (
            <div className="space-y-5">
              {Object.entries(groupedRawModifiers).map(([groupName, mods]) => (
                <div key={groupName}>
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    {groupName}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mods.map((m) => {
                      const id = m.modifier_id;
                      const isSel = selectedRawModIds[groupName] === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setSelectedRawModIds(prev => {
                              if (prev[groupName] === id) {
                                const next = { ...prev };
                                delete next[groupName];
                                return next;
                              }
                              return { ...prev, [groupName]: id };
                            });
                          }}
                          className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                            isSel
                              ? "border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-500/15 dark:text-amber-300"
                              : "border-gray-200 bg-white text-gray-700 hover:border-amber-400 dark:border-[#1f2933] dark:bg-[#1a252b] dark:text-slate-300"
                          }`}
                        >
                          {m.modifier_value}
                          {Number(m.additional_price) > 0 && (
                            <span className="ml-1 text-[11px] opacity-70">+{fmt(m.additional_price)}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                </div>
              ))}
            </div>
          ) : portions.length === 0 && !combosLoading ? (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-500">No variants available for this product.</p>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-[#1f2933] p-5">
          <div className="flex items-center justify-between gap-3">
            {effectivePrice !== null ? (
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {fmt(effectivePrice)}
              </span>
            ) : (
              <span />
            )}
            <button
              type="button"
              disabled={(() => {
                if (adding) return true;
                if (portions.length > 0 && !selectedPortion) return true;
                if (combinations.length > 0 && !selectedCombo) return true;
                
                // Requirement check: Groups related to Warranty, Care, Protection, Installation, or Gift Wrap are optional
                const isOptional = (nm) => {
                  const n = nm.toLowerCase();
                  return n.includes("warranty") || n.includes("care") || n.includes("protection") || n.includes("installation") || n.includes("gift wrap");
                };

                
                const requiredGroups = Object.keys(groupedRawModifiers).filter(name => !isOptional(name));
                const missingRequired = requiredGroups.some(name => !selectedRawModIds[name]);
                return missingRequired;

              })()}
              onClick={handleConfirm}
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-600/20 transition hover:bg-amber-700 disabled:opacity-60"
            >
              {adding ? <span className="pi pi-spin pi-spinner text-sm" /> : <ShoppingCart className="h-4 w-4" />}
              {adding ? "Adding…" : "Add to Cart"}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

export default PortionPickerModal;
