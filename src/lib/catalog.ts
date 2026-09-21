import { db } from "./db";
import { cleanHtml } from "./sanitize";
import { contentVersion, getSetting } from "./settings";
import { fetchCategories, TebexError, type TebexCategory, type TebexPackage } from "./tebex";
import { slugify } from "./utils";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  currency: string;
  image: string;
  categoryId: string;
  categoryName: string;
  order: number;
  disableQuantity: boolean;
  // storefront presentation (owned by this site, never sent to Tebex)
  featured: boolean;
  homepage: boolean;
  visible: boolean;
  badge: string;
  sortOrder: number;
  displayDescription: string;
  /** Tebex marks the package as a subscription (auto-renewing). */
  recurring: boolean;
  /** Products that share a group name are shown as one product with a duration choice. */
  groupName: string;
  optionLabel: string;
  optionMonths: number;
};
export type Category = { id: string; slug: string; name: string; description: string; image: string; order: number; visible: boolean; products: Product[] };
export type Catalog = { source: "tebex" | "demo"; currency: string; categories: Category[]; error?: string };

type Cache = { tebex?: { at: number; token: string; data: TebexCategory[] } };
const g = globalThis as typeof globalThis & { __sfcatalog?: Cache };
const cache = (): Cache => (g.__sfcatalog ??= {});
const TTL_MS = 60_000;
export const clearCatalogCache = () => {
  cache().tebex = undefined;
};

type ProductOverride = { package_id: string; featured: number; visible: number; homepage: number; badge: string; sort_order: number; image_url: string; display_description: string; group_name: string; option_label: string; option_months: number };
type CategoryOverride = { category_id: string; visible: number; sort_order: number | null; image_url: string; display_description: string };

function pickImage(p: TebexPackage): string {
  if (p.image) return p.image;
  const m = p.media?.find((x) => x.type === "image" && x.primary) ?? p.media?.find((x) => x.type === "image");
  return m?.url ?? "";
}

export function mapTebex(categories: TebexCategory[], fallbackCurrency: string): Category[] {
  const seenSlugs = new Set<string>();
  return categories
    .filter((c) => !c.dynamic)
    .map((c, i) => {
      let slug = c.slug || slugify(c.name) || String(c.id);
      if (seenSlugs.has(slug)) slug = `${slug}-${c.id}`;
      seenSlugs.add(slug);
      const products: Product[] = (c.packages ?? []).map((p, j) => {
        const price = Number(p.total_price ?? p.base_price ?? 0);
        const discount = Number(p.discount ?? 0);
        return {
          id: String(p.id),
          slug: p.slug || slugify(p.name) || String(p.id),
          name: p.name,
          description: p.description ?? "",
          price,
          // Tebex reports the amount taken off as `discount`; the pre-sale price is price + discount.
          originalPrice: discount > 0 ? Math.round((price + discount) * 100) / 100 : null,
          currency: p.currency || fallbackCurrency,
          image: pickImage(p),
          categoryId: String(c.id),
          categoryName: c.name,
          order: p.order ?? j,
          disableQuantity: !!p.disable_quantity,
          featured: false,
          homepage: false,
          visible: true,
          badge: "",
          sortOrder: 0,
          displayDescription: "",
          recurring: p.type === "subscription",
          groupName: "",
          optionLabel: "",
          optionMonths: 0,
        };
      });
      return { id: String(c.id), slug, name: c.name, description: c.description ?? "", image: c.image_url ?? "", order: c.order ?? i, visible: true, products };
    });
}

function demoCategories(currency: string): Category[] {
  const cats = db().prepare("SELECT * FROM demo_categories ORDER BY sort_order, id").all() as { id: number; name: string; slug: string; description: string; sort_order: number }[];
  const prods = db().prepare("SELECT * FROM demo_products ORDER BY sort_order, id").all() as { id: number; category_id: number | null; name: string; slug: string; description: string; price_cents: number; original_price_cents: number | null; image_url: string; sort_order: number }[];
  return cats.map((c) => ({
    id: `demo-${c.id}`,
    slug: c.slug,
    name: c.name,
    description: c.description,
    image: "",
    order: c.sort_order,
    visible: true,
    products: prods
      .filter((p) => p.category_id === c.id)
      .map((p) => ({
        id: `demo-${p.id}`,
        slug: p.slug,
        name: p.name,
        description: p.description,
        price: p.price_cents / 100,
        originalPrice: p.original_price_cents ? p.original_price_cents / 100 : null,
        currency,
        image: p.image_url,
        categoryId: `demo-${c.id}`,
        categoryName: c.name,
        order: p.sort_order,
        disableQuantity: false,
        featured: false,
        homepage: false,
        visible: true,
        badge: "",
        sortOrder: 0,
        displayDescription: "",
        recurring: false,
        groupName: "",
        optionLabel: "",
        optionMonths: 0,
      })),
  }));
}

function applyOverrides(categories: Category[]): Category[] {
  const pOv = new Map((db().prepare("SELECT * FROM product_overrides").all() as ProductOverride[]).map((r) => [r.package_id, r]));
  const cOv = new Map((db().prepare("SELECT * FROM category_overrides").all() as CategoryOverride[]).map((r) => [r.category_id, r]));
  return categories
    .map((c) => {
      const co = cOv.get(c.id);
      const products = c.products
        .map((p) => {
          const o = pOv.get(p.id);
          if (!o) return p;
          return { ...p, featured: !!o.featured, homepage: !!o.homepage, visible: !!o.visible, badge: o.badge, sortOrder: o.sort_order, image: o.image_url || p.image, displayDescription: o.display_description, groupName: o.group_name, optionLabel: o.option_label, optionMonths: o.option_months };
        })
        .sort((a, b) => a.sortOrder - b.sortOrder || a.order - b.order || a.name.localeCompare(b.name));
      return { ...c, visible: co ? !!co.visible : true, order: co?.sort_order ?? c.order, image: co?.image_url || c.image, description: co?.display_description || c.description, products };
    })
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

/** Prices and packages always come from Tebex (or the demo tables); the database only adds presentation settings. */
export async function getCatalog(opts: { includeHidden?: boolean } = {}): Promise<Catalog> {
  const tebex = getSetting("tebex");
  const site = getSetting("site");
  let base: Category[];
  let source: Catalog["source"] = "demo";
  let error: string | undefined;

  if (tebex.connected && tebex.publicToken) {
    source = "tebex";
    const c = cache();
    const fresh = c.tebex && c.tebex.token === tebex.publicToken && Date.now() - c.tebex.at < TTL_MS;
    if (!fresh) {
      try {
        c.tebex = { at: Date.now(), token: tebex.publicToken, data: await fetchCategories(tebex.publicToken) };
      } catch (e) {
        error = e instanceof TebexError ? e.message : "The store is temporarily unavailable.";
        // keep serving the previous copy (even if stale) so a Tebex outage does not empty the shop
      }
    }
    base = c.tebex && c.tebex.token === tebex.publicToken ? mapTebex(c.tebex.data, site.currency) : [];
  } else {
    base = demoCategories(site.currency);
  }

  let categories = applyOverrides(base);
  if (!opts.includeHidden) {
    categories = categories.filter((c) => c.visible).map((c) => ({ ...c, products: c.products.filter((p) => p.visible) }));
  }
  return { source, currency: base[0]?.products[0]?.currency ?? site.currency, categories, error };
}

export const catalogVersion = () => contentVersion();

export function allProducts(cat: Catalog): Product[] {
  return cat.categories.flatMap((c) => c.products);
}

export function findProduct(cat: Catalog, idOrSlug: string): Product | undefined {
  return allProducts(cat).find((p) => p.id === idOrSlug) ?? allProducts(cat).find((p) => p.slug === idOrSlug);
}

export function productDescriptionHtml(p: Product): string {
  return cleanHtml(p.displayDescription || p.description);
}

// ---------- duration options: several Tebex packages shown as one product ----------
export type Entry = { key: string; name: string; primary: Product; options: Product[]; fromPrice: number; featured: boolean; homepage: boolean };

/** Products with the same group name (for example "VIP") become one entry whose options are the durations. */
export function collapseGroups(products: Product[]): Entry[] {
  const out: Entry[] = [];
  const groups = new Map<string, Entry>();
  for (const p of products) {
    const g = p.groupName.trim();
    if (!g) {
      out.push({ key: p.id, name: p.name, primary: p, options: [p], fromPrice: p.price, featured: p.featured, homepage: p.homepage });
      continue;
    }
    const existing = groups.get(g.toLowerCase());
    if (existing) {
      existing.options.push(p);
      continue;
    }
    const e: Entry = { key: `g:${g.toLowerCase()}`, name: g, primary: p, options: [p], fromPrice: p.price, featured: false, homepage: false };
    groups.set(g.toLowerCase(), e);
    out.push(e);
  }
  for (const e of out) {
    if (e.options.length > 1) {
      e.options.sort((a, b) => (a.optionMonths || 9999) - (b.optionMonths || 9999) || a.price - b.price);
      e.primary = { ...e.options[0], image: e.options.find((o) => o.image)?.image ?? "", badge: e.options.find((o) => o.badge)?.badge ?? "" };
    }
    e.fromPrice = Math.min(...e.options.map((o) => o.price));
    e.featured = e.options.some((o) => o.featured);
    e.homepage = e.options.some((o) => o.homepage);
  }
  return out;
}

/** Percentage saved per month compared with the shortest option, or 0 when it cannot be worked out. */
export function savePercent(option: Product, options: Product[]): number {
  const base = options.find((o) => o.optionMonths > 0);
  if (!base || option.optionMonths <= base.optionMonths || option.price <= 0) return 0;
  const pct = Math.round((1 - option.price / option.optionMonths / (base.price / base.optionMonths)) * 100);
  return pct > 0 ? pct : 0;
}

export function groupOf(catalog: Catalog, product: Product): Product[] {
  const g = product.groupName.trim().toLowerCase();
  if (!g) return [product];
  return collapseGroups(allProducts(catalog).filter((p) => p.groupName.trim().toLowerCase() === g))[0]?.options ?? [product];
}
