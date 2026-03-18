import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import AddressFormFields from "./AddressFormFields";
import "../../../admin/AdminShared.css";

function AddAddressModal({
  addressForm,
  addingAddress,
  onChange,
  onHide,
  onSubmit,
  visible,
}) {
  return (
    <Dialog
      header="Add New Address"
      className="address-dialog"
      visible={visible}
      style={{ width: "92vw", maxWidth: "760px" }}
      breakpoints={{ "960px": "94vw", "641px": "96vw" }}
      onHide={onHide}
      dismissableMask
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
        content: { className: "px-6 py-6" },
        closeButton: {
          className:
            "w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors",
        },
      }}
    >
      <form onSubmit={onSubmit} className="address-dialog-form space-y-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Add an accurate delivery address for smooth order fulfillment.
        </p>
        <AddressFormFields
          form={addressForm}
          onChange={onChange}
          checkboxClassName="mt-1 flex items-center gap-3 text-sm text-gray-700 dark:text-slate-300"
        />
        <Divider className="!my-0 address-dialog-divider" />
        <div className="address-dialog-actions flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            label="Cancel"
            icon="pi pi-times"
            onClick={onHide}
            disabled={addingAddress}
            className="admin-btn-secondary !w-full !rounded-lg !px-4 !py-2 sm:!w-auto"
          />
          <Button
            type="submit"
            label={addingAddress ? "Adding..." : "Save Address"}
            icon="pi pi-check"
            disabled={addingAddress}
            loading={addingAddress}
            className="admin-btn-primary !w-full !rounded-lg !px-5 !py-2 sm:!w-auto"
          />
        </div>
      </form>
    </Dialog>
  );
}

export default AddAddressModal;
