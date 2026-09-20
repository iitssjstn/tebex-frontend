import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminsManager, type AdminRowT } from "./AdminsManager";

export const metadata = { title: "Admins" };

export default function AdminsPage() {
  const me = requireUser("system");
  const rows = db().prepare("SELECT id, username, display_name AS displayName, role, disabled, last_login_at AS lastLogin FROM admin_users ORDER BY id").all() as { id: number; username: string; displayName: string; role: string; disabled: number; lastLogin: string | null }[];
  return (
    <>
      <h1>Admins</h1>
      <p className="lead">Owners can do everything. Admins manage the store, website and Tebex. Editors can only change website content.</p>
      <AdminsManager meId={me.id} rows={rows.map((r): AdminRowT => ({ ...r, disabled: !!r.disabled }))} />
    </>
  );
}
