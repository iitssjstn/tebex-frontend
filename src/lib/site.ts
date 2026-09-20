import { headers } from "next/headers";
import { getSetting } from "./settings";

/** Public address of the site. Comes from Admin > Settings; falls back to the request headers behind a reverse proxy. */
export function siteUrl(): string {
  const configured = getSetting("site").siteUrl;
  if (configured) return configured.replace(/\/$/, "");
  const h = headers();
  const proto = (h.get("x-forwarded-proto") ?? "http").split(",")[0].trim();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000").split(",")[0].trim();
  return `${proto}://${host}`;
}
