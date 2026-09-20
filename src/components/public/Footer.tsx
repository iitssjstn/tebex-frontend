import Link from "next/link";
import { getSetting } from "@/lib/settings";
import { isExternal, safeHref } from "@/lib/utils";
import { SOCIAL_SHORT } from "./Icons";
import { CopyIp } from "./ServerStatus";

function L({ href, children }: { href: string; children: React.ReactNode }) {
  const h = safeHref(href);
  return isExternal(h) ? <a href={h} target="_blank" rel="noopener noreferrer">{children}</a> : <Link href={h}>{children}</Link>;
}

export function Footer() {
  const f = getSetting("footer");
  const social = getSetting("social").links.filter((l) => l.enabled && l.url);
  const discord = getSetting("discord");
  const server = getSetting("server");
  const labels = getSetting("labels");
  const b = getSetting("branding");
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h3>{f.title || b.storeName}</h3>
            {f.description ? <p style={{ margin: 0, maxWidth: "24rem" }}>{f.description}</p> : null}
            {f.showServerIp && server.ip ? <div style={{ marginTop: "1rem" }}><CopyIp ip={server.ip} copyLabel={labels.copyIp} copiedLabel={labels.copied} /></div> : null}
            {(f.showSocial && social.length) || (f.showDiscord && discord.enabled && discord.url) ? (
              <div className="socials">
                {f.showDiscord && discord.enabled && discord.url && !social.some((s) => s.icon === "discord") ? (
                  <a className="social" href={safeHref(discord.url)} target="_blank" rel="noopener noreferrer" aria-label="Discord">{SOCIAL_SHORT.discord}</a>
                ) : null}
                {f.showSocial
                  ? social.map((s) => (
                      <a key={s.name + s.url} className="social" href={safeHref(s.url)} target="_blank" rel="noopener noreferrer" aria-label={s.name} title={s.name}>
                        {SOCIAL_SHORT[s.icon] ?? "URL"}
                      </a>
                    ))
                  : null}
              </div>
            ) : null}
          </div>
          {f.columns.map((c) => (
            <div key={c.title}>
              <h3>{c.title}</h3>
              <ul>{c.links.map((l) => <li key={l.label + l.url}><L href={l.url}>{l.label}</L></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="footer-base">
          <span>{f.copyright}</span>
          {f.legalLinks.length ? <ul>{f.legalLinks.map((l) => <li key={l.label + l.url}><L href={l.url}>{l.label}</L></li>)}</ul> : null}
        </div>
      </div>
    </footer>
  );
}
