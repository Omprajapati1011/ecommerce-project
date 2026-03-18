import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Chip } from "primereact/chip";
import { Tag } from "primereact/tag";

function AddressCard({
  address,
  deletingAddressId,
  isDefault,
  loadingEditAddressId,
  onDeleteAddress,
  onOpenEditAddress,
  onSetDefaultAddress,
  settingDefaultAddressId,
}) {
  return (
    <Card className="h-full rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_30px_-28px_rgba(15,23,42,0.9)] dark:border-slate-700 dark:bg-slate-900/70">
      <div className="flex h-full flex-col gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
              {address.full_name}
            </p>
            <Chip
              label={address.phone}
              className="!h-7 !bg-slate-100 !text-xs !font-medium !text-slate-700 dark:!bg-slate-700 dark:!text-slate-200"
            />
            {isDefault && <Tag value="Default" severity="success" />}
          </div>

          <div className="mt-4 space-y-2 rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
            <p>
              <span className="font-medium">Address:</span> {address.address_line1}
              {address.address_line2 ? `, ${address.address_line2}` : ""}
            </p>
            <p>
              <span className="font-medium">City:</span> {address.city}
            </p>
            <p>
              <span className="font-medium">State:</span> {address.state}
            </p>
            <p>
              <span className="font-medium">Postal Code:</span> {address.postal_code}
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2 border-t border-slate-200/70 pt-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          {!isDefault && (
            <Button
              type="button"
              label={
                Number(settingDefaultAddressId) === Number(address.address_id)
                  ? "Setting..."
                  : "Set as Default"
              }
              icon="pi pi-check-circle"
              size="small"
              disabled={Number(settingDefaultAddressId) === Number(address.address_id)}
              onClick={() => onSetDefaultAddress(address.address_id)}
              className="!w-full !rounded-lg !bg-emerald-500 !px-3 !py-1.5 !text-xs !font-semibold !text-white hover:!bg-emerald-600 sm:!w-auto"
            />
          )}

          <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center">
            <Button
              type="button"
              label={
                Number(loadingEditAddressId) === Number(address.address_id)
                  ? "Loading..."
                  : "Edit"
              }
              icon="pi pi-pencil"
              outlined
              size="small"
              onClick={() => onOpenEditAddress(address)}
              disabled={Number(loadingEditAddressId) === Number(address.address_id)}
              className="!w-full !rounded-lg sm:!w-auto"
            />
            <Button
              type="button"
              label={
                Number(deletingAddressId) === Number(address.address_id)
                  ? "Deleting..."
                  : "Delete"
              }
              icon="pi pi-trash"
              severity="danger"
              outlined
              size="small"
              onClick={() => onDeleteAddress(address.address_id)}
              disabled={Number(deletingAddressId) === Number(address.address_id)}
              className="!w-full !rounded-lg sm:!w-auto"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default AddressCard;
