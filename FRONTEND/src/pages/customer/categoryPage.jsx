import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Dropdown } from "primereact/dropdown";
import { useTheme } from "../../context/ThemeContext";
import CategoryFilterSidebar from "../../components/category/CategoryFilterSidebar";
import CategorySearchBar from "../../components/category/CategorySearchBar";
import SelectedFilters from "../../components/category/SelectedFilters";
import ProductGrid from "../../components/category/ProductGrid";
import PortionPickerModal from "../../components/category/PortionPickerModal";
import {
  getAllCategories,
  getAllProducts,
  getProductsByCategoryFilters,
  getCategoryProductsPriceRange,
} from "../../services/categoryApi";
import api from "../../../api/api";

const extractProducts = (res) => {
  const data = res?.data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const getAnyProductId = (product) =>
  product?.product_id ??
  product?.id ??
  product?.productId ??
  product?.product?.product_id ??
  product?.product?.id ??
  null;

const toPositiveInt = (value) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const extractCategoryTree = (res) => {
  const data = res?.data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (data?.data?.item && typeof data.data.item === "object")
    return [data.data.item];
  return [];
};

const getSelectedCategoryIds = (selectedKeys = {}) =>
  Object.entries(selectedKeys)
    .filter(([, value]) => value === true || value?.checked === true)
    .map(([key]) => Number(key))
    .filter((value) => Number.isFinite(value) && value > 0);

const buildParentMap = (nodes = []) => {
  const parentMap = new Map();

  const walk = (node, parentId = null) => {
    if (parentId !== null) parentMap.set(node.category_id, parentId);
    (node.children || []).forEach((child) => walk(child, node.category_id));
  };

  nodes.forEach(walk);
  return parentMap;
};

const isDescendantOf = (childId, ancestorId, parentMap) => {
  let current = parentMap.get(childId);
  while (current !== undefined) {
    if (current === ancestorId) return true;
    current = parentMap.get(current);
  }
  return false;
};

const extractTotalRecords = (res, fallback = 0) =>
  Number(
    res?.data?.pagination?.totalItems ?? res?.data?.data?.count ?? fallback,
  );

const buildCategoryLabelMap = (nodes = [], map = new Map()) => {
  nodes.forEach((node) => {
    map.set(node.category_id, node.category_name);
    buildCategoryLabelMap(node.children || [], map);
  });
  return map;
};

const buildParentIdSet = (nodes = [], set = new Set()) => {
  nodes.forEach((node) => {
    if (node?.children?.length) {
      set.add(node.category_id);
      buildParentIdSet(node.children, set);
    }
  });
  return set;
};

const isDescendantOfAny = (childId, ancestorSet, parentMap) => {
  let current = parentMap.get(childId);
  while (current !== undefined) {
    if (ancestorSet.has(current)) return true;
    current = parentMap.get(current);
  }
  return false;
};

const useDebouncedValue = (value, delayMs = 300) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};

function CategoryPage() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useSelector((state) => state.auth);
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);
  const lastAddBtnRef = useRef(null);
  const [addingProductId, setAddingProductId] = useState(null);
  const [addErrorProductId, setAddErrorProductId] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      const el = e?.detail?.target;
      if (el && typeof el.getBoundingClientRect === "function") {
        lastAddBtnRef.current = el;
      }
    };
    window.addEventListener("shopsphere:addToCartClick", handler);
    return () => window.removeEventListener("shopsphere:addToCartClick", handler);
  }, []);

  const [isTreeLoading, setIsTreeLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [treeLoaded, setTreeLoaded] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState({});
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [pager, setPager] = useState({ first: 0, rows: 8 });
  const [totalRecords, setTotalRecords] = useState(0);
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 0 });
  const [pickerProduct, setPickerProduct] = useState(null);
  const prevFilterSignatureRef = useRef("");
  const productsRequestIdRef = useRef(0);
  const priceRangeRequestIdRef = useRef(0);
  const hasUserPriceSelectionRef = useRef(false);
  const debouncedPriceRange = useDebouncedValue(priceRange, 300);
  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category");
  const urlSortField = (searchParams.get("sortField") || "").trim();
  const urlSortOrder = (searchParams.get("sortOrder") || "").trim();
  const urlSortKey = `${urlSortField}:${urlSortOrder}`;

  const sortOptions = useMemo(
    () => [
      { label: "Featured", value: ":" },
      { label: "Newest", value: "created_at:desc" },
      { label: "Price: Low to High", value: "price:asc" },
      { label: "Price: High to Low", value: "price:desc" },
      { label: "Name: A to Z", value: "name:asc" },
      { label: "Name: Z to A", value: "name:desc" },
    ],
    [],
  );

  const [sortKey, setSortKey] = useState(":");

  useEffect(() => {
    const match = sortOptions.some((opt) => opt.value === urlSortKey);
    setSortKey(match ? urlSortKey : ":");
  }, [urlSortKey, sortOptions]);

  const [sortField, sortOrder] = useMemo(() => {
    const [field = "", order = ""] = (sortKey || ":").split(":");
    return [field, order];
  }, [sortKey]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const nextField = sortField || "";
    const nextOrder = sortOrder || "";

    const currentField = (params.get("sortField") || "").trim();
    const currentOrder = (params.get("sortOrder") || "").trim();

    if (!nextField) {
      params.delete("sortField");
      params.delete("sortOrder");
    } else {
      params.set("sortField", nextField);
      params.set("sortOrder", nextOrder || "asc");
    }

    const afterField = (params.get("sortField") || "").trim();
    const afterOrder = (params.get("sortOrder") || "").trim();
    const changed = currentField !== afterField || currentOrder !== afterOrder;
    if (changed) setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, sortOrder]);

  const sortSignature = useMemo(
    () => (sortField ? `${sortField}:${sortOrder || "asc"}` : ""),
    [sortField, sortOrder],
  );

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsTreeLoading(true);
        const categoryRes = await getAllCategories();
        setCategoryTree(extractCategoryTree(categoryRes));
      } catch (error) {
        console.error("Failed to load categories:", error);
        setCategoryTree([]);
      } finally {
        setIsTreeLoading(false);
        setTreeLoaded(true);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    setSearchText(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    if (!treeLoaded) {
      return;
    }

    if (!urlCategory) {
      setSelectedKeys({});
      return;
    }

    const categoryId = Number(urlCategory);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      setSelectedKeys({});
      return;
    }

    setSelectedKeys({
      [String(categoryId)]: {
        checked: true,
        partialChecked: false,
      },
    });
  }, [treeLoaded, urlCategory]);

  const selectedCategoryIds = useMemo(
    () => getSelectedCategoryIds(selectedKeys),
    [selectedKeys],
  );

  const categoryLabelMap = useMemo(
    () => buildCategoryLabelMap(categoryTree),
    [categoryTree],
  );

  const parentMap = useMemo(() => buildParentMap(categoryTree), [categoryTree]);

  const parentIdSet = useMemo(
    () => buildParentIdSet(categoryTree),
    [categoryTree],
  );

  const parentSelectionIds = useMemo(
    () => selectedCategoryIds.filter((id) => parentIdSet.has(id)),
    [selectedCategoryIds, parentIdSet],
  );

  const parentSelectionSet = useMemo(
    () => new Set(parentSelectionIds),
    [parentSelectionIds],
  );

  const childSelectionIds = useMemo(
    () =>
      selectedCategoryIds.filter(
        (id) =>
          !parentIdSet.has(id) &&
          !isDescendantOfAny(id, parentSelectionSet, parentMap),
      ),
    [selectedCategoryIds, parentIdSet, parentSelectionSet, parentMap],
  );

  const categoryIdGroups = useMemo(
    () => ({
      parent: parentSelectionIds,
      child: childSelectionIds,
    }),
    [parentSelectionIds, childSelectionIds],
  );

  const backendPage = useMemo(
    () => Math.floor(pager.first / pager.rows) + 1,
    [pager.first, pager.rows],
  );

  const paginationFetchKey = useMemo(
    () => `${backendPage}-${pager.rows}`,
    [backendPage, pager.rows],
  );

  const filterSignature = useMemo(() => {
    const parentKey = parentSelectionIds.join(",");
    const childKey = childSelectionIds.join(",");
    const priceKey = hasUserPriceSelectionRef.current
      ? `${debouncedPriceRange[0]}-${debouncedPriceRange[1]}`
      : "";
    return `${debouncedSearchText}|${parentKey}|${childKey}|${priceKey}|${sortSignature}`;
  }, [
    debouncedSearchText,
    parentSelectionIds,
    childSelectionIds,
    debouncedPriceRange,
    sortSignature,
  ]);

  const boundsSignature = useMemo(() => {
    const parentKey = parentSelectionIds.join(",");
    const childKey = childSelectionIds.join(",");
    return `${debouncedSearchText}|${parentKey}|${childKey}`;
  }, [debouncedSearchText, parentSelectionIds, childSelectionIds]);

  const priceFilterParams = useMemo(() => {
    const hasPriceFilter =
      hasUserPriceSelectionRef.current &&
      (debouncedPriceRange[0] !== priceBounds.min ||
        debouncedPriceRange[1] !== priceBounds.max);
    return hasPriceFilter
      ? { min_price: debouncedPriceRange[0], max_price: debouncedPriceRange[1] }
      : {};
  }, [debouncedPriceRange, priceBounds.min, priceBounds.max]);

  useEffect(() => {
    if (!treeLoaded) return;
    setPager((prev) => (prev.first === 0 ? prev : { ...prev, first: 0 }));
  }, [treeLoaded, boundsSignature]);

  useEffect(() => {
    if (!treeLoaded) return;

    const isFilterChanged = prevFilterSignatureRef.current !== filterSignature;
    if (isFilterChanged) {
      prevFilterSignatureRef.current = filterSignature;
      setProducts([]);
      setTotalRecords(0);
      if (pager.first !== 0) {
        setPager((prev) => ({ ...prev, first: 0 }));
        return;
      }
    } else {
      prevFilterSignatureRef.current = filterSignature;
    }

    const loadProductsBySelection = async () => {
      const requestId = ++productsRequestIdRef.current;
      try {
        setIsProductsLoading(true);
        let items = [];

        const hasSearch = debouncedSearchText.length > 0;
        const hasCategoryFilter =
          categoryIdGroups.parent.length > 0 ||
          categoryIdGroups.child.length > 0;

        if (!hasCategoryFilter) {
          const productRes = await getAllProducts({
            page: backendPage,
            limit: pager.rows,
            ...(hasSearch ? { search: debouncedSearchText } : {}),
            ...priceFilterParams,
            ...(sortField ? { sortField, sortOrder: sortOrder || "asc" } : {}),
          });
          items = extractProducts(productRes);
          if (requestId === productsRequestIdRef.current) {
            setTotalRecords(extractTotalRecords(productRes, items.length));
          }
        } else {
          const productRes = await getProductsByCategoryFilters({
            ...(categoryIdGroups.parent.length
              ? { parent_ids: categoryIdGroups.parent }
              : {}),
            ...(categoryIdGroups.child.length
              ? { child_ids: categoryIdGroups.child }
              : {}),
            ...(hasSearch ? { search: debouncedSearchText } : {}),
            ...priceFilterParams,
            page: backendPage,
            limit: pager.rows,
            ...(sortField ? { sortField, sortOrder: sortOrder || "asc" } : {}),
          });
          items = extractProducts(productRes);
          if (requestId === productsRequestIdRef.current) {
            setTotalRecords(extractTotalRecords(productRes, items.length));
          }
        }

        if (items.length > pager.rows) {
          items = items.slice(0, pager.rows);
        }

        // Client-side sort fallback (in case backend ignores sortField/sortOrder)
        if (sortField && items.length > 1) {
          const orderFactor = (sortOrder || "asc").toLowerCase() === "desc" ? -1 : 1;
          const safeText = (value) => String(value ?? "").toLowerCase();
          const safeNumber = (value) => {
            const n = Number(value);
            return Number.isFinite(n) ? n : 0;
          };
          const safeDate = (value) => {
            const t = Date.parse(value);
            return Number.isFinite(t) ? t : 0;
          };

          const getEffectivePrice = (p) =>
            safeNumber(p.discounted_price ?? p.price ?? 0);

          const compare = (a, b) => {
            if (sortField === "price") {
              return (getEffectivePrice(a) - getEffectivePrice(b)) * orderFactor;
            }
            if (sortField === "created_at") {
              return (safeDate(a.created_at) - safeDate(b.created_at)) * orderFactor;
            }
            if (sortField === "name") {
              const left = safeText(a.display_name ?? a.name);
              const right = safeText(b.display_name ?? b.name);
              if (left < right) return -1 * orderFactor;
              if (left > right) return 1 * orderFactor;
              return 0;
            }
            return 0;
          };

          items = [...items].sort(compare);
        }

        if (requestId === productsRequestIdRef.current) {
          setProducts(items);
        }
      } catch (error) {
        console.error("Failed to load products:", error);
        if (requestId === productsRequestIdRef.current) {
          setProducts([]);
        }
      } finally {
        if (requestId === productsRequestIdRef.current) {
          setIsProductsLoading(false);
        }
      }
    };

    loadProductsBySelection();
  }, [treeLoaded, paginationFetchKey, filterSignature]);

  useEffect(() => {
    if (!treeLoaded) return;

    let ignore = false;

    const loadPriceBounds = async () => {
      const requestId = ++priceRangeRequestIdRef.current;
      try {
        const hasSearch = debouncedSearchText.length > 0;

        const priceRes = await getCategoryProductsPriceRange({
          ...(categoryIdGroups.parent.length
            ? { parent_ids: categoryIdGroups.parent }
            : {}),
          ...(categoryIdGroups.child.length
            ? { child_ids: categoryIdGroups.child }
            : {}),
          ...(hasSearch ? { search: debouncedSearchText } : {}),
        });

        if (ignore || requestId !== priceRangeRequestIdRef.current) return;
        const min = Number(priceRes?.data?.data?.min ?? 0);
        const max = Number(priceRes?.data?.data?.max ?? 0);
        setPriceBounds({ min, max });
      } catch (error) {
        if (!ignore && requestId === priceRangeRequestIdRef.current) {
          setPriceBounds({ min: 0, max: 0 });
        }
      }
    };

    loadPriceBounds();
    return () => {
      ignore = true;
    };
  }, [treeLoaded, boundsSignature]);

  useEffect(() => {
    setPriceRange((prev) => {
      if (prev[0] === priceBounds.min && prev[1] === priceBounds.max)
        return prev;
      return [priceBounds.min, priceBounds.max];
    });
  }, [priceBounds.min, priceBounds.max]);

  useEffect(() => {
    setPager((prev) => {
      const currentLength = totalRecords;
      if (prev.first < currentLength) return prev;
      return { ...prev, first: 0 };
    });
  }, [products.length, totalRecords]);

  const combinedCategoryIds = useMemo(
    () => [...new Set([...parentSelectionIds, ...childSelectionIds])],
    [parentSelectionIds, childSelectionIds],
  );

  const categoryTags = useMemo(() => {
    return combinedCategoryIds.map((id) => ({
      id,
      label: categoryLabelMap.get(id) || `Category ${id}`,
    }));
  }, [combinedCategoryIds, categoryLabelMap]);

  const priceTag = useMemo(() => {
    const isFullRange =
      priceRange[0] === priceBounds.min && priceRange[1] === priceBounds.max;
    if (isFullRange) return "";
    return `₹${priceRange[0].toLocaleString("en-IN")} - ₹${priceRange[1].toLocaleString("en-IN")}`;
  }, [priceRange, priceBounds.min, priceBounds.max]);

  const handleRemoveCategoryTag = (categoryId) => {
    setSelectedKeys((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        const id = Number(key);
        if (!Number.isFinite(id)) return;

        const shouldRemove =
          id === categoryId || isDescendantOf(id, categoryId, parentMap);
        if (shouldRemove) delete next[key];
      });
      return next;
    });
  };

  const handleClearPrice = () => {
    hasUserPriceSelectionRef.current = false;
    setPriceRange([priceBounds.min, priceBounds.max]);
  };

  const doAddToCart = async (
    product,
    portionId,
    combinationId,
    modifierIds = null,
  ) => {
    try {
      const pid = toPositiveInt(getAnyProductId(product));
      if (!pid) {
        setAddErrorProductId("invalid");
        window.setTimeout(() => setAddErrorProductId(null), 800);
        return;
      }
      setAddingProductId(pid);
      setAddErrorProductId(null);
      await api.post("/cart/items", {
        productId: pid,
        portionId: portionId ? toPositiveInt(portionId) : undefined,
        combinationId: combinationId ? toPositiveInt(combinationId) : undefined,
        modifierIds:
          Array.isArray(modifierIds) && modifierIds.length > 0
            ? modifierIds.map((id) => Number(id)).filter(Boolean)
            : undefined,
        quantity: 1,
      });
      window.dispatchEvent(new CustomEvent("cart:updated"));
      const id = pid;
      if (id) {
        setRecentlyAddedId(id);
        window.setTimeout(() => setRecentlyAddedId(null), 900);
      }

      // ── Premium fly-to-cart animation ──────────────────────────────────
      try {
        const fromEl = lastAddBtnRef.current;
        const cartEl = document.getElementById("shopsphere-cart-link");
        const imgUrl = product.image_url || product.imageUrl || product.image;

        if (fromEl && cartEl) {
          const fromRect = fromEl.getBoundingClientRect();
          const toRect   = cartEl.getBoundingClientRect();

          const fromX = fromRect.left + fromRect.width  / 2;
          const fromY = fromRect.top  + fromRect.height / 2;
          const toX   = toRect.left   + toRect.width    / 2;
          const toY   = toRect.top    + toRect.height   / 2;

          const dx = toX - fromX;
          const dy = toY - fromY;
          // Arc peak: go up 60px relative to the midpoint
          const peakY = -Math.abs(dy) * 0.38 - 60;

          const DURATION = 720; // ms

          // ── 1. Particle burst ────────────────────────────────────────
          const PARTICLE_COLORS = [
            "#2f7a6f", "#34d399", "#6ee7b7",
            "#fbbf24", "#f59e0b", "#fff",
          ];
          for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * 2 * Math.PI;
            const dist  = 28 + Math.random() * 36;
            const p = document.createElement("div");
            p.className = "shopsphere-particle";
            p.style.cssText = `
              left: ${fromX}px;
              top:  ${fromY}px;
              width:  ${4 + Math.random() * 6}px;
              height: ${4 + Math.random() * 6}px;
              --p-color: ${PARTICLE_COLORS[i % PARTICLE_COLORS.length]};
              --p-tx: ${(Math.cos(angle) * dist).toFixed(1)}px;
              --p-ty: ${(Math.sin(angle) * dist).toFixed(1)}px;
              --p-dur: ${380 + Math.random() * 220}ms;
              --p-ease: cubic-bezier(0.22, 1, 0.36, 1);
              margin-left: -4px;
              margin-top:  -4px;
            `;
            document.body.appendChild(p);
            window.setTimeout(() => p.remove(), 700);
          }

          // ── 2. Flying bubble ────────────────────────────────────────
          const fly = document.createElement("div");
          fly.className   = "shopsphere-fly-to-cart";
          fly.style.cssText = `left: ${fromX}px; top: ${fromY}px;`;

          const inner = document.createElement("div");
          inner.className = "shopsphere-fly-inner";

          if (imgUrl) {
            const img = document.createElement("img");
            img.src = imgUrl;
            img.alt = "";
            img.className = "shopsphere-fly-img";
            inner.appendChild(img);
          } else {
            inner.classList.add("shopsphere-fly-dot");
          }

          fly.appendChild(inner);
          document.body.appendChild(fly);

          // Set CSS custom properties for the arc keyframes
          fly.style.setProperty("--fly-dx",   `${dx}px`);
          fly.style.setProperty("--fly-dy",   `0px`);  // Y handled on inner
          inner.style.setProperty("--fly-dy",   `${dy}px`);
          inner.style.setProperty("--fly-peak", `${peakY}px`);

          // Apply keyframe animations — X on outer (linear), Y+scale on inner (arc)
          fly.style.animation   = `flyArcX ${DURATION}ms cubic-bezier(0.42, 0, 0.58, 1) forwards,
                                    flyFadeOut ${DURATION}ms ease forwards`;
          inner.style.animation = `flyArcY ${DURATION}ms cubic-bezier(0.42, 0, 0.58, 1) forwards`;

          // ── 3. Wiggle the cart icon just before landing ───────────
          window.setTimeout(() => {
            cartEl.classList.add("shopsphere-cart-wiggle");
            const removeWiggle = () => {
              cartEl.classList.remove("shopsphere-cart-wiggle");
              cartEl.removeEventListener("animationend", removeWiggle);
            };
            cartEl.addEventListener("animationend", removeWiggle);
          }, DURATION - 80);

          // ── 4. Cleanup ────────────────────────────────────────────
          window.setTimeout(() => fly.remove(), DURATION + 60);
        }
      } catch {
        // ignore animation failures silently
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
      const pid = toPositiveInt(getAnyProductId(product));
      if (pid) {
        setAddErrorProductId(pid);
        window.setTimeout(() => setAddErrorProductId(null), 800);
      }
    } finally {
      setAddingProductId(null);
    }
  };

  /**
   * Parse the encoded portion_details string from the product list API response.
   * Format: "ppId@@value||price||discountedPrice||stock;;ppId2@@value2||..."
   */
  const parseProdPortionDetails = (product) => {
    const raw = product?.portion_details;
    if (!raw || typeof raw !== "string") return [];
    return raw
      .split(";;")
      .map((seg) => {
        const [idPart, rest] = seg.split("@@");
        if (!idPart || !rest) return null;
        const [portion_value, price, discounted_price, stock] = rest.split("||");
        const product_portion_id = Number(idPart);
        if (!product_portion_id) return null;
        return { product_portion_id, portion_value, price: Number(price), discounted_price: discounted_price ? Number(discounted_price) : null, stock: Number(stock) };
      })
      .filter(Boolean);
  };

  const handleAddToCart = async (product) => {
    if (!currentUser) {
      navigate("/login", { state: { from: "/shop" } });
      return;
    }

    const productId = toPositiveInt(getAnyProductId(product));
    if (!productId) {
      setAddErrorProductId("invalid");
      window.setTimeout(() => setAddErrorProductId(null), 800);
      return;
    }

    // Declared outside try-catch so it's preserved in the catch/finally path
    let targetPortionId = null;

    try {
      setAddingProductId(productId);
      setAddErrorProductId(null);

      // ── 1. Get portions — use pre-loaded data from product list API first ──
      let portions = parseProdPortionDetails(product);

      // Fall back to API only if the product has no embedded portion data
      // (e.g. navigating from a detail page that doesn't include portion_details)
      if (!portions.length && Number(product?.portion_count) > 0) {
        try {
          const portRes = await api.get(`/portion/getProductPortions/${productId}`);
          const raw = portRes.data?.data ?? portRes.data ?? [];
          portions = Array.isArray(raw) ? raw : [];
        } catch {
          portions = [];
        }
      }

      // ── 2. If multiple portions → show picker ──
      if (portions.length > 1) {
        setPickerProduct({ ...product, _portions: portions });
        return; // finally will clear addingProductId
      }

      // ── 3. Determine single portionId (or null for products with no portions) ──
      targetPortionId = portions.length === 1 ? portions[0].product_portion_id : null;

      // ── 4. Check for modifiers/combinations ──
      const hasModifiers = Number(product?.modifier_count) > 0;

      if (hasModifiers) {
        // Product has modifiers — show picker so user can select them
        setPickerProduct({ ...product, _portions: portions });
        return; // finally will clear addingProductId
      }

      // ── 5. No picker needed — add directly ──
      await doAddToCart(product, targetPortionId, null);
    } catch (error) {
      console.error("Error in handleAddToCart:", error);
      await doAddToCart(product, targetPortionId, null);
    } finally {
      setAddingProductId(null);
    }
  };

  const handlePickerConfirm = async (portionId, modifierIds, combinationId) => {
    await doAddToCart(pickerProduct, portionId, combinationId, modifierIds);
    setPickerProduct(null);
  };

  return (
    <div className="category-page">
      {pickerProduct && (
        <PortionPickerModal
          product={pickerProduct}
          onHide={() => setPickerProduct(null)}
          onConfirm={handlePickerConfirm}
        />
      )}
      <div className="container mx-auto px-4 py-8">
        <div className="category-page-layout flex flex-col lg:flex-row gap-8">
          <CategoryFilterSidebar
            isLoading={isTreeLoading}
            categoryTree={categoryTree}
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            priceRange={priceRange}
            minPrice={priceBounds.min}
            maxPrice={priceBounds.max}
            onPriceRangeChange={(nextRange) => {
              hasUserPriceSelectionRef.current = true;
              setPriceRange(nextRange);
            }}
          />

          <div className="category-results flex-1 space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex-1">
                <CategorySearchBar
                  isLoading={isTreeLoading}
                  searchText={searchText}
                  onSearchChange={setSearchText}
                />
              </div>
              <div
                className={`w-full lg:w-64 rounded-xl border px-3 py-2.5 ${
                  darkMode
                    ? "border-[#1f2933] bg-[#151e22]"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div
                  className={`mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                    darkMode ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  Sort
                </div>
                <Dropdown
                  value={sortKey}
                  options={sortOptions}
                  onChange={(e) => setSortKey(e.value)}
                  className="w-full"
                  pt={{
                    root: {
                      className:
                        `w-full !rounded-lg !border !shadow-none ${
                          darkMode
                            ? "!border-[#223038] !bg-[#0f161a] !text-slate-100"
                            : "!border-gray-300 !bg-white !text-gray-800"
                        }`,
                    },
                    label: {
                      className:
                        `text-sm ${darkMode ? "text-slate-100" : "text-gray-800"}`,
                    },
                    trigger: {
                      className: darkMode ? "text-slate-300" : "text-gray-500",
                    },
                    panel: {
                      className:
                        darkMode
                          ? "border border-[#223038] bg-[#0f161a] text-slate-100"
                          : "border border-gray-200 bg-white text-gray-800",
                    },
                    item: {
                      className:
                        `text-sm ${
                          darkMode ? "hover:bg-[#151e22]" : "hover:bg-amber-50"
                        }`,
                    },
                  }}
                />
              </div>
            </div>
            <SelectedFilters
              isLoading={isProductsLoading}
              categoryTags={categoryTags}
              searchText={debouncedSearchText}
              priceTag={priceTag}
              onRemoveCategory={handleRemoveCategoryTag}
              onClearSearch={() => setSearchText("")}
              onClearPrice={handleClearPrice}
            />
            <ProductGrid
              isLoading={isProductsLoading}
              products={products}
              onAddToCart={handleAddToCart}
              recentlyAddedProductId={recentlyAddedId}
              addingProductId={addingProductId}
              addErrorProductId={addErrorProductId}
              paginator={{
                enabled: true,
                first: pager.first,
                rows: pager.rows,
                totalRecords: totalRecords,
                rowsPerPageOptions: [8, 16, 24, 32],
              }}
              onPageChange={(event) =>
                setPager({ first: event.first, rows: event.rows })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryPage;
