import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireUser } from "@/lib/auth";
import { SEO_FIELDS } from "@/lib/fields";
import { getSetting } from "@/lib/settings";

export const metadata = { title: "SEO" };

export default function Page() {
  requireUser("content");
  return (
    <>
      <h1>SEO</h1>
      <p className="lead">How your store appears in search results and when shared. Individual pages have their own SEO fields.</p>
      <SettingsForm settingKey="seo" initial={getSetting("seo") as unknown as Record<string, unknown>} fields={SEO_FIELDS} />
    </>
  );
}
