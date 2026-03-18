import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import { EmptyCart } from "../../components/cart/EmptyCart";
import { CartItemSkeleton } from "../../components/cart/CartItemSkeleton";
import { ArrowRight } from "lucide-react";
import api from "../../../api/api";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
];

function CartPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.auth);

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [applyingOffer, setApplyingOffer] = useState(false);
  const [offerCode, setOfferCode] = useState("");
  const [applicableOffers, setApplicableOffers] = useState([]);
  const [pulseCartItemId, setPulseCartItemId] = useState(null);

  // Available offers display
  const [showOffers, setShowOffers] = useState(false);

  const formatINR = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Fetch cart from backend
  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get("/cart");
      // Backend returns { success, message, data: { cartId, items, subtotal, ... } }
      setCart(response.data.data);

      // Fetch applicable offers
      const offersRes = await api.get("/cart/offers");
      // Backend returns { success, message, data: { cartOffers: [...], productOffers: [...] } }
      const offersData = offersRes.data.data || {};
      // Combine cart and product offers, adding type field for filtering
      const cartOffersWithType = (offersData.cartOffers || []).map((o) => ({
        ...o,
        type: "cart",
      }));
      const productOffersWithType = (offersData.productOffers || []).map(
        (o) => ({ ...o, type: "product" }),
      );
      setApplicableOffers([...cartOffersWithType, ...productOffersWithType]);
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchCart();
    } else {
      setLoading(false);
      setCart(null);
    }
  }, [currentUser]);

  // Update item quantity
  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;

    setUpdatingItem(cartItemId);

    try {
      const response = await api.patch(`/cart/items/${cartItemId}`, {
        quantity: newQuantity,
      });
      setCart(response.data.data);
      window.dispatchEvent(new CustomEvent("cart:updated"));
      setPulseCartItemId(cartItemId);
      window.setTimeout(() => setPulseCartItemId(null), 650);
    } catch (error) {
      console.error("Error updating quantity:", error);
    } finally {
      setUpdatingItem(null);
    }
  };

  // Remove item from cart
  const removeItem = (cartItemId, productName) => {
    confirmDialog({
      message: `Are you sure you want to remove "${productName}" from your cart?`,
      header: "Remove Item",
      icon: "pi pi-exclamation-triangle",
      acceptClassName:
        "!bg-red-500 !border-red-500 !text-white hover:!bg-red-600 !px-4 !py-2 !rounded-lg",
      rejectClassName:
        "!bg-transparent !border-gray-300 !text-gray-700 hover:!bg-gray-100 dark:!text-gray-300 dark:hover:!bg-gray-800 !px-4 !py-2 !rounded-lg",
      accept: async () => {
        try {
          const response = await api.delete(`/cart/items/${cartItemId}`);
          setCart(response.data.data);
          window.dispatchEvent(new CustomEvent("cart:updated"));
        } catch (error) {
          console.error("Error removing item:", error);
        }
      },
    });
  };

  // Clear all items from cart
  const clearCart = () => {
    confirmDialog({
      message: "Remove all items from your cart?",
      header: "Clear Cart",
      icon: "pi pi-exclamation-triangle",
      acceptClassName:
        "!bg-red-500 !border-red-500 !text-white hover:!bg-red-600 !px-4 !py-2 !rounded-lg",
      rejectClassName:
        "!bg-transparent !border-gray-300 !text-gray-700 hover:!bg-gray-100 dark:!text-gray-300 dark:hover:!bg-gray-800 !px-4 !py-2 !rounded-lg",
      accept: async () => {
        try {
          const response = await api.delete("/cart/items");
          setCart(response.data.data);
          window.dispatchEvent(new CustomEvent("cart:updated"));
        } catch (error) {
          console.error("Error clearing cart:", error);
        }
      },
    });
  };

  // Apply cart-level offer
  const applyOffer = async () => {
    if (!offerCode.trim()) return;

    setApplyingOffer(true);

    try {
      // Find offer by code from applicable offers
      const offer = applicableOffers.find(
        (o) =>
          o.offer_name?.toLowerCase() === offerCode.toLowerCase() ||
          o.offer_id?.toString() === offerCode,
      );

      if (!offer) {
        setApplyingOffer(false);
        return;
      }

      // Check if it's a product offer or cart offer
      if (offer.type === "product") {
        // Find the cart item for this product
        const cartItem = cart.items.find(
          (item) => item.productId === offer.product_id,
        );
        if (!cartItem) {
          setApplyingOffer(false);
          return;
        }

        // Apply product-specific offer
        const response = await api.post(
          `/cart/items/${cartItem.cartItemId}/offer`,
          { offer_id: offer.offer_id },
        );
        setCart(response.data.data);
      } else {
        // Apply cart-level offer
        const response = await api.post("/cart/offer", {
          offer_id: offer.offer_id,
        });
        setCart(response.data.data);
      }

      setOfferCode("");
    } catch (error) {
      console.error("Error applying offer:", error);
    } finally {
      setApplyingOffer(false);
    }
  };

  // Apply product-specific offer to a cart item
  const applyProductOffer = async (offer) => {
    if (!cart) return;

    // Find the cart item for this product
    const cartItem = cart.items.find(
      (item) => item.productId === offer.product_id,
    );
    if (!cartItem) {
      return;
    }

    // Check if item already has an offer applied
    if (cartItem.appliedOffer) {
      return;
    }

    try {
      const response = await api.post(
        `/cart/items/${cartItem.cartItemId}/offer`,
        { offer_id: offer.offer_id },
      );
      setCart(response.data.data);
    } catch (error) {
      console.error("Error applying product offer:", error);
    }
  };

  // Remove offer from a cart item
  const removeItemOffer = async (cartItemId, offerName) => {
    try {
      const response = await api.delete(`/cart/items/${cartItemId}/offer`);
      setCart(response.data.data);
    } catch (error) {
      console.error("Error removing item offer:", error);
    }
  };

  // Remove applied offer
  const removeOffer = async () => {
    try {
      const response = await api.delete("/cart/offer");
      setCart(response.data.data);
    } catch (error) {
      console.error("Error removing offer:", error);
    }
  };

  // Calculate savings from item discounts
  const calculateSavings = () => {
    if (!cart) return 0;
    return (
      cart.items?.reduce((total, item) => {
        if (item.appliedOffer?.discount_amount) {
          return total + item.appliedOffer.discount_amount;
        }
        return total;
      }, 0) || 0
    );
  };

  // Proceed to checkout - navigate to address selection step
  const proceedToCheckout = () => {
    if (!currentUser) {
      navigate("/login", { state: { from: "/cart" } });
      return;
    }

    if (!cart?.items?.length) {
      return;
    }

    navigate("/checkout/address");
  };

  // Continue shopping
  const continueShopping = () => {
    navigate("/");
  };

  // Get product-specific offers for items in cart
  const getAvailableProductOffers = () => {
    if (!cart || !applicableOffers.length) return [];

    // Get offers that are type='product' and match products in cart
    return applicableOffers.filter((offer) => {
      if (offer.type !== "product") return false;

      // Find the cart item this offer applies to
      const matchingItem = cart.items.find(
        (item) => item.productId === offer.product_id,
      );

      // Only show if:
      // 1. The product is in the cart
      // 2. The offer doesn't already have an applied offer on that item
      return matchingItem && !matchingItem.appliedOffer;
    });
  };

  // Get cart-level offers
  const getCartOffers = () => {
    if (!applicableOffers.length) return [];
    return applicableOffers.filter((offer) => offer.type === "cart");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff8ee] dark:bg-[#0b151b]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Skeleton
              width="200px"
              height="40px"
              className="bg-gray-200 dark:bg-[#243440]"
            />
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <CartItemSkeleton key={i} />
              ))}
            </div>
            <div className="lg:col-span-1">
              <Skeleton
                height="400px"
                borderRadius="16px"
                className="bg-gray-200 dark:bg-[#243440]"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (!cart?.items?.length) {
    return (
      <div className="min-h-screen bg-[#fff8ee] dark:bg-[#0b151b]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <EmptyCart onContinueShopping={continueShopping} />
        </div>
      </div>
    );
  }

  const savings = calculateSavings();
  const hasOffer = cart.appliedCartOffer;

  return (
    <div className="min-h-screen bg-[#fff8ee] dark:bg-[#0b151b]">
      <ConfirmDialog
        className="cart-confirm-dialog"
        contentClassName="dark:bg-[#151e22]"
        breakpoints={{ "960px": "75vw", "640px": "90vw" }}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex mb-4 text-sm text-gray-500 dark:text-slate-400">
            <Link to="/" className="hover:text-[#2f7a6f] transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 dark:text-slate-100">
              Shopping Cart
            </span>
          </nav>
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-gray-900 dark:text-slate-100">
              Shopping Cart ({cart.items.length}{" "}
              {cart.items.length === 1 ? "item" : "items"})
            </h1>
            {cart.items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>

        {/* Mobile Order Summary Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#151e22] border-t border-[#e8dccf] dark:border-[#243440] p-4 z-40 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Total Amount
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-slate-100">
                ₹{formatINR(cart.total)}
              </p>
            </div>
            <Button
              label={
                <span className="flex items-center gap-2">
                  <span>{currentUser ? "Checkout" : "Login"}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </span>
              }
              onClick={proceedToCheckout}
              className="!px-6 !py-3 !bg-[#2f7a6f] !text-white !rounded-xl hover:!bg-[#265c54] !transition-all"
              pt={{
                root: { className: "!overflow-hidden" },
                label: { className: "!p-0 !m-0" },
              }}
            />
          </div>
          {cart.appliedCartOffer?.offer_name ? (
            <div className="mb-2 flex items-center justify-center gap-2 text-xs">
              <span className="text-gray-500 dark:text-slate-400">
                Discount:
              </span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {cart.appliedCartOffer.offer_name}
              </span>
              <button
                type="button"
                onClick={removeOffer}
                className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
              >
                Remove
              </button>
            </div>
          ) : null}
          {cart.discount > 0 && (
            <p className="text-xs text-green-600 dark:text-green-400 text-center">
              You're saving ₹{formatINR(cart.discount)} on this order
            </p>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3 pb-32 lg:pb-0">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.cartItemId}
                className={`group bg-white dark:bg-[#151e22] rounded-2xl p-4 md:p-6 shadow-sm border border-[#e8dccf] dark:border-[#243440] transition-all hover:shadow-md ${
                  pulseCartItemId === item.cartItemId
                    ? "shopsphere-cart-pulse"
                    : ""
                }`}
              >
                <div className="flex gap-4 md:gap-6">
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#1a262f]">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <i className="pi pi-image text-2xl" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-slate-100 text-base sm:text-lg line-clamp-2">
                          {item.productName}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {item.shortDescription}
                        </p>

                        {/* Portion & Variant/Combination Details */}
                        {(item.portionValue ||
                          item.combinationName ||
                          (item.modifiers && item.modifiers.length > 0) ||
                          item.modifierValue) && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.portionValue && (
                              <Tag
                                value={item.portionValue}
                                severity="info"
                                className="text-xs"
                              />
                            )}
                            {item.combinationName ? (
                              <Tag
                                value={item.combinationName}
                                severity="secondary"
                                className="text-xs"
                              />
                            ) : item.modifiers && item.modifiers.length > 0 ? (
                              item.modifiers.map((mod, idx) => (
                                (() => {
                                  const value =
                                    mod.modifier_value ??
                                    mod.modifierValue ??
                                    mod.modifier_name ??
                                    mod.modifierName ??
                                    "Modifier";
                                  const add =
                                    Number(
                                      mod.additional_price ?? mod.additionalPrice ?? 0,
                                    ) || 0;
                                  return (
                                <Tag
                                  key={idx}
                                  value={`${value}${add > 0 ? ` (+₹${add})` : ""}`}
                                  severity="secondary"
                                  className="text-xs"
                                />
                                  );
                                })()
                              ))
                            ) : item.modifierValue && (
                              <Tag
                                value={item.modifierValue}
                                severity="secondary"
                                className="text-xs"
                              />
                            )}
                          </div>
                        )}

                        {/* Applied Offer on Item */}
                        {item.appliedOffer && (
                          <div className="mt-2 flex items-center gap-2">
                            <Tag
                              value={`${item.appliedOffer.offer_name} (-₹${item.appliedOffer.discount_amount})`}
                              severity="success"
                              className="text-xs"
                            />
                            <button
                              onClick={() =>
                                removeItemOffer(
                                  item.cartItemId,
                                  item.appliedOffer.offer_name,
                                )
                              }
                              className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                            >
                              <i className="pi pi-times" />
                              Remove
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div className="text-right sm:text-right">
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    ₹{formatINR(item.price)} each
                  </p>
                        <p className="font-semibold text-gray-900 dark:text-slate-100 text-base sm:text-lg">
                          ₹{formatINR(item.lineTotal)}
                        </p>
                        {Number(item.taxAmount) > 0 ? (
                          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-slate-400">
                            GST {Number(item.taxPercent || 0)}%: ₹{formatINR(item.taxAmount)}
                          </p>
                        ) : null}
                        {item.appliedOffer && (
                          <p className="text-xs sm:text-sm text-gray-400 line-through">
                            ₹
                            {formatINR(
                              item.lineTotal +
                                item.appliedOffer.discount_amount,
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls & Remove */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-[#243440]">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                          Qty:
                        </span>
                        <div className="flex items-center border border-[#2f7a6f] rounded-lg overflow-hidden">
                          <button
                            onClick={() =>
                              updateQuantity(item.cartItemId, item.quantity - 1)
                            }
                            disabled={
                              item.quantity <= 1 ||
                              updatingItem === item.cartItemId
                            }
                            className="px-2 sm:px-3 py-1 text-[#2f7a6f] hover:bg-[#2f7a6f]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <i className="pi pi-minus text-xs sm:text-sm" />
                          </button>
                          <span className="px-2 sm:px-3 py-1 text-gray-900 dark:text-slate-100 font-medium min-w-[36px] sm:min-w-[40px] text-center text-sm sm:text-base">
                            {updatingItem === item.cartItemId ? (
                              <i className="pi pi-spinner pi-spin" />
                            ) : (
                              item.quantity
                            )}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.cartItemId, item.quantity + 1)
                            }
                            disabled={updatingItem === item.cartItemId}
                            className="px-2 sm:px-3 py-1 text-[#2f7a6f] hover:bg-[#2f7a6f]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <i className="pi pi-plus text-xs sm:text-sm" />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          removeItem(item.cartItemId, item.productName)
                        }
                        className="text-red-500 hover:text-red-600 text-xs sm:text-sm flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <i className="pi pi-trash text-sm" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Continue Shopping */}
            <button
              onClick={continueShopping}
              className="flex items-center gap-2 text-[#2f7a6f] hover:text-[#265c54] font-medium transition-colors"
            >
              <i className="pi pi-arrow-left" />
              Continue Shopping
            </button>

            {/* Available Offers Section */}
            <div className="mt-6 bg-white dark:bg-[#151e22] rounded-2xl p-4 sm:p-6 shadow-sm border border-[#e8dccf] dark:border-[#243440]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-lg sm:text-xl font-semibold text-gray-900 dark:text-slate-100">
                  <i className="pi pi-tags text-amber-600 mr-2" />
                  Available Offers
                </h2>
                <Button
                  label={showOffers ? "Hide" : "Show All"}
                  icon={showOffers ? "pi pi-chevron-up" : "pi pi-chevron-down"}
                  className="p-button-text p-button-sm text-[#2f7a6f] text-xs sm:text-sm"
                  onClick={() => setShowOffers(!showOffers)}
                />
              </div>

              {/* Product Offers */}
              {getAvailableProductOffers().length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Product Offers
                  </p>
                  <div className="space-y-2">
                    {getAvailableProductOffers().map((offer) => {
                      // Find the product this offer applies to
                      const productItem = cart.items.find(
                        (item) => item.productId === offer.product_id,
                      );
                      const isApplied =
                        productItem?.appliedOffer?.offer_id === offer.offer_id;

                      return (
                        <div
                          key={offer.offer_id}
                          className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                            isApplied
                              ? "bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30"
                              : "bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <i
                              className={`pi ${isApplied ? "pi-check-circle text-green-600" : "pi-tag text-amber-600"}`}
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                                {offer.offer_name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-slate-400">
                                {productItem?.productName && (
                                  <span className="text-amber-700 dark:text-amber-400 font-medium">
                                    on {productItem.productName}
                                  </span>
                                )}
                                {offer.description && ` • ${offer.description}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Tag
                              value={
                                offer.discount_type === "percentage"
                                  ? `${offer.discount_value}% OFF`
                                  : `₹${offer.discount_value} OFF`
                              }
                              severity={isApplied ? "success" : "warning"}
                            />
                            {!isApplied && (
                              <Button
                                label="Apply"
                                size="small"
                                onClick={() => applyProductOffer(offer)}
                                className="!bg-amber-600 !border-amber-600 hover:!bg-amber-700 !text-white !text-xs !px-2 !py-1"
                              />
                            )}
                            {isApplied && (
                              <Tag
                                value="Applied"
                                severity="success"
                                icon="pi pi-check"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cart Offers */}
              {showOffers && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Cart Offers
                  </p>
                  <div className="space-y-2">
                    {getCartOffers().length > 0 ? (
                      getCartOffers().map((offer) => {
                        const isApplicable =
                          cart.subtotal >= (offer.min_purchase_amount || 0);
                        const isApplied =
                          cart.appliedCartOffer?.offer_id === offer.offer_id;

                        return (
                          <div
                            key={offer.offer_id}
                            className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                              isApplied
                                ? "bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30"
                                : isApplicable
                                  ? "bg-gray-50 dark:bg-[#1a262f] border border-gray-200 dark:border-[#243440]"
                                  : "bg-gray-100 dark:bg-[#1a262f]/50 opacity-60 border border-gray-200 dark:border-[#243440]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <i
                                className={`pi ${isApplied ? "pi-check-circle text-green-600" : isApplicable ? "pi-ticket text-[#2f7a6f]" : "pi-lock text-gray-400"}`}
                              />
                              <div>
                                <p
                                  className={`text-sm font-medium ${isApplicable ? "text-gray-900 dark:text-slate-100" : "text-gray-500 dark:text-slate-400"}`}
                                >
                                  {offer.offer_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                  {offer.description}
                                </p>
                                {!isApplicable && offer.min_purchase_amount && (
                                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                                    Min. order ₹
                                    {formatINR(offer.min_purchase_amount)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Tag
                                value={
                                  offer.discount_type === "percentage"
                                    ? `${offer.discount_value}% OFF`
                                    : `₹${offer.discount_value} OFF`
                                }
                                severity={
                                  isApplied
                                    ? "success"
                                    : isApplicable
                                      ? "info"
                                      : "secondary"
                                }
                              />
                              {isApplicable &&
                                !isApplied &&
                                !cart.appliedCartOffer && (
                                  <Button
                                    label="Apply"
                                    size="small"
                                    onClick={() => {
                                      setOfferCode(offer.offer_name);
                                      applyOffer();
                                    }}
                                    className="!bg-[#2f7a6f] !border-[#2f7a6f] hover:!bg-[#236b62] !text-white !text-xs !px-2 !py-1"
                                  />
                                )}
                              {isApplied ? (
                                <Button
                                  label="Remove"
                                  size="small"
                                  onClick={removeOffer}
                                  className="!bg-transparent !border-red-300 !text-red-600 hover:!bg-red-50 !text-xs !px-2 !py-1 dark:!border-red-500/40 dark:!text-red-400 dark:hover:!bg-red-500/10"
                                />
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-4">
                        No cart offers available
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#151e22] rounded-2xl p-4 sm:p-6 shadow-sm border border-[#e8dccf] dark:border-[#243440] lg:sticky top-24">
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4 sm:mb-6">
                Order Summary
              </h2>

              {cart.appliedCartOffer?.offer_name ? (
                <div className="mb-4 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm dark:border-green-500/30 dark:bg-green-500/10">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-300">
                      Discount applied
                    </p>
                    <p className="truncate font-medium text-green-900 dark:text-green-200">
                      {cart.appliedCartOffer.offer_name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeOffer}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </div>
              ) : null}

              {/* Price Breakdown */}
              <div className="space-y-3 text-sm border-b border-gray-100 dark:border-[#243440] pb-4 mb-4">
                <div className="flex justify-between text-gray-600 dark:text-slate-400">
                  <span>Subtotal ({cart.items.length} items)</span>
                  <span>₹{formatINR(cart.subtotal)}</span>
                </div>

                {cart.tax > 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-slate-400">
                    <span>Tax (GST)</span>
                    <span>₹{formatINR(cart.tax)}</span>
                  </div>
                )}

                {cart.itemDiscount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Item Discounts</span>
                    <span>-₹{formatINR(cart.itemDiscount)}</span>
                  </div>
                )}

                {cart.cartDiscount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Cart Discount</span>
                    <span>-₹{formatINR(cart.cartDiscount)}</span>
                  </div>
                )}

                {cart.discount > 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-slate-400">
                    <span>Total Discount</span>
                    <span className="text-green-600 dark:text-green-400">
                      -₹{formatINR(cart.discount)}
                    </span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex items-baseline justify-between gap-4 mb-6">
                <span className="text-base font-semibold text-gray-900 dark:text-slate-100">
                  Total
                </span>
                <span className="font-sans text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
                  ₹{formatINR(cart.total)}
                </span>
              </div>

              {/* Checkout Button - Hidden on mobile */}
              <Button
                label={
                  <span className="relative flex w-full items-center justify-center pr-10">
                    <span>
                      {currentUser
                        ? "Proceed to Checkout"
                        : "Login to Checkout"}
                    </span>
                    <span className="absolute right-4">
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </span>
                }
                onClick={proceedToCheckout}
                className="!w-full !py-3 !bg-[#2f7a6f] !border-none !text-white !rounded-xl hover:!bg-[#265c54] !transition-all !shadow-lg !shadow-[#2f7a6f]/20 hidden lg:!flex"
                pt={{
                  root: { className: "!overflow-hidden" },
                  label: { className: "!p-0 !m-0 !w-full" },
                }}
              />

              {/* Mobile Checkout Button */}
              <div className="lg:hidden">
                <p className="text-center text-sm text-gray-500 dark:text-slate-400 mb-2">
                  Review your order and proceed
                </p>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-gray-500 dark:text-slate-400">
                <div className="p-2">
                  <i className="pi pi-shield text-[#2f7a6f] text-lg mb-1" />
                  <p>Secure Payment</p>
                </div>
                <div className="p-2">
                  <i className="pi pi-refresh text-[#2f7a6f] text-lg mb-1" />
                  <p>Easy Returns</p>
                </div>
                <div className="p-2">
                  <i className="pi pi-truck text-[#2f7a6f] text-lg mb-1" />
                  <p>Fast Delivery</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;

