import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import {
  createAdminOffer,
  createAdminOfferMapping,
  deleteAdminOffer,
  fetchAdminOfferMappings,
  fetchAdminOfferMappingsByOfferId,
  fetchAdminOffers,
  updateAdminOffer,
  updateAdminOfferMapping,
  updateAdminOfferStatus,
} from "../../../api/adminOffersApi";
import { fetchAdminProducts, fetchCategories } from "../../../api/adminProductsApi";
import api from "../../../api/api";
import AdminOffersToolbar from "./AdminOffersToolbar";
import AdminOffersTable from "./AdminOffersTable";
import OfferFormModal from "./OfferFormModal";
import OfferDeleteDialog from "./OfferDeleteDialog";
import OfferUsageDialog from "./OfferUsageDialog";
import OfferViewDialog from "./OfferViewDialog";
import "./AdminShared.css";

const EMPTY_FORM = {
  offer_name: "",
  description: "",
  offer_type: "flat_discount",
  discount_type: "percentage",
  discount_value: "",
  maximum_discount_amount: "",
  min_purchase_amount: "",
  usage_limit_per_user: "",
  start_date: "",
  end_date: "",
  start_time: "",
  end_time: "",
  product_id: null,
  category_id: null,
  is_active: true,
};

const REQUIRED_FIELDS = [
  "offer_name",
  "offer_type",
  "discount_type",
  "discount_value",
  "maximum_discount_amount",
  "min_purchase_amount",
  "usage_limit_per_user",
  "start_date",
  "end_date",
];

const toInputDate = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    // Keep plain SQL date/date-time strings stable (no timezone conversion).
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    const sqlDateTime = value.match(/^(\d{4}-\d{2}-\d{2})\s/);
    if (sqlDateTime) {
      return sqlDateTime[1];
    }
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toInputTime = (value) => {
  if (!value) return "";
  const match = String(value).match(/^(\d{2}:\d{2})/);
  return match ? match[1] : "";
};

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentTimeString = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const pickScopeMapping = (mappings, offerType) => {
  if (!Array.isArray(mappings) || mappings.length === 0) return null;

  if (offerType === "product_discount") {
    return mappings.find((m) => m.product_id != null) || null;
  }

  if (offerType === "category_discount") {
    return mappings.find((m) => m.category_id != null) || null;
  }

  return mappings[0] || null;
};

function AdminOffersTab() {
  const toast = useRef(null);

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [formVisible, setFormVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [viewVisible, setViewVisible] = useState(false);
  const [usageVisible, setUsageVisible] = useState(false);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageRows, setUsageRows] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [offerTypeFilter, setOfferTypeFilter] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);

  const showToast = useCallback((severity, summary, detail) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const getErrorMessage = useCallback((error) => {
    const apiMessage = error.response?.data?.message;
    const apiErrors = error.response?.data?.errors;
    if (apiMessage) return apiMessage;
    if (Array.isArray(apiErrors) && apiErrors.length) {
      return apiErrors[0]?.message || "Validation failed.";
    }
    return error.message || "An unexpected error occurred.";
  }, []);

  const mapApiErrorsToForm = useCallback((error) => {
    const apiErrors = error.response?.data?.errors;
    if (!Array.isArray(apiErrors) || apiErrors.length === 0) {
      return null;
    }

    return apiErrors.reduce((acc, issue) => {
      if (!issue?.field || !issue?.message) return acc;
      acc[issue.field] = issue.message;
      return acc;
    }, {});
  }, []);

  const mapOfferToForm = useCallback((offer) => ({
    offer_name: offer.offer_name || "",
    description: offer.description || "",
    offer_type: offer.offer_type || "flat_discount",
    discount_type: offer.discount_type || "percentage",
    discount_value: offer.discount_value ?? "",
    maximum_discount_amount: offer.maximum_discount_amount ?? "",
    min_purchase_amount:
      offer.min_purchase_amount === null || offer.min_purchase_amount === undefined
        ? ""
        : offer.min_purchase_amount,
    usage_limit_per_user:
      offer.usage_limit_per_user === null || offer.usage_limit_per_user === undefined
        ? ""
        : offer.usage_limit_per_user,
    start_date: toInputDate(offer.start_date),
    end_date: toInputDate(offer.end_date),
    start_time: toInputTime(offer.start_time),
    end_time: toInputTime(offer.end_time),
    product_id: null,
    category_id: null,
    is_active: Boolean(offer.is_active),
  }), []);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminOffers();
      let mappings = [];
      try {
        mappings = await fetchAdminOfferMappings();
      } catch {
        mappings = [];
      }

      const productNameById = new Map(products.map((item) => [item.value, item.label]));
      const categoryNameById = new Map(categories.map((item) => [item.value, item.label]));
      const mappingsByOfferId = new Map();
      (mappings || []).forEach((mapping) => {
        if (!mappingsByOfferId.has(mapping.offer_id)) {
          mappingsByOfferId.set(mapping.offer_id, []);
        }
        mappingsByOfferId.get(mapping.offer_id).push(mapping);
      });

      const visibleOffers = (data || [])
        .filter((offer) => !Number(offer.is_deleted))
        .map((offer) => {
          const mapping = pickScopeMapping(
            mappingsByOfferId.get(offer.offer_id),
            offer.offer_type,
          );
          let scopeName = "-";

          if (offer.offer_type === "product_discount") {
            const productId = mapping?.product_id;
            scopeName = productNameById.get(productId) || `Product #${productId || "-"}`;
          }

          if (offer.offer_type === "category_discount") {
            const categoryId = mapping?.category_id;
            scopeName =
              categoryNameById.get(categoryId) || `Category #${categoryId || "-"}`;
          }

          return {
            ...offer,
            scope_name: scopeName,
          };
        })
        .sort((a, b) => Number(a.offer_id) - Number(b.offer_id));
      setOffers(visibleOffers);
    } catch (error) {
      setOffers([]);
      showToast("error", "Error", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [categories, getErrorMessage, products, showToast]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  useEffect(() => {
    const loadScopeOptions = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetchAdminProducts({ page: 1, limit: 1000 }),
          fetchCategories(),
        ]);

        setProducts(
          (productsResponse?.data || []).map((product) => ({
            label: product.display_name || product.name,
            value: product.product_id,
          })),
        );

        setCategories(
          (categoriesResponse || []).map((category) => ({
            label: category.name || category.category_name,
            value: category.category_id || category.id,
          })),
        );
      } catch (error) {
        showToast("warn", "Warning", "Unable to load product/category options");
      }
    };

    loadScopeOptions();
  }, [showToast]);

  const handleOpenCreate = useCallback(() => {
    setSelectedOffer(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setTouchedFields({});
    setFormVisible(true);
  }, []);

  const handleOpenEdit = useCallback(
    (offer) => {
      setSelectedOffer(offer);
      setForm(mapOfferToForm(offer));
      setFormErrors({});
      setTouchedFields({});
      setFormVisible(true);

      fetchAdminOfferMappingsByOfferId(offer.offer_id)
        .then((mappings) => {
          const scopeMapping = pickScopeMapping(mappings, offer.offer_type);
          if (!scopeMapping) return;
          setForm((prev) => ({
            ...prev,
            product_id: scopeMapping.product_id ?? null,
            category_id: scopeMapping.category_id ?? null,
          }));
        })
        .catch(() => {
          // no mapping for this offer or request failed
        });
    },
    [mapOfferToForm],
  );

  const handleCloseForm = useCallback(() => {
    setFormVisible(false);
    setSelectedOffer(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setTouchedFields({});
  }, []);

  const handleOpenDelete = useCallback((offer) => {
    setSelectedOffer(offer);
    setDeleteVisible(true);
  }, []);

  const handleOpenView = useCallback((offer) => {
    setSelectedOffer(offer);
    setViewVisible(true);
  }, []);

  const handleCloseView = useCallback(() => {
    setViewVisible(false);
    setSelectedOffer(null);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeleteVisible(false);
    setSelectedOffer(null);
  }, []);

  const handleOpenUsage = useCallback(
    async (offer) => {
      setSelectedOffer(offer);
      setUsageVisible(true);
      setUsageLoading(true);
      setUsageRows([]);

      try {
        const response = await api.get(`/offer/usagebyoffer/${offer.offer_id}`);
        const rows = response.data?.data?.usage_details || [];
        setUsageRows(rows);
      } catch (error) {
        setUsageRows([]);
        if (error.response?.status !== 404) {
          showToast("error", "Error", getErrorMessage(error));
        }
      } finally {
        setUsageLoading(false);
      }
    },
    [getErrorMessage, showToast],
  );

  const handleCloseUsage = useCallback(() => {
    setUsageVisible(false);
    setUsageLoading(false);
    setUsageRows([]);
    setSelectedOffer(null);
  }, []);

  const handleFormChange = useCallback((key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "offer_type") {
        if (value === "product_discount") {
          next.category_id = null;
        } else if (value === "category_discount") {
          next.product_id = null;
        } else {
          next.product_id = null;
          next.category_id = null;
        }
      }
      return next;
    });
    setFormErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleFieldBlur = useCallback((field) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};
    const today = getTodayDateString();
    const currentTime = getCurrentTimeString();

    if (!form.offer_name.trim()) errors.offer_name = "Offer name is required";
    if (!form.offer_type) errors.offer_type = "Offer type is required";
    if (!form.discount_type) errors.discount_type = "Discount type is required";
    if (!form.start_date) errors.start_date = "Start date is required";
    if (!form.end_date) errors.end_date = "End date is required";

    const discountValue = Number(form.discount_value);
    const maxDiscount = Number(form.maximum_discount_amount);
    const minPurchase = Number(form.min_purchase_amount);
    const usageLimit = Number(form.usage_limit_per_user);

    if (form.discount_value === "" || Number.isNaN(discountValue) || discountValue < 0) {
      errors.discount_value = "Discount value is required";
    }
    if (form.discount_type === "percentage" && discountValue > 100) {
      errors.discount_value = "Discount value cannot be greater than 100";
    }

    if (
      form.maximum_discount_amount === "" ||
      Number.isNaN(maxDiscount) ||
      maxDiscount < 0
    ) {
      errors.maximum_discount_amount = "Maximum discount amount is required";
    }

    if (form.offer_type === "product_discount") {
      if (
        form.min_purchase_amount !== "" &&
        (Number.isNaN(minPurchase) || minPurchase < 0)
      ) {
        errors.min_purchase_amount = "Min purchase amount must be a valid number";
      }
    } else if (
      form.min_purchase_amount === "" ||
      Number.isNaN(minPurchase) ||
      minPurchase < 0
    ) {
      errors.min_purchase_amount = "Min purchase amount is required";
    }

    if (
      form.usage_limit_per_user === "" ||
      Number.isNaN(usageLimit) ||
      usageLimit < 1
    ) {
      errors.usage_limit_per_user = "Usage limit per user is required";
    }

    if (
      form.discount_type === "fixed_amount" &&
      form.maximum_discount_amount !== "" &&
      form.discount_value !== "" &&
      !Number.isNaN(maxDiscount) &&
      !Number.isNaN(discountValue) &&
      maxDiscount < discountValue
    ) {
      errors.maximum_discount_amount =
        "Maximum discount amount cannot be less than discount value for fixed amount";
    }

    if (form.start_date && form.end_date) {
      const startDate = new Date(form.start_date);
      const endDate = new Date(form.end_date);

      if (startDate > endDate) {
        errors.start_date = "Start date must be before end date";
        errors.end_date = "End date must be after start date";
      }
    }

    if (
      form.start_date === today &&
      form.start_time &&
      form.start_time < currentTime
    ) {
      errors.start_time = "Start time cannot be in the past for today";
    }

    if (form.end_date === today) {
      if (form.end_time && form.end_time <= currentTime) {
        errors.end_time = "End time must be in the future for today";
      }
    }

    if (
      form.start_date &&
      form.end_date &&
      form.start_date === form.end_date &&
      form.start_time &&
      form.end_time &&
      form.start_time >= form.end_time
    ) {
      errors.start_time = "Start time must be before end time";
    }

    if (form.offer_type === "product_discount" && !form.product_id) {
      errors.product_id = "Product is required for product discount";
    }

    if (form.offer_type === "category_discount" && !form.category_id) {
      errors.category_id = "Category is required for category discount";
    }

    return errors;
  }, [form]);

  const buildPayload = useCallback(() => {
    const today = getTodayDateString();
    const autoStartTime =
      form.start_date === today && !form.start_time ? getCurrentTimeString() : null;

    return {
      offer_name: form.offer_name.trim(),
      description: form.description.trim() || null,
      offer_type: form.offer_type,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      maximum_discount_amount: Number(form.maximum_discount_amount),
      min_purchase_amount:
        form.min_purchase_amount === "" ? null : Number(form.min_purchase_amount),
      usage_limit_per_user:
        form.usage_limit_per_user === "" ? null : Number(form.usage_limit_per_user),
      start_date: `${form.start_date} 00:00:00`,
      end_date: `${form.end_date} 23:59:59`,
      start_time: form.start_time || autoStartTime,
      end_time: form.end_time || null,
      is_active: form.is_active ? 1 : 0,
    };
  }, [form]);

  const handleSave = useCallback(async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      const touchedRequired = REQUIRED_FIELDS.reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {},
      );
      setTouchedFields((prev) => ({
        ...touchedRequired,
        ...prev,
        start_time: true,
        end_time: true,
      }));
      showToast("warn", "Validation", "Please fix required fields");
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (selectedOffer?.offer_id) {
        await updateAdminOffer(selectedOffer.offer_id, payload);

        if (
          form.offer_type === "product_discount" ||
          form.offer_type === "category_discount"
        ) {
          const mappings = await fetchAdminOfferMappingsByOfferId(selectedOffer.offer_id);
          const scopeMapping = pickScopeMapping(mappings, form.offer_type);
          const mappingPayload =
            form.offer_type === "product_discount"
              ? { product_id: Number(form.product_id) }
              : { category_id: Number(form.category_id) };

          if (scopeMapping?.offer_product_category_id) {
            await updateAdminOfferMapping(
              scopeMapping.offer_product_category_id,
              mappingPayload,
            );
          } else {
            await createAdminOfferMapping({
              offer_id: selectedOffer.offer_id,
              ...mappingPayload,
            });
          }
        } else {
          const mappings = await fetchAdminOfferMappingsByOfferId(selectedOffer.offer_id);
          await Promise.all(
            (mappings || [])
              .filter((m) => m?.offer_product_category_id)
              .map((m) =>
                updateAdminOfferMapping(m.offer_product_category_id, {
                  product_id: null,
                  category_id: null,
                }),
              ),
          );
        }

        showToast("success", "Success", "Offer updated successfully");
      } else {
        const result = await createAdminOffer(payload);
        const newOfferId = result?.data?.offer_id;

        if (
          newOfferId &&
          (form.offer_type === "product_discount" || form.offer_type === "category_discount")
        ) {
          await createAdminOfferMapping({
            offer_id: newOfferId,
            product_id: form.offer_type === "product_discount" ? Number(form.product_id) : null,
            category_id:
              form.offer_type === "category_discount" ? Number(form.category_id) : null,
          });
        }

        showToast("success", "Success", "Offer created successfully");
      }
      handleCloseForm();
      await loadOffers();
    } catch (error) {
      const apiFormErrors = mapApiErrorsToForm(error);
      if (apiFormErrors) {
        setFormErrors((prev) => ({ ...prev, ...apiFormErrors }));
        setTouchedFields((prev) => {
          const next = { ...prev };
          Object.keys(apiFormErrors).forEach((field) => {
            next[field] = true;
          });
          return next;
        });
        showToast("warn", "Validation", "Please fix the highlighted fields");
        return;
      }

      showToast("error", "Error", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }, [
    buildPayload,
    getErrorMessage,
    handleCloseForm,
    loadOffers,
    mapApiErrorsToForm,
    selectedOffer,
    showToast,
    validateForm,
  ]);

  const handleConfirmDelete = useCallback(async (offer) => {
    if (!offer?.offer_id) return;

    setDeleting(true);
    try {
      await deleteAdminOffer(offer.offer_id);
      showToast("success", "Success", "Offer deleted successfully");
      handleCloseDelete();
      await loadOffers();
    } catch (error) {
      showToast("error", "Error", getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }, [getErrorMessage, handleCloseDelete, loadOffers, showToast]);

  const handleToggleStatus = useCallback(
    async (offer) => {
      const nextValue = !Boolean(offer.is_active);

      setOffers((prev) =>
        prev.map((item) =>
          item.offer_id === offer.offer_id
            ? { ...item, is_active: nextValue ? 1 : 0 }
            : item,
        ),
      );

      try {
        await updateAdminOfferStatus(offer.offer_id, nextValue);
        showToast(
          "success",
          "Success",
          `Offer ${nextValue ? "activated" : "deactivated"} successfully`,
        );
      } catch (error) {
        setOffers((prev) =>
          prev.map((item) =>
            item.offer_id === offer.offer_id
              ? { ...item, is_active: offer.is_active }
              : item,
          ),
        );
        showToast("error", "Error", getErrorMessage(error));
      }
    },
    [getErrorMessage, showToast],
  );

  const totalAll = offers.length;
  const totalActive = useMemo(
    () => offers.filter((item) => Boolean(item.is_active)).length,
    [offers],
  );

  const filteredOffers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const normalizedStatus =
      statusFilter && typeof statusFilter === "object" && "value" in statusFilter
        ? statusFilter.value
        : statusFilter;

    const statusValue =
      normalizedStatus === "true"
        ? true
        : normalizedStatus === "false"
          ? false
          : normalizedStatus;

    const result = offers.filter((offer) => {
      const statusMatch =
        statusValue == null ? true : Boolean(offer.is_active) === statusValue;
      const offerTypeMatch =
        offerTypeFilter == null ? true : offer.offer_type === offerTypeFilter;

      if (!statusMatch || !offerTypeMatch) return false;

      if (!query) return true;

      const searchFields = [
        offer.offer_name,
        offer.description,
        offer.offer_type,
        offer.discount_type,
        offer.scope_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchFields.includes(query);
    });
    if (!sortField || !sortOrder) {
      return result;
    }

    const sorted = [...result].sort((a, b) => {
      const aValue = a?.[sortField];
      const bValue = b?.[sortField];

      if (sortField === "offer_id") {
        return (Number(aValue) - Number(bValue)) * sortOrder;
      }

      const aText = String(aValue ?? "").toLowerCase();
      const bText = String(bValue ?? "").toLowerCase();
      return aText.localeCompare(bText) * sortOrder;
    });

    return sorted;
  }, [offerTypeFilter, offers, searchTerm, sortField, sortOrder, statusFilter]);

  const handleSort = useCallback((event) => {
    setSortField(event.sortField);
    setSortOrder(event.sortOrder);
  }, []);

  return (
    <div className="admin-products-container animate-fade-in flex-1 flex flex-col min-h-0 w-full">
      <Toast ref={toast} position="top-right" />

      <div className="admin-products-card flex-1 flex flex-col min-h-0">
        <AdminOffersToolbar
          onSearch={setSearchTerm}
          onStatusFilter={setStatusFilter}
          statusFilter={statusFilter}
          onOfferTypeFilter={setOfferTypeFilter}
          offerTypeFilter={offerTypeFilter}
          onAddOffer={handleOpenCreate}
          totalAll={totalAll}
          totalActive={totalActive}
        />

        <AdminOffersTable
          offers={filteredOffers}
          loading={loading}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          onView={handleOpenView}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          onToggleStatus={handleToggleStatus}
          onViewUsage={handleOpenUsage}
        />
      </div>

      <OfferFormModal
        visible={formVisible}
        onHide={handleCloseForm}
        form={form}
        onChange={handleFormChange}
        onBlurField={handleFieldBlur}
        errors={formErrors}
        touched={touchedFields}
        products={products}
        categories={categories}
        onSave={handleSave}
        saving={saving}
        isEditing={Boolean(selectedOffer)}
      />

      <OfferDeleteDialog
        visible={deleteVisible}
        onHide={handleCloseDelete}
        offer={selectedOffer}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />

      <OfferViewDialog
        visible={viewVisible}
        onHide={handleCloseView}
        offer={selectedOffer}
      />

      <OfferUsageDialog
        visible={usageVisible}
        onHide={handleCloseUsage}
        offer={selectedOffer}
        usageRows={usageRows}
        loading={usageLoading}
      />
    </div>
  );
}

export default AdminOffersTab;


