import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { decryptSecret } from "@/lib/crypto";
import { getSetting } from "@/lib/settings";
import { fetchPayments } from "@/lib/tebex";
import { formatMoney } from "@/lib/utils";

export const metadata = { title: "Customers" };

export default async function Customers() {
  requireUser("store");
  const secret = decryptSecret(getSetting("tebex").secretKeyEnc);
  const map = new Map<string, { name: string; email: string; orders: number; total: number; currency: string }>();
  let err = "";
  if (secret) {
    try {
      for (const p of await fetchPayments(secret)) {
        const k = p.player || p.email;
        const c = map.get(k) ?? { name: p.player, email: p.email, orders: 0, total: 0, currency: p.currency };
        c.orders++; c.total += p.amount; map.set(k, c);
      }
    } catch { err = "Tebex could not be reached. Try again in a moment."; }
  }
  const rows = [...map.values()].sort((a, b) => b.total - a.total);
  return (
    <>
      <h1>Customers</h1>
      <p className="lead">Built from the payments Tebex reports, grouped by player.</p>
      {!secret ? <div className="notice">Customers need the game server secret. Add it under <Link href="/admin/tebex">Tebex</Link>.</div> : null}
      {err ? <div className="notice bad">{err}</div> : null}
      <div className="card tw" style={{ padding: 0 }}>
        <table className="t"><thead><tr><th>Player</th><th>Email</th><th>Orders</th><th>Total</th></tr></thead>
          <tbody>{rows.map((c) => <tr key={c.name + c.email}><td>{c.name}</td><td>{c.email}</td><td>{c.orders}</td><td>{formatMoney(c.total, c.currency || "EUR")}</td></tr>)}
            {!rows.length ? <tr><td colSpan={4}><div className="empty-a">No customers to show.</div></td></tr> : null}</tbody></table>
      </div>
    </>
  );
}
