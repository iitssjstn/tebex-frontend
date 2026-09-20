// A tiny stand-in for the Tebex Headless and Game Server APIs, used only by the smoke test.
import http from "node:http";

const TOKEN = "testtoken123";
const cats = [
  { id: 1, name: "Ranks", slug: "ranks", order: 1, description: "Permanent ranks", packages: [
    { id: 101, name: "VIP Rank", description: "<p>VIP perks</p>", total_price: 9.99, base_price: 9.99, discount: 0, currency: "EUR", order: 1 },
    { id: 102, name: "MVP Rank", description: "<p>MVP perks</p>", total_price: 15, base_price: 20, discount: 5, currency: "EUR", order: 2 },
  ] },
  { id: 2, name: "Crates", slug: "crates", order: 2, description: "", packages: [{ id: 201, name: "Sky Crate Key", description: "", total_price: 2.5, base_price: 2.5, discount: 0, currency: "EUR", order: 1 }] },
];
const all = cats.flatMap((c) => c.packages);
const baskets = new Map();
const basketView = (b) => ({
  ident: b.ident, complete: false, username: b.username, coupons: [], currency: "EUR",
  base_price: b.items.reduce((n, i) => n + all.find((p) => p.id === i.id).total_price * i.q, 0),
  total_price: b.items.reduce((n, i) => n + all.find((p) => p.id === i.id).total_price * i.q, 0),
  packages: b.items.map((i) => { const p = all.find((x) => x.id === i.id); return { id: p.id, name: p.name, in_basket: { quantity: i.q, price: p.total_price * i.q } }; }),
  links: { checkout: `https://pay.tebex.example/checkout/${b.ident}` },
});
const send = (res, code, body) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
const body = (req) => new Promise((r) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => { try { r(JSON.parse(d || "{}")); } catch { r({}); } }); });

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  const p = u.pathname;
  let m;
  if ((m = p.match(/^\/api\/accounts\/([^/]+)(\/.*)?$/)) && m[1] !== TOKEN) return send(res, 404, { detail: "not found" });
  if (p === `/api/accounts/${TOKEN}`) return send(res, 200, { data: { name: "Mock Store", currency: "EUR" } });
  if (p === `/api/accounts/${TOKEN}/categories`) return send(res, 200, { data: cats });
  if (p === `/api/accounts/${TOKEN}/baskets` && req.method === "POST") { const ident = `bskt${baskets.size + 1}abc`; baskets.set(ident, { ident, items: [], username: null }); return send(res, 200, { data: basketView(baskets.get(ident)) }); }
  if ((m = p.match(/^\/api\/accounts\/[^/]+\/baskets\/([^/]+)$/))) { const b = baskets.get(m[1]); return b ? send(res, 200, { data: basketView(b) }) : send(res, 404, {}); }
  if ((m = p.match(/^\/api\/accounts\/[^/]+\/baskets\/([^/]+)\/auth$/))) return send(res, 200, [{ name: "Minecraft: Java", url: `https://auth.tebex.example/${m[1]}` }]);
  if ((m = p.match(/^\/api\/baskets\/([^/]+)\/packages$/)) && req.method === "POST") { const b = baskets.get(m[1]); if (!b) return send(res, 404, {}); const j = await body(req); const id = Number(j.package_id); if (!all.some((x) => x.id === id)) return send(res, 422, { detail: "bad package" }); const it = b.items.find((i) => i.id === id); if (it) it.q += j.quantity || 1; else b.items.push({ id, q: j.quantity || 1 }); return send(res, 200, basketView(b)); }
  if ((m = p.match(/^\/api\/baskets\/([^/]+)\/packages\/remove$/))) { const b = baskets.get(m[1]); const j = await body(req); b.items = b.items.filter((i) => i.id !== Number(j.package_id)); return send(res, 200, basketView(b)); }
  if ((m = p.match(/^\/api\/baskets\/([^/]+)\/packages\/(\d+)$/)) && req.method === "PUT") { const b = baskets.get(m[1]); if (!b.username) return send(res, 422, { detail: "login first" }); const j = await body(req); b.items.find((i) => i.id === Number(m[2])).q = j.quantity; return send(res, 200, {}); }
  if ((m = p.match(/^\/__authorize\/([^/]+)$/))) { baskets.get(m[1]).username = "Steve"; return send(res, 200, { ok: true }); }
  if (p === "/payments") return req.headers["x-tebex-secret"] === "gamesecret" ? send(res, 200, [{ id: 1, date: "2026-09-19", amount: 9.99, currency: { iso_4217: "EUR" }, status: "Complete", player: { name: "Steve" }, email: "a@b.c", packages: [{ name: "VIP Rank" }] }]) : send(res, 403, {});
  send(res, 404, {});
}).listen(Number(process.env.MOCK_PORT || 3199), () => console.log("mock tebex up"));
