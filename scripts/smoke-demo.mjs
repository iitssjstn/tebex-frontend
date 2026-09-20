// Demo mode (no Tebex) and persistence checks. Usage: see README "Testing".
import fs from "node:fs";
const BASE = process.env.BASE || "http://localhost:3100";
const MODE = process.argv[2] || "demo";
let jar = {}; let fails = 0;
const ok = (n, c, x = "") => { console.log(`${c ? "PASS" : "FAIL"}  ${n}${c ? "" : "  " + x}`); if (!c) fails++; };
const req = async (p, o = {}) => { const r = await fetch(BASE + p, { redirect: "manual", ...o, headers: { cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; "), Origin: BASE, ...(o.headers ?? {}) } }); for (const c of r.headers.getSetCookie()) { const [kv] = c.split(";"); const i = kv.indexOf("="); jar[kv.slice(0, i)] = kv.slice(i + 1); } return r; };
const J = { "Content-Type": "application/json" };
if (MODE === "demo") {
  const r = await req("/api/setup", { method: "POST", headers: J, body: JSON.stringify({ username: "demo", password: "correct-horse-1", confirm: "correct-horse-1", storeName: "Demo Store", ip: "play.demo.test", discord: "", timezone: "UTC", currency: "USD", publicToken: "", privateKey: "", gameServerSecret: "" }) });
  ok("setup without Tebex", r.status === 200);
  const h = await (await req("/")).text();
  ok("demo notice shown", h.includes('class="notice">Demo'));
  ok("demo products shown", h.includes("Starter rank"));
  ok("no Discord section without link", !h.includes("discord-panel"));
  const st = await (await req("/store")).text();
  ok("prices in USD", st.includes("$4.99"));
  let c = await (await req("/api/cart", { method: "POST", headers: J, body: JSON.stringify({ action: "add", id: "demo-1", quantity: 3 }) })).json();
  ok("demo cart total computed server-side", c.cart.total === 14.97, JSON.stringify(c));
  const forged = { ...jar }; jar.sf_cart = jar.sf_cart.replace(/^./, "Z");
  c = await (await req("/api/cart")).json();
  ok("tampered cart cookie ignored", c.cart.items.length === 0);
  jar = forged;
  const co = await (await req("/api/cart", { method: "POST", headers: J, body: JSON.stringify({ action: "checkout" }) })).json();
  ok("demo checkout goes to success page", co.checkoutUrl === "/checkout/success?demo=1", JSON.stringify(co));
  ok("success page", (await req("/checkout/success?demo=1")).status === 200);
  for (const p of ["/admin/products", "/admin/categories", "/admin/tebex", "/admin/orders"]) ok(p, (await req(p)).status === 200);
  ok("products admin shows demo notice", (await (await req("/admin/products")).text()).includes("Demo mode"));
  const m = await req("/api/admin/backup/x.zip"); ok("bad backup name", m.status === 404);
} else {
  const li = await req("/api/auth/login", { method: "POST", headers: J, body: JSON.stringify({ username: "demo", password: "correct-horse-1" }) });
  ok("login works after restart (data persisted)", li.status === 200);
  ok("store name persisted", (await (await req("/")).text()).includes("Demo Store"));
  ok("demo products persisted", (await (await req("/store")).text()).includes("Starter rank"));
  // backup -> change -> restore round trip
  const ids = {};
  (function scan(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = d + "/" + e.name; if (e.isDirectory()) scan(p); else if (e.name.endsWith(".js")) for (const m of fs.readFileSync(p, "utf8").matchAll(/"?([0-9a-f]{40})"?:\(\)=>Promise\.resolve\(\)\.then\(\w+\.bind\(\w+,\d+\)\)\.then\(\w+=>\w+\.(\w+)\)/g)) ids[m[2]] = m[1]; } })(new URL("../.next/server", import.meta.url).pathname);
  const act = async (name, args) => (await req("/", { method: "POST", headers: { "Next-Action": ids[name], "Content-Type": "text/plain;charset=UTF-8", Accept: "text/x-component" }, body: JSON.stringify(args) })).text();
  const b = (await act("createBackupAction", [])).match(/backup-\d{8}-\d{6}\.zip/)?.[0];
  ok("backup created", !!b);
  await act("saveSettingAction", ["branding", { storeName: "Changed Name" }]);
  ok("change visible", (await (await req("/")).text()).includes("Changed Name"));
  const zip = await (await req(`/api/admin/backup/${b}`)).arrayBuffer();
  const fd = new FormData(); fd.append("file", new Blob([zip]), b);
  const rr = await req("/api/admin/restore", { method: "POST", body: fd });
  ok("restore accepted", rr.status === 200, await rr.text());
  jar = {};
  const l2 = await req("/api/auth/login", { method: "POST", headers: J, body: JSON.stringify({ username: "demo", password: "correct-horse-1" }) });
  ok("login works after restore", l2.status === 200);
  const after = await (await req("/")).text();
  ok("restore rolled the change back", after.includes("Demo Store") && !after.includes("Changed Name</span>"));
  const junk = new FormData(); junk.append("file", new Blob(["not a zip"]), "x.zip");
  ok("garbage restore rejected", (await req("/api/admin/restore", { method: "POST", body: junk })).status === 400);
  ok("store still works after rejected restore", (await req("/store")).status === 200);
}
process.exit(fails ? 1 : 0);
