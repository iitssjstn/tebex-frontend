import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { closeDb, db, dataDir, dbFile, migrate } from "./db";
import { invalidateAll, setSetting } from "./settings";
import { clearCatalogCache } from "./catalog";
import { isMediaFile, mediaPath, uploadsDir } from "./media";
import type { SettingKey } from "./validators";

export const backupsDir = () => {
  const d = path.join(dataDir(), "backups");
  fs.mkdirSync(d, { recursive: true });
  return d;
};
const BACKUP_RE = /^backup-\d{8}-\d{6}(-[a-z]+)?\.zip$/;
export const isBackupName = (n: string) => BACKUP_RE.test(n);

const stamp = () => new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);

export type BackupInfo = { name: string; size: number; createdAt: string };

export function listBackups(): BackupInfo[] {
  return fs
    .readdirSync(backupsDir())
    .filter(isBackupName)
    .map((name) => {
      const st = fs.statSync(path.join(backupsDir(), name));
      return { name, size: st.size, createdAt: st.mtime.toISOString() };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** A consistent snapshot of the database (SQLite online backup) plus every uploaded image, in one zip. */
export async function createBackup(tag = ""): Promise<BackupInfo> {
  const tmp = path.join(backupsDir(), `.snapshot-${Date.now()}.db`);
  await db().backup(tmp);
  const files: Record<string, Uint8Array> = { "storefront.db": fs.readFileSync(tmp), "manifest.json": strToU8(JSON.stringify({ createdAt: new Date().toISOString(), format: 1 })) };
  fs.unlinkSync(tmp);
  for (const f of fs.readdirSync(uploadsDir())) if (isMediaFile(f)) files[`uploads/${f}`] = fs.readFileSync(mediaPath(f));
  const name = `backup-${stamp()}${tag ? `-${tag}` : ""}.zip`;
  fs.writeFileSync(path.join(backupsDir(), name), zipSync(files, { level: 3 }));
  const st = fs.statSync(path.join(backupsDir(), name));
  return { name, size: st.size, createdAt: st.mtime.toISOString() };
}

export function deleteBackup(name: string): void {
  if (isBackupName(name)) fs.rmSync(path.join(backupsDir(), name), { force: true });
}

/**
 * Replaces the live database and uploads with the contents of a backup zip. A safety backup of the current
 * state is written first. The Tebex private key is encrypted with a key that stays on this server and is NOT part of
 * backups, so it may need to be re-entered after restoring onto a different server.
 */
export async function restoreBackup(zip: Buffer): Promise<void> {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(new Uint8Array(zip));
  } catch {
    throw new Error("That file is not a valid backup zip.");
  }
  const dbBytes = entries["storefront.db"];
  if (!dbBytes || Buffer.from(dbBytes.slice(0, 15)).toString() !== "SQLite format 3") throw new Error("This zip does not contain a storefront database.");

  const tmp = path.join(backupsDir(), `.restore-${Date.now()}.db`);
  fs.writeFileSync(tmp, dbBytes);
  try {
    const probe = new Database(tmp, { readonly: true });
    const ok = probe.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('admin_users','settings')").all().length === 2;
    probe.close();
    if (!ok) throw new Error("This database does not look like a storefront backup.");
  } catch (e) {
    fs.rmSync(tmp, { force: true });
    throw e instanceof Error && e.message.includes("storefront") ? e : new Error("This database file is damaged.");
  }

  await createBackup("prerestore");
  closeDb();
  for (const ext of ["", "-wal", "-shm"]) fs.rmSync(dbFile() + ext, { force: true });
  fs.renameSync(tmp, dbFile());
  for (const f of fs.readdirSync(uploadsDir())) if (isMediaFile(f)) fs.rmSync(mediaPath(f), { force: true });
  for (const [k, v] of Object.entries(entries)) {
    const m = k.match(/^uploads\/([^/]+)$/);
    if (m && isMediaFile(m[1])) fs.writeFileSync(mediaPath(m[1]), v);
  }
  const d = db(); // reopens and applies any newer migrations
  migrate(d);
  invalidateAll();
  clearCatalogCache();
}

// ---------- portable store export / import (settings, pages, presentation, media; never users or secrets) ----------
const PORTABLE: SettingKey[] = ["branding", "theme", "store", "cart", "server", "discord", "seo", "footer", "social", "navigation", "faq", "labels", "home.draft", "home.published"];

export function exportStore(): Buffer {
  const d = db();
  const settings: Record<string, unknown> = {};
  for (const k of PORTABLE) {
    const row = d.prepare("SELECT value FROM settings WHERE key = ?").get(k) as { value: string } | undefined;
    if (row) settings[k] = JSON.parse(row.value);
  }
  const media = d.prepare("SELECT * FROM media").all() as { file: string }[];
  const data = {
    format: 1,
    exportedAt: new Date().toISOString(),
    settings,
    pages: d.prepare("SELECT slug, title, draft, published, status FROM pages").all(),
    productOverrides: d.prepare("SELECT * FROM product_overrides").all(),
    categoryOverrides: d.prepare("SELECT * FROM category_overrides").all(),
    demoCategories: d.prepare("SELECT * FROM demo_categories").all(),
    demoProducts: d.prepare("SELECT * FROM demo_products").all(),
    media,
  };
  const files: Record<string, Uint8Array> = { "store.json": strToU8(JSON.stringify(data, null, 2)) };
  for (const m of media) if (isMediaFile(m.file) && fs.existsSync(mediaPath(m.file))) files[`media/${m.file}`] = fs.readFileSync(mediaPath(m.file));
  return Buffer.from(zipSync(files, { level: 3 }));
}

export function importStore(zip: Buffer): { settings: number; pages: number; media: number } {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(new Uint8Array(zip));
  } catch {
    throw new Error("That file is not a valid store export.");
  }
  if (!entries["store.json"]) throw new Error("This zip does not contain store.json.");
  const data = JSON.parse(strFromU8(entries["store.json"])) as {
    settings?: Record<string, unknown>;
    pages?: { slug: string; title: string; draft: string; published: string | null; status: string }[];
    productOverrides?: Record<string, unknown>[];
    categoryOverrides?: Record<string, unknown>[];
    demoCategories?: Record<string, unknown>[];
    demoProducts?: Record<string, unknown>[];
    media?: { id: string; file: string; original_name: string; mime: string; size: number; width: number; height: number; alt: string; created_at: string }[];
  };
  const d = db();
  const counts = { settings: 0, pages: 0, media: 0 };

  for (const m of data.media ?? []) {
    const bytes = entries[`media/${m.file}`];
    if (!bytes || !isMediaFile(m.file) || !/^[a-f0-9]{16}$/.test(m.id)) continue;
    fs.writeFileSync(mediaPath(m.file), bytes);
    d.prepare("INSERT OR IGNORE INTO media (id, file, original_name, mime, size, width, height, alt, created_at) VALUES (@id, @file, @original_name, @mime, @size, @width, @height, @alt, @created_at)").run(m);
    counts.media++;
  }
  for (const [k, v] of Object.entries(data.settings ?? {})) {
    if (!(PORTABLE as string[]).includes(k)) continue;
    try {
      setSetting(k as SettingKey, v);
      counts.settings++;
    } catch {
      /* skip a setting that fails validation rather than half-importing */
    }
  }
  for (const p of data.pages ?? []) {
    if (!/^[a-z0-9-]+$/.test(p.slug)) continue;
    d.prepare(
      `INSERT INTO pages (slug, title, draft, published, status) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET title = excluded.title, draft = excluded.draft, published = excluded.published, status = excluded.status, updated_at = datetime('now')`
    ).run(p.slug, String(p.title).slice(0, 160), p.draft, p.published, p.status === "published" ? "published" : "draft");
    counts.pages++;
  }
  d.transaction(() => {
    d.exec("DELETE FROM product_overrides; DELETE FROM category_overrides; DELETE FROM demo_products; DELETE FROM demo_categories;");
    for (const r of data.categoryOverrides ?? []) d.prepare("INSERT OR REPLACE INTO category_overrides (category_id, visible, sort_order, image_url, display_description) VALUES (@category_id, @visible, @sort_order, @image_url, @display_description)").run(r);
    for (const r of data.productOverrides ?? []) d.prepare("INSERT OR REPLACE INTO product_overrides (package_id, featured, visible, homepage, badge, sort_order, image_url, display_description) VALUES (@package_id, @featured, @visible, @homepage, @badge, @sort_order, @image_url, @display_description)").run(r);
    for (const r of data.demoCategories ?? []) d.prepare("INSERT OR REPLACE INTO demo_categories (id, name, slug, description, sort_order) VALUES (@id, @name, @slug, @description, @sort_order)").run(r);
    for (const r of data.demoProducts ?? []) d.prepare("INSERT OR REPLACE INTO demo_products (id, category_id, name, slug, description, price_cents, original_price_cents, image_url, sort_order) VALUES (@id, @category_id, @name, @slug, @description, @price_cents, @original_price_cents, @image_url, @sort_order)").run(r);
  })();
  invalidateAll();
  clearCatalogCache();
  return counts;
}
