import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import AddAddressModal from "./AddAddressModal";
import AddressList from "./AddressList";
import { cardPt, panelCardClassName } from "../constants";

function AddressesSection({
  addresses,
  addressActionError,
  addressForm,
  addressFormError,
  addressFormSuccess,
  addingAddress,
  defaultAddressId,
  deletingAddressId,
  loadingEditAddressId,
  onAddAddressChange,
  onAddAddressSubmit,
  onDeleteAddress,
  onOpenEditAddress,
  onSetDefaultAddress,
  onToggleAddForm,
  settingDefaultAddressId,
  showAddAddressForm,
}) {
  const toolbarStart = (
    <div>
      <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100">
        Manage Addresses
      </h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Keep delivery details updated for faster checkout.
      </p>
    </div>
  );

  const toolbarEnd = (
    <Button
      type="button"
      onClick={onToggleAddForm}
      icon="pi pi-plus"
      label="Add New Address"
      className="!w-full !rounded-xl !bg-amber-500 !px-4 !py-2 !text-sm !font-semibold !text-[#132a29] hover:!bg-amber-400 sm:!w-auto"
    />
  );

  return (
    <Card
      className={`${panelCardClassName} border-slate-200/80 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.7)] dark:border-[#1f2933]`}
      pt={cardPt}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        {toolbarStart}
        {toolbarEnd}
      </div>

      {addresses.length === 0 ? (
        <Message
          className="w-full"
          severity="info"
          text="No addresses found yet. Add one to speed up your checkout."
        />
      ) : (
        <AddressList
          addresses={addresses}
          defaultAddressId={defaultAddressId}
          deletingAddressId={deletingAddressId}
          loadingEditAddressId={loadingEditAddressId}
          onDeleteAddress={onDeleteAddress}
          onOpenEditAddress={onOpenEditAddress}
          onSetDefaultAddress={onSetDefaultAddress}
          settingDefaultAddressId={settingDefaultAddressId}
        />
      )}

      <AddAddressModal
        visible={showAddAddressForm}
        addressForm={addressForm}
        addingAddress={addingAddress}
        onChange={onAddAddressChange}
        onSubmit={onAddAddressSubmit}
        onHide={onToggleAddForm}
      />
    </Card>
  );
}

export default AddressesSection;
