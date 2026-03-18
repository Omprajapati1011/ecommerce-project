import { Card } from "primereact/card";
import { Chip } from "primereact/chip";
import { Divider } from "primereact/divider";
import { cardPt, panelCardClassName } from "../constants";

function ProfileSection({ currentUser, profile }) {
  const fields = [
    { label: "Name", value: profile?.name || "-" },
    { label: "Email", value: profile?.email || currentUser?.email || "-" },
    { label: "Role", value: currentUser?.role || "customer" },
    { label: "User ID", value: currentUser?.user_id || "-" },
  ];

  return (
    <Card className={panelCardClassName} pt={cardPt}>
      <h2 className="font-serif text-2xl text-gray-900 dark:text-slate-100">
        Profile Details
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label} className="rounded-xl bg-gray-50 p-4 dark:bg-slate-800">
            <Chip
              label={field.label}
              className="!bg-slate-200 !text-[11px] !font-semibold !uppercase !tracking-[0.08em] !text-slate-700 dark:!bg-slate-700 dark:!text-slate-200"
            />
            <Divider className="!my-2" />
            <p className="mt-2 text-sm text-gray-800 dark:text-slate-200">
              {field.value}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default ProfileSection;
