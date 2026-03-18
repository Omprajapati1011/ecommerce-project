import { Card } from "primereact/card";
import { Message } from "primereact/message";
import { cardPt, pageHeaderCardClassName } from "../constants";

function DashboardHeader({ error }) {
  return (
    <Card
      className={`${pageHeaderCardClassName} overflow-hidden border-slate-200/80 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)] dark:border-[#1f2933]`}
      pt={cardPt}
    >
      <div className="relative rounded-2xl bg-gradient-to-r from-[#123232] via-[#16403f] to-[#1a4e4b] p-5 text-white sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2),transparent_65%)]" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">
              Customer Dashboard
            </p>
            <h2 className="mt-2 font-serif text-2xl leading-tight text-white sm:text-3xl">
              Profile Dashboard
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-100/90">
              Track orders, saved addresses, offers, and account settings from a
              single, easy-to-manage workspace.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/95 backdrop-blur">
            <i className="pi pi-verified text-amber-200" />
            Account Center
          </div>
        </div>
      </div>

      {error && <Message className="mt-4 w-full" severity="error" text={error} />}
    </Card>
  );
}

export default DashboardHeader;
