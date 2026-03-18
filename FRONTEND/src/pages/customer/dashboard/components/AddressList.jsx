import AddressCard from "./AddressCard";

function AddressList({
  addresses,
  defaultAddressId,
  deletingAddressId,
  loadingEditAddressId,
  onDeleteAddress,
  onOpenEditAddress,
  onSetDefaultAddress,
  settingDefaultAddressId,
}) {
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      {addresses.map((address) => {
        const hasResolvedDefault =
          defaultAddressId !== null && defaultAddressId !== undefined;
        const isDefault = hasResolvedDefault
          ? Number(address.address_id) === Number(defaultAddressId)
          : Number(address.is_default) === 1;

        return (
          <AddressCard
            key={address.address_id}
            address={address}
            deletingAddressId={deletingAddressId}
            isDefault={isDefault}
            loadingEditAddressId={loadingEditAddressId}
            onDeleteAddress={onDeleteAddress}
            onOpenEditAddress={onOpenEditAddress}
            onSetDefaultAddress={onSetDefaultAddress}
            settingDefaultAddressId={settingDefaultAddressId}
          />
        );
      })}
    </div>
  );
}

export default AddressList;
