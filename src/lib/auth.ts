import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { randomToken, sha256 } from "./crypto";
import { can, type Capability } from "./permissions";
import type { Role } from "./constants";

export const SESSION_COOKIE = "sf_session";
const SESSION_DAYS = 14;

export type SessionUser = { id: number; username: string; displayName: string; role: Role };

type AdminRow = { id: number; username: string; display_name: string; password_hash: string; role: Role; disabled: number };
// Compared against when the username is unknown so that response time does not reveal which accounts exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export function validatePassword(pw: string): string | null {
  if (pw.length < 10) return "Use at least 10 characters.";
  if (pw.length > 200) return "That password is too long.";
  return null;
}

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);

export function clientIp(): string {
  const h = headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim().slice(0, 64);
}

// ----- login throttling (in memory; resets on restart, which is acceptable for a small admin surface) -----
type Attempts = Map<string, { count: number; first: number }>;
const g = globalThis as typeof globalThis & { __sflogin?: Attempts };
const attempts = (): Attempts => (g.__sflogin ??= new Map());
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function throttled(key: string): boolean {
  const a = attempts().get(key);
  if (!a) return false;
  if (Date.now() - a.first > WINDOW_MS) {
    attempts().delete(key);
    return false;
  }
  return a.count >= MAX_ATTEMPTS;
}
function recordFailure(key: string) {
  const a = attempts().get(key);
  if (!a || Date.now() - a.first > WINDOW_MS) attempts().set(key, { count: 1, first: Date.now() });
  else a.count++;
}

export async function verifyLogin(username: string, password: string): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  const ip = clientIp();
  const keys = [`ip:${ip}`, `user:${username.toLowerCase()}`];
  if (keys.some(throttled)) return { ok: false, error: "Too many attempts. Try again in 15 minutes." };
  const row = db().prepare("SELECT * FROM admin_users WHERE username = ?").get(username.trim()) as AdminRow | undefined;
  const match = await bcrypt.compare(password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !match || row.disabled) {
    keys.forEach(recordFailure);
    return { ok: false, error: "Wrong username or password." };
  }
  keys.forEach((k) => attempts().delete(k));
  db().prepare("UPDATE admin_users SET last_login_at = datetime('now') WHERE id = ?").run(row.id);
  return { ok: true, user: { id: row.id, username: row.username, displayName: row.display_name || row.username, role: row.role } };
}

function isHttps(): boolean {
  return (headers().get("x-forwarded-proto") ?? "").split(",")[0].trim() === "https";
}

export function startSession(userId: number): void {
  const token = randomToken(32);
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  const h = headers();
  db()
    .prepare("INSERT INTO sessions (token_hash, user_id, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?)")
    .run(sha256(token), userId, expires.toISOString(), clientIp(), (h.get("user-agent") ?? "").slice(0, 200));
  db().prepare("DELETE FROM sessions WHERE expires_at < ?").run(new Date().toISOString());
  cookies().set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: isHttps(), path: "/", expires });
}

export function endSession(): void {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
  cookies().delete(SESSION_COOKIE);
}

export function getCurrentUser(): SessionUser | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db()
    .prepare(
      `SELECT u.id, u.username, u.display_name, u.role, u.disabled, s.expires_at
       FROM sessions s JOIN admin_users u ON u.id = s.user_id WHERE s.token_hash = ?`
    )
    .get(sha256(token)) as { id: number; username: string; display_name: string; role: Role; disabled: number; expires_at: string } | undefined;
  if (!row || row.disabled || new Date(row.expires_at).getTime() < Date.now()) return null;
  return { id: row.id, username: row.username, displayName: row.display_name || row.username, role: row.role };
}

/** For pages/layouts: redirects to the login page when there is no valid session or the role lacks the capability. */
export function requireUser(cap?: Capability): SessionUser {
  const user = getCurrentUser();
  if (!user) redirect("/admin/login");
  if (cap && !can(user.role, cap)) redirect("/admin?denied=1");
  return user;
}

/** For server actions / route handlers: throws instead of redirecting. */
export function requireUserForAction(cap?: Capability): SessionUser {
  const user = getCurrentUser();
  if (!user) throw new Error("Your session has expired. Sign in again.");
  if (cap && !can(user.role, cap)) throw new Error("Your role is not allowed to do this.");
  return user;
}

export function adminCount(): number {
  return (db().prepare("SELECT COUNT(*) AS n FROM admin_users").get() as { n: number }).n;
}

/** Rejects cross-site form/fetch posts to route handlers. Server actions get the same protection from Next.js. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients (curl) cannot ride a victim's cookies
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
    return new URL(origin).host === host.split(",")[0].trim();
  } catch {
    return false;
  }
}
