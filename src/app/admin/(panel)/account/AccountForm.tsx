"use client";

import { useState } from "react";
import { changeOwnPasswordAction } from "@/app/admin/actions";
import { useToast } from "@/components/admin/ui";

export function AccountForm() {
  const toast = useToast();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="card" style={{ maxWidth: "28rem" }}>
      <h2>Change password</h2>
      <div className="f"><label htmlFor="cp">Current password</label><input id="cp" type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" /></div>
      <div className="f"><label htmlFor="np">New password</label><input id="np" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" /><small>At least 10 characters.</small></div>
      <button className="b p" disabled={busy || !cur || !next} onClick={async () => { setBusy(true); const r = await changeOwnPasswordAction(cur, next); setBusy(false); if (r.ok) { toast("Password changed"); setCur(""); setNext(""); } else toast(r.error, "e"); }}>Change password</button>
    </div>
  );
}
