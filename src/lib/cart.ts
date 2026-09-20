import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { findProduct, getCatalog } from "./catalog";
import { sign } from "./crypto";
import { getSetting } from "./settings";
import { siteUrl } from "./site";
import * as tebex from "./tebex";
import { TebexError } from "./tebex";
import { clamp } from "./utils";

export type CartItem = { id: string; name: string; image: string; quantity: number; linePrice: number; canChangeQuantity: boolean };
export type CartView = {
  source: "tebex" | "demo";
  currency: string;
  items: CartItem[];
  total: number;
  count: number;
  coupons: string[];
  needsAuth: boolean;
  username: string;
  error?: string;
};

const BASKET_COOKIE = "sf_basket";
const DEMO_COOKIE = "sf_cart";
const cookieOpts = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: (headers().get("x-forwarded-proto") ?? "").split(",")[0].trim() === "https",
  maxAge: 60 * 60 * 24 * 30,
});

const empty = (source: CartView["source"], currency: string, error?: string): CartView => ({ source, currency, items: [], total: 0, count: 0, coupons: [], needsAuth: false, username: "", error });
const isTebexMode = () => {
  const t = getSetting("tebex");
  return t.connected && !!t.publicToken;
};

// ---------- demo cart: a signed cookie; prices are always recalculated on the server ----------
function readDemo(): Record<string, number> {
  const raw = cookies().get(DEMO_COOKIE)?.value;
  if (!raw) return {};
  const [body, sig] = raw.split(".");
  if (!body || !sig) return {};
  const expected = sign(body);
  if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return {};
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed)) if (/^demo-\d+$/.test(k) && typeof v === "number") out[k] = clamp(Math.floor(v), 1, 99);
    return out;
  } catch {
    return {};
  }
}
function writeDemo(items: Record<string, number>) {
  const body = Buffer.from(JSON.stringify(items)).toString("base64url");
  cookies().set(DEMO_COOKIE, `${body}.${sign(body)}`, cookieOpts());
}

async function demoView(): Promise<CartView> {
  const cat = await getCatalog();
  const items: CartItem[] = [];
  let total = 0;
  for (const [id, qty] of Object.entries(readDemo())) {
    const p = findProduct(cat, id);
    if (!p) continue;
    const linePrice = Math.round(p.price * qty * 100) / 100;
    total += linePrice;
    items.push({ id, name: p.name, image: p.image, quantity: qty, linePrice, canChangeQuantity: !p.disableQuantity });
  }
  return { source: "demo", currency: cat.currency, items, total: Math.round(total * 100) / 100, count: items.reduce((n, i) => n + i.quantity, 0), coupons: [], needsAuth: false, username: "" };
}

// ---------- Tebex basket ----------
function basketToView(b: tebex.TebexBasket, currency: string): CartView {
  const items: CartItem[] = (b.packages ?? []).map((p) => ({
    id: String(p.id),
    name: p.name,
    image: p.image ?? "",
    quantity: p.in_basket?.quantity ?? 1,
    linePrice: Number(p.in_basket?.price ?? 0),
    canChangeQuantity: true,
  }));
  return {
    source: "tebex",
    currency: b.currency || currency,
    items,
    total: Number(b.total_price ?? b.base_price ?? 0),
    count: items.reduce((n, i) => n + i.quantity, 0),
    coupons: [...(b.coupons ?? []).map((c) => c.code), ...(b.creator_code ? [b.creator_code] : [])],
    needsAuth: !b.username,
    username: b.username ?? "",
  };
}

async function newBasket(): Promise<tebex.TebexBasket> {
  const base = siteUrl();
  const b = await tebex.createBasket(`${base}/checkout/success`, `${base}/cart`);
  cookies().set(BASKET_COOKIE, b.ident, cookieOpts());
  return b;
}

/** Runs `fn` against the visitor's basket, creating (or re-creating an expired) basket when needed. */
async function withBasket<T>(fn: (ident: string) => Promise<T>): Promise<T> {
  let ident = cookies().get(BASKET_COOKIE)?.value;
  if (!ident || !/^[\w-]{6,80}$/.test(ident)) ident = (await newBasket()).ident;
  try {
    const first = await fn(ident);
    return first;
  } catch (e) {
    if (e instanceof TebexError && (e.status === 404 || e.status === 422)) {
      const fresh = await newBasket();
      return fn(fresh.ident);
    }
    throw e;
  }
}

const fail = (e: unknown, source: CartView["source"], currency: string): CartView =>
  empty(source, currency, e instanceof TebexError ? e.message : "Something went wrong. Please try again.");

// ---------- public API ----------
export async function getCartView(): Promise<CartView> {
  const currency = getSetting("site").currency;
  if (!isTebexMode()) return demoView();
  const ident = cookies().get(BASKET_COOKIE)?.value;
  if (!ident) return empty("tebex", currency);
  try {
    const b = await tebex.getBasket(ident);
    if (b.complete) return empty("tebex", currency);
    return basketToView(b, currency);
  } catch (e) {
    return e instanceof TebexError && e.status !== 0 ? empty("tebex", currency) : fail(e, "tebex", currency);
  }
}

export async function addItem(productId: string, quantity: number): Promise<CartView> {
  const cat = await getCatalog();
  const product = findProduct(cat, productId);
  const currency = cat.currency;
  if (!product) return empty(cat.source, currency, "That product is not available.");
  const qty = product.disableQuantity ? 1 : clamp(Math.floor(quantity) || 1, 1, 99);
  if (!isTebexMode()) {
    const items = readDemo();
    items[product.id] = clamp((items[product.id] ?? 0) + qty, 1, 99);
    writeDemo(items);
    return demoView();
  }
  try {
    const b = await withBasket((ident) => tebex.addToBasket(ident, product.id, qty));
    return basketToView(b, currency);
  } catch (e) {
    return fail(e, "tebex", currency);
  }
}

export async function removeItem(productId: string): Promise<CartView> {
  const currency = getSetting("site").currency;
  if (!isTebexMode()) {
    const items = readDemo();
    delete items[productId];
    writeDemo(items);
    return demoView();
  }
  try {
    const b = await withBasket((ident) => tebex.removeFromBasket(ident, productId));
    return basketToView(b, currency);
  } catch (e) {
    return fail(e, "tebex", currency);
  }
}

export async function setQuantity(productId: string, quantity: number): Promise<CartView> {
  const qty = clamp(Math.floor(quantity) || 1, 1, 99);
  if (!isTebexMode()) {
    const items = readDemo();
    if (items[productId]) items[productId] = qty;
    writeDemo(items);
    return demoView();
  }
  const currency = getSetting("site").currency;
  try {
    await withBasket((ident) => tebex.setBasketQuantity(ident, productId, qty));
    return getCartView();
  } catch (e) {
    const view = await getCartView();
    return { ...view, error: e instanceof TebexError && e.status === 422 ? "Sign in first, then you can change quantities." : fail(e, "tebex", currency).error };
  }
}

export async function applyCartCode(code: string): Promise<CartView & { message?: string }> {
  if (!isTebexMode()) return { ...(await demoView()), message: "Codes are not available in demo mode." };
  const clean = code.trim().slice(0, 60);
  if (!clean) return { ...(await getCartView()), message: "Enter a code." };
  try {
    const r = await withBasket((ident) => tebex.applyCode(ident, clean));
    return { ...(await getCartView()), message: r.message };
  } catch (e) {
    return { ...fail(e, "tebex", getSetting("site").currency) };
  }
}

export async function beginCheckout(): Promise<{ checkoutUrl?: string; authLinks?: { name: string; url: string }[]; error?: string }> {
  if (!isTebexMode()) {
    const view = await demoView();
    return view.items.length ? { checkoutUrl: "/checkout/success?demo=1" } : { error: "Your cart is empty." };
  }
  try {
    return await withBasket(async (ident) => {
      const b = await tebex.getBasket(ident);
      if (b.complete || !(b.packages ?? []).length) return { error: "Your cart is empty." };
      if (!b.username) {
        const links = await tebex.getAuthLinks(ident, `${siteUrl()}/cart?auth=1`);
        const safe = links.filter((l) => /^https:\/\//i.test(l.url));
        return safe.length ? { authLinks: safe } : { error: "Sign-in is not available right now." };
      }
      const url = b.links?.checkout;
      return url && /^https:\/\//i.test(url) ? { checkoutUrl: url } : { error: "Checkout is not available right now." };
    });
  } catch (e) {
    return { error: e instanceof TebexError ? e.message : "Something went wrong. Please try again." };
  }
}

export function clearCart(): void {
  cookies().delete(DEMO_COOKIE);
  cookies().delete(BASKET_COOKIE);
}
