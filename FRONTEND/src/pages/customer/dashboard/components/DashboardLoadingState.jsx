import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { Skeleton } from "primereact/skeleton";
import { cardPt, panelCardClassName } from "../constants";

function DashboardLoadingState() {
  return (
    <Card
      className={`${panelCardClassName} border-slate-200/80 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.65)] dark:border-[#1f2933]`}
      pt={cardPt}
    >
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <ProgressSpinner style={{ width: "24px", height: "24px" }} strokeWidth="4" />
          <div className="w-full max-w-xs">
            <Skeleton width="100%" height="0.95rem" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton height="5rem" borderRadius="14px" />
          <Skeleton height="5rem" borderRadius="14px" />
          <Skeleton height="5rem" borderRadius="14px" />
        </div>
      </div>
    </Card>
  );
}

export default DashboardLoadingState;
