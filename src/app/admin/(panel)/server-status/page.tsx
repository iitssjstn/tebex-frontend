import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireUser } from "@/lib/auth";
import { SERVER_FIELDS } from "@/lib/fields";
import { getSetting } from "@/lib/settings";

export const metadata = { title: "Server status" };

export default function Page() {
  requireUser("content");
  return (
    <>
      <h1>Server status</h1>
      <p className="lead">The address the store checks for the live player count. If the status service cannot be reached, the store says so instead of showing a number.</p>
      <SettingsForm settingKey="server" initial={getSetting("server") as unknown as Record<string, unknown>} fields={SERVER_FIELDS} />
    </>
  );
}
