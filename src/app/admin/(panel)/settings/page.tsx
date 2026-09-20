import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireUser } from "@/lib/auth";
import { SITE_FIELDS } from "@/lib/fields";
import { getSetting } from "@/lib/settings";
import { ImportExport } from "./ImportExport";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  requireUser("system");
  const { setupComplete: _s, ...site } = getSetting("site");
  return (
    <>
      <h1>Settings</h1>
      <p className="lead">The public address of your store, plus moving your configuration to another server.</p>
      <SettingsForm settingKey="site" initial={{ ...site, setupComplete: true }} fields={SITE_FIELDS} />
      <ImportExport />
    </>
  );
}
