import { Card } from "primereact/card";
import { Chip } from "primereact/chip";
import { cardPt, metricCardClassName } from "../constants";
import { formatCurrency } from "../utils";
import OrdersTableSection from "./OrdersTableSection";

function DashboardOverviewSection({
  onOpenOrderDetails,
  orderMetrics,
  recentOrders,
}) {
  const metrics = [
    { label: "Total Orders", value: orderMetrics.totalOrders },
    { label: "Completed", value: orderMetrics.completedOrders },
    { label: "Open Orders", value: orderMetrics.openOrders },
    {
      label: "Total Spent",
      value: formatCurrency(orderMetrics.totalSpent),
      valueClassName: "text-xl",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className={metricCardClassName} pt={cardPt}>
            <Chip
              label={metric.label}
              className="!bg-gray-200 !text-[11px] !font-medium !uppercase !tracking-[0.08em] !text-gray-700 dark:!bg-slate-700 dark:!text-slate-200"
            />
            <p
              className={`mt-2 font-accent font-semibold text-gray-900 dark:text-slate-100 ${
                metric.valueClassName || "text-3xl"
              }`}
            >
              {metric.value}
            </p>
          </Card>
        ))}
      </div>

      <OrdersTableSection
        title="Recent Orders"
        rows={recentOrders}
        onOrderClick={onOpenOrderDetails}
      />
    </div>
  );
}

export default DashboardOverviewSection;
