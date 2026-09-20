import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireUser } from "@/lib/auth";
import { DISCORD_FIELDS } from "@/lib/fields";
import { getSetting } from "@/lib/settings";

export const metadata = { title: "Discord" };

export default function Page() {
  requireUser("content");
  return (
    <>
      <h1>Discord</h1>
      <p className="lead">The Discord section on the homepage and the Discord button in the footer.</p>
      <SettingsForm settingKey="discord" initial={getSetting("discord") as unknown as Record<string, unknown>} fields={DISCORD_FIELDS} />
    </>
  );
}
