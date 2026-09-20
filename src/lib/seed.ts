import { db } from "./db";
import { createPage, publishPage } from "./pages";
import { getSetting, setSetting } from "./settings";
import { slugify } from "./utils";
import type { Section } from "./validators";

const id = () => Math.random().toString(36).slice(2, 10);

export function defaultHomeSections(): Section[] {
  return [
    { id: id(), type: "hero", enabled: true, config: {} },
    { id: id(), type: "featuredProducts", enabled: true, config: { title: "Featured", subtitle: "Pick up where you left off, or start with the most popular items.", count: 4 } },
    { id: id(), type: "categories", enabled: true, config: {} },
    { id: id(), type: "serverStatus", enabled: true, config: { title: "Join us in game", description: "The server is live. Log in and your purchase arrives within a minute." } },
    { id: id(), type: "discord", enabled: true, config: {} },
    { id: id(), type: "faq", enabled: true, config: { title: "Questions before you buy", limit: 4 } },
  ];
}

const para = (html: string) => ({ id: id(), type: "text" as const, props: { html } });
const heading = (text: string) => ({ id: id(), type: "heading" as const, props: { text, level: "h2" as const } });

export type SetupInput = { storeName: string; ip: string; discord: string; timezone: string; currency: string };

/** Fills the database with editable starter content. Runs once, at the end of first-run setup. */
export function seedDefaults(input: SetupInput): void {
  const name = input.storeName.trim() || "My Server Store";
  setSetting("site", { ...getSetting("site"), timezone: input.timezone, currency: input.currency, setupComplete: true });
  setSetting("branding", { ...getSetting("branding"), storeName: name, browserTitle: `${name} Store` });
  setSetting("server", { ...getSetting("server"), ip: input.ip.trim() || getSetting("server").ip });
  setSetting("discord", { ...getSetting("discord"), url: input.discord, enabled: !!input.discord });
  setSetting("seo", { ...getSetting("seo"), title: `${name} Store`, description: `Ranks, crates and perks for ${name}.` });
  setSetting("navigation", {
    items: [
      { label: "Home", url: "/", enabled: true, children: [] },
      { label: "Store", url: "/store", enabled: true, children: [] },
      { label: "FAQ", url: "/faq", enabled: true, children: [] },
      ...(input.discord ? [{ label: "Discord", url: input.discord, enabled: true, children: [] }] : []),
    ],
  });
  setSetting("footer", {
    title: name,
    description: "Purchases support the server and are delivered automatically.",
    columns: [
      { title: "Store", links: [{ label: "All products", url: "/store" }, { label: "FAQ", url: "/faq" }] },
      { title: "Information", links: [{ label: "Terms", url: "/terms" }, { label: "Privacy", url: "/privacy" }, { label: "Refunds", url: "/refunds" }] },
    ],
    legalLinks: [],
    copyright: `\u00a9 ${new Date().getFullYear()} ${name}. Not affiliated with Mojang or Microsoft.`,
    showSocial: true,
    showDiscord: true,
    showServerIp: true,
  });
  setSetting("faq", {
    title: "Frequently asked questions",
    intro: "",
    items: [
      { question: "How fast is my purchase delivered?", answer: "<p>Usually within a minute. If you are offline, it is delivered the next time you join.</p>", enabled: true },
      { question: "Which payment methods do you accept?", answer: "<p>Payments are handled by Tebex and support the methods shown at checkout.</p>", enabled: true },
      { question: "Something went wrong with my order.", answer: "<p>Contact us on Discord with your transaction ID and we will sort it out.</p>", enabled: true },
      { question: "Can I get a refund?", answer: "<p>See our <a href=\"/refunds\">refund policy</a> for the details.</p>", enabled: true },
    ],
  });
  const home = { sections: defaultHomeSections() };
  setSetting("home.draft", home);
  setSetting("home.published", home);

  const starter: [string, string, string][] = [
    ["Terms", "terms", "These are placeholder terms. Replace this text in Admin > Pages with your own terms of service."],
    ["Privacy", "privacy", "This is a placeholder privacy policy. Replace this text in Admin > Pages with your own policy."],
    ["Refunds", "refunds", "This is a placeholder refund policy. Replace this text in Admin > Pages with your own policy."],
  ];
  for (const [title, slug, body] of starter) {
    const p = createPage(title, slug, [heading(title), para(`<p>${body}</p>`)]);
    publishPage(p.id);
  }
  seedDemoData();
}

export function seedDemoData(): void {
  const d = db();
  if ((d.prepare("SELECT COUNT(*) AS n FROM demo_categories").get() as { n: number }).n > 0) return;
  const addCat = d.prepare("INSERT INTO demo_categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)");
  const addProd = d.prepare("INSERT INTO demo_products (category_id, name, slug, description, price_cents, original_price_cents, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, '', ?)");
  const cats: [string, string, [string, string, number, number | null][]][] = [
    ["Ranks", "Permanent ranks with perks. Demo items: edit or delete them in Admin > Products.", [["Starter rank", "<p>A demo product. Edit this text in the admin panel.</p>", 499, null], ["Plus rank", "<p>A demo product with a discount.</p>", 799, 999], ["Premium rank", "<p>A demo product.</p>", 1499, null]]],
    ["Crate keys", "Keys for crates. Demo category.", [["Common key x3", "<p>A demo product.</p>", 299, null], ["Rare key x3", "<p>A demo product.</p>", 599, null]]],
    ["Cosmetics", "Looks only. Demo category.", [["Particle trail", "<p>A demo product.</p>", 399, null], ["Chat colour", "<p>A demo product.</p>", 249, null]]],
  ];
  cats.forEach(([name, desc, prods], i) => {
    const cid = Number(addCat.run(name, slugify(name), desc, i).lastInsertRowid);
    prods.forEach(([pn, pd, price, orig], j) => addProd.run(cid, pn, `${slugify(pn)}-${cid}`, pd, price, orig, j));
  });
}
