"use client";

import { useState } from "react";

export function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const fd = new FormData(e.currentTarget);
        const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }) });
        const j = await r.json().catch(() => ({}));
        if (r.ok) location.href = "/admin";
        else { setBusy(false); setError(j.error ?? "Sign in failed."); }
      }}
    >
      <div className="f">
        <label htmlFor="u">Username</label>
        <input id="u" name="username" type="text" autoComplete="username" required autoFocus />
      </div>
      <div className="f">
        <label htmlFor="p">Password</label>
        <input id="p" name="password" type="password" autoComplete="current-password" required />
      </div>
      {error ? <p className="notice bad" role="alert">{error}</p> : null}
      <button className="b p" style={{ width: "100%" }} disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
    </form>
  );
}
