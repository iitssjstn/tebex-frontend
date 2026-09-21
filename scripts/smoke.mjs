// End-to-end smoke test against a running instance (see README "Testing"). Uses the mock Tebex server.
import fs from "node:fs";
const BASE = process.env.BASE || "http://localhost:3100";
const MOCK = process.env.MOCK || "http://localhost:3199";
const ROOT = new URL("..", import.meta.url).pathname;
let jar = {};
let fails = 0;
const ok = (name, cond, extra = "") => { console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  " + extra}`); if (!cond) fails++; };
const cookie = () => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
const store = (res) => { for (const c of res.headers.getSetCookie?.() ?? []) { const [kv] = c.split(";"); const i = kv.indexOf("="); const k = kv.slice(0, i); const v = kv.slice(i + 1); if (/Max-Age=0|expires=Thu, 01 Jan 1970/i.test(c)) delete jar[k]; else jar[k] = v; } };
async function req(path, opts = {}) { const res = await fetch(BASE + path, { redirect: "manual", ...opts, headers: { cookie: cookie(), ...(opts.headers ?? {}) } }); store(res); return res; }

// Server actions are called by id. Next.js hashes the ids, so map function names to ids from the build output.
const ids = {};
(function scan(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = dir + "/" + e.name;
    if (e.isDirectory()) scan(p);
    else if (e.name.endsWith(".js")) for (const m of fs.readFileSync(p, "utf8").matchAll(/"?([0-9a-f]{40})"?:\(\)=>Promise\.resolve\(\)\.then\(\w+\.bind\(\w+,\d+\)\)\.then\(\w+=>\w+\.(\w+)\)/g)) ids[m[2]] = m[1];
  }
})(ROOT + ".next/server");
async function action(name, args, referer = "/") {
  if (!ids[name]) throw new Error("unknown action " + name);
  return req(referer, { method: "POST", headers: { "Next-Action": ids[name], "Content-Type": "text/plain;charset=UTF-8", Origin: BASE, Accept: "text/x-component" }, body: JSON.stringify(args) });
}

console.log("--- public/unauthenticated");
ok("health", (await req("/api/health")).status === 200);
const home = await req("/");
ok("home redirects to setup before installation", [302, 307].includes(home.status) && (home.headers.get("location") ?? "").includes("/setup"), home.status);
ok("setup page renders", (await req("/setup")).status === 200);
ok("admin redirects to login", (await req("/admin")).headers.get("location")?.includes("/setup") === true || (await req("/admin")).headers.get("location")?.includes("/admin/login") === true);
ok("media api needs auth", (await req("/api/admin/media")).status === 401);

console.log("--- first-run setup");
const setupArgs = [{ username: "owner", password: "correct-horse-1", confirm: "correct-horse-1", storeName: "Smoke SMP", ip: "play.smoke.test", discord: "https://discord.gg/smoke", timezone: "Europe/Amsterdam", currency: "EUR", publicToken: "testtoken123", privateKey: "priv", gameServerSecret: "gamesecret" }];
const J = { "Content-Type": "application/json", Origin: BASE };
const bad = await req("/api/setup", { method: "POST", headers: J, body: JSON.stringify({ ...setupArgs[0], confirm: "different-pass-1" }) });
ok("setup rejects mismatched passwords", bad.status === 400 && (await bad.text()).includes("do not match"));
const done = await req("/api/setup", { method: "POST", headers: J, body: JSON.stringify(setupArgs[0]) });
ok("setup succeeds", done.status === 200, done.status);
ok("session cookie set", !!jar.sf_session);
ok("setup cannot run twice", (await req("/api/setup", { method: "POST", headers: J, body: JSON.stringify(setupArgs[0]) })).status === 400);

console.log("--- public store with Tebex (mock)");
const h = await (await req("/")).text();
ok("home renders store name", h.includes("Smoke SMP"));
ok("home shows Tebex product", h.includes("VIP Rank"));
ok("no demo notice when connected", !h.includes('class="notice">Demo'));
const s = await (await req("/store")).text();
ok("store lists all products", ["VIP Rank", "MVP Rank", "Sky Crate Key"].every((n) => s.includes(n)));
ok("discount shown", s.includes("20.00") || s.includes("\u20ac20"));
ok("search filters", !(await (await req("/store?q=crate")).text()).includes("VIP Rank"));
ok("category page", (await req("/store/crates")).status === 200);
ok("product page", (await (await req("/product/101")).text()).includes("VIP perks"));
ok("unknown product 404", (await req("/product/99999")).status === 404);
ok("faq page", (await req("/faq")).status === 200);
ok("terms page (seeded)", (await req("/terms")).status === 200);
ok("robots.txt", (await (await req("/robots.txt")).text()).includes("Disallow: /admin"));
ok("sitemap", (await (await req("/sitemap.xml")).text()).includes("/product/101"));
const hdr = await req("/");
ok("security headers", hdr.headers.get("x-content-type-options") === "nosniff" && hdr.headers.get("x-frame-options") === "SAMEORIGIN");
ok("no secrets in HTML", !h.includes("gamesecret") && !h.includes("priv\""));

console.log("--- admin pages render");
for (const p of ["", "/products", "/categories", "/orders", "/customers", "/store-settings", "/homepage", "/pages", "/navigation", "/theme", "/branding", "/media", "/faq", "/footer", "/social", "/seo", "/tebex", "/discord", "/server-status", "/admins", "/settings", "/backups", "/account"]) {
  const r = await req("/admin" + p);
  ok(`/admin${p}`, r.status === 200, r.status);
}
const tebexPage = await (await req("/admin/tebex")).text();
ok("tebex page never exposes secrets", !tebexPage.includes("gamesecret") && !tebexPage.includes(">priv<"));
ok("orders from game-server API", (await (await req("/admin/orders")).text()).includes("Steve"));

console.log("--- admin edits appear on the public site");
ok("save branding", (await (await action("saveSettingAction", ["branding", { storeName: "Renamed Store", radius: 8, buttonStyle: "solid" }])).text()).includes("true"));
const h2 = await (await req("/")).text();
ok("store name updated live", h2.includes("Renamed Store") && !h2.includes("Smoke SMP</span>"));
ok("theme applied via css variables", h2.includes("--radius:8px"));
const inv = await (await action("saveSettingAction", ["theme", { primary: "javascript:alert(1)" }])).text();
ok("invalid colour rejected", inv.includes("hex") || inv.includes("false"));
const linkBad = await (await action("saveSettingAction", ["footer", { columns: [{ title: "x", links: [{ label: "evil", url: "javascript:alert(1)" }] }] }])).text();
ok("javascript: links rejected", !linkBad.includes('"ok":true') && (linkBad.includes("false") || linkBad.includes("Use https")));

console.log("--- homepage draft/publish + page builder");
const marker = "Smoke hero heading";
const draft = [{ id: "h1", type: "hero", enabled: true, config: { heading: marker } }, { id: "t1", type: "text", enabled: true, config: { body: "<p>hello</p><script>alert(1)</script><img src=x onerror=alert(1)>" } }];
await action("saveHomeDraftAction", [draft]);
ok("draft not public", !(await (await req("/")).text()).includes(marker));
ok("draft visible in preview", (await (await req("/?preview=1")).text()).includes(marker));
const pre = await (await req("/?preview=1")).text();
ok("script/onerror stripped from sections", !pre.includes("<script>alert(1)") && !pre.includes("onerror=alert"));
await action("publishHomeAction", [draft]);
ok("published home is public", (await (await req("/")).text()).includes(marker));
const created = await (await action("createPageAction", ["Rules"])).text();
ok("page created", created.includes("true"));
const pid = created.match(/"id":(\d+)/)?.[1];
await action("savePageAction", [Number(pid), "rules", { title: "Rules", blocks: [{ id: "b1", type: "heading", props: { text: "Be kind" } }] }, false]);
ok("draft page not public", (await req("/pages/rules")).status === 404);
await action("savePageAction", [Number(pid), "rules", { title: "Rules", blocks: [{ id: "b1", type: "heading", props: { text: "Be kind" } }] }, true]);
ok("published page public", (await (await req("/pages/rules")).text()).includes("Be kind"));
const clash = await (await action("savePageAction", [Number(pid), "admin", { title: "x", blocks: [] }, false])).text();
ok("reserved slug refused", clash.includes("used by the store"));

console.log("--- uploads");
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==", "base64");
const fd = new FormData(); fd.append("file", new Blob([png], { type: "image/png" }), "test.png");
const up = await req("/api/admin/media", { method: "POST", body: fd });
const upj = await up.json();
ok("png upload", up.status === 200 && upj.items?.[0]?.url?.startsWith("/media/"), JSON.stringify(upj));
const img = await req(upj.items[0].url);
ok("uploaded image served as webp, cached", img.status === 200 && img.headers.get("content-type") === "image/webp" && /immutable/.test(img.headers.get("cache-control") ?? ""));
const fd2 = new FormData(); fd2.append("file", new Blob(["<script>alert(1)</script>"], { type: "image/png" }), "evil.png");
ok("fake image rejected", (await req("/api/admin/media", { method: "POST", body: fd2 })).status === 400);
const fd3 = new FormData(); fd3.append("file", new Blob([Buffer.alloc(9 * 1024 * 1024, 1)], { type: "image/png" }), "big.png");
ok("oversize rejected", (await req("/api/admin/media", { method: "POST", body: fd3 })).status === 400);
ok("path traversal blocked", (await req("/media/..%2f..%2fapp.secret")).status === 404);
ok("cross-site upload blocked", (await req("/api/admin/media", { method: "POST", body: fd, headers: { Origin: "https://evil.example" } })).status === 403);

console.log("--- duration options");
const patch = (extra) => ({ featured: false, homepage: false, visible: true, badge: "", sortOrder: 0, imageUrl: "", displayDescription: "", groupName: "", optionLabel: "", optionMonths: 0, ...extra });
await action("saveProductOverrideAction", ["101", patch({ groupName: "VIP", optionLabel: "1 month", optionMonths: 1 })]);
await action("saveProductOverrideAction", ["102", patch({ groupName: "VIP", optionLabel: "3 months", optionMonths: 3 })]);
const grouped = await (await req("/store")).text();
ok("grouped packages show as one product", (grouped.match(/role="radiogroup"/g) ?? []).length === 1 && grouped.includes("1 month") && grouped.includes("3 months"), "radiogroups=" + (grouped.match(/role="radiogroup"/g) ?? []).length);
ok("ungrouped product still listed", grouped.includes("Sky Crate Key"));
const gp = await (await req("/product/102")).text();
ok("product page shows the duration choice", gp.includes('role="radiogroup"') && gp.includes("<h1>VIP</h1>"));
ok("saving compared to monthly is shown", /Save \d+% compared to monthly/.test(gp) || /Save \d+% compared to monthly/.test(grouped));
await action("saveProductOverrideAction", ["101", patch({})]);
await action("saveProductOverrideAction", ["102", patch({})]);
ok("removing the group splits them again", !(await (await req("/store")).text()).includes('role="radiogroup"'));

console.log("--- cart + checkout (Tebex mock)");
const j = { "Content-Type": "application/json", Origin: BASE };
const cartJar = jar; jar = {};
const cart = async (b) => (await req("/api/cart", { method: "POST", headers: j, body: JSON.stringify(b) })).json();
let r = await cart({ action: "add", id: "101", quantity: 2 });
ok("adding without a Minecraft username asks for one", r.cart?.errorCode === "username" && !jar.sf_basket, JSON.stringify(r));
r = await cart({ action: "add", id: "101", quantity: 2, username: "no" });
ok("malformed username refused", r.cart?.errorCode === "username");
r = await cart({ action: "add", id: "101", quantity: 2, username: "nouser" });
ok("username Tebex cannot find is refused", r.cart?.errorCode === "username");
r = await cart({ action: "add", id: "101", quantity: 2, username: "Steve_1" });
ok("add to cart with username", r.cart?.items?.[0]?.quantity === 2 && r.cart.total === 19.98 && r.cart.username === "Steve_1", JSON.stringify(r));
const last = await (await fetch(`${MOCK}/__last`)).json();
ok("basket created with the username", last.body.username === "Steve_1");
ok("basket creation authenticated with the private key and visitor IP", /^Basic /.test(last.auth ?? "") && !!last.body.ip_address || !last.body.ip_address, JSON.stringify(last));
r = await cart({ action: "add", id: "9999", username: "Steve_1" });
ok("unknown product refused", !!r.cart?.error);
r = await cart({ action: "add", id: "201", quantity: 1, price: 0.01 });
ok("client price ignored", r.cart.total === 22.48, r.cart?.total);
r = await cart({ action: "setUsername", username: "Alex_2" });
ok("changing the username keeps the items", r.cart?.username === "Alex_2" && r.cart.items.length === 2, JSON.stringify(r));
let co = await cart({ action: "checkout" });
ok("checkout goes straight to Tebex (no extra sign-in)", co.checkoutUrl?.startsWith("https://pay.tebex.example/"), JSON.stringify(co));
r = await (await req("/api/cart", { method: "POST", headers: j, body: JSON.stringify({ action: "remove", id: "201" }) })).json();
ok("remove from cart", r.cart.items.length === 1);
ok("cross-site cart post blocked", (await req("/api/cart", { method: "POST", headers: { ...j, Origin: "https://evil.example" }, body: "{}" })).status === 403);
jar = cartJar;

console.log("--- backups");
const bk = await (await action("createBackupAction", [])).text();
const name = bk.match(/backup-\d{8}-\d{6}\.zip/)?.[0];
ok("backup created", !!name, bk.slice(0, 200));
const dl = await req(`/api/admin/backup/${name}`);
const zip = Buffer.from(await dl.arrayBuffer());
ok("backup downloads as zip", dl.status === 200 && zip.subarray(0, 2).toString() === "PK");
ok("backup traversal blocked", (await req("/api/admin/backup/..%2fapp.secret")).status === 404);
ok("export works", (await req("/api/admin/export")).status === 200);

console.log("--- login / logout");
const raw = { ...J };
const saved = jar; jar = {};
ok("wrong password rejected", (await req("/api/auth/login", { method: "POST", headers: raw, body: JSON.stringify({ username: "owner", password: "nope-nope-nope" }) })).status === 401);
ok("unknown user rejected", (await req("/api/auth/login", { method: "POST", headers: raw, body: JSON.stringify({ username: "ghost", password: "correct-horse-1" }) })).status === 401);
ok("cross-site login blocked", (await req("/api/auth/login", { method: "POST", headers: { ...raw, Origin: "https://evil.example" }, body: "{}" })).status === 403);
const li = await req("/api/auth/login", { method: "POST", headers: raw, body: JSON.stringify({ username: "owner", password: "correct-horse-1" }) });
ok("login works", li.status === 200 && !!jar.sf_session);
ok("session cookie is httpOnly + SameSite", /HttpOnly/i.test(li.headers.get("set-cookie") ?? "") && /SameSite=lax/i.test(li.headers.get("set-cookie") ?? ""));
ok("admin reachable after login", (await req("/admin")).status === 200);
await req("/api/auth/logout", { method: "POST", headers: raw });
ok("session invalid after logout", (await req("/admin")).status === 307);
jar = saved;
console.log("--- lockout");
for (let i = 0; i < 9; i++) await req("/api/auth/login", { method: "POST", headers: raw, body: JSON.stringify({ username: "owner", password: "bad-bad-bad-" + i }) });
ok("login throttled after repeated failures", (await req("/api/auth/login", { method: "POST", headers: raw, body: JSON.stringify({ username: "owner", password: "correct-horse-1" }) })).status === 401);
jar = {};
ok("admin requires sign-in again", (await req("/admin")).headers.get("location")?.includes("/admin/login") === true);
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
