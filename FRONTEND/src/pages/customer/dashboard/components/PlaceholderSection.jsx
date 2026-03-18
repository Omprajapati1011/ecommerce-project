import { Card } from "primereact/card";
import { Message } from "primereact/message";
import { cardPt, panelCardClassName } from "../constants";

function PlaceholderSection({ text, title }) {
  return (
    <Card
      className={`${panelCardClassName} border-slate-200/80 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.75)] dark:border-[#1f2933]`}
      pt={cardPt}
    >
      <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
        <i className="pi pi-info-circle text-base" />
      </div>
      <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100">
        {title}
      </h2>
      <Message className="mt-4 w-full" severity="info" text={text} />
    </Card>
  );
}

export default PlaceholderSection;
