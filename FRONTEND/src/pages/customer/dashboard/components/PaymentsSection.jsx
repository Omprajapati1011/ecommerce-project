import { Card } from "primereact/card";
import { Chip } from "primereact/chip";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Tag } from "primereact/tag";
import { cardPt, panelCardClassName } from "../constants";
import { formatCurrency, formatDate, paymentSeverity } from "../utils";

function PaymentsSection({ rows }) {
  const orderIdTemplate = (row) => row.order_number || `#${row.order_id}`;
  const amountTemplate = (row) => formatCurrency(row.total_amount);
  const dateTemplate = (row) => formatDate(row.created_at || row.placed_at);
  const paymentStatusTemplate = (row) => (
    <Tag
      value={row.payment_status || "unknown"}
      severity={paymentSeverity(row.payment_status)}
    />
  );

  return (
    <Card className={panelCardClassName} pt={cardPt}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-2xl text-gray-900 dark:text-slate-100">
          Payment Status
        </h2>
        <Chip
          label={`${rows?.length || 0} records`}
          className="!bg-slate-200 !text-xs !font-semibold !uppercase !tracking-[0.08em] !text-slate-700 dark:!bg-slate-700 dark:!text-slate-200"
        />
      </div>
      <DataTable
        value={rows}
        className="mt-5"
        emptyMessage="No payment records found."
        rows={8}
      >
        <Column field="order_number" header="Order" body={orderIdTemplate} />
        <Column field="total_amount" header="Amount" body={amountTemplate} />
        <Column
          field="payment_status"
          header="Payment"
          body={paymentStatusTemplate}
        />
        <Column field="created_at" header="Date" body={dateTemplate} />
      </DataTable>
    </Card>
  );
}

export default PaymentsSection;
