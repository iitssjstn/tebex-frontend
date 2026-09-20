"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createBackupAction, deleteBackupAction } from "@/app/admin/actions";
import { useToast } from "@/components/admin/ui";
import { timeAgo } from "@/lib/utils";

export function BackupsPanel({ items }: { items: { name: string; size: number; createdAt: string }[] }) {
  const router = useRouter();
  const toast = useToast();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function restore(file: File) {
    if (!window.confirm("Restore this backup?\n\nEverything on the site is replaced by the backup: content, pages, admin users and images. Changes made since the backup are lost. A safety backup of the current state is created first.")) return;
    setBusy(true);
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch("/api/admin/restore", { method: "POST", body: fd });
    const j = await r.json();
    setBusy(false);
    if (r.ok) { toast("Backup restored. Signing you out."); setTimeout(() => (location.href = "/admin/login"), 1200); } else toast(j.error ?? "Restore failed.", "e");
    if (ref.current) ref.current.value = "";
  }

  return (
    <>
      <div className="row" style={{ marginBottom: "1rem" }}>
        <button className="b p" disabled={busy} onClick={async () => { setBusy(true); const r = await createBackupAction(); setBusy(false); if (r.ok) { toast("Backup created"); router.refresh(); } else toast(r.error, "e"); }}>{busy ? "Working..." : "Create backup"}</button>
        <label className="b" style={{ cursor: "pointer" }}>Restore from file<input ref={ref} type="file" accept=".zip,application/zip" hidden onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])} /></label>
      </div>
      <div className="notice warn">Restoring replaces the current site with the backup. The Tebex private key is encrypted with a key that stays on this server and is not in backups, so after restoring onto another server you need to enter it again.</div>
      <div className="card tw" style={{ padding: 0 }}>
        <table className="t"><thead><tr><th>Backup</th><th>Size</th><th>Created</th><th></th></tr></thead>
          <tbody>{items.map((b) => (
            <tr key={b.name}><td>{b.name}</td><td>{(b.size / 1024 / 1024).toFixed(1)} MB</td><td>{timeAgo(b.createdAt)}</td>
              <td className="row end"><a className="b s" href={`/api/admin/backup/${b.name}`}>Download</a><button className="b s d" onClick={async () => { if (!window.confirm("Delete this backup file?")) return; const r = await deleteBackupAction(b.name); if (r.ok) router.refresh(); else toast(r.error, "e"); }}>Delete</button></td></tr>
          ))}{!items.length ? <tr><td colSpan={4}><div className="empty-a">No backups yet.</div></td></tr> : null}</tbody></table>
      </div>
    </>
  );
}
