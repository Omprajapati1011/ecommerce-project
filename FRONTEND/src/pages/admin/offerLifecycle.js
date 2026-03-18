export const getOfferLifecycleMeta = (offer) => {
  if (!offer) {
    return {
      label: "-",
      className:
        "!bg-gray-100 !text-gray-700 dark:!bg-slate-800 dark:!text-slate-300",
    };
  }

  if (!offer.is_active) {
    return {
      label: "Inactive",
      className:
        "!bg-gray-100 !text-gray-700 dark:!bg-slate-800 dark:!text-slate-300",
    };
  }

  const now = new Date();
  const start = offer.start_date ? new Date(offer.start_date) : null;
  const end = offer.end_date ? new Date(offer.end_date) : null;

  if (start && !Number.isNaN(start.getTime()) && now < start) {
    return {
      label: "Upcoming",
      className:
        "!bg-blue-100 !text-blue-800 dark:!bg-blue-900/30 dark:!text-blue-300",
    };
  }

  if (end && !Number.isNaN(end.getTime()) && now > end) {
    return {
      label: "Expired",
      className:
        "!bg-red-100 !text-red-800 dark:!bg-red-900/30 dark:!text-red-300",
    };
  }

  return {
    label: "Running",
    className:
      "!bg-green-100 !text-green-800 dark:!bg-green-900/30 dark:!text-green-300",
  };
};
