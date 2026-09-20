import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireUser } from "@/lib/auth";
import { SOCIAL_FIELDS } from "@/lib/fields";
import { getSetting } from "@/lib/settings";

export const metadata = { title: "Social links" };

export default function Page() {
  requireUser("content");
  return (
    <>
      <h1>Social links</h1>
      <p className="lead">Links to your communities. They appear in the footer.</p>
      <SettingsForm settingKey="social" initial={getSetting("social") as unknown as Record<string, unknown>} fields={SOCIAL_FIELDS} />
    </>
  );
}
