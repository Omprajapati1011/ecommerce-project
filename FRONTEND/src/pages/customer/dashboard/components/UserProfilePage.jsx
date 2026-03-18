import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar } from "primereact/avatar";
import { Card } from "primereact/card";
import { Chip } from "primereact/chip";
import { ProgressSpinner } from "primereact/progressspinner";
import api from "../../../../../api/api";
import EditProfileForm from "./EditProfileForm";

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

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function ProfileInfoTile({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-[0_14px_24px_-28px_rgba(15,23,42,0.9)] dark:border-slate-700 dark:bg-slate-800/80">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <i className={`${icon} text-sm text-amber-600 dark:text-amber-300`} />
      </div>
      <p className="mt-2 break-all text-sm font-semibold text-slate-800 dark:text-slate-200">
        {value}
      </p>
    </div>
  );
}

function UserProfilePage({ currentUser, showToast }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await api.get("/users/view-profile");
      const payload = extractData(response);
      const normalized = Array.isArray(payload) ? payload[0] : payload;
      setProfile(normalized || null);
    } catch (error) {
      setErrorMessage(
        extractErrorMessage(
          error,
          "Failed to fetch profile details. Please refresh and try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

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

  const profileSummary = useMemo(
    () => ({
      name: profile?.name || currentUser?.name || "-",
      email: profile?.email || currentUser?.email || "-",
      role: profile?.role || currentUser?.role || "customer",
      lastLogin:
        formatDateTime(
          profile?.last_login ||
            profile?.lastLogin ||
            profile?.updated_at ||
            profile?.created_at,
        ) || "-",
    }),
    [currentUser?.email, currentUser?.name, currentUser?.role, profile],
  );

  const handleProfileUpdate = useCallback(
    async (payload) => {
      setUpdatingProfile(true);
      setInfoMessage("");
      setErrorMessage("");

      try {
        const response = await api.put("/users/update", payload);
        setInfoMessage(extractMessage(response, "Profile updated successfully."));
        await loadProfile();
      } catch (error) {
        setErrorMessage(
          extractErrorMessage(error, "Failed to update profile details."),
        );
      } finally {
        setUpdatingProfile(false);
      }
    },
    [loadProfile],
  );

  if (loading) {
    return (
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.8)] dark:border-[#1f2933] dark:bg-[#151e22]">
        <div className="flex items-center gap-3">
          <ProgressSpinner style={{ width: "24px", height: "24px" }} strokeWidth="4" />
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Loading profile details...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_38px_-30px_rgba(15,23,42,0.85)] dark:border-[#1f2933] dark:bg-[#151e22]">
        <div className="relative bg-gradient-to-r from-[#163332] to-[#1d4745] px-5 py-6 text-white sm:px-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_65%)]" />
          <div className="relative z-10 flex flex-wrap items-center gap-4">
            <Avatar
              shape="circle"
              size="xlarge"
              className="!bg-[#c9b88a]/15 !text-[#c9b88a]"
            >
              {(profileSummary.name || "U").charAt(0).toUpperCase()}
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-xs tracking-[0.18em] text-[#c9b88a]">ACCOUNT PROFILE</p>
              <h2 className="truncate font-serif text-xl text-white sm:text-2xl">{profileSummary.name}</h2>
              <p className="truncate text-sm text-slate-100/90">{profileSummary.email}</p>
            </div>
            <Chip
              label={profileSummary.role}
              className="!bg-white/15 !text-xs !font-semibold !uppercase !tracking-[0.08em] !text-white"
            />
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <ProfileInfoTile icon="pi pi-user" label="Name" value={profileSummary.name} />
            <ProfileInfoTile icon="pi pi-envelope" label="Email" value={profileSummary.email} />
            <ProfileInfoTile icon="pi pi-id-card" label="Role" value={profileSummary.role} />
            <ProfileInfoTile
              icon="pi pi-clock"
              label="Last Login"
              value={profileSummary.lastLogin}
            />
          </div>
        </div>
      </Card>

      <div className="grid gap-4">
        <EditProfileForm
          initialValues={{
            name: profileSummary.name === "-" ? "" : profileSummary.name,
          }}
          loading={updatingProfile}
          onSubmit={handleProfileUpdate}
          onValidationError={setErrorMessage}
        />
      </div>
    </div>
  );
}

export default UserProfilePage;
