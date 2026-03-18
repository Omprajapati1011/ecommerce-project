import { useEffect, useRef } from "react";
import { dashboardPlaceholderContent } from "../constants";
import AddressesSection from "./AddressesSection";
import DashboardLoadingState from "./DashboardLoadingState";
import HelpSupportPage from "./HelpSupportPage";
import OrdersPage from "./OrdersPage";
import PaymentsPage from "./PaymentsPage";
import PlaceholderSection from "./PlaceholderSection";
import SecuritySettingsPage from "./SecuritySettingsPage";
import UserDashboardHome from "./UserDashboardHome";
import UserProfilePage from "./UserProfilePage";
import UserReviewsPage from "./UserReviewsPage";

function DashboardContent({ currentUser, dashboard, showToast }) {
  const toastTrackerRef = useRef({
    dashboardError: "",
    orderItemsError: "",
    addressFormError: "",
    addressActionError: "",
    addressSuccess: "",
  });

  useEffect(() => {
    const message = dashboard.error || "";

    if (!message) {
      toastTrackerRef.current.dashboardError = "";
      return;
    }

    if (toastTrackerRef.current.dashboardError === message) {
      return;
    }

    toastTrackerRef.current.dashboardError = message;
    showToast?.("error", "Error", message);
  }, [dashboard.error, showToast]);

  useEffect(() => {
    const message = dashboard.orderItemsError || "";

    if (!message) {
      toastTrackerRef.current.orderItemsError = "";
      return;
    }

    if (toastTrackerRef.current.orderItemsError === message) {
      return;
    }

    toastTrackerRef.current.orderItemsError = message;
    showToast?.("error", "Error", message);
  }, [dashboard.orderItemsError, showToast]);

  useEffect(() => {
    const message = dashboard.addressFormError || "";

    if (!message) {
      toastTrackerRef.current.addressFormError = "";
      return;
    }

    if (toastTrackerRef.current.addressFormError === message) {
      return;
    }

    toastTrackerRef.current.addressFormError = message;
    showToast?.("error", "Error", message);
  }, [dashboard.addressFormError, showToast]);

  useEffect(() => {
    const message = dashboard.addressActionError || "";

    if (!message) {
      toastTrackerRef.current.addressActionError = "";
      return;
    }

    if (toastTrackerRef.current.addressActionError === message) {
      return;
    }

    toastTrackerRef.current.addressActionError = message;
    showToast?.("error", "Error", message);
  }, [dashboard.addressActionError, showToast]);

  useEffect(() => {
    const message = dashboard.addressFormSuccess || "";

    if (!message) {
      toastTrackerRef.current.addressSuccess = "";
      return;
    }

    if (toastTrackerRef.current.addressSuccess === message) {
      return;
    }

    toastTrackerRef.current.addressSuccess = message;
    showToast?.("success", "Success", message);
  }, [dashboard.addressFormSuccess, showToast]);

  if (dashboard.loading && dashboard.activeTab === "profile") {
    return <DashboardLoadingState />;
  }

  if (dashboard.activeTab === "dashboard") {
    return <UserDashboardHome showToast={showToast} />;
  }

  if (dashboard.activeTab === "profile") {
    return <UserProfilePage currentUser={currentUser} showToast={showToast} />;
  }

  if (dashboard.activeTab === "orders") {
    return <OrdersPage showToast={showToast} />;
  }

  if (dashboard.activeTab === "payments") {
    return <PaymentsPage showToast={showToast} />;
  }

  if (dashboard.activeTab === "addresses") {
    return (
      <AddressesSection
        addresses={dashboard.addresses}
        addressActionError={dashboard.addressActionError}
        addressForm={dashboard.addressForm}
        addressFormError={dashboard.addressFormError}
        addressFormSuccess={dashboard.addressFormSuccess}
        addingAddress={dashboard.addingAddress}
        defaultAddressId={dashboard.defaultAddressId}
        deletingAddressId={dashboard.deletingAddressId}
        loadingEditAddressId={dashboard.loadingEditAddressId}
        onAddAddressChange={dashboard.handleAddressInputChange}
        onAddAddressSubmit={dashboard.handleAddAddress}
        onDeleteAddress={dashboard.handleDeleteAddress}
        onOpenEditAddress={dashboard.handleOpenEditAddress}
        onSetDefaultAddress={dashboard.handleSetDefaultAddress}
        onToggleAddForm={dashboard.toggleAddAddressForm}
        settingDefaultAddressId={dashboard.settingDefaultAddressId}
        showAddAddressForm={dashboard.showAddAddressForm}
      />
    );
  }

  if (dashboard.activeTab === "reviews") {
    return <UserReviewsPage showToast={showToast} />;
  }

  if (dashboard.activeTab === "security") {
    return (
      <SecuritySettingsPage
        currentUser={currentUser}
        onProfileRefresh={dashboard.loadDashboardData}
        showToast={showToast}
      />
    );
  }

  if (dashboard.activeTab === "support") {
    return <HelpSupportPage />;
  }

  const activeContent = dashboardPlaceholderContent[dashboard.activeTab];

  if (!activeContent) {
    return null;
  }

  return (
    <PlaceholderSection title={activeContent.title} text={activeContent.text} />
  );
}

export default DashboardContent;
