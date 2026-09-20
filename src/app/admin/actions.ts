"use server";

import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";
import { hashPassword, requireUserForAction, validatePassword } from "@/lib/auth";
import { clearCatalogCache, getCatalog } from "@/lib/catalog";
import { ROLES } from "@/lib/constants";
import { db } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { createBackup, deleteBackup } from "@/lib/backup";
import { publishHome } from "@/lib/home";
import { deleteMedia, setMediaAlt } from "@/lib/media";
import { createPage, deletePage, publishPage, saveDraft, unpublishPage } from "@/lib/pages";
import type { Capability } from "@/lib/permissions";
import { SETTING_CAP } from "@/lib/permissions";
import { getSetting, setSetting } from "@/lib/settings";
import { testConnection } from "@/lib/tebex";
import { slugify } from "@/lib/utils";
import { cleanHtml } from "@/lib/sanitize";
import { SCHEMAS, type SettingKey } from "@/lib/validators";

export type Result<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

function describe(e: unknown): string {
  if (e instanceof ZodError) {
    const i = e.issues[0];
    return i ? `${i.path.length ? i.path.join(" > ") + ": " : ""}${i.message}` : "Some values are not valid.";
  }
  if (e instanceof Error) return e.message;
  return "Something went wrong.";
}

async function guard<T>(cap: Capability | undefined, fn: (userId: number) => T | Promise<T>): Promise<Result<T>> {
  try {
    const user = requireUserForAction(cap);
    const data = await fn(user.id);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: describe(e) };
  }
}

const refresh = () => revalidatePath("/", "layout");

// ---------- settings ----------
export async function saveSettingAction(key: SettingKey, value: unknown): Promise<Result<unknown>> {
  if (!(key in SCHEMAS) || key === "tebex" || key === "home.published") return { ok: false, error: "That setting cannot be saved here." };
  return guard(SETTING_CAP[key], () => {
    const saved = setSetting(key, value);
    refresh();
    return saved;
  });
}

// ---------- homepage ----------
export async function saveHomeDraftAction(sections: unknown): Promise<Result<unknown>> {
  return guard("content", () => {
    const saved = setSetting("home.draft", { sections });
    return saved;
  });
}
export async function publishHomeAction(sections: unknown): Promise<Result<unknown>> {
  return guard("content", () => {
    setSetting("home.draft", { sections });
    const published = publishHome();
    refresh();
    return published;
  });
}
export async function discardHomeDraftAction(): Promise<Result<unknown>> {
  return guard("content", () => setSetting("home.draft", getSetting("home.published")));
}

// ---------- pages ----------
export async function createPageAction(title: string): Promise<Result<{ id: number }>> {
  return guard("content", () => {
    const p = createPage(String(title).slice(0, 160));
    refresh();
    return { id: p.id };
  });
}
export async function savePageAction(id: number, slug: string, content: unknown, publish: boolean): Promise<Result<{ slug: string }>> {
  return guard("content", () => {
    const r = saveDraft(id, content, slug.trim());
    if (!r.ok) throw new Error(r.error);
    if (publish) publishPage(id);
    refresh();
    return { slug: r.page.slug };
  });
}
export async function unpublishPageAction(id: number): Promise<Result> {
  return guard("content", () => {
    unpublishPage(id);
    refresh();
  });
}
export async function deletePageAction(id: number): Promise<Result> {
  return guard("content", () => {
    deletePage(id);
    refresh();
  });
}

// ---------- media ----------
export async function deleteMediaAction(id: string): Promise<Result> {
  return guard("content", () => deleteMedia(String(id)));
}
export async function setMediaAltAction(id: string, alt: string): Promise<Result> {
  return guard("content", () => setMediaAlt(String(id), String(alt)));
}

// ---------- products & categories (presentation only) ----------
const ProductPatch = z.object({
  featured: z.boolean(),
  homepage: z.boolean(),
  visible: z.boolean(),
  badge: z.string().max(24),
  sortOrder: z.coerce.number().int().min(-9999).max(9999),
  imageUrl: z.string().max(2000).refine((v) => v === "" || /^(\/media\/[\w.-]+|https?:\/\/)/.test(v)),
  displayDescription: z.string().max(20000),
});
export async function saveProductOverrideAction(packageId: string, patch: unknown): Promise<Result> {
  return guard("store", () => {
    const id = z.string().min(1).max(60).parse(packageId);
    const p = ProductPatch.parse(patch);
    db()
      .prepare(
        `INSERT INTO product_overrides (package_id, featured, visible, homepage, badge, sort_order, image_url, display_description, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(package_id) DO UPDATE SET featured=excluded.featured, visible=excluded.visible, homepage=excluded.homepage, badge=excluded.badge,
           sort_order=excluded.sort_order, image_url=excluded.image_url, display_description=excluded.display_description, updated_at=excluded.updated_at`
      )
      .run(id, +p.featured, +p.visible, +p.homepage, p.badge.trim(), p.sortOrder, p.imageUrl, p.displayDescription);
    refresh();
  });
}

const CategoryPatch = z.object({
  visible: z.boolean(),
  sortOrder: z.coerce.number().int().min(-9999).max(9999),
  imageUrl: z.string().max(2000).refine((v) => v === "" || /^(\/media\/[\w.-]+|https?:\/\/)/.test(v)),
  displayDescription: z.string().max(2000),
});
export async function saveCategoryOverrideAction(categoryId: string, patch: unknown): Promise<Result> {
  return guard("store", () => {
    const id = z.string().min(1).max(60).parse(categoryId);
    const p = CategoryPatch.parse(patch);
    db()
      .prepare(
        `INSERT INTO category_overrides (category_id, visible, sort_order, image_url, display_description, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(category_id) DO UPDATE SET visible=excluded.visible, sort_order=excluded.sort_order, image_url=excluded.image_url, display_description=excluded.display_description, updated_at=excluded.updated_at`
      )
      .run(id, +p.visible, p.sortOrder, p.imageUrl, p.displayDescription);
    refresh();
  });
}

export async function syncTebexAction(): Promise<Result<{ categories: number; products: number; error?: string }>> {
  return guard("store", async () => {
    clearCatalogCache();
    const c = await getCatalog({ includeHidden: true });
    refresh();
    return { categories: c.categories.length, products: c.categories.reduce((n, x) => n + x.products.length, 0), error: c.error };
  });
}

// ---------- demo catalog (only used while Tebex is not connected) ----------
const DemoProduct = z.object({
  id: z.number().int().optional(),
  categoryId: z.number().int().nullable(),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(20000),
  price: z.coerce.number().min(0).max(100000),
  originalPrice: z.coerce.number().min(0).max(100000).nullable(),
  imageUrl: z.string().max(2000).refine((v) => v === "" || /^(\/media\/[\w.-]+|https?:\/\/)/.test(v)),
  sortOrder: z.coerce.number().int().min(-9999).max(9999),
});
export async function saveDemoProductAction(input: unknown): Promise<Result<{ id: number }>> {
  return guard("store", () => {
    const p = DemoProduct.parse(input);
    const price = Math.round(p.price * 100);
    const orig = p.originalPrice && p.originalPrice > p.price ? Math.round(p.originalPrice * 100) : null;
    const description = cleanHtml(p.description);
    let id = p.id;
    if (id) {
      db().prepare("UPDATE demo_products SET category_id=?, name=?, description=?, price_cents=?, original_price_cents=?, image_url=?, sort_order=? WHERE id=?").run(p.categoryId, p.name, description, price, orig, p.imageUrl, p.sortOrder, id);
    } else {
      const slug = `${slugify(p.name) || "product"}-${Date.now().toString(36)}`;
      id = Number(db().prepare("INSERT INTO demo_products (category_id, name, slug, description, price_cents, original_price_cents, image_url, sort_order) VALUES (?,?,?,?,?,?,?,?)").run(p.categoryId, p.name, slug, description, price, orig, p.imageUrl, p.sortOrder).lastInsertRowid);
    }
    refresh();
    return { id };
  });
}
export async function deleteDemoProductAction(id: number): Promise<Result> {
  return guard("store", () => {
    db().prepare("DELETE FROM demo_products WHERE id = ?").run(id);
    refresh();
  });
}
const DemoCategory = z.object({ id: z.number().int().optional(), name: z.string().trim().min(1).max(80), description: z.string().max(400), sortOrder: z.coerce.number().int().min(-9999).max(9999) });
export async function saveDemoCategoryAction(input: unknown): Promise<Result<{ id: number }>> {
  return guard("store", () => {
    const c = DemoCategory.parse(input);
    let id = c.id;
    if (id) db().prepare("UPDATE demo_categories SET name=?, description=?, sort_order=? WHERE id=?").run(c.name, c.description, c.sortOrder, id);
    else id = Number(db().prepare("INSERT INTO demo_categories (name, slug, description, sort_order) VALUES (?,?,?,?)").run(c.name, `${slugify(c.name) || "category"}-${Date.now().toString(36)}`, c.description, c.sortOrder).lastInsertRowid);
    refresh();
    return { id };
  });
}
export async function deleteDemoCategoryAction(id: number): Promise<Result> {
  return guard("store", () => {
    db().prepare("DELETE FROM demo_categories WHERE id = ?").run(id);
    refresh();
  });
}

// ---------- Tebex ----------
const TebexInput = z.object({
  publicToken: z.string().trim().regex(/^[\w-]{6,200}$/, "The public token looks wrong. Copy it from your Tebex panel > Developers > API Keys."),
  privateKey: z.string().trim().max(500).optional().default(""),
  gameServerSecret: z.string().trim().max(500).optional().default(""),
});

async function testAndStore(): Promise<{ ok: boolean; message: string }> {
  const t = getSetting("tebex");
  const r = await testConnection(t.publicToken);
  setSetting("tebex", { ...getSetting("tebex"), connected: r.ok, storeName: r.ok ? r.name : t.storeName, lastTestAt: new Date().toISOString(), lastTestOk: r.ok, lastError: r.ok ? "" : r.error });
  clearCatalogCache();
  refresh();
  return r.ok ? { ok: true, message: `Connected to ${r.name || "your Tebex store"}.` } : { ok: false, message: r.error };
}

export async function saveTebexAction(input: unknown): Promise<Result<{ message: string; connected: boolean }>> {
  return guard("integrations", async () => {
    const v = TebexInput.parse(input);
    const cur = getSetting("tebex");
    setSetting("tebex", {
      ...cur,
      publicToken: v.publicToken,
      privateKeyEnc: v.privateKey ? encryptSecret(v.privateKey) : cur.privateKeyEnc,
      secretKeyEnc: v.gameServerSecret ? encryptSecret(v.gameServerSecret) : cur.secretKeyEnc,
    });
    const r = await testAndStore();
    return { message: r.ok ? r.message : `Saved, but Tebex could not be reached: ${r.message}`, connected: r.ok };
  });
}
export async function testTebexAction(): Promise<Result<{ message: string; connected: boolean }>> {
  return guard("integrations", async () => {
    if (!getSetting("tebex").publicToken) throw new Error("Enter your Tebex public token first.");
    const r = await testAndStore();
    return { message: r.ok ? r.message : r.message, connected: r.ok };
  });
}
export async function disconnectTebexAction(): Promise<Result> {
  return guard("integrations", () => {
    setSetting("tebex", { ...getSetting("tebex"), connected: false });
    clearCatalogCache();
    refresh();
  });
}

// ---------- administrators ----------
const Username = z.string().trim().regex(/^[A-Za-z0-9_.@-]{3,60}$/, "Use 3-60 letters, numbers or . _ @ -");

function ownerCount(exceptId?: number): number {
  return (db().prepare("SELECT COUNT(*) AS n FROM admin_users WHERE role='owner' AND disabled=0 AND id != ?").get(exceptId ?? -1) as { n: number }).n;
}
const dropSessions = (id: number) => db().prepare("DELETE FROM sessions WHERE user_id = ?").run(id);

export async function createAdminAction(input: { username: string; displayName: string; password: string; role: string }): Promise<Result> {
  return guard("system", async () => {
    const username = Username.parse(input.username);
    const role = z.enum(ROLES).parse(input.role);
    const pwError = validatePassword(input.password);
    if (pwError) throw new Error(pwError);
    if (db().prepare("SELECT 1 FROM admin_users WHERE username = ?").get(username)) throw new Error("That username is taken.");
    db().prepare("INSERT INTO admin_users (username, display_name, password_hash, role) VALUES (?,?,?,?)").run(username, String(input.displayName ?? "").slice(0, 60), await hashPassword(input.password), role);
  });
}
export async function updateAdminAction(id: number, patch: { displayName: string; role: string; disabled: boolean }): Promise<Result> {
  return guard("system", (me) => {
    const role = z.enum(ROLES).parse(patch.role);
    const cur = db().prepare("SELECT role, disabled FROM admin_users WHERE id = ?").get(id) as { role: string; disabled: number } | undefined;
    if (!cur) throw new Error("User not found.");
    if (id === me && patch.disabled) throw new Error("You cannot disable your own account.");
    if (cur.role === "owner" && (role !== "owner" || patch.disabled) && ownerCount(id) === 0) throw new Error("There must always be at least one active owner.");
    db().prepare("UPDATE admin_users SET display_name=?, role=?, disabled=? WHERE id=?").run(String(patch.displayName ?? "").slice(0, 60), role, +patch.disabled, id);
    if (patch.disabled) dropSessions(id);
  });
}
export async function setAdminPasswordAction(id: number, password: string): Promise<Result> {
  return guard("system", async () => {
    const pwError = validatePassword(password);
    if (pwError) throw new Error(pwError);
    db().prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?").run(await hashPassword(password), id);
    dropSessions(id);
  });
}
export async function deleteAdminAction(id: number): Promise<Result> {
  return guard("system", (me) => {
    if (id === me) throw new Error("You cannot delete your own account.");
    const cur = db().prepare("SELECT role FROM admin_users WHERE id = ?").get(id) as { role: string } | undefined;
    if (cur?.role === "owner" && ownerCount(id) === 0) throw new Error("There must always be at least one active owner.");
    db().prepare("DELETE FROM admin_users WHERE id = ?").run(id);
  });
}
export async function changeOwnPasswordAction(current: string, next: string): Promise<Result> {
  return guard(undefined, async (me) => {
    const row = db().prepare("SELECT username, password_hash FROM admin_users WHERE id = ?").get(me) as { username: string; password_hash: string };
    const bcrypt = (await import("bcryptjs")).default;
    if (!(await bcrypt.compare(current, row.password_hash))) throw new Error("Your current password is not correct.");
    const pwError = validatePassword(next);
    if (pwError) throw new Error(pwError);
    db().prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?").run(await hashPassword(next), me);
  });
}

// ---------- backups ----------
export async function createBackupAction(): Promise<Result<{ name: string }>> {
  return guard("system", async () => ({ name: (await createBackup()).name }));
}
export async function deleteBackupAction(name: string): Promise<Result> {
  return guard("system", () => deleteBackup(name));
}

// Used by the Tebex admin page to show what is stored without ever returning the secrets themselves.
export async function tebexStatusAction(): Promise<{ hasPrivateKey: boolean; hasGameServerSecret: boolean }> {
  requireUserForAction("integrations");
  const t = getSetting("tebex");
  return { hasPrivateKey: !!decryptSecret(t.privateKeyEnc), hasGameServerSecret: !!decryptSecret(t.secretKeyEnc) };
}
