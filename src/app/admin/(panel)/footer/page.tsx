import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireUser } from "@/lib/auth";
import { FOOTER_FIELDS } from "@/lib/fields";
import { getSetting } from "@/lib/settings";

export const metadata = { title: "Footer" };

export default function Page() {
  requireUser("content");
  return (
    <>
      <h1>Footer</h1>
      <p className="lead">Text, link columns and legal links shown at the bottom of every page.</p>
      <SettingsForm settingKey="footer" initial={getSetting("footer") as unknown as Record<string, unknown>} fields={FOOTER_FIELDS} />
    </>
  );
}
