import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { decryptSecret } from "@/lib/crypto";
import { getSetting } from "@/lib/settings";
import { fetchPayments, type TebexPayment } from "@/lib/tebex";
import { formatMoney } from "@/lib/utils";

export const metadata = { title: "Orders" };

export default async function Orders() {
  requireUser("store");
  const secret = decryptSecret(getSetting("tebex").secretKeyEnc);
  let rows: TebexPayment[] = [];
  let err = "";
  if (secret) { try { rows = await fetchPayments(secret); } catch { err = "Tebex could not be reached. Try again in a moment."; } }
  return (
    <>
      <h1>Orders</h1>
      <p className="lead">Purchases as reported by Tebex. Payments and refunds are handled in your Tebex panel.</p>
      {!secret ? <div className="notice">Orders need the game server secret. Add it under <Link href="/admin/tebex">Tebex</Link>.</div> : null}
      {err ? <div className="notice bad">{err}</div> : null}
      <div className="card tw" style={{ padding: 0 }}>
        <table className="t"><thead><tr><th>ID</th><th>Player</th><th>Items</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>{rows.map((p) => <tr key={p.id}><td>{p.id}</td><td>{p.player}</td><td>{p.packages.join(", ")}</td><td>{formatMoney(p.amount, p.currency || "EUR")}</td><td>{p.status}</td><td>{p.date}</td></tr>)}
            {!rows.length ? <tr><td colSpan={6}><div className="empty-a">No orders to show.</div></td></tr> : null}</tbody></table>
      </div>
    </>
  );
}
