import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";

function EditProfileForm({ initialValues, loading, onSubmit, onValidationError }) {
  const [form, setForm] = useState({
    name: initialValues?.name || "",
  });

  useEffect(() => {
    setForm({
      name: initialValues?.name || "",
    });
  }, [initialValues?.name]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) {
      return "Name is required.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      onValidationError?.(validationError);
      return;
    }

    await onSubmit({
      name: form.name.trim(),
    });
  };

  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_34px_-30px_rgba(15,23,42,0.85)] dark:border-[#1f2933] dark:bg-[#151e22]">
      <div className="flex items-center gap-2">
        <i className="pi pi-user-edit text-amber-600 dark:text-amber-300" />
        <h3 className="font-serif text-xl text-slate-900 dark:text-slate-100">Edit Profile</h3>
      </div>
      <Divider className="!my-3" />
      <p className="text-xs text-slate-500 dark:text-slate-400">Update your display name.</p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="profile_name"
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Name
          </label>
          <InputText
            id="profile_name"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full !rounded-xl !border-slate-300 !bg-slate-100 !px-3 !py-2.5 !text-slate-900 placeholder:!text-slate-500 focus:!border-amber-500 focus:!shadow-none dark:!border-slate-600 dark:!bg-slate-800 dark:!text-slate-100 dark:placeholder:!text-slate-400"
          />
        </div>

        <Button
          type="submit"
          label={loading ? "Saving..." : "Save Changes"}
          icon="pi pi-save"
          disabled={loading}
          loading={loading}
          className="!w-full !rounded-xl !bg-amber-500 !px-4 !py-2 !text-sm !font-semibold !text-[#132a29] hover:!bg-amber-400 sm:!w-auto"
        />
      </form>
    </Card>
  );
}

export default EditProfileForm;
