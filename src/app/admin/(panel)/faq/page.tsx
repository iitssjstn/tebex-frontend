import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireUser } from "@/lib/auth";
import { FAQ_FIELDS } from "@/lib/fields";
import { getSetting } from "@/lib/settings";

export const metadata = { title: "FAQ" };

export default function Page() {
  requireUser("content");
  return (
    <>
      <h1>FAQ</h1>
      <p className="lead">Questions and answers for the FAQ page and the FAQ section on the homepage.</p>
      <SettingsForm settingKey="faq" initial={getSetting("faq") as unknown as Record<string, unknown>} fields={FAQ_FIELDS} />
    </>
  );
}
