import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { MIGRATIONS } from "./migrations";

/** Directory that holds the database, uploads, backups and the generated app secret (mount as a volume). */
export function dataDir(): string {
  const dir = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), "data"));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export const dbFile = () => path.join(dataDir(), "storefront.db");

type SfGlobal = typeof globalThis & { __sfdb?: Database.Database };
const g = globalThis as SfGlobal;

export function migrate(d: Database.Database): string[] {
  d.exec("CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))");
  const done = new Set((d.prepare("SELECT id FROM _migrations").all() as { id: string }[]).map((r) => r.id));
  const applied: string[] = [];
  for (const m of MIGRATIONS) {
    if (done.has(m.id)) continue;
    d.transaction(() => {
      d.exec(m.sql);
      d.prepare("INSERT INTO _migrations (id) VALUES (?)").run(m.id);
    })();
    applied.push(m.id);
  }
  return applied;
}

function open(): Database.Database {
  const d = new Database(dbFile());
  d.pragma("journal_mode = WAL");
  d.pragma("foreign_keys = ON");
  d.pragma("busy_timeout = 5000");
  migrate(d);
  return d;
}

export function db(): Database.Database {
  if (!g.__sfdb) g.__sfdb = open();
  return g.__sfdb;
}

export function closeDb(): void {
  if (g.__sfdb) {
    g.__sfdb.close();
    g.__sfdb = undefined;
  }
}
