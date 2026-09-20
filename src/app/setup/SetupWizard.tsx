"use client";

import { useState } from "react";

export function SetupWizard({ timezones, currencies }: { timezones: string[]; currencies: string[] }) {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [f, setF] = useState({ username: "", password: "", confirm: "", storeName: "", ip: "", discord: "", timezone: timezones[0], currency: currencies[0], publicToken: "", privateKey: "", gameServerSecret: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  function next() {
    setError("");
    if (step === 1) {
      if (!/^[A-Za-z0-9_.@-]{3,60}$/.test(f.username)) return setError("Username: use 3-60 letters, numbers or . _ @ -");
      if (f.password.length < 10) return setError("Use at least 10 characters for the password.");
      if (f.password !== f.confirm) return setError("The passwords do not match.");
    }
    if (step === 2 && !f.storeName.trim()) return setError("Enter a store name.");
    setStep(step + 1);
  }

  async function finish() {
    setBusy(true);
    setError("");
    const r = await fetch("/api/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) { location.href = "/admin"; return; }
    setBusy(false);
    setError(j.error ?? "Setup failed. Check the form and try again.");
  }

  return (
    <div>
      <div className="steps" aria-hidden>{[1, 2, 3].map((n) => <span key={n} data-on={n <= step} />)}</div>
      {step === 1 && (
        <>
          <h1>Welcome</h1>
          <p className="lead">Create the administrator account for your store. You will be the owner.</p>
          <div className="f"><label htmlFor="s-u">Username</label><input id="s-u" type="text" value={f.username} onChange={set("username")} autoComplete="username" /></div>
          <div className="f"><label htmlFor="s-p">Password</label><input id="s-p" type="password" value={f.password} onChange={set("password")} autoComplete="new-password" /><small>At least 10 characters.</small></div>
          <div className="f"><label htmlFor="s-c">Confirm password</label><input id="s-c" type="password" value={f.confirm} onChange={set("confirm")} autoComplete="new-password" /></div>
        </>
      )}
      {step === 2 && (
        <>
          <h1>Store setup</h1>
          <p className="lead">You can change all of this later in the admin panel.</p>
          <div className="f"><label htmlFor="s-n">Store name</label><input id="s-n" type="text" value={f.storeName} onChange={set("storeName")} /></div>
          <div className="f"><label htmlFor="s-ip">Server address</label><input id="s-ip" type="text" value={f.ip} onChange={set("ip")} placeholder="play.example.com" /></div>
          <div className="f"><label htmlFor="s-d">Discord link</label><input id="s-d" type="text" value={f.discord} onChange={set("discord")} placeholder="https://discord.gg/..." /></div>
          <div className="grid2">
            <div className="f"><label htmlFor="s-t">Timezone</label><select id="s-t" value={f.timezone} onChange={set("timezone")}>{timezones.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div className="f"><label htmlFor="s-cur">Currency</label><select id="s-cur" value={f.currency} onChange={set("currency")}>{currencies.map((t) => <option key={t}>{t}</option>)}</select></div>
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <h1>Connect Tebex</h1>
          <p className="lead">Optional. Until Tebex is connected the store shows editable demo products. In Tebex, open Developers &gt; API Keys.</p>
          <div className="f"><label htmlFor="s-pt">Public token</label><input id="s-pt" type="text" value={f.publicToken} onChange={set("publicToken")} autoComplete="off" /></div>
          <div className="f"><label htmlFor="s-pk">Private key</label><input id="s-pk" type="password" value={f.privateKey} onChange={set("privateKey")} autoComplete="off" /><small>Stored encrypted on the server. It is never sent to visitors.</small></div>
          <div className="f"><label htmlFor="s-gs">Game server secret (optional)</label><input id="s-gs" type="password" value={f.gameServerSecret} onChange={set("gameServerSecret")} autoComplete="off" /><small>Only needed for the Orders and Customers pages.</small></div>
        </>
      )}
      {error ? <p className="notice bad" role="alert">{error}</p> : null}
      <div className="row between" style={{ marginTop: "1rem" }}>
        {step > 1 ? <button type="button" className="b" onClick={() => setStep(step - 1)}>Back</button> : <span />}
        {step < 3 ? <button type="button" className="b p" onClick={next}>Continue</button> : <button type="button" className="b p" onClick={finish} disabled={busy}>{busy ? "Setting up..." : f.publicToken ? "Finish setup" : "Skip Tebex and finish"}</button>}
      </div>
    </div>
  );
}
