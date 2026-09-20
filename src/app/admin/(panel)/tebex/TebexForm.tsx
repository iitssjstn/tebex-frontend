"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { disconnectTebexAction, saveTebexAction, testTebexAction } from "@/app/admin/actions";
import { Tag, useToast } from "@/components/admin/ui";

type Status = { publicToken: string; connected: boolean; storeName: string; lastTestAt: string; lastError: string; hasPrivateKey: boolean; hasSecret: boolean };

export function TebexForm({ status }: { status: Status }) {
  const router = useRouter();
  const toast = useToast();
  const [token, setToken] = useState(status.publicToken);
  const [pk, setPk] = useState("");
  const [gs, setGs] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(fn: () => ReturnType<typeof saveTebexAction>) {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (!r.ok) { setResult({ ok: false, text: r.error }); return toast(r.error, "e"); }
    setResult({ ok: r.data!.connected, text: r.data!.message });
    setPk(""); setGs("");
    router.refresh();
  }

  return (
    <>
      <div className="card">
        <div className="row between"><h2 style={{ margin: 0 }}>Connection</h2>{status.connected ? <Tag kind="ok">Connected{status.storeName ? `: ${status.storeName}` : ""}</Tag> : <Tag kind="warn">Not connected (demo store)</Tag>}</div>
        {!status.connected && status.lastError ? <p className="notice bad" style={{ marginTop: ".8rem" }}>{status.lastError}</p> : null}
        <div className="f" style={{ marginTop: "1rem" }}><label htmlFor="tk">Public token</label><input id="tk" type="text" value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" /><small>Tebex panel &gt; Developers &gt; API Keys. This is what the storefront uses to read products and build baskets.</small></div>
        <div className="f"><label htmlFor="pk">Private key</label><input id="pk" type="password" value={pk} onChange={(e) => setPk(e.target.value)} placeholder={status.hasPrivateKey ? "Stored. Type to replace." : ""} autoComplete="off" /></div>
        <div className="f"><label htmlFor="gs">Game server secret (for Orders and Customers)</label><input id="gs" type="password" value={gs} onChange={(e) => setGs(e.target.value)} placeholder={status.hasSecret ? "Stored. Type to replace." : ""} autoComplete="off" /><small>Tebex panel &gt; Game servers.</small></div>
        {result ? <p className={`notice ${result.ok ? "ok" : "bad"}`} role="status">{result.ok ? "\u2713 " : "\u2715 "}{result.text}</p> : null}
        <div className="row">
          <button className="b p" disabled={busy || !token.trim()} onClick={() => run(() => saveTebexAction({ publicToken: token, privateKey: pk, gameServerSecret: gs }))}>{busy ? "Working..." : "Connect Tebex"}</button>
          <button className="b" disabled={busy || !status.publicToken} onClick={() => run(() => testTebexAction())}>Test connection</button>
          {status.connected ? <button className="b d" disabled={busy} onClick={async () => { if (!window.confirm("Disconnect Tebex? The store switches back to demo products.")) return; const r = await disconnectTebexAction(); if (r.ok) { toast("Disconnected"); router.refresh(); } else toast(r.error, "e"); }}>Disconnect</button> : null}
        </div>
      </div>
      <p className="lead">Checkout and payment always happen on Tebex. Visitors are redirected there and return to your store afterwards.</p>
    </>
  );
}
