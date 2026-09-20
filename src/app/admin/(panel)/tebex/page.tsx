import { requireUser } from "@/lib/auth";
import { decryptSecret } from "@/lib/crypto";
import { getSetting } from "@/lib/settings";
import { TebexForm } from "./TebexForm";

export const metadata = { title: "Tebex" };

export default function TebexPage() {
  requireUser("integrations");
  const t = getSetting("tebex");
  return (
    <>
      <h1>Tebex</h1>
      <p className="lead">Tebex stays the source of truth for products, prices, checkout and payments. Secrets are stored encrypted on the server and are never sent to the browser.</p>
      <TebexForm status={{ publicToken: t.publicToken, connected: t.connected, storeName: t.storeName, lastTestAt: t.lastTestAt, lastError: t.lastError, hasPrivateKey: !!decryptSecret(t.privateKeyEnc), hasSecret: !!decryptSecret(t.secretKeyEnc) }} />
    </>
  );
}
