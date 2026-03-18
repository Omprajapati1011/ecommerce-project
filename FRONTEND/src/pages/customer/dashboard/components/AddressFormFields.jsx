import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputSwitch } from "primereact/inputswitch";

function AddressFormFields({
  checkboxClassName = "flex items-center gap-3 text-sm text-gray-700 dark:text-slate-300",
  form,
  onChange,
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="full_name"
            className="text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            Full Name <span className="text-red-500">*</span>
          </label>
          <InputText
            id="full_name"
            name="full_name"
            value={form.full_name}
            onChange={onChange}
            className="admin-input w-full rounded-lg h-10 px-3 text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="phone"
            className="text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            Phone (10 digits) <span className="text-red-500">*</span>
          </label>
          <InputText
            id="phone"
            name="phone"
            value={form.phone}
            onChange={onChange}
            className="admin-input w-full rounded-lg h-10 px-3 text-sm"
          />
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <label
            htmlFor="address_line1"
            className="text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            Address Line 1 <span className="text-red-500">*</span>
          </label>
          <InputTextarea
            id="address_line1"
            name="address_line1"
            value={form.address_line1}
            onChange={onChange}
            rows={2}
            className="admin-input w-full rounded-lg p-3 text-sm"
          />
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <label
            htmlFor="address_line2"
            className="text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            Address Line 2
          </label>
          <InputTextarea
            id="address_line2"
            name="address_line2"
            value={form.address_line2}
            onChange={onChange}
            rows={2}
            className="admin-input w-full rounded-lg p-3 text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="city"
            className="text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            City <span className="text-red-500">*</span>
          </label>
          <InputText
            id="city"
            name="city"
            value={form.city}
            onChange={onChange}
            className="admin-input w-full rounded-lg h-10 px-3 text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="state"
            className="text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            State <span className="text-red-500">*</span>
          </label>
          <InputText
            id="state"
            name="state"
            value={form.state}
            onChange={onChange}
            className="admin-input w-full rounded-lg h-10 px-3 text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="postal_code"
            className="text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            Postal Code <span className="text-red-500">*</span>
          </label>
          <InputText
            id="postal_code"
            name="postal_code"
            value={form.postal_code}
            onChange={onChange}
            className="admin-input w-full rounded-lg h-10 px-3 text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="country"
            className="text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            Country
          </label>
          <InputText
            id="country"
            name="country"
            value={form.country}
            onChange={onChange}
            className="admin-input w-full rounded-lg h-10 px-3 text-sm"
          />
        </div>
      </div>

      <div
        className={`${checkboxClassName} rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800`}
      >
        <InputSwitch
          inputId="is_default"
          checked={form.is_default}
          onChange={(event) =>
            onChange({
              target: {
                name: "is_default",
                type: "checkbox",
                checked: Boolean(event.value),
                value: Boolean(event.value),
              },
            })
          }
        />
        <div className="space-y-0.5">
          <label
            htmlFor="is_default"
            className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-200"
          >
            Set as default address
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Use this address automatically during checkout.
          </p>
        </div>
      </div>
    </>
  );
}

export default AddressFormFields;
