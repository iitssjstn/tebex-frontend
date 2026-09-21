import { decryptSecret } from "./crypto";
import { getSetting } from "./settings";

/** Thrown for any Tebex problem. `message` is safe to show to customers; `detail` is for the admin panel only. */
export class TebexError extends Error {
  constructor(message: string, public status = 0, public detail = "") {
    super(message);
  }
}

// Tests point these at a local mock server; normal installs never set them.
const headlessBase = () => (process.env.TEBEX_HEADLESS_BASE || "https://headless.tebex.io").replace(/\/$/, "");
const pluginBase = () => (process.env.TEBEX_PLUGIN_BASE || "https://plugin.tebex.io").replace(/\/$/, "");

export function tebexToken(): string {
  return getSetting("tebex").publicToken;
}
export const tebexSecrets = () => {
  const t = getSetting("tebex");
  return { privateKey: decryptSecret(t.privateKeyEnc), gameServerSecret: decryptSecret(t.secretKeyEnc) };
};

async function request(url: string, init: RequestInit = {}, timeoutMs = 9000): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...(init.headers ?? {}) },
    });
  } catch (e) {
    throw new TebexError("The store is temporarily unavailable.", 0, e instanceof Error ? e.message : "network error");
  }
  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  if (!res.ok) {
    const detail = (json as { detail?: string; message?: string; error_message?: string } | null);
    throw new TebexError(res.status === 404 || res.status === 422 ? "That item is not available." : "The store is temporarily unavailable.", res.status, detail?.detail ?? detail?.message ?? detail?.error_message ?? `HTTP ${res.status}`);
  }
  return json;
}

const unwrap = <T>(j: unknown): T => ((j as { data?: unknown } | null)?.data ?? j) as T;

// ---------- types (only the fields we use) ----------
export type TebexPackage = {
  id: number;
  name: string;
  description?: string;
  image?: string | null;
  type?: string;
  base_price?: number;
  total_price?: number;
  sales_tax?: number;
  discount?: number;
  currency?: string;
  order?: number;
  slug?: string;
  disable_quantity?: boolean;
  category?: { id: number; name: string };
  media?: { type: string; url: string; primary?: boolean; featured?: boolean }[];
};
export type TebexCategory = { id: number; name: string; slug?: string | null; description?: string; order?: number; image_url?: string | null; dynamic?: boolean; parent?: { id: number } | null; packages?: TebexPackage[] | null };
export type TebexBasket = {
  ident: string;
  complete?: boolean;
  username?: string | null;
  coupons?: { code: string }[];
  creator_code?: string;
  base_price?: number;
  total_price?: number;
  currency?: string;
  packages?: { id: number; name: string; image?: string; in_basket?: { quantity: number; price: number } }[];
  links?: { checkout?: string };
};

// ---------- read-only ----------
export async function fetchCategories(token: string): Promise<TebexCategory[]> {
  const j = await request(`${headlessBase()}/api/accounts/${encodeURIComponent(token)}/categories?includePackages=1`);
  return unwrap<TebexCategory[]>(j) ?? [];
}

export async function fetchWebstore(token: string): Promise<{ name?: string; currency?: string; webstore_url?: string }> {
  return unwrap(await request(`${headlessBase()}/api/accounts/${encodeURIComponent(token)}`));
}

export async function testConnection(token: string): Promise<{ ok: true; name: string; currency: string } | { ok: false; error: string }> {
  try {
    const s = await fetchWebstore(token);
    return { ok: true, name: s.name ?? "", currency: s.currency ?? "" };
  } catch (e) {
    if (e instanceof TebexError) return { ok: false, error: e.status === 404 || e.status === 422 ? "Tebex does not recognise this public token." : e.detail || e.message };
    return { ok: false, error: "Could not reach Tebex." };
  }
}

// ---------- baskets ----------
const acct = () => `${headlessBase()}/api/accounts/${encodeURIComponent(tebexToken())}`;

export async function createBasket(completeUrl: string, cancelUrl: string, opts: { username?: string; ip?: string } = {}): Promise<TebexBasket> {
  // Sending the visitor's IP (so the basket is not attributed to this server) requires the private key as Basic auth.
  const { privateKey } = tebexSecrets();
  const withIp = !!opts.ip && !!privateKey;
  const body = {
    complete_url: completeUrl,
    cancel_url: cancelUrl,
    complete_auto_redirect: true,
    ...(opts.username ? { username: opts.username } : {}),
    ...(withIp ? { ip_address: opts.ip } : {}),
  };
  const headers: Record<string, string> = withIp ? { Authorization: `Basic ${Buffer.from(`${tebexToken()}:${privateKey}`).toString("base64")}` } : {};
  return unwrap(await request(`${acct()}/baskets`, { method: "POST", body: JSON.stringify(body), headers }));
}
export async function getBasket(ident: string): Promise<TebexBasket> {
  return unwrap(await request(`${acct()}/baskets/${encodeURIComponent(ident)}`));
}
export async function addToBasket(ident: string, packageId: string, quantity: number): Promise<TebexBasket> {
  return unwrap(await request(`${headlessBase()}/api/baskets/${encodeURIComponent(ident)}/packages`, { method: "POST", body: JSON.stringify({ package_id: packageId, quantity }) }));
}
export async function removeFromBasket(ident: string, packageId: string): Promise<TebexBasket> {
  return unwrap(await request(`${headlessBase()}/api/baskets/${encodeURIComponent(ident)}/packages/remove`, { method: "POST", body: JSON.stringify({ package_id: packageId }) }));
}
export async function setBasketQuantity(ident: string, packageId: string, quantity: number): Promise<void> {
  await request(`${headlessBase()}/api/baskets/${encodeURIComponent(ident)}/packages/${encodeURIComponent(packageId)}`, { method: "PUT", body: JSON.stringify({ quantity }) });
}
export async function getAuthLinks(ident: string, returnUrl: string): Promise<{ name: string; url: string }[]> {
  const j = await request(`${acct()}/baskets/${encodeURIComponent(ident)}/auth?returnUrl=${encodeURIComponent(returnUrl)}`);
  const list = unwrap<unknown>(j);
  return Array.isArray(list) ? (list as { name: string; url: string }[]) : [];
}
export async function applyCode(ident: string, code: string): Promise<{ success: boolean; message: string }> {
  // A code may be a coupon or a creator code; try the coupon first and fall back to the creator code.
  for (const [path, field] of [["coupons", "coupon_code"], ["creator-codes", "creator_code"]] as const) {
    try {
      const j = (await request(`${acct()}/baskets/${encodeURIComponent(ident)}/${path}`, { method: "POST", body: JSON.stringify({ [field]: code }) })) as { success?: boolean; message?: string } | null;
      if (j?.success !== false) return { success: true, message: j?.message ?? "Code applied." };
    } catch {
      /* try next */
    }
  }
  return { success: false, message: "That code is not valid for this basket." };
}

// ---------- orders (Game Server API, optional) ----------
export type TebexPayment = { id: string; date: string; amount: number; currency: string; status: string; player: string; email: string; packages: string[] };

export async function fetchPayments(secret: string): Promise<TebexPayment[]> {
  const j = (await request(`${pluginBase()}/payments?paged=1`, { headers: { "X-Tebex-Secret": secret } })) as { data?: unknown[] } | unknown[];
  const list = (Array.isArray(j) ? j : j?.data ?? []) as Record<string, unknown>[];
  return list.map((p) => ({
    id: String(p.id ?? p.txn_id ?? ""),
    date: String(p.date ?? p.created_at ?? ""),
    amount: Number(p.amount ?? 0),
    currency: typeof p.currency === "object" && p.currency ? String((p.currency as { iso_4217?: string }).iso_4217 ?? "") : String(p.currency ?? ""),
    status: String(p.status ?? ""),
    player: typeof p.player === "object" && p.player ? String((p.player as { name?: string }).name ?? "") : String(p.player ?? ""),
    email: String(p.email ?? ""),
    packages: Array.isArray(p.packages) ? (p.packages as { name?: string }[]).map((x) => String(x.name ?? "")) : [],
  }));
}
