"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createAdminAction, deleteAdminAction, setAdminPasswordAction, updateAdminAction } from "@/app/admin/actions";
import { Modal } from "@/components/admin/Modal";
import { Tag, useToast } from "@/components/admin/ui";
import { ROLES } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";

export type AdminRowT = { id: number; username: string; displayName: string; role: string; disabled: boolean; lastLogin: string | null };

export function AdminsManager({ rows, meId }: { rows: AdminRowT[]; meId: number }) {
  const router = useRouter();
  const toast = useToast();
  const [edit, setEdit] = useState<AdminRowT | "new" | null>(null);
  const [f, setF] = useState({ username: "", displayName: "", role: "editor", password: "", disabled: false });
  const [busy, setBusy] = useState(false);

  const open = (r: AdminRowT | "new") => { setEdit(r); setF(r === "new" ? { username: "", displayName: "", role: "editor", password: "", disabled: false } : { username: r.username, displayName: r.displayName, role: r.role, password: "", disabled: r.disabled }); };
  const done = (msg: string) => { toast(msg); setEdit(null); router.refresh(); };

  async function save() {
    setBusy(true);
    let r;
    if (edit === "new") r = await createAdminAction({ username: f.username, displayName: f.displayName, password: f.password, role: f.role });
    else if (edit) {
      r = await updateAdminAction(edit.id, { displayName: f.displayName, role: f.role, disabled: f.disabled });
      if (r.ok && f.password) r = await setAdminPasswordAction(edit.id, f.password);
    }
    setBusy(false);
    if (r?.ok) done("Saved"); else if (r) toast(r.error, "e");
  }

  return (
    <>
      <div className="row" style={{ marginBottom: "1rem" }}><button className="b p" onClick={() => open("new")}>Add admin</button></div>
      <div className="card tw" style={{ padding: 0 }}>
        <table className="t"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Last sign-in</th><th></th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}><td><b>{r.displayName || r.username}</b><div className="muted" style={{ color: "var(--mut)" }}>{r.username}{r.id === meId ? " (you)" : ""}</div></td><td><Tag kind="blue">{r.role}</Tag></td><td>{r.disabled ? <Tag kind="bad">Disabled</Tag> : <Tag kind="ok">Active</Tag>}</td><td>{r.lastLogin ? timeAgo(r.lastLogin) : "Never"}</td><td className="row end"><button className="b s" onClick={() => open(r)}>Edit</button></td></tr>
          ))}</tbody></table>
      </div>
      {edit ? (
        <Modal title={edit === "new" ? "Add admin" : edit.username} onClose={() => setEdit(null)}>
          {edit === "new" ? <div className="f"><label htmlFor="au">Username</label><input id="au" type="text" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} autoComplete="off" /></div> : null}
          <div className="f"><label htmlFor="ad">Display name</label><input id="ad" type="text" value={f.displayName} onChange={(e) => setF({ ...f, displayName: e.target.value })} /></div>
          <div className="f"><label htmlFor="ar">Role</label><select id="ar" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></div>
          <div className="f"><label htmlFor="ap">{edit === "new" ? "Password" : "New password (optional)"}</label><input id="ap" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" /><small>At least 10 characters. Changing it signs that user out everywhere.</small></div>
          {edit !== "new" ? <label className="chk f"><input type="checkbox" checked={f.disabled} onChange={(e) => setF({ ...f, disabled: e.target.checked })} />Disabled (cannot sign in)</label> : null}
          <div className="row between">
            <button className="b p" disabled={busy} onClick={save}>{busy ? "Saving..." : "Save"}</button>
            {edit !== "new" && edit.id !== meId ? <button className="b d" onClick={async () => { if (!window.confirm(`Delete ${edit.username}?`)) return; const r = await deleteAdminAction(edit.id); if (r.ok) done("Deleted"); else toast(r.error, "e"); }}>Delete</button> : null}
          </div>
        </Modal>
      ) : null}
    </>
  );
}
