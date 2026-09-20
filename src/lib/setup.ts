import { z } from "zod";
import { adminCount, hashPassword, validatePassword } from "./auth";
import { clearCatalogCache } from "./catalog";
import { CURRENCIES, TIMEZONES } from "./constants";
import { encryptSecret } from "./crypto";
import { db } from "./db";
import { seedDefaults } from "./seed";
import { getSetting, setSetting } from "./settings";
import { testConnection } from "./tebex";

export type SetupInput = {
  username: string;
  password: string;
  confirm: string;
  storeName: string;
  ip: string;
  discord: string;
  timezone: string;
  currency: string;
  publicToken: string;
  privateKey: string;
  gameServerSecret: string;
};

const Schema = z.object({
  username: z.string().trim().regex(/^[A-Za-z0-9_.@-]{3,60}$/, "Username: use 3-60 letters, numbers or . _ @ -"),
  storeName: z.string().trim().min(1, "Enter a store name.").max(80),
  ip: z.string().trim().max(120),
  discord: z.string().trim().max(300).refine((v) => v === "" || /^https?:\/\//i.test(v), "The Discord link must start with https://"),
  timezone: z.enum(TIMEZONES),
  currency: z.enum(CURRENCIES),
  publicToken: z.string().trim().refine((v) => v === "" || /^[\w-]{6,200}$/.test(v), "The Tebex public token looks wrong."),
});

export async function runSetup(input: SetupInput): Promise<{ error: string } | { userId: number }> {
  if (adminCount() > 0) return { error: "Setup has already been completed. Sign in instead." };
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const pwError = validatePassword(input.password);
  if (pwError) return { error: pwError };
  if (input.password !== input.confirm) return { error: "The passwords do not match." };
  const v = parsed.data;

  const hash = await hashPassword(input.password);
  const created = db().transaction(() => {
    if (adminCount() > 0) return null;
    return Number(db().prepare("INSERT INTO admin_users (username, display_name, password_hash, role) VALUES (?, ?, ?, 'owner')").run(v.username, v.username, hash).lastInsertRowid);
  })();
  if (created === null) return { error: "Setup has already been completed. Sign in instead." };

  seedDefaults({ storeName: v.storeName, ip: v.ip, discord: v.discord, timezone: v.timezone, currency: v.currency });

  if (v.publicToken) {
    const test = await testConnection(v.publicToken);
    setSetting("tebex", {
      ...getSetting("tebex"),
      publicToken: v.publicToken,
      privateKeyEnc: input.privateKey.trim() ? encryptSecret(input.privateKey.trim()) : "",
      secretKeyEnc: input.gameServerSecret.trim() ? encryptSecret(input.gameServerSecret.trim()) : "",
      connected: test.ok,
      storeName: test.ok ? test.name : "",
      lastTestAt: new Date().toISOString(),
      lastTestOk: test.ok,
      lastError: test.ok ? "" : test.error,
    });
    clearCatalogCache();
  }
  return { userId: created };
}
