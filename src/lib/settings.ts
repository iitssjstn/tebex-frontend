import { db } from "./db";
import { SCHEMAS, type SettingKey, type SettingValue } from "./validators";

type Cache = { map: Map<string, unknown>; version: number };
const g = globalThis as typeof globalThis & { __sfsettings?: Cache };
const cache = (): Cache => (g.__sfsettings ??= { map: new Map(), version: 0 });

/** Increments whenever content changes; used to invalidate derived caches (catalog, status, ...). */
export const contentVersion = () => cache().version;

export function getSetting<K extends SettingKey>(key: K): SettingValue<K> {
  const c = cache();
  if (c.map.has(key)) return c.map.get(key) as SettingValue<K>;
  const row = db().prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  let raw: unknown = {};
  if (row) {
    try {
      raw = JSON.parse(row.value);
    } catch {
      raw = {};
    }
  }
  const schema = SCHEMAS[key] as unknown as { safeParse: (v: unknown) => { success: boolean; data?: unknown }; parse: (v: unknown) => unknown };
  const parsed = schema.safeParse(raw);
  const value = (parsed.success ? parsed.data : schema.parse({})) as SettingValue<K>;
  c.map.set(key, value);
  return value;
}

export function setSetting<K extends SettingKey>(key: K, input: unknown): SettingValue<K> {
  const schema = SCHEMAS[key] as unknown as { parse: (v: unknown) => unknown };
  const value = schema.parse(input) as SettingValue<K>;
  db()
    .prepare("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
    .run(key, JSON.stringify(value));
  const c = cache();
  c.map.delete(key);
  c.version++;
  return value;
}

export function hasSetting(key: SettingKey): boolean {
  return !!db().prepare("SELECT 1 FROM settings WHERE key = ?").get(key);
}

export function invalidateAll(): void {
  const c = cache();
  c.map.clear();
  c.version++;
}
