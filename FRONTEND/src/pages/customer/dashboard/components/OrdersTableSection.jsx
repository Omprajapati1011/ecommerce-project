import { Card } from "primereact/card";
import { Chip } from "primereact/chip";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Tag } from "primereact/tag";
import { cardPt, panelCardClassName } from "../constants";
import {
  formatCurrency,
  formatDate,
  orderSeverity,
  paymentSeverity,
} from "../utils";

function OrdersTableSection({ clickable = false, onOrderClick, rows, title }) {
  const statusTemplate = (row) => (
    <Tag
      value={row.order_status || "unknown"}
      severity={orderSeverity(row.order_status)}
    />
  );

  const paymentStatusTemplate = (row) => (
    <Tag
      value={row.payment_status || "unknown"}
      severity={paymentSeverity(row.payment_status)}
    />
  );

  const orderIdTemplate = (row) => row.order_number || `#${row.order_id}`;
  const amountTemplate = (row) => formatCurrency(row.total_amount);
  const dateTemplate = (row) => formatDate(row.created_at || row.placed_at);

  return (
    <Card className={panelCardClassName} pt={cardPt}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-2xl text-gray-900 dark:text-slate-100">{title}</h2>
        <Chip
          label={`${rows?.length || 0} orders`}
          className="!bg-slate-200 !text-xs !font-semibold !uppercase !tracking-[0.08em] !text-slate-700 dark:!bg-slate-700 dark:!text-slate-200"
        />
      </div>
      {clickable && (
        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
          Click any order row to view item details.
        </p>
      )}
      <DataTable
        value={rows}
        className="mt-5"
        emptyMessage="No orders found."
        stripedRows
        rows={8}
        onRowClick={clickable ? (event) => onOrderClick(event.data) : undefined}
        rowClassName={
          clickable
            ? () => "cursor-pointer hover:bg-amber-50 dark:hover:bg-[#1a2327]"
            : undefined
        }
      >
        <Column field="order_number" header="Order" body={orderIdTemplate} />
        <Column field="item_count" header="Items" body={(row) => row.item_count ?? 0} />
        <Column field="total_amount" header="Amount" body={amountTemplate} />
        <Column field="order_status" header="Order Status" body={statusTemplate} />
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

export default OrdersTableSection;
