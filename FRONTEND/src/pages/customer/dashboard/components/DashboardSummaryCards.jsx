import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";

function SummaryCard({ iconClass, iconToneClassName, label, loading, value }) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_32px_-26px_rgba(15,23,42,0.65)] dark:border-[#1f2933] dark:bg-[#151e22]">
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="font-accent text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <span
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconToneClassName}`}
          >
            <i className={`${iconClass} text-base`} />
          </span>
        </div>

        <div>
          {loading ? (
            <Skeleton width="5rem" height="1.9rem" />
          ) : (
            <p className="font-accent text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
              {value}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function DashboardSummaryCards({ loading, summary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <SummaryCard
        label="Total Orders"
        iconClass="pi pi-shopping-bag"
        iconToneClassName="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
        loading={loading}
        value={summary.totalOrders}
      />
      <SummaryCard
        label="Saved Addresses"
        iconClass="pi pi-map-marker"
        iconToneClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
        loading={loading}
        value={summary.savedAddresses}
      />
      <SummaryCard
        label="Active Offers"
        iconClass="pi pi-percentage"
        iconToneClassName="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
        loading={loading}
        value={summary.activeOffers}
      />
    </div>
  );
}

export default DashboardSummaryCards;
