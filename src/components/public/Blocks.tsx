import Link from "next/link";
import { cleanHtml } from "@/lib/sanitize";
import { isExternal, safeHref } from "@/lib/utils";
import type { Block } from "@/lib/validators";

const P = (b: Block) => b.props as Record<string, string>;

function Btn({ href, children, ghost }: { href: string; children: React.ReactNode; ghost?: boolean }) {
  const h = safeHref(href);
  const cls = `btn${ghost ? " btn-ghost" : ""}`;
  return isExternal(h) ? <a className={cls} href={h} target="_blank" rel="noopener noreferrer">{children}</a> : <Link className={cls} href={h}>{children}</Link>;
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="container blocks">
      {blocks.map((b) => {
        const p = P(b);
        switch (b.type) {
          case "heading": {
            const Tag = (["h2", "h3", "h4"].includes(p.level) ? p.level : "h2") as "h2" | "h3" | "h4";
            return <Tag key={b.id} className={p.align === "center" ? "b-align-center" : p.align === "right" ? "b-align-right" : undefined} style={{ fontSize: Tag === "h2" ? "clamp(1.8rem,3.4vw,2.6rem)" : Tag === "h3" ? "1.6rem" : "1.2rem" }}>{p.text}</Tag>;
          }
          case "text":
          case "html":
            return <div key={b.id} className="prose" dangerouslySetInnerHTML={{ __html: cleanHtml(p.html ?? "") }} />;
          case "image":
            return p.src ? (
              <figure key={b.id} className={p.width === "narrow" ? "b-narrow" : p.width === "wide" ? "b-wide" : undefined}>
                <img src={p.src} alt={p.alt ?? ""} loading="lazy" />
                {p.caption ? <figcaption>{p.caption}</figcaption> : null}
              </figure>
            ) : null;
          case "button":
            return <div key={b.id} className={p.align === "center" ? "b-align-center" : p.align === "right" ? "b-align-right" : undefined}><Btn href={p.url} ghost={p.variant === "ghost"}>{p.text}</Btn></div>;
          case "divider":
            return <hr key={b.id} />;
          case "spacer":
            return <div key={b.id} aria-hidden style={{ height: p.size === "lg" ? "4rem" : p.size === "sm" ? "1rem" : "2rem" }} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
