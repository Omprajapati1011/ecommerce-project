import { useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { Password } from "primereact/password";

function ChangePasswordForm({ loading, onSubmit, onValidationError }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (
      !form.currentPassword.trim() ||
      !form.newPassword.trim() ||
      !form.confirmPassword.trim()
    ) {
      return "All password fields are required.";
    }

    if (form.newPassword.length < 8) {
      return "New password must be at least 8 characters.";
    }

    if (form.newPassword !== form.confirmPassword) {
      return "New password and confirm password do not match.";
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

    const success = await onSubmit({
      oldPassword: form.currentPassword,
      newPassword: form.newPassword,
      confirmPassword: form.confirmPassword,
    });

    if (success) {
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  };

  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_34px_-30px_rgba(15,23,42,0.85)] dark:border-[#1f2933] dark:bg-[#151e22]">
      <div className="flex items-center gap-2">
        <i className="pi pi-lock text-amber-600 dark:text-amber-300" />
        <h3 className="font-serif text-xl text-slate-900 dark:text-slate-100">
          Change Password
        </h3>
      </div>
      <Divider className="!my-3" />
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Use a strong password to secure your account.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="current_password"
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Current Password
          </label>
          <Password
            inputId="current_password"
            value={form.currentPassword}
            onChange={(event) => handleChange("currentPassword", event.target.value)}
            toggleMask
            feedback={false}
            pt={{
              input: {
                autoComplete: "current-password",
                name: "current_password",
              },
            }}
            className="w-full [&_.p-inputtext]:!w-full [&_.p-inputtext]:!rounded-xl [&_.p-inputtext]:!border-slate-300 [&_.p-inputtext]:!bg-slate-100 [&_.p-inputtext]:!px-3 [&_.p-inputtext]:!py-2.5 [&_.p-inputtext]:!text-slate-900 [&_.p-inputtext]:placeholder:!text-slate-500 [&_.p-inputtext]:focus:!border-amber-500 [&_.p-inputtext]:focus:!shadow-none dark:[&_.p-inputtext]:!border-slate-600 dark:[&_.p-inputtext]:!bg-slate-800 dark:[&_.p-inputtext]:!text-slate-100 dark:[&_.p-inputtext]:placeholder:!text-slate-400"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="new_password"
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            New Password
          </label>
          <Password
            inputId="new_password"
            value={form.newPassword}
            onChange={(event) => handleChange("newPassword", event.target.value)}
            toggleMask
            feedback={false}
            pt={{
              input: {
                autoComplete: "new-password",
                name: "new_password",
              },
            }}
            className="w-full [&_.p-inputtext]:!w-full [&_.p-inputtext]:!rounded-xl [&_.p-inputtext]:!border-slate-300 [&_.p-inputtext]:!bg-slate-100 [&_.p-inputtext]:!px-3 [&_.p-inputtext]:!py-2.5 [&_.p-inputtext]:!text-slate-900 [&_.p-inputtext]:placeholder:!text-slate-500 [&_.p-inputtext]:focus:!border-amber-500 [&_.p-inputtext]:focus:!shadow-none dark:[&_.p-inputtext]:!border-slate-600 dark:[&_.p-inputtext]:!bg-slate-800 dark:[&_.p-inputtext]:!text-slate-100 dark:[&_.p-inputtext]:placeholder:!text-slate-400"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirm_password"
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Confirm Password
          </label>
          <Password
            inputId="confirm_password"
            value={form.confirmPassword}
            onChange={(event) => handleChange("confirmPassword", event.target.value)}
            toggleMask
            feedback={false}
            pt={{
              input: {
                autoComplete: "new-password",
                name: "confirm_password",
              },
            }}
            className="w-full [&_.p-inputtext]:!w-full [&_.p-inputtext]:!rounded-xl [&_.p-inputtext]:!border-slate-300 [&_.p-inputtext]:!bg-slate-100 [&_.p-inputtext]:!px-3 [&_.p-inputtext]:!py-2.5 [&_.p-inputtext]:!text-slate-900 [&_.p-inputtext]:placeholder:!text-slate-500 [&_.p-inputtext]:focus:!border-amber-500 [&_.p-inputtext]:focus:!shadow-none dark:[&_.p-inputtext]:!border-slate-600 dark:[&_.p-inputtext]:!bg-slate-800 dark:[&_.p-inputtext]:!text-slate-100 dark:[&_.p-inputtext]:placeholder:!text-slate-400"
          />
        </div>
        <Button
          type="submit"
          label={loading ? "Updating..." : "Update Password"}
          icon="pi pi-key"
          disabled={loading}
          loading={loading}
          className="!w-full !rounded-xl !bg-amber-500 !px-4 !py-2 !text-sm !font-semibold !text-[#132a29] hover:!bg-amber-400 sm:!w-auto"
        />
      </form>
    </Card>
  );
}

export default ChangePasswordForm;
