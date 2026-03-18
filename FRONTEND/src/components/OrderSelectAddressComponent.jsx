import React, { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { RadioButton } from "primereact/radiobutton";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchUserAddress } from "../redux/slices/orderSlice";
import OrderSummaryComponent from "./OrderSummaryComponent";
import { MapPin, Plus, X } from "lucide-react";
import api from "../../api/api";
import "../styles/CheckoutFlow.css";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal","Delhi",
].map((s) => ({ label: s, value: s }));

const EMPTY_FORM = {
  full_name: "", phone: "", address_line1: "", address_line2: "",
  city: "", state: "", postal_code: "", country: "India",
};

const formatPersonName = (value = "") =>
  value.trim().split(/\s+/).filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");

export default function OrderSelectAddressComponent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => { dispatch(fetchUserAddress()); }, [dispatch]);

  const { userAddresses, loading, error } = useSelector((state) => state.order || {});

  useEffect(() => {
    if (!Array.isArray(userAddresses) || userAddresses.length === 0) {
      return;
    }

    setSelectedAddress((prev) => {
      if (
        prev &&
        userAddresses.some(
          (address) => Number(address.address_id) === Number(prev.address_id),
        )
      ) {
        return prev;
      }

      return (
        userAddresses.find((address) => Number(address.is_default) === 1) ||
        userAddresses[0]
      );
    });
  }, [userAddresses]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedAddress) return;
    navigate("/checkout/payment", { state: { selectedAddress } });
  };

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target?.value ?? e.value ?? e }));

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.full_name || !form.phone || !form.address_line1 || !form.city || !form.state || !form.postal_code) {
      setFormError("Please fill all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/users/add-address", form);
      dispatch(fetchUserAddress());
      setForm(EMPTY_FORM);
      setShowAddForm(false);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save address.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="order-flow-shell">
      <section className="order-flow-hero">
        <div className="order-flow-hero-content flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="order-flow-eyebrow">Step 1 of 3</p>
            <h2 className="order-flow-title">Select Delivery Address</h2>
            <p className="order-flow-text">
              Choose the address where your order should be delivered.
            </p>
          </div>
          <div className="order-flow-card-muted flex items-center gap-3 self-start md:self-auto">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              <MapPin className="h-6 w-6" />
            </span>
            <div>
              <p className="order-flow-stat-label">Saved Addresses</p>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-slate-100">
                {userAddresses?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="order-flow-grid">
        <div className="space-y-4">

          {/* Address selection card */}
          <div className="order-flow-card">
            <div className="mb-5 flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h3 className="order-flow-section-title">Delivery Address</h3>
                <p className="order-flow-section-copy">
                  Pick a saved address or add a new one below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowAddForm((v) => !v); setFormError(""); }}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
                  showAddForm
                    ? "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300"
                    : "border-[#2f7a6f]/60 bg-[#2f7a6f]/5 text-[#2f7a6f] hover:bg-[#2f7a6f]/10 dark:bg-[#2f7a6f]/10 dark:text-[#5eada3]"
                }`}
              >
                {showAddForm ? (
                  <><X className="h-4 w-4" /> Cancel</>
                ) : (
                  <><Plus className="h-4 w-4" /> Add New Address</>
                )}
              </button>
            </div>

            {loading && <div className="order-flow-empty">Loading addresses...</div>}
            {!loading && error && (
              <div className="order-flow-alert border-red-300/70 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </div>
            )}
            {!loading && !error && !userAddresses?.length && !showAddForm && (
              <div className="order-flow-empty">
                No addresses found. Click <strong>Add New Address</strong> to continue.
              </div>
            )}

            {!loading && !error && userAddresses?.map((address) => {
              const isSelected = selectedAddress?.address_id === address.address_id;
              return (
                <div
                  key={address.address_id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedAddress(address)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedAddress(address); }
                  }}
                  className={`cursor-pointer ${isSelected ? "order-flow-option order-flow-option-active" : "order-flow-option"}`}
                >
                  <div className="flex items-start gap-3">
                    <RadioButton
                      inputId={`addr-${address.address_id}`}
                      name="address"
                      value={address.address_id}
                      onChange={() => setSelectedAddress(address)}
                      checked={isSelected}
                    />
                    <label htmlFor={`addr-${address.address_id}`} className="w-full cursor-pointer">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-gray-900 dark:text-slate-100">
                          {formatPersonName(address.full_name)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-slate-400">{address.phone}</span>
                      </div>
                      <p className="m-0 mt-1.5 text-sm leading-6 text-gray-700 dark:text-slate-300">
                        {address.address_line1}{address.address_line2 ? `, ${address.address_line2}` : ""}
                      </p>
                      <p className="m-0 text-sm text-gray-500 dark:text-slate-400">
                        {address.city}, {address.state} — {address.postal_code}
                      </p>
                    </label>
                  </div>
                </div>
              );
            })}

            <Button
              type="submit"
              label="Continue to Payment"
              icon="pi pi-arrow-right"
              iconPos="right"
              disabled={!selectedAddress}
              className="order-flow-primary-button mt-2 w-full"
            />
          </div>

          {/* Add new address form */}
          {showAddForm && (
            <div className="order-flow-card animate-fade-in">
              <div className="mb-5">
                <h3 className="order-flow-section-title">New Delivery Address</h3>
                <p className="order-flow-section-copy">Fill in the details below to add a new address.</p>
              </div>

              {formError && (
                <div className="order-flow-alert border-red-300/70 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200 mb-4">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="order-flow-stat-label !text-[0.8rem] !text-gray-600 dark:!text-slate-400">Full Name *</label>
                  <InputText
                    value={form.full_name}
                    onChange={set("full_name")}
                    placeholder="e.g. Rahul Sharma"
                    className="!rounded-xl !border-gray-200 dark:!border-[#1f2933] !text-sm focus:!border-[#2f7a6f] focus:!shadow-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="order-flow-stat-label !text-[0.8rem] !text-gray-600 dark:!text-slate-400">Phone *</label>
                  <InputText
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder="10-digit mobile number"
                    className="!rounded-xl !border-gray-200 dark:!border-[#1f2933] !text-sm focus:!border-[#2f7a6f] focus:!shadow-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="order-flow-stat-label !text-[0.8rem] !text-gray-600 dark:!text-slate-400">Address Line 1 *</label>
                  <InputText
                    value={form.address_line1}
                    onChange={set("address_line1")}
                    placeholder="House / Flat no., Building, Street"
                    className="!rounded-xl !border-gray-200 dark:!border-[#1f2933] !text-sm focus:!border-[#2f7a6f] focus:!shadow-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="order-flow-stat-label !text-[0.8rem] !text-gray-600 dark:!text-slate-400">Address Line 2 <span className="normal-case font-normal">(optional)</span></label>
                  <InputText
                    value={form.address_line2}
                    onChange={set("address_line2")}
                    placeholder="Area, Colony, Locality"
                    className="!rounded-xl !border-gray-200 dark:!border-[#1f2933] !text-sm focus:!border-[#2f7a6f] focus:!shadow-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="order-flow-stat-label !text-[0.8rem] !text-gray-600 dark:!text-slate-400">City *</label>
                  <InputText
                    value={form.city}
                    onChange={set("city")}
                    placeholder="City"
                    className="!rounded-xl !border-gray-200 dark:!border-[#1f2933] !text-sm focus:!border-[#2f7a6f] focus:!shadow-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="order-flow-stat-label !text-[0.8rem] !text-gray-600 dark:!text-slate-400">Pincode *</label>
                  <InputText
                    value={form.postal_code}
                    onChange={set("postal_code")}
                    placeholder="6-digit pincode"
                    className="!rounded-xl !border-gray-200 dark:!border-[#1f2933] !text-sm focus:!border-[#2f7a6f] focus:!shadow-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="order-flow-stat-label !text-[0.8rem] !text-gray-600 dark:!text-slate-400">State *</label>
                  <Dropdown
                    value={form.state}
                    options={INDIAN_STATES}
                    onChange={(e) => setForm((prev) => ({ ...prev, state: e.value }))}
                    placeholder="Select State"
                    filter
                    className="!rounded-xl !border-gray-200 dark:!border-[#1f2933] !text-sm w-full"
                    panelClassName="!rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  type="button"
                  label={submitting ? "Saving..." : "Save Address"}
                  icon="pi pi-check"
                  loading={submitting}
                  onClick={handleAddAddress}
                  className="order-flow-primary-button"
                />
                <Button
                  type="button"
                  label="Cancel"
                  icon="pi pi-times"
                  onClick={() => { setShowAddForm(false); setFormError(""); setForm(EMPTY_FORM); }}
                  className="order-flow-neutral-button"
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <OrderSummaryComponent title="Current Cart Summary" />
        </div>
      </form>
    </div>
  );
}
