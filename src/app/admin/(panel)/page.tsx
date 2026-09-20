import Link from "next/link";
import { getCatalog, allProducts } from "@/lib/catalog";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { listPages } from "@/lib/pages";
import { homeHasUnpublished } from "@/lib/home";
import { getSetting } from "@/lib/settings";
import { decryptSecret } from "@/lib/crypto";
import { fetchPayments, type TebexPayment } from "@/lib/tebex";
import { getServerStatus } from "@/lib/status";
import { db } from "@/lib/db";
import { formatMoney, timeAgo } from "@/lib/utils";

export const metadata = { title: "Overview" };

export default async function Overview({ searchParams }: { searchParams: { denied?: string } }) {
  const user = requireUser();
  const catalog = await getCatalog({ includeHidden: true });
  const tebex = getSetting("tebex");
  const products = allProducts(catalog);
  const pages = listPages();
  const status = await getServerStatus();
  const promos = products.filter((p) => p.originalPrice && p.originalPrice > p.price).length;
  const recent = db().prepare("SELECT package_id, updated_at FROM product_overrides ORDER BY updated_at DESC LIMIT 5").all() as { package_id: string; updated_at: string }[];
  let payments: TebexPayment[] = [];
  let payErr = "";
  const secret = decryptSecret(tebex.secretKeyEnc);
  if (can(user.role, "store") && tebex.connected && secret) {
    try { payments = (await fetchPayments(secret)).slice(0, 5); } catch { payErr = "Recent purchases could not be loaded."; }
  }
  return (
    <>
      <h1>Overview</h1>
      <p className="lead">Welcome back, {user.displayName}.</p>
      {searchParams.denied ? <div className="notice warn">Your role does not have access to that page.</div> : null}
      {catalog.source === "demo" ? <div className="notice warn">Tebex is not connected. The store shows demo products. {can(user.role, "integrations") ? <Link href="/admin/tebex">Connect Tebex</Link> : null}</div> : null}
      <div className="cards">
        <div className="stat"><b>{products.length}</b><span>Products</span></div>
        <div className="stat"><b>{catalog.categories.length}</b><span>Categories</span></div>
        <div className="stat"><b>{promos}</b><span>Products on sale</span></div>
        <div className="stat"><b>{catalog.source === "tebex" ? (tebex.lastTestOk ? "Connected" : "Problem") : "Demo"}</b><span>Tebex</span></div>
        <div className="stat"><b>{status.available ? (status.online ? "Online" : "Offline") : "Unknown"}</b><span>Minecraft server{status.players ? ` (${status.players.online} players)` : ""}</span></div>
      </div>
      <div className="grid2">
        <div className="card"><h2>Website</h2>
          <dl className="kv">
            <dt>Homepage</dt><dd>{homeHasUnpublished() ? <><span className="tag warn">Unpublished changes</span> <Link href="/admin/homepage">Review</Link></> : <span className="tag ok">Published</span>}</dd>
            <dt>Pages</dt><dd>{pages.filter((p) => p.status === "published").length} published, {pages.filter((p) => p.status !== "published").length} draft</dd>
            <dt>Store</dt><dd>{catalog.error ? <span className="tag bad">Tebex unreachable</span> : <span className="tag ok">Working</span>}</dd>
          </dl>
        </div>
        <div className="card"><h2>Recently updated products</h2>
          {recent.length ? <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>{recent.map((r) => <li key={r.package_id}>{products.find((p) => p.id === r.package_id)?.name ?? r.package_id} <span className="tag">{timeAgo(r.updated_at)}</span></li>)}</ul> : <div className="empty-a">No product changes yet.</div>}
        </div>
      </div>
      {can(user.role, "store") ? (
        <div className="card"><h2>Recent purchases</h2>
          {payments.length ? <table className="t"><tbody>{payments.map((p) => <tr key={p.id}><td>{p.player || p.email}</td><td>{p.packages.join(", ")}</td><td>{formatMoney(p.amount, p.currency || "EUR")}</td><td>{p.date}</td></tr>)}</tbody></table> : <div className="empty-a">{payErr || (secret ? "No purchases yet." : "Add your game server secret under Tebex to see purchases here.")}</div>}
        </div>
      ) : null}
    </>
  );
}
