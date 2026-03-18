import { useCallback, useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { ProgressSpinner } from "primereact/progressspinner";
import api from "../../../../../api/api";
import ChangePasswordForm from "./ChangePasswordForm";

const extractData = (response) => response?.data?.data ?? null;

const extractMessage = (response, fallback) =>
  response?.data?.message || response?.data?.data?.message || fallback;

const extractErrorMessage = (error, fallback) => {
  const responseData = error?.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  if (responseData?.message) {
    return responseData.message;
  }

  const errors = responseData?.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    return errors
      .map((entry) => entry?.message || "Invalid value")
      .join(" | ");
  }

  return error?.message || fallback;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SecuritySettingsPage({ currentUser, onProfileRefresh, showToast }) {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [otpRequestedEmail, setOtpRequestedEmail] = useState("");

  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [requestingDeleteOtp, setRequestingDeleteOtp] = useState(false);
  const [verifyingDeleteOtp, setVerifyingDeleteOtp] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteOtpToken, setDeleteOtpToken] = useState("");
  const [deleteOtpRequestedEmail, setDeleteOtpRequestedEmail] = useState("");

  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);

    try {
      const response = await api.get("/users/view-profile");
      const payload = extractData(response);
      const normalized = Array.isArray(payload) ? payload[0] : payload;
      const profileEmail = normalized?.email || currentUser?.email || "";
      setCurrentEmail(String(profileEmail || "").trim().toLowerCase());
    } catch (error) {
      setErrorMessage(
        extractErrorMessage(error, "Failed to load security details."),
      );
    } finally {
      setLoadingProfile(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!infoMessage) {
      return;
    }

    showToast?.("success", "Success", infoMessage);
  }, [infoMessage, showToast]);

  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    showToast?.("error", "Error", errorMessage);
  }, [errorMessage, showToast]);

  const handleRequestEmailOtp = useCallback(async () => {
    const normalized = newEmail.trim().toLowerCase();
    setInfoMessage("");
    setErrorMessage("");

    if (!normalized) {
      setErrorMessage("Please enter a new email.");
      return;
    }

    if (!emailPattern.test(normalized)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (normalized === currentEmail) {
      setErrorMessage("New email must be different from current email.");
      return;
    }

    setRequestingOtp(true);
    try {
      const response = await api.post("/users/change-email/request-otp", {
        newEmail: normalized,
      });
      const payload = extractData(response);
      const token = payload?.otpToken || response?.data?.otpToken || "";

      if (!token) {
        setErrorMessage("OTP token missing from server response.");
        return;
      }

      setOtpToken(token);
      setOtpRequestedEmail(normalized);
      setOtp("");
      setInfoMessage(extractMessage(response, "OTP sent to your new email."));
    } catch (error) {
      setErrorMessage(
        extractErrorMessage(error, "Failed to send OTP to new email."),
      );
    } finally {
      setRequestingOtp(false);
    }
  }, [currentEmail, newEmail]);

  const handleVerifyEmailOtp = useCallback(async () => {
    setInfoMessage("");
    setErrorMessage("");

    if (!otpToken || !otpRequestedEmail) {
      setErrorMessage("Please request OTP first.");
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setErrorMessage("OTP must be 6 digits.");
      return;
    }

    setVerifyingOtp(true);
    try {
      const response = await api.post("/users/change-email/verify-otp", {
        newEmail: otpRequestedEmail,
        otp: otp.trim(),
        otpToken,
      });

      setCurrentEmail(otpRequestedEmail);
      setNewEmail("");
      setOtp("");
      setOtpToken("");
      setOtpRequestedEmail("");
      setInfoMessage(
        extractMessage(response, "Email changed successfully. Please login again."),
      );

      await onProfileRefresh?.();

      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("currentUser");
        window.location.href = "/login";
      }, 1100);
    } catch (error) {
      setErrorMessage(
        extractErrorMessage(error, "Failed to verify OTP for email change."),
      );
    } finally {
      setVerifyingOtp(false);
    }
  }, [onProfileRefresh, otp, otpRequestedEmail, otpToken]);

  const handlePasswordUpdate = useCallback(async (payload) => {
    setUpdatingPassword(true);
    setInfoMessage("");
    setErrorMessage("");

    try {
      const response = await api.patch("/users/update-password", payload);
      setInfoMessage(
        extractMessage(response, "Password changed successfully. Please login again."),
      );

      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("currentUser");
        window.location.href = "/login";
      }, 1100);

      return true;
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, "Failed to update password."));
      return false;
    } finally {
      setUpdatingPassword(false);
    }
  }, []);

  const handleRequestDeleteOtp = useCallback(async () => {
    const normalized = deleteEmail.trim().toLowerCase();
    setInfoMessage("");
    setErrorMessage("");

    if (!normalized) {
      setErrorMessage("Please enter your account email.");
      return;
    }

    if (!emailPattern.test(normalized)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (normalized !== currentEmail) {
      setErrorMessage("Please enter your current account email.");
      return;
    }

    setRequestingDeleteOtp(true);
    try {
      const response = await api.post("/users/delete-account/request-otp", {
        email: normalized,
      });
      const payload = extractData(response);
      const token = payload?.otpToken || response?.data?.otpToken || "";

      if (!token) {
        setErrorMessage("OTP token missing from server response.");
        return;
      }

      setDeleteOtpToken(token);
      setDeleteOtpRequestedEmail(normalized);
      setDeleteOtp("");
      setInfoMessage(
        extractMessage(response, "OTP sent to your email for account deletion."),
      );
    } catch (error) {
      setErrorMessage(
        extractErrorMessage(error, "Failed to send account deletion OTP."),
      );
    } finally {
      setRequestingDeleteOtp(false);
    }
  }, [currentEmail, deleteEmail]);

  const handleVerifyDeleteOtp = useCallback(async () => {
    setInfoMessage("");
    setErrorMessage("");

    if (!deleteOtpToken || !deleteOtpRequestedEmail) {
      setErrorMessage("Please request OTP first.");
      return;
    }

    if (!/^\d{6}$/.test(deleteOtp.trim())) {
      setErrorMessage("OTP must be 6 digits.");
      return;
    }

    setVerifyingDeleteOtp(true);
    try {
      const response = await api.post("/users/delete-account/verify-otp", {
        email: deleteOtpRequestedEmail,
        otp: deleteOtp.trim(),
        otpToken: deleteOtpToken,
      });

      setInfoMessage(extractMessage(response, "Account deleted successfully."));

      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("currentUser");
        window.location.href = "/login";
      }, 900);
    } catch (error) {
      setErrorMessage(
        extractErrorMessage(error, "Failed to verify OTP for account deletion."),
      );
    } finally {
      setVerifyingDeleteOtp(false);
    }
  }, [deleteOtp, deleteOtpRequestedEmail, deleteOtpToken]);

  if (loadingProfile) {
    return (
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.8)] dark:border-[#1f2933] dark:bg-[#151e22]">
        <div className="flex items-center gap-3">
          <ProgressSpinner style={{ width: "24px", height: "24px" }} strokeWidth="4" />
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Loading security settings...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_34px_-30px_rgba(15,23,42,0.85)] dark:border-[#1f2933] dark:bg-[#151e22]">
          <div className="flex items-center gap-2">
            <i className="pi pi-envelope text-amber-600 dark:text-amber-300" />
            <h3 className="font-serif text-xl text-slate-900 dark:text-slate-100">
              Change Email (OTP)
            </h3>
          </div>
          <Divider className="!my-3" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            OTP will be sent to your new email address for verification.
          </p>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="current_email"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Current Email
              </label>
              <InputText
                id="current_email"
                value={currentEmail}
                disabled
                className="w-full !rounded-xl !border-slate-300 !bg-slate-100 !px-3 !py-2.5 !text-slate-700 dark:!border-slate-600 dark:!bg-slate-800 dark:!text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="new_email"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                New Email
              </label>
              <InputText
                id="new_email"
                name="change_email_new"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="none"
                placeholder="Enter new email"
                className="w-full !rounded-xl !border-slate-300 !bg-slate-100 !px-3 !py-2.5 !text-slate-900 placeholder:!text-slate-500 focus:!border-amber-500 focus:!shadow-none dark:!border-slate-600 dark:!bg-slate-800 dark:!text-slate-100 dark:placeholder:!text-slate-400"
              />
            </div>

            <Button
              type="button"
              label={requestingOtp ? "Sending OTP..." : "Send OTP"}
              icon="pi pi-send"
              loading={requestingOtp}
              disabled={requestingOtp || verifyingOtp}
              onClick={handleRequestEmailOtp}
              className="!w-full !rounded-xl !bg-amber-500 !px-4 !py-2 !text-sm !font-semibold !text-[#132a29] hover:!bg-amber-400 sm:!w-auto"
            />

            {otpToken ? (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  OTP sent to: <span className="font-semibold">{otpRequestedEmail}</span>
                </p>
                <div className="space-y-1.5">
                  <label
                    htmlFor="email_change_otp"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Enter OTP
                  </label>
                  <InputText
                    id="email_change_otp"
                    value={otp}
                    maxLength={6}
                    onChange={(event) =>
                      setOtp(event.target.value.replace(/[^\d]/g, "").slice(0, 6))
                    }
                    placeholder="6-digit code"
                    className="w-full !rounded-xl !border-slate-300 !bg-white !px-3 !py-2.5 !text-slate-900 placeholder:!text-slate-500 focus:!border-amber-500 focus:!shadow-none dark:!border-slate-600 dark:!bg-slate-900 dark:!text-slate-100 dark:placeholder:!text-slate-400"
                  />
                </div>
                <Button
                  type="button"
                  label={verifyingOtp ? "Verifying..." : "Verify OTP & Update Email"}
                  icon="pi pi-check-circle"
                  loading={verifyingOtp}
                  disabled={requestingOtp || verifyingOtp}
                  onClick={handleVerifyEmailOtp}
                  className="!w-full !rounded-xl !bg-emerald-500 !px-4 !py-2 !text-sm !font-semibold !text-white hover:!bg-emerald-600"
                />
              </div>
            ) : null}
          </div>
        </Card>

        <ChangePasswordForm
          loading={updatingPassword}
          onSubmit={handlePasswordUpdate}
          onValidationError={setErrorMessage}
        />
      </div>

      <Card className="rounded-2xl border border-red-200/90 bg-red-50 p-6 shadow-[0_18px_34px_-30px_rgba(127,29,29,0.7)] dark:border-red-900 dark:bg-red-950/30">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-serif text-xl text-red-700 dark:text-red-300">Delete Account</h3>
          <i className="pi pi-exclamation-triangle text-red-600 dark:text-red-300" />
        </div>
        <Divider className="!my-3" />
        <p className="text-sm text-red-700/90 dark:text-red-200">
          To delete your account, enter your email and verify OTP sent to that email.
        </p>

        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <label
              htmlFor="delete_account_email"
              className="text-sm font-medium text-red-700 dark:text-red-200"
            >
              Account Email
            </label>
            <InputText
              id="delete_account_email"
              name="delete_account_email"
              value={deleteEmail}
              onChange={(event) => setDeleteEmail(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="none"
              placeholder="Enter your account email"
              className="w-full !rounded-xl !border-red-200 !bg-white !px-3 !py-2.5 !text-slate-900 placeholder:!text-slate-500 focus:!border-red-400 focus:!shadow-none dark:!border-red-800 dark:!bg-slate-900 dark:!text-slate-100 dark:placeholder:!text-slate-400"
            />
          </div>

          <Button
            type="button"
            label={requestingDeleteOtp ? "Sending OTP..." : "Send Delete OTP"}
            icon="pi pi-send"
            severity="danger"
            loading={requestingDeleteOtp}
            disabled={requestingDeleteOtp || verifyingDeleteOtp}
            onClick={handleRequestDeleteOtp}
            className="!w-full !rounded-xl sm:!w-auto"
          />

          {deleteOtpToken ? (
            <div className="space-y-3 rounded-xl border border-red-200 bg-white p-3 dark:border-red-800 dark:bg-slate-900">
              <p className="text-xs text-red-700 dark:text-red-200">
                OTP sent to: <span className="font-semibold">{deleteOtpRequestedEmail}</span>
              </p>
              <div className="space-y-1.5">
                <label
                  htmlFor="delete_account_otp"
                  className="text-sm font-medium text-red-700 dark:text-red-200"
                >
                  Enter OTP
                </label>
                <InputText
                  id="delete_account_otp"
                  value={deleteOtp}
                  maxLength={6}
                  onChange={(event) =>
                    setDeleteOtp(
                      event.target.value.replace(/[^\d]/g, "").slice(0, 6),
                    )
                  }
                  placeholder="6-digit code"
                  className="w-full !rounded-xl !border-red-200 !bg-white !px-3 !py-2.5 !text-slate-900 placeholder:!text-slate-500 focus:!border-red-400 focus:!shadow-none dark:!border-red-800 dark:!bg-slate-900 dark:!text-slate-100 dark:placeholder:!text-slate-400"
                />
              </div>
              <Button
                type="button"
                label={verifyingDeleteOtp ? "Deleting..." : "Verify OTP & Delete Account"}
                icon="pi pi-trash"
                severity="danger"
                loading={verifyingDeleteOtp}
                disabled={requestingDeleteOtp || verifyingDeleteOtp}
                onClick={handleVerifyDeleteOtp}
                className="!w-full !rounded-xl"
              />
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

export default SecuritySettingsPage;
