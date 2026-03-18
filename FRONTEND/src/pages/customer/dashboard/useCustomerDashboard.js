import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../../../api/api";
import { initialAddressForm, profileNav } from "./constants";
import { fetchAllUserOrders } from "./orderData";
import {
  buildAddressFormState,
  buildAddressPayload,
  extractData,
  extractErrorMessage,
  extractValidationErrorMessage,
  toArray,
  validateAddressFields,
} from "./utils";

const normalizeProfilePayload = (payload) =>
  Array.isArray(payload) ? payload[0] : payload;

const DEFAULT_ACTIVE_TAB = "dashboard";
const activeTabKeys = new Set(profileNav.map((item) => item.key));

const normalizeActiveTab = (tab) => {
  if (!activeTabKeys.has(tab)) {
    return DEFAULT_ACTIVE_TAB;
  }

  return tab;
};

export function useCustomerDashboard() {
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      const storedTab = localStorage.getItem("customer-dashboard-active-tab");
      return normalizeActiveTab(storedTab || DEFAULT_ACTIVE_TAB);
    } catch {
      return DEFAULT_ACTIVE_TAB;
    }
  });
  const [profile, setProfile] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [defaultAddressId, setDefaultAddressId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [orderItemsDialogVisible, setOrderItemsDialogVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState([]);
  const [orderItemsLoading, setOrderItemsLoading] = useState(false);
  const [orderItemsError, setOrderItemsError] = useState("");

  const [addressForm, setAddressForm] = useState(initialAddressForm);
  const [addingAddress, setAddingAddress] = useState(false);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [addressFormError, setAddressFormError] = useState("");
  const [addressFormSuccess, setAddressFormSuccess] = useState("");
  const [addressActionError, setAddressActionError] = useState("");
  const [settingDefaultAddressId, setSettingDefaultAddressId] = useState(null);
  const [editAddressDialogVisible, setEditAddressDialogVisible] = useState(false);
  const [editAddressForm, setEditAddressForm] = useState(initialAddressForm);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [loadingEditAddressId, setLoadingEditAddressId] = useState(null);
  const [updatingAddress, setUpdatingAddress] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState(null);

  const fetchDefaultAddressId = useCallback(async (fallback = null) => {
    try {
      const defaultAddressRes = await api.get("/users/getDefault");
      const defaultAddress = extractData(defaultAddressRes);
      return Number(defaultAddress?.address_id) || fallback;
    } catch {
      return fallback;
    }
  }, []);

  const refreshAddresses = useCallback(async () => {
    const addressesRes = await api.get("/users/show-addresses");
    const addressesPayload = toArray(extractData(addressesRes));
    const defaultFromList = addressesPayload.find(
      (address) => Number(address?.is_default) === 1,
    );
    const fallbackDefaultId = defaultFromList
      ? Number(defaultFromList.address_id)
      : null;

    setAddresses(addressesPayload);
    setDefaultAddressId(await fetchDefaultAddressId(fallbackDefaultId));
  }, [fetchDefaultAddressId]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [profileRes, ordersRes, addressesRes] = await Promise.all([
        api.get("/users/view-profile"),
        fetchAllUserOrders(api),
        api.get("/users/show-addresses"),
      ]);

      setProfile(normalizeProfilePayload(extractData(profileRes)) || null);

      const addressesPayload = toArray(extractData(addressesRes));
      const defaultFromList = addressesPayload.find(
        (address) => Number(address?.is_default) === 1,
      );
      const fallbackDefaultId = defaultFromList
        ? Number(defaultFromList.address_id)
        : null;
      setAddresses(addressesPayload);

      const ordersPayload = toArray(ordersRes);
      const sortedOrders = [...ordersPayload].sort((a, b) => {
        const aDate = new Date(a?.created_at || a?.placed_at || 0).getTime();
        const bDate = new Date(b?.created_at || b?.placed_at || 0).getTime();

        if (aDate !== bDate) {
          return bDate - aDate;
        }

        return Number(b?.order_id || 0) - Number(a?.order_id || 0);
      });

      const ordersWithCount = sortedOrders.map((order) => ({
        ...order,
        item_count: Number(order?.item_count) || 0,
      }));

      setUserOrders(ordersWithCount);
      setDefaultAddressId(await fetchDefaultAddressId(fallbackDefaultId));
    } catch (apiError) {
      setError(
        apiError?.response?.data?.message ||
          "Failed to load dashboard data. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [fetchDefaultAddressId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleOpenOrderDetails = useCallback(async (order) => {
    setSelectedOrder(order);
    setOrderItemsDialogVisible(true);
    setOrderItemsLoading(true);
    setOrderItemsError("");

    try {
      const itemsRes = await api.get(`/order-item/${order.order_id}/items`);
      const items = toArray(extractData(itemsRes));
      const itemsWithImages = await Promise.all(
        items.map(async (item) => {
          if (item?.image_url) {
            return item;
          }

          try {
            const imageRes = await api.get(`/productImages/${item.product_id}`);
            const imageList = toArray(extractData(imageRes));
            const primaryImage =
              imageList.find((img) => Number(img?.is_primary) === 1) ||
              imageList[0];

            return {
              ...item,
              image_url: primaryImage?.image_url || null,
            };
          } catch {
            return item;
          }
        }),
      );

      setSelectedOrderItems(itemsWithImages);
    } catch (apiError) {
      setSelectedOrderItems([]);
      setOrderItemsError(
        apiError?.response?.data?.message ||
          "Failed to load order items. Please try again.",
      );
    } finally {
      setOrderItemsLoading(false);
    }
  }, []);

  const handleCloseOrderDetails = useCallback(() => {
    setOrderItemsDialogVisible(false);
    setSelectedOrder(null);
    setSelectedOrderItems([]);
    setOrderItemsError("");
  }, []);

  const handleAddressInputChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;

    setAddressForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const handleEditAddressInputChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;

    setEditAddressForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const setDefaultAddressRequest = useCallback(async (addressId) => {
    const normalizedAddressId = Number(addressId);

    try {
      await api.patch(`/users/setDefault/${normalizedAddressId}`);
      return;
    } catch (patchError) {
      const patchMessage = extractErrorMessage(patchError, "");
      const patchMessageText = String(patchMessage).toLowerCase();
      const patchErrorText = String(patchError?.message || "").toLowerCase();
      const patchStatus = patchError?.response?.status;
      const isNetworkLevelFailure =
        !patchError?.response &&
        (patchErrorText.includes("network") ||
          patchErrorText.includes("cors") ||
          patchErrorText.includes("failed"));
      const shouldFallbackToPost =
        isNetworkLevelFailure ||
        patchStatus === 405 ||
        (patchStatus === 404 &&
          (patchMessageText.includes("route") ||
            patchMessageText.includes("method")));

      if (!shouldFallbackToPost) {
        throw patchError;
      }
    }

    await api.post(`/users/setDefault/${normalizedAddressId}`);
  }, []);

  const toggleAddAddressForm = useCallback(() => {
    setAddressFormError("");
    setAddressActionError("");
    setAddressFormSuccess("");
    setShowAddAddressForm((prev) => {
      const next = !prev;

      if (next) {
        setAddressForm(initialAddressForm);
      }

      return next;
    });
  }, []);

  const handleAddAddress = useCallback(
    async (event) => {
      event.preventDefault();
      setAddressFormError("");
      setAddressFormSuccess("");
      setAddressActionError("");

      const validationMessage = validateAddressFields(addressForm);

      if (validationMessage) {
        setAddressFormError(validationMessage);
        return;
      }

      setAddingAddress(true);

      try {
        const payload = buildAddressPayload(addressForm);
        const response = await api.post("/users/add-address", payload);
        const createdAddress = extractData(response);
        const newAddressId =
          Number(createdAddress?.address_id) ||
          Number(response?.data?.address_id) ||
          null;
        let defaultUpdateFailed = false;

        if (addressForm.is_default && newAddressId) {
          try {
            await setDefaultAddressRequest(newAddressId);
            setDefaultAddressId(Number(newAddressId));
          } catch {
            defaultUpdateFailed = true;
          }
        }

        try {
          await refreshAddresses();
        } catch {
          // Keep local success state even when refresh fails.
        }

        setAddressForm(initialAddressForm);
        setShowAddAddressForm(false);

        if (defaultUpdateFailed) {
          setAddressActionError(
            "Address added, but setting it as default failed. Please try 'Set as Default' again.",
          );
        }

        setAddressFormSuccess("Address added successfully.");
      } catch (apiError) {
        const validationErrorMessage = extractValidationErrorMessage(apiError);

        if (validationErrorMessage) {
          setAddressFormError(validationErrorMessage);
          return;
        }

        setAddressFormError(
          extractErrorMessage(
            apiError,
            "Failed to add address. Please check your inputs.",
          ),
        );
      } finally {
        setAddingAddress(false);
      }
    },
    [addressForm, refreshAddresses, setDefaultAddressRequest],
  );

  const handleOpenEditAddress = useCallback(
    async (address) => {
      const normalizedId = Number(address?.address_id);

      if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
        setAddressActionError("Invalid address selected.");
        return;
      }

      setAddressFormError("");
      setAddressActionError("");
      setAddressFormSuccess("");
      setLoadingEditAddressId(normalizedId);

      try {
        const response = await api.get(`/users/address/${normalizedId}`);
        const payload = extractData(response);
        const addressById = Array.isArray(payload) ? payload[0] : payload;
        const mergedAddress = {
          ...address,
          ...(addressById || {}),
          address_id: normalizedId,
        };

        setEditingAddressId(normalizedId);
        setEditAddressForm({
          ...buildAddressFormState(mergedAddress),
          is_default:
            Number(mergedAddress?.is_default) === 1 ||
            Number(mergedAddress?.address_id) === Number(defaultAddressId),
        });
        setEditAddressDialogVisible(true);
      } catch (apiError) {
        const fallbackAddress = {
          ...address,
          address_id: normalizedId,
        };

        setEditingAddressId(normalizedId);
        setEditAddressForm({
          ...buildAddressFormState(fallbackAddress),
          is_default:
            Number(fallbackAddress?.is_default) === 1 ||
            Number(fallbackAddress?.address_id) === Number(defaultAddressId),
        });
        setEditAddressDialogVisible(true);
        setAddressActionError(
          extractErrorMessage(
            apiError,
            "Failed to fetch latest address details. You can still edit this address.",
          ),
        );
      } finally {
        setLoadingEditAddressId(null);
      }
    },
    [defaultAddressId],
  );

  const closeEditAddressDialog = useCallback(() => {
    setEditAddressDialogVisible(false);
    setEditingAddressId(null);
  }, []);

  const handleUpdateAddress = useCallback(
    async (event) => {
      event.preventDefault();
      setAddressFormError("");
      setAddressActionError("");
      setAddressFormSuccess("");

      if (!editingAddressId) {
        setAddressActionError("No address selected for update.");
        return;
      }

      const validationMessage = validateAddressFields(editAddressForm);

      if (validationMessage) {
        setAddressFormError(validationMessage);
        return;
      }

      setUpdatingAddress(true);

      try {
        const payload = buildAddressPayload(editAddressForm);
        await api.patch(`/users/update-address/${editingAddressId}`, payload);

        if (editAddressForm.is_default) {
          await setDefaultAddressRequest(editingAddressId);
          setDefaultAddressId(Number(editingAddressId));
        }

        await refreshAddresses();
        closeEditAddressDialog();
        setAddressFormSuccess("Address updated successfully.");
      } catch (apiError) {
        const validationErrorMessage = extractValidationErrorMessage(apiError);

        if (validationErrorMessage) {
          setAddressFormError(validationErrorMessage);
          return;
        }

        setAddressActionError(
          extractErrorMessage(apiError, "Failed to update address."),
        );
      } finally {
        setUpdatingAddress(false);
      }
    },
    [
      closeEditAddressDialog,
      editAddressForm,
      editingAddressId,
      refreshAddresses,
      setDefaultAddressRequest,
    ],
  );

  const handleDeleteAddress = useCallback(
    async (addressId) => {
      const normalizedAddressId = Number(addressId);

      if (!Number.isInteger(normalizedAddressId) || normalizedAddressId <= 0) {
        setAddressActionError("Invalid address selected.");
        return;
      }

      const confirmed = window.confirm("Delete this address?");

      if (!confirmed) {
        return;
      }

      setAddressActionError("");
      setAddressFormSuccess("");
      setDeletingAddressId(normalizedAddressId);

      try {
        await api.delete(`/users/delete-address/${normalizedAddressId}`);
        await refreshAddresses();

        if (Number(defaultAddressId) === normalizedAddressId) {
          setDefaultAddressId(null);
        }

        setAddressFormSuccess("Address deleted successfully.");
      } catch (apiError) {
        setAddressActionError(
          extractErrorMessage(apiError, "Failed to delete address."),
        );
      } finally {
        setDeletingAddressId(null);
      }
    },
    [defaultAddressId, refreshAddresses],
  );

  const handleSetDefaultAddress = useCallback(
    async (addressId) => {
      const normalizedAddressId = Number(addressId);

      setAddressActionError("");
      setAddressFormSuccess("");
      setSettingDefaultAddressId(normalizedAddressId);

      try {
        await setDefaultAddressRequest(normalizedAddressId);
        setDefaultAddressId(normalizedAddressId);
        setAddresses((prev) =>
          prev.map((address) => ({
            ...address,
            is_default:
              Number(address.address_id) === normalizedAddressId ? 1 : 0,
          })),
        );
        setAddressFormSuccess("Default address updated successfully.");

        try {
          await refreshAddresses();
        } catch {
          // Keep optimistic default update if refresh call fails.
        }
      } catch (apiError) {
        setAddressActionError(
          extractErrorMessage(apiError, "Failed to set default address."),
        );
      } finally {
        setSettingDefaultAddressId(null);
      }
    },
    [refreshAddresses, setDefaultAddressRequest],
  );

  const orderMetrics = useMemo(() => {
    const totalOrders = userOrders.length;
    const completedOrders = userOrders.filter((order) =>
      ["delivered", "completed"].includes(
        String(order?.order_status || "").toLowerCase(),
      ),
    ).length;
    const openOrders = userOrders.filter((order) =>
      ["pending", "processing", "shipped"].includes(
        String(order?.order_status || "").toLowerCase(),
      ),
    ).length;
    const totalSpent = userOrders.reduce(
      (sum, order) => sum + (Number(order?.total_amount) || 0),
      0,
    );

    return {
      totalOrders,
      completedOrders,
      openOrders,
      totalSpent,
    };
  }, [userOrders]);

  const recentOrders = useMemo(() => userOrders.slice(0, 5), [userOrders]);

  const setActiveTab = useCallback((nextTab) => {
    const normalizedTab = normalizeActiveTab(nextTab);
    setActiveTabState(normalizedTab);
    try {
      localStorage.setItem("customer-dashboard-active-tab", normalizedTab);
    } catch {
      // no-op
    }
  }, []);

  return {
    activeTab,
    setActiveTab,
    profile,
    userOrders,
    addresses,
    defaultAddressId,
    loading,
    error,
    orderMetrics,
    recentOrders,
    loadDashboardData,
    orderItemsDialogVisible,
    selectedOrder,
    selectedOrderItems,
    orderItemsLoading,
    orderItemsError,
    handleOpenOrderDetails,
    handleCloseOrderDetails,
    addressForm,
    addingAddress,
    showAddAddressForm,
    addressFormError,
    addressFormSuccess,
    addressActionError,
    settingDefaultAddressId,
    editAddressDialogVisible,
    editAddressForm,
    loadingEditAddressId,
    updatingAddress,
    deletingAddressId,
    toggleAddAddressForm,
    handleAddressInputChange,
    handleEditAddressInputChange,
    handleAddAddress,
    handleOpenEditAddress,
    closeEditAddressDialog,
    handleUpdateAddress,
    handleDeleteAddress,
    handleSetDefaultAddress,
  };
}
