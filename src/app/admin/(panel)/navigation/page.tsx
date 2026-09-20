import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireUser } from "@/lib/auth";
import { NAV_FIELDS } from "@/lib/fields";
import { getSetting } from "@/lib/settings";

export const metadata = { title: "Navigation" };

export default function Page() {
  requireUser("content");
  return (
    <>
      <h1>Navigation</h1>
      <p className="lead">The menu at the top of your store. Drag to reorder, and add dropdown items under any menu item.</p>
      <SettingsForm settingKey="navigation" initial={getSetting("navigation") as unknown as Record<string, unknown>} fields={NAV_FIELDS} />
    </>
  );
}
