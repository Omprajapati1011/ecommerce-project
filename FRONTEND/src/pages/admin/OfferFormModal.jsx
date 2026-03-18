import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputSwitch } from "primereact/inputswitch";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";

const OFFER_TYPES = [
  { label: "Flat Discount", value: "flat_discount" },
  { label: "First Order", value: "first_order" },
  { label: "Time Based", value: "time_based" },
  { label: "Category Discount", value: "category_discount" },
  { label: "Product Discount", value: "product_discount" },
];

const DISCOUNT_TYPES = [
  { label: "Percentage", value: "percentage" },
  { label: "Fixed Amount", value: "fixed_amount" },
];

function OfferFormModal({
  visible,
  onHide,
  form,
  onChange,
  onBlurField,
  errors = {},
  touched = {},
  products = [],
  categories = [],
  onSave,
  saving,
  isEditing,
}) {
  const showError = (field) => touched[field] && errors[field];

  return (
    <Dialog
      header={isEditing ? "Edit Offer" : "Create Offer"}
      visible={visible}
      onHide={onHide}
      draggable={false}
      style={{ width: "min(56rem, 95vw)" }}
      contentClassName="!pb-3"
      className="admin-dialog"
      pt={{
        root: { className: "admin-dialog rounded-2xl overflow-hidden" },
        header: { className: "admin-dialog-header px-6 py-4 border-b" },
        title: { className: "text-2xl font-serif text-gray-900 dark:text-slate-100" },
        content: { className: "px-6 py-5 font-sans" },
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="offer_name" className="block text-sm font-medium mb-1">
            Offer Name <span className="text-red-500">*</span>
          </label>
          <InputText
            id="offer_name"
            value={form.offer_name}
            onChange={(e) => onChange("offer_name", e.target.value)}
            onBlur={() => onBlurField("offer_name")}
            className="admin-input w-full"
            placeholder="Summer Sale 20%"
          />
          {showError("offer_name") && (
            <small className="text-red-500 text-xs mt-1 block">{errors.offer_name}</small>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <InputTextarea
            id="description"
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            onBlur={() => onBlurField("description")}
            className="admin-input w-full !h-auto"
            rows={3}
            autoResize
          />
          {showError("description") && (
            <small className="text-red-500 text-xs mt-1 block">{errors.description}</small>
          )}
        </div>

        {form.offer_type === "product_discount" && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Select Product <span className="text-red-500">*</span>
            </label>
            <Dropdown
              value={form.product_id}
              options={products}
              onChange={(e) => onChange("product_id", e.value)}
              onBlur={() => onBlurField("product_id")}
              optionLabel="label"
              optionValue="value"
              placeholder="Select Product"
              filter
              filterBy="label"
              filterPlaceholder="Search product..."
              showClear
              virtualScrollerOptions={{ itemSize: 40 }}
              className="w-full"
              panelClassName="admin-dropdown-panel rounded-lg"
              pt={{
                root: { className: "admin-dropdown-root rounded-lg h-10" },
                input: { className: "px-3 text-sm" },
                trigger: { className: "" },
              }}
            />
            {showError("product_id") && (
              <small className="text-red-500 text-xs mt-1 block">{errors.product_id}</small>
            )}
          </div>
        )}

        {form.offer_type === "category_discount" && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Select Category <span className="text-red-500">*</span>
            </label>
            <Dropdown
              value={form.category_id}
              options={categories}
              onChange={(e) => onChange("category_id", e.value)}
              onBlur={() => onBlurField("category_id")}
              optionLabel="label"
              optionValue="value"
              placeholder="Select Category"
              filter
              filterBy="label"
              filterPlaceholder="Search category..."
              showClear
              virtualScrollerOptions={{ itemSize: 40 }}
              className="w-full"
              panelClassName="admin-dropdown-panel rounded-lg"
              pt={{
                root: { className: "admin-dropdown-root rounded-lg h-10" },
                input: { className: "px-3 text-sm" },
                trigger: { className: "" },
              }}
            />
            {showError("category_id") && (
              <small className="text-red-500 text-xs mt-1 block">{errors.category_id}</small>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            Offer Type <span className="text-red-500">*</span>
          </label>
          <Dropdown
            value={form.offer_type}
            options={OFFER_TYPES}
            onChange={(e) => onChange("offer_type", e.value)}
            onBlur={() => onBlurField("offer_type")}
            optionLabel="label"
            optionValue="value"
            className="w-full"
            panelClassName="admin-dropdown-panel rounded-lg"
            pt={{
              root: { className: "admin-dropdown-root rounded-lg h-10" },
              input: { className: "px-3 text-sm" },
              trigger: { className: "" },
            }}
          />
          {showError("offer_type") && (
            <small className="text-red-500 text-xs mt-1 block">{errors.offer_type}</small>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Discount Type <span className="text-red-500">*</span>
          </label>
          <Dropdown
            value={form.discount_type}
            options={DISCOUNT_TYPES}
            onChange={(e) => onChange("discount_type", e.value)}
            onBlur={() => onBlurField("discount_type")}
            optionLabel="label"
            optionValue="value"
            className="w-full"
            panelClassName="admin-dropdown-panel rounded-lg"
            pt={{
              root: { className: "admin-dropdown-root rounded-lg h-10" },
              input: { className: "px-3 text-sm" },
              trigger: { className: "" },
            }}
          />
          {showError("discount_type") && (
            <small className="text-red-500 text-xs mt-1 block">{errors.discount_type}</small>
          )}
        </div>

        <div>
          <label htmlFor="discount_value" className="block text-sm font-medium mb-1">
            Discount Value <span className="text-red-500">*</span>
          </label>
          <InputText
            id="discount_value"
            type="number"
            min="0"
            value={form.discount_value}
            onChange={(e) => onChange("discount_value", e.target.value)}
            onBlur={() => onBlurField("discount_value")}
            className="admin-input w-full"
          />
          {showError("discount_value") && (
            <small className="text-red-500 text-xs mt-1 block">{errors.discount_value}</small>
          )}
        </div>

        <div>
          <label htmlFor="maximum_discount_amount" className="block text-sm font-medium mb-1">
            Maximum Discount Amount <span className="text-red-500">*</span>
          </label>
          <InputText
            id="maximum_discount_amount"
            type="number"
            min="0"
            value={form.maximum_discount_amount}
            onChange={(e) => onChange("maximum_discount_amount", e.target.value)}
            onBlur={() => onBlurField("maximum_discount_amount")}
            className="admin-input w-full"
          />
          {showError("maximum_discount_amount") && (
            <small className="text-red-500 text-xs mt-1 block">
              {errors.maximum_discount_amount}
            </small>
          )}
        </div>

        <div>
          <label htmlFor="min_purchase_amount" className="block text-sm font-medium mb-1">
            Min Purchase Amount{" "}
            {form.offer_type !== "product_discount" && (
              <span className="text-red-500">*</span>
            )}
          </label>
          <InputText
            id="min_purchase_amount"
            type="number"
            min="0"
            value={form.min_purchase_amount}
            onChange={(e) => onChange("min_purchase_amount", e.target.value)}
            onBlur={() => onBlurField("min_purchase_amount")}
            className="admin-input w-full"
          />
          {showError("min_purchase_amount") && (
            <small className="text-red-500 text-xs mt-1 block">
              {errors.min_purchase_amount}
            </small>
          )}
        </div>

        <div>
          <label htmlFor="usage_limit_per_user" className="block text-sm font-medium mb-1">
            Usage Limit Per User <span className="text-red-500">*</span>
          </label>
          <InputText
            id="usage_limit_per_user"
            type="number"
            min="1"
            value={form.usage_limit_per_user}
            onChange={(e) => onChange("usage_limit_per_user", e.target.value)}
            onBlur={() => onBlurField("usage_limit_per_user")}
            className="admin-input w-full"
          />
          {showError("usage_limit_per_user") && (
            <small className="text-red-500 text-xs mt-1 block">
              {errors.usage_limit_per_user}
            </small>
          )}
        </div>

        <div>
          <label htmlFor="start_date" className="block text-sm font-medium mb-1">
            Start Date <span className="text-red-500">*</span>
          </label>
          <InputText
            id="start_date"
            type="date"
            value={form.start_date}
            onChange={(e) => onChange("start_date", e.target.value)}
            onBlur={() => onBlurField("start_date")}
            className="admin-input admin-date-filter w-full"
          />
          {showError("start_date") && (
            <small className="text-red-500 text-xs mt-1 block">{errors.start_date}</small>
          )}
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-medium mb-1">
            End Date <span className="text-red-500">*</span>
          </label>
          <InputText
            id="end_date"
            type="date"
            value={form.end_date}
            onChange={(e) => onChange("end_date", e.target.value)}
            onBlur={() => onBlurField("end_date")}
            className="admin-input admin-date-filter w-full"
          />
          {showError("end_date") && (
            <small className="text-red-500 text-xs mt-1 block">{errors.end_date}</small>
          )}
        </div>

        <div>
          <label htmlFor="start_time" className="block text-sm font-medium mb-1">
            Start Time
          </label>
          <InputText
            id="start_time"
            type="time"
            value={form.start_time}
            onChange={(e) => onChange("start_time", e.target.value)}
            onBlur={() => onBlurField("start_time")}
            className="admin-input w-full"
          />
          {showError("start_time") && (
            <small className="text-red-500 text-xs mt-1 block">{errors.start_time}</small>
          )}
        </div>

        <div>
          <label htmlFor="end_time" className="block text-sm font-medium mb-1">
            End Time
          </label>
          <InputText
            id="end_time"
            type="time"
            value={form.end_time}
            onChange={(e) => onChange("end_time", e.target.value)}
            onBlur={() => onBlurField("end_time")}
            className="admin-input w-full"
          />
          {showError("end_time") && (
            <small className="text-red-500 text-xs mt-1 block">{errors.end_time}</small>
          )}
        </div>

        <div className="md:col-span-2 flex items-center gap-2 mt-1">
          <InputSwitch
            checked={Boolean(form.is_active)}
            onChange={(e) => onChange("is_active", e.value)}
            className="admin-status-switch"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button
          type="button"
          label="Close"
          className="admin-btn-secondary px-4 py-2 rounded-lg font-medium transition-colors"
          onClick={onHide}
          disabled={saving}
        />
        <Button
          type="button"
          icon={!saving ? "pi pi-arrow-right" : undefined}
          iconPos="right"
          label={saving ? "Saving..." : "Save Offer"}
          className="admin-btn-primary px-5 py-2 rounded-lg font-medium shadow-sm transition-colors"
          onClick={onSave}
          disabled={saving}
          pt={{ root: { className: "flex items-center justify-center gap-2 !px-5 !py-2" } }}
        />
      </div>
    </Dialog>
  );
}

export default OfferFormModal;
