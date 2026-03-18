import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BadgePercent,
  Boxes,
  ChevronLeft,
  ChevronRight,
  FileText,
  Heart,
  Minus,
  Plus,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog";
import { Skeleton } from "primereact/skeleton";
import { Toast } from "primereact/toast";
import { useSelector } from "react-redux";
import { useTheme } from "../../context/ThemeContext";
import {
  addCartItem,
  createReview,
  getCart,
  getCategories,
  getModifiersByPortion,
  getModifiersByProduct,
  getProductById,
  getProductImages,
  getProductPortions,
  getRelatedProducts,
  getReviews,
  getReviewSummary,
  getVisibleProductOffers,
  toggleReviewHelpful,
} from "../../../api/productDetailsApi";
import api from "../../../api/api";

const EMPTY_REVIEW_DRAFT = {
  rating: 0,
  title: "",
  review_text: "",
};

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(value || 0)
  );

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getEffectivePrice = (entity) => {
  if (!entity) return 0;
  const discounted = Number(entity.discounted_price);
  const regular = Number(entity.price);
  if (discounted > 0 && discounted < regular) return discounted;
  return regular;
};  

const getSavingsPct = (regular, discounted) => {
  if (!regular || !discounted || discounted >= regular) return 0;
  return Math.round(((regular - discounted) / regular) * 100);
};

const getStockLabel = (stock) => {
  if (stock <= 0) return { label: "Out of Stock", className: "bg-red-100 text-red-700" };
  if (stock <= 5) return { label: "Low Stock", className: "bg-amber-100 text-amber-700" };
  return { label: "In Stock", className: "bg-emerald-100 text-emerald-700" };
};

const metaUpsert = (selector, attributes) => {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement("meta");
    document.head.appendChild(node);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    node.setAttribute(key, value);
  });
};

const renderCompactStars = (ratingValue) => {
  const normalized = Number(ratingValue || 0);
  return Array.from({ length: 5 }).map((_, idx) => (
    <Star
      key={idx}
      className={`h-3.5 w-3.5 ${idx < Math.round(normalized) ? "fill-current" : ""}`}
    />
  ));
};

const formatOfferDate = (value) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatOfferTime = (value) => {
  if (!value) return "All day";
  const [hours = "0", minutes = "0"] = String(value).split(":");
  const parsed = new Date();
  parsed.setHours(Number(hours), Number(minutes), 0, 0);
  return parsed.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const normalizeTextBlocks = (value) =>
  String(value || "")
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

const buildDescriptionParagraphs = (product) => {
  const longBlocks = normalizeTextBlocks(product?.description);
  if (longBlocks.length > 0) return longBlocks;
  const shortBlocks = normalizeTextBlocks(product?.short_description);
  return shortBlocks.length > 0 ? shortBlocks : ["No detailed description available yet."];
};

function ProductDetailsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { currentUser } = useSelector((state) => state.auth);
  const toastRef = useRef(null);
  const ctaAnchorRef = useRef(null);
  const bottomSentinelRef = useRef(null);
  const recentlyViewedRef = useRef(null);
  const relatedProductsRef = useRef(null);
  const touchStartXRef = useRef(0);
  const detailsSectionRefs = useRef({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [portions, setPortions] = useState([]);
  const [selectedPortionId, setSelectedPortionId] = useState(null);
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [rawModifiers, setRawModifiers] = useState([]);
  const [combinations, setCombinations] = useState([]);
  const [selectedCombinationId, setSelectedCombinationId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [reviewLoadingMore, setReviewLoadingMore] = useState(false);
  const [reviewDialogVisible, setReviewDialogVisible] = useState(false);
  const [reviewDraft, setReviewDraft] = useState(EMPTY_REVIEW_DRAFT);
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);
  const [reviewFormError, setReviewFormError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [tapZoom, setTapZoom] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addLoading, setAddLoading] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [wishlistSaved, setWishlistSaved] = useState(false);
  const [quantityInCart, setQuantityInCart] = useState(0);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isBottomVisible, setIsBottomVisible] = useState(false);

  const showToast = useCallback((severity, summaryText, detail) => {
    toastRef.current?.show({ severity, summary: summaryText, detail, life: 3000 });
  }, []);

  const userScopedWishlistKey = useMemo(
    () => `shopsphere_wishlist_${currentUser?.user_id || "guest"}`,
    [currentUser?.user_id]
  );

  const selectedPortion = useMemo(
    () =>
      portions.find((portion) => Number(portion.product_portion_id) === Number(selectedPortionId)) ||
      null,
    [portions, selectedPortionId]
  );

  const selectedCombination = useMemo(
    () => combinations.find(c => c.combination_id === selectedCombinationId) || null,
    [combinations, selectedCombinationId]
  );

  const modifierExtraPrice = useMemo(
    () => Number(selectedCombination?.additional_price || 0),
    [selectedCombination]
  );

  const baseRegularPrice = selectedPortion
    ? Number(selectedPortion.price || 0)
    : Number(product?.price || 0);
  const baseDiscountedPrice = selectedPortion
    ? Number(selectedPortion.discounted_price || 0)
    : Number(product?.discounted_price || 0);
  const effectiveRegularPrice = baseRegularPrice + modifierExtraPrice;
  const effectivePrice = (baseDiscountedPrice > 0 && baseDiscountedPrice < baseRegularPrice
    ? baseDiscountedPrice
    : baseRegularPrice) + modifierExtraPrice;
  const savingsPct = getSavingsPct(effectiveRegularPrice, effectivePrice);
  const effectiveStock = selectedPortion
    ? Number(selectedPortion.stock || 0)
    : Number(product?.stock || 0);
  const stockMeta = getStockLabel(effectiveStock);
  const outOfStock = effectiveStock <= 0 || !product?.is_active;
  const descriptionParagraphs = useMemo(() => buildDescriptionParagraphs(product), [product]);

  const detailSections = useMemo(
    () => [
      { id: "overview", label: "Overview", icon: FileText },
      { id: "variants", label: "Variants", icon: Boxes },
      { id: "customize", label: "Customize", icon: Sparkles },
      { id: "shopping", label: "Shopping Notes", icon: ShieldCheck },
    ],
    []
  );

  const breadcrumbTrail = useMemo(() => {
    if (!product?.category_id || categories.length === 0) return [];
    const byId = new Map(categories.map((item) => [Number(item.category_id), item]));
    const trail = [];
    let pointer = byId.get(Number(product.category_id));
    while (pointer) {
      trail.push(pointer);
      pointer = pointer.parent_id ? byId.get(Number(pointer.parent_id)) : null;
    }
    return trail.reverse();
  }, [categories, product?.category_id]);

  const detailHighlights = useMemo(
    () => [
      {
        label: "Category",
        value:
          breadcrumbTrail[breadcrumbTrail.length - 1]?.category_name ||
          "Uncategorized",
      },
      {
        label: "Availability",
        value: stockMeta.label,
      },
      {
        label: "Configuration",
        value: `${portions.length || 0} variant${portions.length === 1 ? "" : "s"}`,
      },
      {
        label: "Custom Options",
        value: `${combinations.length || 0} variant${combinations.length === 1 ? "" : "s"}`,
      },
      {
        label: "Active Offers",
        value: `${offers.length || 0}`,
      },
    ],
    [breadcrumbTrail, combinations.length, offers.length, portions.length, product?.product_id, stockMeta.label]
  );

  const activeImage = images[activeImageIndex] || images[0] || null;


  const canCreateReview = currentUser?.role === "customer";
  const reviewAverage = Number(summary?.average_rating || 0);
  const reviewCount = Number(summary?.total_reviews || 0);

  const loadReviews = useCallback(
    async (page, append = false) => {
      const data = await getReviews(productId, { page, limit: 5, sort: "newest" });
      setReviews((prev) => (append ? [...prev, ...(data.items || [])] : data.items || []));
      setReviewPage(Number(data.page || page));
      setReviewTotalPages(Number(data.total_pages || 1));
    },
    [productId]
  );

  const refreshReviewData = useCallback(async () => {
    const [summaryData] = await Promise.all([
      getReviewSummary(productId).catch(() => null),
      loadReviews(1, false),
    ]);
    setSummary(summaryData);
  }, [loadReviews, productId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [
        productData,
        imageData,
        portionsData,
        reviewSummaryData,
        offerData,
        categoriesData,
        cartData,
      ] = await Promise.all([
        getProductById(productId),
        getProductImages(productId).catch(() => []),
        getProductPortions(productId).catch(() => []),
        getReviewSummary(productId).catch(() => null),
        getVisibleProductOffers(productId).catch(() => []),
        getCategories().catch(() => []),
        getCart().catch(() => null),
      ]);

      if (!productData) {
        setError("Product not found.");
        return;
      }

      setProduct(productData);
      setImages(imageData?.length ? imageData : []);
      const activePortions = (portionsData || []).filter((item) => Number(item.is_active) === 1);
      setPortions(activePortions);
      const defaultPortion =
        activePortions.find((item) => Number(item.is_default) === 1) || activePortions[0] || null;
      setSelectedPortionId(defaultPortion?.product_portion_id || null);
      setSummary(reviewSummaryData);
      setOffers(offerData || []);
      setCategories(categoriesData || []);

      const cartItems = cartData?.items || [];
      const inCartCount = cartItems
        .filter((item) => Number(item.productId) === Number(productData.product_id))
        .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      setQuantityInCart(inCartCount);

      const wishlistRaw = localStorage.getItem(userScopedWishlistKey);
      const wishlistIds = wishlistRaw ? JSON.parse(wishlistRaw) : [];
      setWishlistSaved(wishlistIds.includes(Number(productData.product_id)));

      await refreshReviewData();

      const recentlyRaw = localStorage.getItem("shopsphere_recently_viewed");
      const recentlyList = recentlyRaw ? JSON.parse(recentlyRaw) : [];
      const currentEntry = {
        product_id: productData.product_id,
        display_name: productData.display_name || productData.name,
        price: Number(productData.price || 0),
        discounted_price: Number(productData.discounted_price || 0),
        average_rating: Number(reviewSummaryData?.average_rating || 0),
        image_url: imageData?.[0]?.image_url || "",
      };

      const nextViewed = [
        currentEntry,
        ...recentlyList.filter((item) => Number(item.product_id) !== Number(productData.product_id)),
      ].slice(0, 10);

      localStorage.setItem("shopsphere_recently_viewed", JSON.stringify(nextViewed));
      setRecentlyViewed(nextViewed.filter((item) => Number(item.product_id) !== Number(productData.product_id)).slice(0, 8));

      if (productData.category_id) {
        const related = await getRelatedProducts({
          categoryId: productData.category_id,
          excludeId: productData.product_id,
          limit: 12,
        }).catch(() => []);
        setRelatedProducts(related || []);
      } else {
        setRelatedProducts([]);
      }
    } catch (loadError) {
      setError(loadError?.response?.data?.message || "Failed to load product details.");
    } finally {
      setLoading(false);
    }
  }, [productId, refreshReviewData, userScopedWishlistKey]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!product) return;
    document.title = `${product.display_name || product.name} | ShopSphere`;
    metaUpsert('meta[name="description"]', {
      name: "description",
      content: product.short_description || product.description || "Shop product details on ShopSphere.",
    });
    if (images[0]?.image_url) {
      metaUpsert('meta[property="og:image"]', {
        property: "og:image",
        content: images[0].image_url,
      });
    }
  }, [product, images]);

  useEffect(() => {
    if (!selectedPortion && !product) return;
    const loadVariantsData = async () => {
      const productId = product?.product_id ?? product?.id;
      if (!productId) return;

      try {
        const comboUrl = selectedPortion
          ? `/modifiers/combinations/by-portion/${selectedPortion.product_portion_id}`
          : `/modifiers/combinations/by-product/${productId}`;
        
        const rawModUrl = selectedPortion
          ? `/modifiers/by-portion/${selectedPortion.product_portion_id}`
          : `/modifiers/by-product/${productId}`;

        const [comboRes, modRes] = await Promise.all([
          api.get(comboUrl),
          api.get(rawModUrl)
        ]);

        let finalCombos = comboRes.data?.data || [];
        let finalMods = modRes.data?.data || [];

        // Fallback: If portion-specific fetch returned nothing, try product-level
        if (selectedPortion && finalCombos.length === 0 && finalMods.length === 0) {
          try {
            const [fbComboRes, fbModRes] = await Promise.all([
              api.get(`/modifiers/combinations/by-product/${productId}`),
              api.get(`/modifiers/by-product/${productId}`)
            ]);
            finalCombos = fbComboRes.data?.data || [];
            finalMods = fbModRes.data?.data || [];
          } catch (err) {
            console.error("Fallback fetch failed:", err);
          }
        }
        
        setCombinations(finalCombos);
        setRawModifiers(finalMods);

        // Auto-select mandatory modifiers by default
        const isOptional = (nm) => {
          const n = nm.toLowerCase();
          return n.includes("warranty") || n.includes("care") || n.includes("protection") || n.includes("installation") || n.includes("gift wrap");
        };

        const defaultSelections = {};
        finalMods.forEach(m => {
          if (!isOptional(m.modifier_name) && !defaultSelections[m.modifier_name]) {
            defaultSelections[m.modifier_name] = m.modifier_id;
          }
        });
        setSelectedModifiers(defaultSelections); 

        // Auto-select the first in-stock combination
        const firstInStock = finalCombos.find(c => Number(c.stock) > 0);
        if (firstInStock) {
          setSelectedCombinationId(firstInStock.combination_id);
        } else if (finalCombos.length > 0) {
          setSelectedCombinationId(finalCombos[0].combination_id);
        } else {
          setSelectedCombinationId(null);
        }
      } catch (err) {
        console.error("Failed to load variants data:", err);
        setCombinations([]);
        setRawModifiers([]);
        setSelectedCombinationId(null);
      }
    };
    loadVariantsData();
  }, [selectedPortion, product]);


  useEffect(() => {
    const anchor = ctaAnchorRef.current;
    if (!anchor) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 0.2 }
    );
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => {
    const sentinel = bottomSentinelRef.current;
    if (!sentinel) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsBottomVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading]);

  const handleToggleWishlist = () => {
    const raw = localStorage.getItem(userScopedWishlistKey);
    const ids = raw ? JSON.parse(raw) : [];
    const id = Number(product.product_id);
    const next = wishlistSaved ? ids.filter((x) => Number(x) !== id) : [...new Set([...ids, id])];
    localStorage.setItem(userScopedWishlistKey, JSON.stringify(next));
    setWishlistSaved(!wishlistSaved);
  };

  const requiredModifierMissing = useMemo(() => {
    let missing = false;
    if (combinations.length > 0 && !selectedCombinationId) missing = true;
    
    // For raw modifiers, check if all mandatory groups have a selection
    // Optional groups include Warranty, Care, Protection, Installation, and Gift Wrap
    const isOptional = (nm) => {
      const n = nm.toLowerCase();
      return n.includes("warranty") || n.includes("care") || n.includes("protection") || n.includes("installation") || n.includes("gift wrap");
    };
    
    const requiredGroups = [...new Set(rawModifiers.map(m => m.modifier_name))].filter(
      name => !isOptional(name)
    );
    if (requiredGroups.some(name => !selectedModifiers[name])) missing = true;

    return missing;
  }, [combinations, selectedCombinationId, rawModifiers, selectedModifiers]);

  const validateSelection = () => {
    if (requiredModifierMissing) {
      showToast("warn", "Required Selection", "Please select all required options.");
      return false;
    }
    if (outOfStock) {
      showToast("warn", "Out of Stock", "This product is currently unavailable.");
      return false;
    }
    return true;
  };

  const performAddToCart = async () => {
    if (!currentUser) {
      showToast("warn", "Login Required", "Please log in to continue.");
      navigate("/login");
      return false;
    }
    if (!validateSelection()) return false;
    const modifierIds = Object.values(selectedModifiers).filter(Boolean);
    await addCartItem({
      productId: Number(product.product_id),
      quantity,
      portionId: selectedPortion ? Number(selectedPortion.product_portion_id) : undefined,
      combinationId: selectedCombinationId,
      modifierIds: modifierIds.length > 0 ? modifierIds : undefined,
    });
    setQuantityInCart((prev) => prev + quantity);
    showToast("success", "Added to Cart", "Product added successfully.");
    return true;
  };

  const handleAddToCart = async () => {
    setAddLoading(true);
    try {
      await performAddToCart();
    } catch (addError) {
      showToast("error", "Add to Cart Failed", addError?.response?.data?.message || "Try again.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleBuyNow = async () => {
    setBuyLoading(true);
    try {
      const added = await performAddToCart();
      if (added) navigate("/checkout");
    } catch (buyError) {
      showToast("error", "Buy Now Failed", buyError?.response?.data?.message || "Try again.");
    } finally {
      setBuyLoading(false);
    }
  };

  const handleShare = async () => {
    const title = product.display_name || product.name;
    const url = window.location.href;
    try {
      showToast("info", "Link Copied", "Product link copied to clipboard.");
      if (navigator.share) {
        await navigator.share({ title, text: product.short_description || title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        showToast("info", "Link Copied", "Product link copied to clipboard.");
      }
    } catch {
      showToast("warn", "Share Cancelled", "Share action was not completed.");
    }
  };

  const handleHelpful = async (reviewId) => {
    if (!currentUser) {
      showToast("warn", "Login Required", "Please log in to vote reviews.");
      navigate("/login");
      return;
    }
    setReviews((prev) =>
      prev.map((item) =>
        item.review_id === reviewId
          ? {
              ...item,
              is_liked_by_me: !item.is_liked_by_me,
              helpful_count: clamp(
                Number(item.helpful_count || 0) + (item.is_liked_by_me ? -1 : 1),
                0,
                999999
              ),
            }
          : item
      )
    );
    try {
      const data = await toggleReviewHelpful(reviewId);
      setReviews((prev) =>
        prev.map((item) =>
          item.review_id === reviewId
            ? { ...item, helpful_count: Number(data?.helpful_count || item.helpful_count) }
            : item
        )
      );
    } catch {
      setReviews((prev) =>
        prev.map((item) =>
          item.review_id === reviewId
            ? {
                ...item,
                is_liked_by_me: !item.is_liked_by_me,
                helpful_count: clamp(
                  Number(item.helpful_count || 0) + (item.is_liked_by_me ? -1 : 1),
                  0,
                  999999
                ),
              }
            : item
        )
      );
      showToast("error", "Action Failed", "Could not update helpful vote.");
    }
  };

  const handleLoadMoreReviews = async () => {
    if (reviewPage >= reviewTotalPages) return;
    setReviewLoadingMore(true);
    try {
      await loadReviews(reviewPage + 1, true);
    } finally {
      setReviewLoadingMore(false);
    }
  };

  const scrollToDetailSection = (sectionId) => {
    detailsSectionRefs.current[sectionId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const resetReviewDialog = useCallback(() => {
    setReviewDialogVisible(false);
    setReviewDraft(EMPTY_REVIEW_DRAFT);
    setReviewFormError("");
    setReviewSubmitLoading(false);
  }, []);

  const openReviewDialog = () => {
    if (!currentUser) {
      showToast("warn", "Login Required", "Please log in to write a review.");
      navigate("/login");
      return;
    }

    if (!canCreateReview) {
      showToast("warn", "Customer Only", "Only customer accounts can submit reviews.");
      return;
    }

    setReviewFormError("");
    setReviewDialogVisible(true);
  };

  const handleReviewFieldChange = (field, value) => {
    setReviewDraft((prev) => ({ ...prev, [field]: value }));
    if (reviewFormError) {
      setReviewFormError("");
    }
  };

  const handleReviewSubmit = async () => {
    const rating = Number(reviewDraft.rating || 0);
    const title = reviewDraft.title.trim();
    const reviewText = reviewDraft.review_text.trim();

    if (rating < 1 || rating > 5) {
      setReviewFormError("Please select a star rating.");
      return;
    }

    if (!title && !reviewText) {
      setReviewFormError("Add a title or review text before submitting.");
      return;
    }

    setReviewSubmitLoading(true);
    setReviewFormError("");

    try {
      await createReview({
        product_id: Number(product.product_id),
        rating,
        title: title || null,
        review_text: reviewText || null,
      });

      await refreshReviewData();
      resetReviewDialog();
      showToast("success", "Review Submitted", "Thanks for sharing your feedback.");
    } catch (submitError) {
      const message =
        submitError?.response?.data?.message ||
        "Could not submit your review right now.";
      setReviewFormError(message);
    } finally {
      setReviewSubmitLoading(false);
    }
  };

  const goToImage = (nextIndex) => {
    const total = images.length;
    if (!total) return;
    const normalized = ((nextIndex % total) + total) % total;
    setActiveImageIndex(normalized);
    setTapZoom(false);
  };

  const scrollRailByCard = (railRef, direction) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.firstElementChild;
    const cardWidth = card ? card.getBoundingClientRect().width : 240;
    rail.scrollBy({
      left: direction * (cardWidth + 12) * 2,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton width="16rem" height="1rem" />
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-[#1f2933] dark:bg-[#151e22]">
            <Skeleton width="100%" height="27rem" className="rounded-xl" />
            <div className="mt-3 flex gap-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton key={idx} width="4.5rem" height="4.5rem" className="rounded-lg" />
              ))}
            </div>
          </Card>
          <Card className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-[#1f2933] dark:bg-[#151e22]">
            <Skeleton width="70%" height="2rem" />
            <Skeleton width="40%" height="1rem" className="mt-3" />
            <Skeleton width="35%" height="2rem" className="mt-4" />
            <Skeleton width="100%" height="8rem" className="mt-4 rounded-xl" />
            <Skeleton width="100%" height="3rem" className="mt-4 rounded-xl" />
          </Card>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <Card className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-8 dark:border-red-700/40 dark:bg-[#151e22]">
        <h1 className="font-serif text-2xl text-gray-900 dark:text-slate-100">Could not load product</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">{error || "Unknown error"}</p>
        <Button
          type="button"
          label="Retry"
          onClick={loadAll}
          className="mt-5 !rounded-xl !bg-amber-600 !px-5 !py-3 !text-white hover:!bg-amber-700"
        />
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Toast ref={toastRef} position="top-right" />
      <Dialog
        visible={Boolean(selectedOffer)}
        onHide={() => setSelectedOffer(null)}
        header={selectedOffer?.offer_name || "Offer Details"}
        draggable={false}
        resizable={false}
        dismissableMask
        className="w-[92vw] max-w-2xl"
        contentClassName={darkMode ? "bg-[#151e22] text-slate-100" : "bg-[#fff8ee] text-gray-900"}
      >
        {selectedOffer && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 p-4 dark:border-amber-600/30 dark:bg-amber-500/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-gray-500 dark:text-slate-400">Offer Code</p>
                  <p className="mt-1 font-accent text-2xl font-semibold text-amber-700">
                    {selectedOffer.offer_name}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-4 dark:border-[#1f2933]">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500 dark:text-slate-400">Discount</p>
                <p className="mt-1 text-sm font-medium">
                  {selectedOffer.discount_type === "percentage"
                    ? `${selectedOffer.discount_value}% off`
                    : `${formatINR(selectedOffer.discount_value)} off`}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 dark:border-[#1f2933]">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500 dark:text-slate-400">Offer Type</p>
                <p className="mt-1 text-sm font-medium">{selectedOffer.offer_type || "General"}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 dark:border-[#1f2933]">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500 dark:text-slate-400">Valid Dates</p>
                <p className="mt-1 text-sm font-medium">
                  {formatOfferDate(selectedOffer.start_date)} to {formatOfferDate(selectedOffer.end_date)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 dark:border-[#1f2933]">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500 dark:text-slate-400">Valid Time</p>
                <p className="mt-1 text-sm font-medium">
                  {selectedOffer.start_time || selectedOffer.end_time
                    ? `${formatOfferTime(selectedOffer.start_time)} to ${formatOfferTime(selectedOffer.end_time)}`
                    : "All day"}
                </p>
              </div>
            </div>

            {selectedOffer.description && (
              <div className="rounded-xl border border-gray-200 p-4 dark:border-[#1f2933]">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500 dark:text-slate-400">Details</p>
                <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">
                  {selectedOffer.description}
                </p>
              </div>
            )}

            {(selectedOffer.min_purchase_amount || selectedOffer.maximum_discount_amount) && (
              <div className="rounded-xl border border-gray-200 p-4 dark:border-[#1f2933]">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500 dark:text-slate-400">Conditions</p>
                <div className="mt-2 space-y-1 text-sm text-gray-700 dark:text-slate-300">
                  {selectedOffer.min_purchase_amount ? (
                    <p>Minimum purchase: {formatINR(selectedOffer.min_purchase_amount)}</p>
                  ) : null}
                  {selectedOffer.maximum_discount_amount ? (
                    <p>Maximum discount: {formatINR(selectedOffer.maximum_discount_amount)}</p>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>
      <Dialog
        visible={reviewDialogVisible}
        onHide={resetReviewDialog}
        draggable={false}
        resizable={false}
        dismissableMask={!reviewSubmitLoading}
        className="w-[94vw] max-w-3xl"
        contentClassName={darkMode ? "bg-[#151e22] text-slate-100" : "bg-[#fff8ee] text-gray-900"}
        header={
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-[#2f7a6f] text-white shadow-lg shadow-amber-500/25">
              <Star className="h-5 w-5 fill-current" />
            </div>
            <div>
              <p className="font-serif text-xl font-semibold">
                Rate & Review
              </p>
              <p className="text-sm font-normal text-gray-500 dark:text-slate-400">
                Share how {product.display_name || product.name} worked for you.
              </p>
            </div>
          </div>
        }
      >
        <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
          <div className="overflow-hidden rounded-[28px] border border-amber-200/70 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.24),_transparent_55%),linear-gradient(145deg,rgba(255,248,238,0.95),rgba(255,237,213,0.72))] p-5 dark:border-amber-600/25 dark:bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.16),_transparent_55%),linear-gradient(145deg,rgba(21,30,34,0.98),rgba(16,23,27,0.92))]">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-700/80 dark:text-amber-300/80">
              Community Snapshot
            </p>
            <div className="mt-4 flex items-end gap-3">
              <span className="font-accent text-5xl font-semibold text-gray-900 dark:text-slate-100">
                {reviewAverage.toFixed(1)}
              </span>
              <div className="pb-1">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`h-4 w-4 ${idx < Math.round(reviewAverage) ? "fill-current" : ""}`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                  Based on {reviewCount} review{reviewCount === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              {[5, 4, 3, 2, 1].map((starCount) => {
                const count = Number(summary?.rating_breakdown?.[starCount]?.count || 0);
                const percentage = Number(summary?.rating_breakdown?.[starCount]?.percentage || 0);
                return (
                  <div key={starCount} className="flex items-center gap-3">
                    <span className="w-7 text-sm font-medium text-gray-700 dark:text-slate-300">
                      {starCount}.0
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-[#2f7a6f]"
                        style={{ width: `${clamp(percentage, 0, 100)}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs text-gray-500 dark:text-slate-400">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 rounded-2xl border border-white/70 bg-white/70 p-4 text-sm text-gray-600 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              Reviews are available for delivered purchases. If you already reviewed this product, the backend will block duplicates.
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-200/80 bg-white/80 p-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.4)] backdrop-blur dark:border-[#1f2933] dark:bg-[#10171b]/90">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">
                Your Rating
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const starValue = idx + 1;
                  const active = starValue <= Number(reviewDraft.rating || 0);
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => handleReviewFieldChange("rating", starValue)}
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
                        active
                          ? "border-amber-400 bg-amber-50 text-amber-500 shadow-[0_12px_30px_-20px_rgba(245,158,11,0.8)] dark:border-amber-400/70 dark:bg-amber-500/10"
                          : "border-gray-200 bg-white text-gray-300 hover:border-amber-300 hover:text-amber-400 dark:border-[#243440] dark:bg-[#151e22] dark:text-slate-500"
                      }`}
                      aria-label={`Rate ${starValue} star${starValue === 1 ? "" : "s"}`}
                      aria-pressed={active}
                    >
                      <Star className={`h-6 w-6 ${active ? "fill-current" : ""}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-slate-100">
                  Review title
                </label>
                <input
                  type="text"
                  value={reviewDraft.title}
                  onChange={(event) => handleReviewFieldChange("title", event.target.value)}
                  maxLength={200}
                  placeholder="Sum up your experience in one line"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#2f7a6f] focus:ring-2 focus:ring-[#2f7a6f]/15 dark:border-[#243440] dark:bg-[#151e22] dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-slate-100">
                  Your review
                </label>
                <textarea
                  value={reviewDraft.review_text}
                  onChange={(event) => handleReviewFieldChange("review_text", event.target.value)}
                  rows={6}
                  placeholder="What stood out about quality, fit, packaging, or delivery?"
                  className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#2f7a6f] focus:ring-2 focus:ring-[#2f7a6f]/15 dark:border-[#243440] dark:bg-[#151e22] dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              {reviewFormError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                  {reviewFormError}
                </div>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-[#1f2933]">
                <p className="max-w-sm text-xs leading-5 text-gray-500 dark:text-slate-400">
                  Your review helps other shoppers and improves product trust on the storefront.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={resetReviewDialog}
                    className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 dark:border-[#243440] dark:text-slate-300 dark:hover:bg-[#151e22]"
                    disabled={reviewSubmitLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReviewSubmit}
                    disabled={reviewSubmitLoading}
                    className="rounded-2xl bg-[#2f7a6f] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_34px_-22px_rgba(47,122,111,0.9)] transition hover:bg-[#26635a] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {reviewSubmitLoading ? "Submitting..." : "Publish Review"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center justify-between gap-3 text-sm"
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 font-medium text-gray-700 transition hover:border-amber-300 hover:text-amber-700 dark:border-[#1f2933] dark:bg-[#151e22] dark:text-slate-300 dark:hover:border-amber-500/40 dark:hover:text-amber-300"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <ol className="flex flex-wrap items-center gap-2 text-gray-500 dark:text-slate-400">
          <li><Link to="/" className="hover:text-amber-600">Home</Link></li>
          {breadcrumbTrail.map((item) => (
            <li key={item.category_id} className="flex items-center gap-2">
              <span>/</span>
              <span>{item.category_name}</span>
            </li>
          ))}
          <li className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
            <span>/</span>
            <span>{product.display_name || product.name}</span>
          </li>
        </ol>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-[#1f2933] dark:bg-[#151e22]">
          <div
            className="relative overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-[#1f2933] dark:bg-[#10171b]"
            onTouchStart={(event) => {
              touchStartXRef.current = event.changedTouches[0]?.clientX || 0;
            }}
            onTouchEnd={(event) => {
              const endX = event.changedTouches[0]?.clientX || 0;
              if (Math.abs(endX - touchStartXRef.current) < 40) return;
              goToImage(activeImageIndex + (endX < touchStartXRef.current ? 1 : -1));
            }}
          >
            {activeImage?.image_url ? (
              <button
                type="button"
                onClick={() => setTapZoom((prev) => !prev)}
                className="group h-[450px] w-full overflow-hidden md:h-[560px]"
                aria-label="Toggle image zoom"
              >
                <img
                  src={activeImage.image_url}
                  alt={product.display_name || product.name}
                  className={`h-full w-full object-contain transition-transform duration-300 ${
                    tapZoom ? "scale-150" : "scale-100 group-hover:scale-125"
                  }`}
                />
              </button>
            ) : (
              <div className="flex h-[450px] items-center justify-center text-gray-500 dark:text-slate-400">
                No image available
              </div>
            )}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goToImage(activeImageIndex - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 shadow"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => goToImage(activeImageIndex + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 shadow"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {(images.length ? images : [{ image_url: "" }]).map((item, index) => (
              <button
                key={item.image_id || `img-${index}`}
                type="button"
                onClick={() => goToImage(index)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border ${
                  index === activeImageIndex
                    ? "border-amber-500"
                    : "border-gray-200 dark:border-[#1f2933]"
                }`}
                aria-label={`View image ${index + 1}`}
              >
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gray-100 dark:bg-[#10171b]" />
                )}
              </button>
            ))}
          </div>
        </Card>

        <Card className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-[#1f2933] dark:bg-[#151e22]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-serif text-3xl text-gray-900 dark:text-slate-100">
                {product.display_name || product.name}
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                {product.short_description || product.description}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`h-4 w-4 ${
                        idx < Math.round(summary?.average_rating || 0)
                          ? "fill-current"
                          : ""
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 dark:text-slate-300">
                  {(summary?.average_rating || 0).toFixed(1)} ({summary?.total_reviews || 0} reviews)
                </span>
              </div>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${stockMeta.className}`}>
              {stockMeta.label}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 dark:border-amber-600/30 dark:bg-amber-500/5">
            <div className="flex flex-wrap items-end gap-3">
              <span className="font-accent text-3xl font-semibold text-gray-900 dark:text-slate-100">
                {formatINR(effectivePrice)}
              </span>
              {effectivePrice < effectiveRegularPrice && (
                <>
                  <span className="text-sm text-gray-500 line-through">{formatINR(effectiveRegularPrice)}</span>
                  <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                    Save {savingsPct}%
                  </span>
                </>
              )}
            </div>
          </div>

          {offers.length > 0 && (
            <div className="mt-5 rounded-xl border border-gray-200 p-4 dark:border-[#1f2933]">
              <h2 className="font-accent text-sm font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-slate-400">
                Offers
              </h2>
              <div className="mt-3 space-y-2">
                {offers.slice(0, 4).map((offer) => (
                  <button
                    key={offer.offer_id}
                    type="button"
                    onClick={() => setSelectedOffer(offer)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-left transition hover:border-amber-300 hover:bg-amber-50 dark:border-[#1f2933] dark:bg-[#10171b] dark:hover:border-amber-500/40 dark:hover:bg-amber-500/5"
                  >
                    <p className="text-sm text-gray-700 dark:text-slate-300">
                      Use code <span className="font-semibold text-amber-700">{offer.offer_name}</span> for{" "}
                      {offer.discount_type === "percentage"
                        ? `${offer.discount_value}% off`
                        : `${formatINR(offer.discount_value)} off`}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                      Tap to view offer details
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {portions.length > 0 && (
            <div className="mt-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-slate-400">
                Portion / Variant
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {portions.map((portion) => {
                  const isSelected =
                    Number(portion.product_portion_id) === Number(selectedPortionId);
                  return (
                    <button
                      key={portion.product_portion_id}
                      type="button"
                      onClick={() => setSelectedPortionId(portion.product_portion_id)}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        isSelected
                          ? "border-amber-500 bg-amber-50 text-amber-800"
                          : "border-gray-200 text-gray-700 dark:border-[#1f2933] dark:text-slate-300"
                      }`}
                      aria-pressed={isSelected}
                    >
                      {portion.portion_value} {formatINR(getEffectivePrice(portion))}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {combinations.length > 0 && (
            <div className="mt-5 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-slate-400">
                Choose Variant
              </h3>
              <div className="flex flex-col gap-2">
                {combinations.map((combo) => {
                  const isSelected = selectedCombinationId === combo.combination_id;
                  const inStock = Number(combo.stock) > 0;
                  return (
                    <button
                      key={combo.combination_id}
                      type="button"
                      disabled={!inStock}
                      onClick={() => inStock && setSelectedCombinationId(combo.combination_id)}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                        isSelected
                          ? "border-amber-500 bg-amber-50 text-amber-800 shadow-sm"
                          : inStock 
                          ? "border-gray-200 text-gray-700 bg-white hover:border-amber-300 dark:border-[#1f2933] dark:bg-[#151e22] dark:text-slate-300"
                          : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed dark:border-transparent dark:bg-white/5"
                      }`}
                      aria-pressed={isSelected}
                    >
                      <div>
                        <p className="font-semibold">{combo.name}</p>
                        <p className="text-[10px] uppercase tracking-wider text-gray-500">
                          {inStock ? `${combo.stock} available` : "Out of Stock"}
                        </p>
                      </div>
                      <div className="text-right">
                        {Number(combo.additional_price || 0) > 0 && (
                          <p className="text-xs font-bold text-green-600 dark:text-green-400">
                            +{formatINR(combo.additional_price)}
                          </p>
                        )}
                        {isSelected && <Sparkles className="h-4 w-4 text-amber-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {rawModifiers.length > 0 && (
            <div className="mt-5 space-y-5">
              {(() => {
                const groups = {};
                rawModifiers.forEach(m => {
                  if (!groups[m.modifier_name]) groups[m.modifier_name] = [];
                  groups[m.modifier_name].push(m);
                });
                return Object.entries(groups).map(([name, mods]) => (
                  <div key={name}>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-slate-400">
                      {name}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {mods.map(m => {
                        const isSelected = selectedModifiers[name] === m.modifier_id;
                        return (
                          <button
                            key={m.modifier_id}
                            type="button"
                            onClick={() => {
                              setSelectedModifiers(prev => {
                                if (prev[name] === m.modifier_id) {
                                  const next = { ...prev };
                                  delete next[name];
                                  return next;
                                }
                                return { ...prev, [name]: m.modifier_id };
                              });
                            }}

                            className={`rounded-lg border px-3 py-2 text-sm transition ${
                              isSelected
                                ? "border-amber-500 bg-amber-50 text-amber-800"
                                : "border-gray-200 text-gray-700 dark:border-[#1f2933] dark:text-slate-300"
                            }`}
                          >
                            {m.modifier_value}
                            {Number(m.additional_price || 0) > 0 && (
                              <span className="ml-1 text-xs opacity-60">(+{formatINR(m.additional_price)})</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}

          <div ref={ctaAnchorRef} className="mt-6 rounded-xl border border-gray-200 p-4 dark:border-[#1f2933]">
            {quantityInCart > 0 && (
              <p className="mb-2 text-xs font-medium text-emerald-700">
                {quantityInCart} already in cart
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-lg border border-gray-200 dark:border-[#1f2933]">
                <button
                  type="button"
                  className="px-3 py-2 text-gray-700 dark:text-slate-300"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-10 px-2 text-center text-sm">{quantity}</span>
                <button
                  type="button"
                  className="px-3 py-2 text-gray-700 dark:text-slate-300"
                  onClick={() => setQuantity((prev) => Math.min(99, prev + 1))}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button
                type="button"
                onClick={handleAddToCart}
                disabled={outOfStock || addLoading}
                label={addLoading ? "Adding..." : "Add to Cart"}
                className="!rounded-xl !bg-amber-600 !px-5 !py-3 !text-white hover:!bg-amber-700"
              />
              <Button
                type="button"
                onClick={handleBuyNow}
                disabled={outOfStock || buyLoading}
                label={buyLoading ? "Processing..." : "Buy Now"}
                className="!rounded-xl !bg-[#163332] !px-5 !py-3 !text-white hover:!bg-[#102a29]"
              />
              <button
                type="button"
                onClick={handleToggleWishlist}
                className={`rounded-xl border px-4 py-3 text-sm ${
                  wishlistSaved
                    ? "border-red-300 bg-red-50 text-red-700"
                    : "border-gray-200 text-gray-700 dark:border-[#1f2933] dark:text-slate-300"
                }`}
                aria-label={wishlistSaved ? "Remove from wishlist" : "Save to wishlist"}
              >
                <Heart className={`mr-1 inline h-4 w-4 ${wishlistSaved ? "fill-current" : ""}`} />
                {wishlistSaved ? "Saved" : "Save"}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 dark:border-[#1f2933] dark:text-slate-300"
                aria-label="Share product"
              >
                <Share2 className="mr-1 inline h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-[#1f2933] dark:bg-[#151e22]">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-[28px] border border-amber-200/70 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_58%),linear-gradient(145deg,rgba(255,248,238,0.96),rgba(255,237,213,0.86))] p-5 dark:border-amber-600/25 dark:bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.12),_transparent_55%),linear-gradient(145deg,rgba(21,30,34,0.98),rgba(16,23,27,0.92))]">
              <p className="text-xs uppercase tracking-[0.24em] text-amber-700/80 dark:text-amber-300/80">
                Product Details
              </p>
              <h2 className="mt-3 font-serif text-2xl text-gray-900 dark:text-slate-100">
                Everything in one place
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-slate-300">
                Scan the essentials, compare available configurations, and review purchase notes without leaving the PDP.
              </p>
              <div className="mt-5 space-y-2">
                {detailSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => scrollToDetailSection(section.id)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-left text-sm font-medium text-gray-800 transition hover:-translate-y-0.5 hover:border-amber-300 hover:text-amber-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:border-amber-500/40 dark:hover:text-amber-300"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-[#2f7a6f] text-white shadow-lg shadow-amber-500/15">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{section.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="space-y-5">
            <section
              ref={(node) => {
                detailsSectionRefs.current.overview = node;
              }}
              className="rounded-[28px] border border-gray-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(248,250,252,0.9))] p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)] dark:border-[#1f2933] dark:bg-[linear-gradient(145deg,rgba(16,23,27,0.98),rgba(21,30,34,0.94))]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                    <FileText className="h-3.5 w-3.5" />
                    Overview
                  </div>
                  <h3 className="mt-4 font-serif text-2xl text-gray-900 dark:text-slate-100">
                    {product.display_name || product.name}
                  </h3>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600 dark:text-slate-300">
                    {product.short_description || "A closer look at this product, its setup options, and purchase-ready information."}
                  </p>
                </div>
                <div className={`rounded-full px-3 py-1.5 text-xs font-semibold ${stockMeta.className}`}>
                  {stockMeta.label}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {detailHighlights.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 dark:border-[#243440] dark:bg-[#151e22]/85"
                  >
                    <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-3xl border border-gray-200/80 bg-white/70 p-5 dark:border-[#243440] dark:bg-[#10171b]/80">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">
                  Full Description
                </p>
                <div className="mt-3 space-y-4 text-sm leading-7 text-gray-700 dark:text-slate-300">
                  {descriptionParagraphs.map((paragraph, index) => (
                    <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </section>

            <section
              ref={(node) => {
                detailsSectionRefs.current.variants = node;
              }}
              className="rounded-[28px] border border-gray-200/80 bg-white/90 p-5 dark:border-[#1f2933] dark:bg-[#10171b]/90"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <Boxes className="h-3.5 w-3.5" />
                    Variants
                  </div>
                  <h3 className="mt-4 font-serif text-2xl text-gray-900 dark:text-slate-100">
                    Sizes, packs, and price points
                  </h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {portions.length > 0 ? `${portions.length} configuration options available` : "Standard single configuration"}
                </p>
              </div>

              {portions.length > 0 ? (
                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  {portions.map((portion) => {
                    const isSelected =
                      Number(portion.product_portion_id) === Number(selectedPortionId);
                    const portionPrice = getEffectivePrice(portion);
                    const portionStock = getStockLabel(Number(portion.stock || 0));
                    return (
                      <button
                        key={portion.product_portion_id}
                        type="button"
                        onClick={() => setSelectedPortionId(portion.product_portion_id)}
                        className={`rounded-[24px] border p-4 text-left transition ${
                          isSelected
                            ? "border-amber-400 bg-amber-50 shadow-[0_18px_40px_-30px_rgba(245,158,11,0.8)] dark:border-amber-400/70 dark:bg-amber-500/10"
                            : "border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/60 dark:border-[#243440] dark:bg-[#151e22] dark:hover:border-amber-500/30 dark:hover:bg-[#151e22]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-base font-semibold text-gray-900 dark:text-slate-100">
                              {portion.portion_value}
                            </p>
                            <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                              {portion.portion_description || "Configured variant ready to purchase."}
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${portionStock.className}`}>
                            {portionStock.label}
                          </span>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <span className="font-accent text-2xl font-semibold text-gray-900 dark:text-slate-100">
                            {formatINR(portionPrice)}
                          </span>
                          {Number(portion.discounted_price || 0) > 0 &&
                          Number(portion.discounted_price || 0) < Number(portion.price || 0) ? (
                            <span className="text-sm text-gray-500 line-through">
                              {formatINR(portion.price)}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-[24px] border border-dashed border-gray-300 px-5 py-6 text-sm text-gray-600 dark:border-[#243440] dark:text-slate-300">
                  This product currently ships in a standard configuration. Use the purchase panel above to select quantity.
                </div>
              )}
            </section>

            <section
              ref={(node) => {
                detailsSectionRefs.current.customize = node;
              }}
              className="rounded-[28px] border border-gray-200/80 bg-white/90 p-5 dark:border-[#1f2933] dark:bg-[#10171b]/90"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
                <Sparkles className="h-3.5 w-3.5" />
                Customization
              </div>
              <h3 className="mt-4 font-serif text-2xl text-gray-900 dark:text-slate-100">
                Option groups and add-ons
              </h3>

              {combinations.length > 0 ? (
                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  {combinations.map((combo) => {
                    const isSelected = selectedCombinationId === combo.combination_id;
                    const inStock = Number(combo.stock) > 0;
                    
                    return (
                      <button
                        key={combo.combination_id}
                        type="button"
                        disabled={!inStock}
                        onClick={() => inStock && setSelectedCombinationId(combo.combination_id)}
                        className={`group relative flex flex-col items-start rounded-[24px] border p-5 text-left transition-all hover:shadow-lg ${
                          isSelected
                            ? "border-amber-400 bg-amber-50/50 shadow-md ring-1 ring-amber-400/20 dark:border-amber-400/70 dark:bg-amber-500/5"
                            : inStock
                              ? "border-gray-200 bg-white/80 hover:border-amber-300 dark:border-[#243440] dark:bg-[#151e22]/85 dark:hover:border-amber-500/30"
                              : "border-gray-100 bg-gray-50/50 opacity-60 cursor-not-allowed dark:border-[#243440] dark:bg-[#10171b]/50"
                        }`}
                      >
                        <div className="flex w-full items-center justify-between gap-3">
                          <p className={`text-lg font-bold ${
                            isSelected ? "text-amber-700 dark:text-amber-400" : "text-gray-900 dark:text-slate-100"
                          }`}>
                            {combo.name}
                          </p>
                          {isSelected && <Sparkles className="h-5 w-5 text-amber-500" />}
                        </div>
                        
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {(combo.modifiers || []).map((m) => (
                            <span 
                              key={m.modifier_id}
                              className="rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:bg-[#1c2a33] dark:text-slate-400"
                            >
                              {m.modifier_value}
                            </span>
                          ))}
                        </div>

                        <div className="mt-4 flex w-full items-end justify-between gap-3 pt-3 border-t border-gray-100 dark:border-[#1f2933]">
                          <div>
                            <span className={`text-xs font-semibold ${inStock ? "text-gray-500 dark:text-slate-400" : "text-red-500"}`}>
                              {inStock ? `${combo.stock} In Stock` : "Out of Stock"}
                            </span>
                          </div>
                          {Number(combo.additional_price || 0) > 0 && (
                            <div className="text-right">
                              <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-0.5">Additional</span>
                              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                +{formatINR(combo.additional_price)}
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-[24px] border border-dashed border-gray-300 px-5 py-6 text-sm text-gray-600 dark:border-[#243440] dark:text-slate-300">
                  No variant combinations are configured for this item right now.
                </div>
              )}
            </section>

            <section
              ref={(node) => {
                detailsSectionRefs.current.shopping = node;
              }}
              className="rounded-[28px] border border-gray-200/80 bg-white/90 p-5 dark:border-[#1f2933] dark:bg-[#10171b]/90"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Shopping Notes
                  </div>
                  <h3 className="mt-4 font-serif text-2xl text-gray-900 dark:text-slate-100">
                    Purchase-ready information
                  </h3>
                </div>
                {offers.length > 0 ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                    <BadgePercent className="h-3.5 w-3.5" />
                    {offers.length} active offer{offers.length === 1 ? "" : "s"}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[24px] border border-gray-200 bg-white/80 p-4 dark:border-[#243440] dark:bg-[#151e22]/85">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">
                    Pricing Snapshot
                  </p>
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <span className="font-accent text-3xl font-semibold text-gray-900 dark:text-slate-100">
                      {formatINR(effectivePrice)}
                    </span>
                    {effectivePrice < effectiveRegularPrice ? (
                      <>
                        <span className="text-sm text-gray-500 line-through">
                          {formatINR(effectiveRegularPrice)}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                          Save {savingsPct}%
                        </span>
                      </>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm text-gray-600 dark:text-slate-300">
                    Price updates automatically when you switch portions or add paid modifiers above.
                  </p>
                </div>

                <div className="rounded-[24px] border border-gray-200 bg-white/80 p-4 dark:border-[#243440] dark:bg-[#151e22]/85">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400">
                    What to know
                  </p>
                  <ul className="mt-3 space-y-3 text-sm text-gray-700 dark:text-slate-300">
                    <li className="flex gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[#2f7a6f]" />
                      <span>Current category path: {breadcrumbTrail.map((item) => item.category_name).join(" / ") || "General catalog"}.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                      <span>{outOfStock ? "This item is currently unavailable for checkout." : "This item is available for cart and checkout flows."}</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-violet-500" />
                      <span>Use the review section below to inspect shopper feedback and leave your own rating after purchase.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-[#1f2933] dark:bg-[#151e22]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-gray-900 dark:text-slate-100">Ratings & Reviews</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
              Honest feedback from verified shoppers and community members.
            </p>
          </div>
          <button
            type="button"
            onClick={openReviewDialog}
            className="group overflow-hidden rounded-[22px] border border-amber-200 bg-[linear-gradient(135deg,rgba(255,251,235,0.98),rgba(255,237,213,0.95))] px-4 py-3 text-left shadow-[0_16px_36px_-28px_rgba(245,158,11,0.75)] transition hover:-translate-y-0.5 hover:border-amber-300 dark:border-amber-500/30 dark:bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(47,122,111,0.14))]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-[#2f7a6f] text-white shadow-lg shadow-amber-500/20">
                <Star className="h-5 w-5 fill-current" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                  Rate this product
                </p>
                <p className="text-xs text-gray-600 dark:text-slate-300">
                  {currentUser
                    ? canCreateReview
                      ? "Open the review studio"
                      : "Customer account required"
                    : "Login to share feedback"}
                </p>
              </div>
            </div>
          </button>
        </div>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600 dark:text-slate-300">No reviews yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {reviews.map((review) => (
              <article
                key={review.review_id}
                className="rounded-xl border border-gray-200 p-4 dark:border-[#1f2933]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-100">{review.reviewer_name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className={`h-4 w-4 ${idx < Number(review.rating) ? "fill-current" : ""}`} />
                    ))}
                  </div>
                </div>
                {review.title && (
                  <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-slate-100">{review.title}</p>
                )}
                <p className="mt-1 text-sm text-gray-700 dark:text-slate-300">{review.review_text}</p>
                <button
                  type="button"
                  onClick={() => handleHelpful(review.review_id)}
                  className={`mt-3 rounded-lg border px-3 py-1.5 text-xs ${
                    review.is_liked_by_me
                      ? "border-amber-300 bg-amber-50 text-amber-700"
                      : "border-gray-200 text-gray-600 dark:border-[#1f2933] dark:text-slate-300"
                  }`}
                  aria-pressed={Boolean(review.is_liked_by_me)}
                >
                  Helpful ({review.helpful_count || 0})
                </button>
              </article>
            ))}
            {reviewPage < reviewTotalPages && (
              <Button
                type="button"
                onClick={handleLoadMoreReviews}
                disabled={reviewLoadingMore}
                label={reviewLoadingMore ? "Loading..." : "Load More Reviews"}
                className="!rounded-xl !border !border-gray-200 !bg-transparent !text-gray-700 dark:!border-[#1f2933] dark:!text-slate-300"
              />
            )}
          </div>
        )}
      </Card>

      {recentlyViewed.length > 0 && (
        <Card className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-[#1f2933] dark:bg-[#151e22]">
          <h2 className="font-serif text-2xl text-gray-900 dark:text-slate-100">Recently Viewed</h2>
          <div className="relative mt-4">
            <button
              type="button"
              onClick={() => scrollRailByCard(recentlyViewedRef, -1)}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-gray-200 bg-white/95 p-2 text-gray-700 shadow-sm transition hover:border-amber-300 hover:text-amber-700 dark:border-[#1f2933] dark:bg-[#151e22]/95 dark:text-slate-300"
              aria-label="Scroll recently viewed left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollRailByCard(recentlyViewedRef, 1)}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-gray-200 bg-white/95 p-2 text-gray-700 shadow-sm transition hover:border-amber-300 hover:text-amber-700 dark:border-[#1f2933] dark:bg-[#151e22]/95 dark:text-slate-300"
              aria-label="Scroll recently viewed right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div
              ref={recentlyViewedRef}
              className="flex gap-3 overflow-x-auto px-10 pb-2 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {recentlyViewed.map((item) => (
                (() => {
                  const regularPrice = Number(item.price || 0);
                  const discountedPrice = Number(item.discounted_price || regularPrice);
                  const effectiveCardPrice =
                    discountedPrice > 0 && discountedPrice < regularPrice
                      ? discountedPrice
                      : regularPrice;
                  const cardSavingsPct = getSavingsPct(regularPrice, effectiveCardPrice);
                  const cardRating = Number(item.average_rating || item.rating || 0);

                  return (
                    <Link
                      key={`recent-${item.product_id}`}
                      to={`/products/${item.product_id}`}
                      className="w-56 shrink-0 rounded-xl border border-gray-200 p-3 dark:border-[#1f2933]"
                    >
                      <div className="h-64 w-45 overflow-hidden rounded-lg bg-gray-100 dark:bg-[#10171b]">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.display_name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-medium text-gray-900 dark:text-slate-100">{item.display_name}</p>
                      <div className="mt-2 flex items-center gap-1 text-amber-500">
                        <div className="flex items-center gap-0.5">
                          {cardRating ? renderCompactStars(cardRating) : null}
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
                          {cardRating ? cardRating.toFixed(1) : null}
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-semibold text-amber-700">{formatINR(effectiveCardPrice)}</p>
                        {effectiveCardPrice < regularPrice && (
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-gray-500 line-through">{formatINR(regularPrice)}</span>
                            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                              Save {cardSavingsPct}%
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })()
              ))}
            </div>
          </div>
        </Card>
      )}

      {relatedProducts.length > 0 && (
        <Card className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-[#1f2933] dark:bg-[#151e22]">
          <h2 className="font-serif text-2xl text-gray-900 dark:text-slate-100">You May Also Like</h2>
          <div className="relative mt-4">
            <button
              type="button"
              onClick={() => scrollRailByCard(relatedProductsRef, -1)}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-gray-200 bg-white/95 p-2 text-gray-700 shadow-sm transition hover:border-amber-300 hover:text-amber-700 dark:border-[#1f2933] dark:bg-[#151e22]/95 dark:text-slate-300"
              aria-label="Scroll related products left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollRailByCard(relatedProductsRef, 1)}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-gray-200 bg-white/95 p-2 text-gray-700 shadow-sm transition hover:border-amber-300 hover:text-amber-700 dark:border-[#1f2933] dark:bg-[#151e22]/95 dark:text-slate-300"
              aria-label="Scroll related products right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div
              ref={relatedProductsRef}
              className="flex gap-3 overflow-x-auto px-10 pb-2 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {relatedProducts.map((item) => (
                (() => {
                  const regularPrice = Number(item.price || 0);
                  const discountedPrice = Number(item.discounted_price || regularPrice);
                  const effectiveCardPrice =
                    discountedPrice > 0 && discountedPrice < regularPrice
                      ? discountedPrice
                      : regularPrice;
                  const cardSavingsPct = getSavingsPct(regularPrice, effectiveCardPrice);
                  const cardRating = Number(item.average_rating || item.rating || 0);

                  return (
                    <Link
                      key={item.product_id}
                      to={`/products/${item.product_id}`}
                      className="w-56 shrink-0 rounded-xl border border-gray-200 p-3 dark:border-[#1f2933]"
                    >
                      <div className="h-64 w-45 overflow-hidden rounded-lg bg-gray-100 dark:bg-[#10171b]">
                        {(item.image_url || "").length > 0 && (
                          <img src={item.image_url} alt={item.display_name || item.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-medium text-gray-900 dark:text-slate-100">
                        {item.display_name || item.name}
                      </p>
                      <div className="mt-2 flex items-center gap-1 text-amber-500">
                        <div className="flex items-center gap-0.5">
                          {renderCompactStars(cardRating)}
                          
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
                          {cardRating ? cardRating.toFixed(1) : "New"}
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-semibold text-amber-700">{formatINR(effectiveCardPrice)}</p>
                        {effectiveCardPrice < regularPrice && (
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-gray-500 line-through">{formatINR(regularPrice)}</span>
                            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                              Save {cardSavingsPct}%
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })()
              ))}
            </div>
          </div>
        </Card>
      )}

      <div ref={bottomSentinelRef} className="h-1 w-full" aria-hidden="true" />

      {showStickyBar && !isBottomVisible && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-30 border-t px-4 py-3 shadow-lg ${
            darkMode ? "border-[#1f2933] bg-[#151e22]/95" : "border-amber-200 bg-[#fff8ee]/95"
          }`}
        >
          <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 md:px-8 lg:px-12">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-gray-500 dark:text-slate-400">Price</p>
              <p className="font-accent text-xl font-semibold">{formatINR(effectivePrice)}</p>
            </div>
            <Button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock || addLoading}
              label={addLoading ? "Adding..." : "Add to Cart"}
              className="!rounded-xl !bg-amber-600 !px-5 !py-3 !text-white hover:!bg-amber-700"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetailsPage;
