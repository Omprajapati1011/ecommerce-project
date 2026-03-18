/**
 * @component ProductFormModal
 * @description PrimeReact Dialog for creating and editing products.
 *
 * Contains a 4-tab TabView:
 *  1. Basic Info — Formik + Yup validated form (name, display_name, category,
 *     price, discounted_price, stock, description, active status)
 *  2. Portions  — ProductPortionsPanel (assign portions to product)
 *  3. Modifiers — ProductModifiersPanel (assign modifiers to portions/product)
 *  4. Images    — ProductImagesPanel (upload product + modifier images)
 *
 * Creation wizard flow: Basic Info → Continue (saves product) → Portions →
 *   Continue → Modifiers → Continue → Images → Save & Close
 * Edit flow: Standard Save on tab 1; free tab navigation.
 *
 * Props: visible, onHide, product, onSave, saving, initialTab
 * Consumed by: AdminProductsTab
 */
import { useEffect, useState, useRef, useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { TabView, TabPanel } from "primereact/tabview";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import { useToast } from "../../context/ToastContext";
import { ArrowRight } from "lucide-react";
import { fetchCategories } from "../../../api/adminProductsApi";
import ProductPortionsPanel from "./ProductPortionsPanel";
import ProductModifiersPanel from "./ProductModifiersPanel";
import ProductImagesPanel from "./ProductImagesPanel";

// Yup validation schema
const validationSchema = Yup.object().shape({
  name: Yup.string()
    .required("System name is required")
    .min(3, "Name must be at least 3 characters"),
  display_name: Yup.string()
    .required("Display name is required")
    .min(3, "Display name must be at least 3 characters"),
  short_description: Yup.string(),
  description: Yup.string(),
  price: Yup.number()
    .required("Price is required")
    .min(0, "Price must be 0 or greater"),
  discounted_price: Yup.number()
    .nullable()
    .min(0, "Discounted price must be 0 or greater")
    .test(
      "less-than-price",
      "Discounted price must be less than original price",
      function (value) {
        const { price } = this.parent;
        if (value === null || value === undefined) return true;
        return value < price;
      },
    ),
  stock: Yup.number()
    .required("Stock is required")
    .min(0, "Stock must be 0 or greater")
    .integer("Stock must be a whole number"),
  category_id: Yup.mixed().required("Category is required"),
  is_active: Yup.boolean(),
});

/**
 * ProductFormModal - Create/Edit product form with TabView
 * Creation flow: Basic Info → Continue → Portions → Continue → Modifiers → Save & Close
 * Edit flow: Standard Save on Basic Info, free tab navigation
 */
function ProductFormModal({
  visible,
  onHide,
  product,
  onSave,
  onMutate,
  saving,
  initialTab = 0,
}) {
  const showToast = useToast();
  const filePickerGuardTimerRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [filePickerActive, setFilePickerActive] = useState(false);

  // Wizard flow tracking
  const [isNewProductFlow, setIsNewProductFlow] = useState(false);
  const [portionsCount, setPortionsCount] = useState(0);
  const [modifiersDetected, setModifiersDetected] = useState(false);

  const isEditing = Boolean(product);

  const setFilePickerGuard = useCallback((active) => {
    if (filePickerGuardTimerRef.current) {
      clearTimeout(filePickerGuardTimerRef.current);
      filePickerGuardTimerRef.current = null;
    }

    if (active) {
      setFilePickerActive(true);
      return;
    }

    filePickerGuardTimerRef.current = setTimeout(() => {
      setFilePickerActive(false);
      filePickerGuardTimerRef.current = null;
    }, 400);
  }, []);

  const handleDialogHide = useCallback(() => {
    if (filePickerActive) {
      return;
    }
    onHide();
  }, [filePickerActive, onHide]);

  // Fetch categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const data = await fetchCategories();
        const categoryOptions = data.map((cat) => ({
          label: cat.name || cat.category_name,
          value: cat.category_id || cat.id,
        }));
        setCategories(categoryOptions);
      } catch (error) {
        console.error("Failed to load categories:", error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    if (visible && categories.length === 0) {
      loadCategories();
    }
  }, [visible, categories.length]);

  // Formik setup
  const formik = useFormik({
    initialValues: {
      name: "",
      display_name: "",
      short_description: "",
      description: "",
      price: null,
      discounted_price: null,
      stock: null,
      category_id: null,
      is_active: true,
    },
    validationSchema,
    onSubmit: async (values) => {
      const payload = {
        ...values,
        is_active: values.is_active ? 1 : 0,
      };
      await onSave(payload);
    },
    enableReinitialize: true,
  });

  // Track whether we just transitioned from create → edit
  const prevProductRef = useRef(null);

  // Reset form when product changes or dialog opens
  useEffect(() => {
    if (visible) {
      const wasCreating = prevProductRef.current === null;
      prevProductRef.current = product;

      if (product) {
        formik.setValues({
          name: product.name || "",
          display_name: product.display_name || "",
          short_description: product.short_description || "",
          description: product.description || "",
          price: product.price ? Number(product.price) : null,
          discounted_price: product.discounted_price
            ? Number(product.discounted_price)
            : null,
          stock: product.stock ? Number(product.stock) : null,
          category_id: product.category_id || null,
          is_active: Boolean(product.is_active),
        });
        if (wasCreating) {
          // Auto-navigate to Portions tab after product creation
          setIsNewProductFlow(true);
          setActiveIndex(1);
        } else {
          // Normal edit — use the initialTab from parent (e.g. chip click)
          setActiveIndex(initialTab);
        }
      } else {
        setActiveIndex(0);
        setIsNewProductFlow(false);
        setPortionsCount(0);
        setModifiersDetected(false);
        formik.resetForm();
      }
    } else {
      prevProductRef.current = null;
      setIsNewProductFlow(false);
      setPortionsCount(0);
      setModifiersDetected(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, visible]);

  useEffect(() => {
    return () => {
      if (filePickerGuardTimerRef.current) {
        clearTimeout(filePickerGuardTimerRef.current);
      }
    };
  }, []);

  // Callbacks from panels
  const handlePortionsCountChange = useCallback((count) => {
    setPortionsCount(count);
  }, []);

  const handleModifiersCountChange = useCallback((count) => {
    if (count > 0) setModifiersDetected(true);
  }, []);

  // Check if field has error and is touched
  const isFieldInvalid = (fieldName) => {
    return formik.touched[fieldName] && formik.errors[fieldName];
  };

  // Get field error message
  const getErrorMessage = (fieldName) => {
    return formik.touched[fieldName] && formik.errors[fieldName] ? (
      <small className="text-red-500 text-xs mt-1 block">
        {formik.errors[fieldName]}
      </small>
    ) : null;
  };

  // ── Wizard navigation handlers ──

  const handleContinueToModifiers = () => {
    if (portionsCount === 0) {
      confirmDialog({
        message:
          "You haven't added any portions yet. Are you sure you want to skip? You can always add them later from the edit screen.",
        header: "Skip Portions?",
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Yes, Skip",
        rejectLabel: "Go Back",
        acceptClassName:
          "admin-btn-primary px-4 py-2 rounded-lg text-sm font-medium",
        rejectClassName:
          "admin-btn-secondary px-4 py-2 rounded-lg text-sm font-medium",
        accept: () => setActiveIndex(2),
      });
    } else {
      setActiveIndex(2);
    }
  };

  const handleContinueToImages = () => {
    if (!modifiersDetected) {
      confirmDialog({
        message:
          "You haven't added any modifiers yet. Are you sure you want to skip? You can always add them later from the edit screen.",
        header: "Skip Modifiers?",
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Yes, Skip",
        rejectLabel: "Go Back",
        acceptClassName:
          "admin-btn-primary px-4 py-2 rounded-lg text-sm font-medium",
        rejectClassName:
          "admin-btn-secondary px-4 py-2 rounded-lg text-sm font-medium",
        accept: () => setActiveIndex(3),
      });
    } else {
      setActiveIndex(3);
    }
  };

  // ── Dynamic dialog title ──
  const getDialogTitle = () => {
    if (!isEditing) return "Add New Product";
    if (isNewProductFlow) {
      if (activeIndex === 0) return "Edit Product";
      if (activeIndex === 1) return "Add Portions";
      if (activeIndex === 2) return "Add Modifiers";
      if (activeIndex === 3) return "Add Images";
      return "Edit Product";
    }
    return "Edit Product";
  };

  // ── Dynamic footer based on tab + flow ──
  const footerContent = (
    <div className="flex justify-end gap-3 mt-4">
      {/* ── Tab 0: Basic Info ── */}
      {activeIndex === 0 && (
        <>
          <Button
            type="button"
            label="Close"
            onClick={handleDialogHide}
            disabled={saving}
            className="admin-btn-secondary px-4 py-2 rounded-lg font-medium transition-colors"
            pt={{ root: { className: "border-none bg-transparent" } }}
          />
          {!isEditing ? (
            // Creation: "Continue" saves product then moves to portions
            <Button
              type="submit"
              label={saving ? "Saving..." : "Continue"}
              onClick={formik.handleSubmit}
              disabled={saving || formik.isSubmitting}
              className="admin-btn-primary px-5 py-2 rounded-lg font-medium shadow-sm transition-colors"
              pt={{
                root: { className: "flex items-center justify-center gap-2" },
              }}
            >
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            // Editing: regular "Save"
            <Button
              type="submit"
              label={saving ? "Saving..." : "Save"}
              onClick={formik.handleSubmit}
              disabled={saving || formik.isSubmitting}
              className="admin-btn-primary px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
              pt={{ root: { className: "flex items-center justify-center" } }}
            />
          )}
        </>
      )}

      {/* ── Tab 1: Portions ── */}
      {activeIndex === 1 && (
        <>
          {isNewProductFlow ? (
            <>
              <Button
                type="button"
                label="Skip"
                onClick={handleContinueToModifiers}
                className="admin-btn-secondary px-4 py-2 rounded-lg font-medium transition-colors"
                pt={{ root: { className: "border-none bg-transparent" } }}
              />
              <Button
                type="button"
                label="Continue"
                onClick={handleContinueToModifiers}
                disabled={portionsCount === 0}
                className="admin-btn-primary px-5 py-2 rounded-lg font-medium shadow-sm transition-colors"
                pt={{
                  root: { className: "flex items-center justify-center gap-2" },
                }}
              >
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          ) : (
            <Button
              type="button"
              label="Close"
              onClick={handleDialogHide}
              className="admin-btn-secondary px-4 py-2 rounded-lg font-medium transition-colors"
              pt={{ root: { className: "border-none bg-transparent" } }}
            />
          )}
        </>
      )}

      {/* ── Tab 2: Modifiers ── */}
      {activeIndex === 2 && (
        <>
          {isNewProductFlow ? (
            <>
              <Button
                type="button"
                label="Skip"
                onClick={handleContinueToImages}
                className="admin-btn-secondary px-4 py-2 rounded-lg font-medium transition-colors"
                pt={{ root: { className: "border-none bg-transparent" } }}
              />
              <Button
                type="button"
                label="Continue"
                onClick={handleContinueToImages}
                disabled={!modifiersDetected}
                className="admin-btn-primary px-5 py-2 rounded-lg font-medium shadow-sm transition-colors"
                pt={{
                  root: { className: "flex items-center justify-center gap-2" },
                }}
              >
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          ) : (
            <Button
              type="button"
              label="Close"
              onClick={handleDialogHide}
              className="admin-btn-secondary px-4 py-2 rounded-lg font-medium transition-colors"
              pt={{ root: { className: "border-none bg-transparent" } }}
            />
          )}
        </>
      )}

      {/* ── Tab 3: Images ── */}
      {activeIndex === 3 && (
        <>
          {isNewProductFlow ? (
            <Button
              type="button"
              label="Save & Close"
              onClick={handleDialogHide}
              className="admin-btn-primary px-5 py-2 rounded-lg font-medium shadow-sm transition-colors"
              pt={{ root: { className: "flex items-center justify-center" } }}
            />
          ) : (
            <Button
              type="button"
              label="Close"
              onClick={handleDialogHide}
              className="admin-btn-secondary px-4 py-2 rounded-lg font-medium transition-colors"
              pt={{ root: { className: "border-none bg-transparent" } }}
            />
          )}
        </>
      )}
    </div>
  );

  return (
    <Dialog
      header={getDialogTitle()}
      visible={visible}
      style={{ width: "65vw" }}
      breakpoints={{ "1200px": "75vw", "960px": "85vw", "641px": "95vw" }}
      footer={footerContent}
      onHide={handleDialogHide}
      dismissableMask
      maximizable
      pt={{
        root: {
          className:
            "border-0 shadow-2xl rounded-2xl overflow-hidden admin-dialog",
        },
        header: {
          className: "admin-dialog-header px-6 py-5 border-b",
        },
        title: {
          className: "text-xl font-serif font-semibold",
        },
        content: { className: "p-0" },
        footer: {
          className: "admin-dialog-footer px-6 py-4 border-t rounded-b-2xl",
        },
        closeButton: {
          className:
            "w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors",
        },
        maximizableButton: {
          className:
            "w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors",
        },
      }}
    >
      <ConfirmDialog />

      <TabView
        activeIndex={activeIndex}
        onTabChange={(e) => setActiveIndex(e.index)}
        pt={{
          nav: {
            className:
              "admin-tabview-nav border-b border-gray-200 dark:border-gray-700 px-6",
          },
          panelContainer: { className: "p-6" },
        }}
      >
        {/* ════════════════════ Tab 1: Basic Info ════════════════════ */}
        <TabPanel header="Basic Info">
          <form
            onSubmit={formik.handleSubmit}
            autoComplete="off"
            className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2 font-sans"
          >
            {/* System Name field */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="name"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                System Name <span className="text-red-500">*</span>
              </label>
              <InputText
                id="name"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`admin-input w-full rounded-lg h-10 px-3 text-sm ${
                  isFieldInvalid("name") ? "p-invalid border-red-500" : ""
                }`}
                placeholder="e.g. iphone_15_pro"
              />
              {getErrorMessage("name")}
            </div>

            {/* Display Name field */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="display_name"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Display Name <span className="text-red-500">*</span>
              </label>
              <InputText
                id="display_name"
                name="display_name"
                value={formik.values.display_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`admin-input w-full rounded-lg h-10 px-3 text-sm ${
                  isFieldInvalid("display_name")
                    ? "p-invalid border-red-500"
                    : ""
                }`}
                placeholder="e.g. iPhone 15 Pro"
              />
              {getErrorMessage("display_name")}
            </div>

            {/* Category dropdown */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="category_id"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Category <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="category_id"
                name="category_id"
                value={formik.values.category_id}
                onChange={(e) => formik.setFieldValue("category_id", e.value)}
                onBlur={formik.handleBlur}
                options={categories}
                placeholder={
                  loadingCategories ? "Loading..." : "Select a Category"
                }
                disabled={loadingCategories}
                className={`admin-dropdown w-full ${
                  isFieldInvalid("category_id") ? "p-invalid" : ""
                }`}
                pt={{
                  root: {
                    className:
                      "admin-dropdown-root rounded-lg h-10 flex items-center shadow-none",
                  },
                  input: {
                    className: "px-3 text-sm",
                  },
                  trigger: { className: "w-10" },
                  panel: {
                    className: "admin-dropdown-panel rounded-lg shadow-xl mt-1",
                  },
                }}
              />
              {getErrorMessage("category_id")}
            </div>

            {/* Stock field */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="stock"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Stock Quantity <span className="text-red-500">*</span>
              </label>
              <InputNumber
                inputId="stock"
                name="stock"
                value={formik.values.stock}
                onValueChange={(e) => formik.setFieldValue("stock", e.value)}
                onBlur={formik.handleBlur}
                min={0}
                className={`admin-inputnumber-wrap w-full ${isFieldInvalid("stock") ? "p-invalid" : ""}`}
                pt={{
                  input: {
                    className:
                      "admin-input w-full rounded-lg h-10 px-3 text-sm",
                    autoComplete: "off",
                  },
                }}
              />
              {getErrorMessage("stock")}
            </div>

            {/* Short Description field - full width */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label
                htmlFor="short_description"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Short Description
              </label>
              <InputText
                id="short_description"
                name="short_description"
                value={formik.values.short_description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="admin-input w-full rounded-lg h-10 px-3 text-sm"
                placeholder="Brief overview of the product..."
              />
            </div>

            {/* Full Description field - full width */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label
                htmlFor="description"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Full Description
              </label>
              <InputTextarea
                id="description"
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                rows={3}
                className="admin-input w-full rounded-lg p-3 text-sm"
                placeholder="Detailed features and specifications..."
              />
            </div>

            {/* Original Price field */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="price"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Original Price <span className="text-red-500">*</span>
              </label>
              <InputNumber
                inputId="price"
                name="price"
                value={formik.values.price}
                onValueChange={(e) => formik.setFieldValue("price", e.value)}
                onBlur={formik.handleBlur}
                mode="currency"
                currency="INR"
                locale="en-IN"
                className={`admin-inputnumber-wrap w-full ${isFieldInvalid("price") ? "p-invalid" : ""}`}
                pt={{
                  input: {
                    className:
                      "admin-input w-full rounded-lg h-10 px-3 text-sm",
                    autoComplete: "off",
                  },
                }}
              />
              {getErrorMessage("price")}
            </div>

            {/* Discounted Price field */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="discounted_price"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Discounted Price
              </label>
              <InputNumber
                inputId="discounted_price"
                name="discounted_price"
                value={formik.values.discounted_price}
                onValueChange={(e) =>
                  formik.setFieldValue("discounted_price", e.value)
                }
                onBlur={formik.handleBlur}
                mode="currency"
                currency="INR"
                locale="en-IN"
                className={`admin-inputnumber-wrap w-full ${isFieldInvalid("discounted_price") ? "p-invalid" : ""}`}
                pt={{
                  input: {
                    className:
                      "admin-input w-full rounded-lg h-10 px-3 text-sm",
                    autoComplete: "off",
                  },
                }}
              />
              {getErrorMessage("discounted_price")}
            </div>

            {/* Active status switch - full width */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label
                htmlFor="is_active"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Active Status
              </label>
              <div className="flex items-center gap-3 mt-1">
                <InputSwitch
                  id="is_active"
                  checked={formik.values.is_active}
                  onChange={(e) => formik.setFieldValue("is_active", e.value)}
                  className="admin-status-switch"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formik.values.is_active
                    ? "Product is visible to customers"
                    : "Product is hidden from customers"}
                </span>
              </div>
            </div>
          </form>
        </TabPanel>

        {/* ════════════════════ Tab 2: Portions ════════════════════ */}
        <TabPanel header="Portions">
          {isEditing ? (
            <ProductPortionsPanel
              product={product}
              onCountChange={handlePortionsCountChange}
              onMutate={onMutate}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-4">
                <span className="text-amber-600 dark:text-amber-400 text-xl font-semibold">
                  !
                </span>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Save the product first
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                Click &quot;Continue&quot; on the Basic Info tab to save the
                product, then you can assign portions here.
              </p>
            </div>
          )}
        </TabPanel>

        {/* ════════════════════ Tab 3: Modifiers ════════════════════ */}
        <TabPanel header="Modifiers">
          {isEditing ? (
            <ProductModifiersPanel
              product={product}
              onCountChange={handleModifiersCountChange}
              onMutate={onMutate}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-4">
                <span className="text-amber-600 dark:text-amber-400 text-xl font-semibold">
                  !
                </span>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Save the product first
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                Click &quot;Continue&quot; on the Basic Info tab to save the
                product, then manage modifiers here.
              </p>
            </div>
          )}
        </TabPanel>

        {/* ════════════════════ Tab 4: Images ════════════════════ */}
        <TabPanel header="Images">
          {isEditing ? (
            <ProductImagesPanel
              product={product}
              onMutate={onMutate}
              onFilePickerStateChange={setFilePickerGuard}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-4">
                <span className="text-amber-600 dark:text-amber-400 text-xl font-semibold">
                  !
                </span>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Save the product first
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                Click &quot;Continue&quot; on the Basic Info tab to save the
                product, then upload images here.
              </p>
            </div>
          )}
        </TabPanel>
      </TabView>
    </Dialog>
  );
}

export default ProductFormModal;