import { getSetting } from "./settings";
import { isSafePublicUrl } from "./utils";

export type ServerStatus = { available: boolean; online: boolean; players: { online: number; max: number } | null; checkedAt: number };

const g = globalThis as typeof globalThis & { __sfstatus?: { key: string; at: number; value: ServerStatus } };
const TTL_MS = 45_000;

function endpoint(): string | null {
  const s = getSetting("server");
  const host = s.ip.trim();
  if (!host) return null;
  const hp = `${host}:${s.port}`;
  if (s.statusApi === "mcsrvstat") return `https://api.mcsrvstat.us/${s.edition === "bedrock" ? "bedrock/" : ""}3/${encodeURIComponent(hp)}`;
  if (s.statusApi === "custom") {
    const url = s.customApiUrl.replace("{host}", encodeURIComponent(host)).replace("{port}", String(s.port)).replace("{edition}", s.edition);
    return isSafePublicUrl(url) ? url : null;
  }
  return `https://api.mcstatus.io/v2/status/${s.edition}/${encodeURIComponent(hp)}`;
}

/** Real data only: when the status API cannot be reached the result says so instead of showing a made-up number. */
export async function getServerStatus(): Promise<ServerStatus> {
  const url = endpoint();
  const now = Date.now();
  if (!url) return { available: false, online: false, players: null, checkedAt: now };
  if (g.__sfstatus && g.__sfstatus.key === url && now - g.__sfstatus.at < TTL_MS) return g.__sfstatus.value;
  let value: ServerStatus;
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000), headers: { Accept: "application/json", "User-Agent": "tebex-storefront" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = (await res.json()) as { online?: boolean; players?: { online?: number; max?: number } };
    if (typeof j.online !== "boolean") throw new Error("unexpected response");
    value = { available: true, online: j.online, players: j.online && typeof j.players?.online === "number" ? { online: j.players.online, max: Number(j.players.max ?? 0) } : null, checkedAt: now };
  } catch {
    value = { available: false, online: false, players: null, checkedAt: now };
  }
  g.__sfstatus = { key: url, at: now, value };
  return value;
}
