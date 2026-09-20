"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { isExternal, safeHref } from "@/lib/utils";
import { CartButton } from "./cart";

export type NavItem = { label: string; url: string; children: { label: string; url: string }[] };

function A({ href, children, current }: { href: string; children: React.ReactNode; current?: boolean }) {
  const h = safeHref(href);
  if (isExternal(h)) return <a href={h} target="_blank" rel="noopener noreferrer">{children}</a>;
  return <Link href={h} aria-current={current ? "page" : undefined}>{children}</Link>;
}

export function SiteNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const is = (u: string) => (u === "/" ? path === "/" : !!u && path.startsWith(u));
  return (
    <>
      <button type="button" className="menu-toggle" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen((o) => !o)}>
        <span className="sr-only">Menu</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><path d="M3 6h18M3 12h18M3 18h18" /></svg>
      </button>
      <nav id="site-nav" className="nav" data-open={open} aria-label="Main" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
        {items.map((it) =>
          it.children.length ? (
            <div className="nav-item" key={it.label}>
              {it.url ? <A href={it.url} current={is(it.url)}>{it.label}</A> : <button type="button" className="nav-link" aria-haspopup="true">{it.label}</button>}
              <div className="dropdown">
                {it.children.map((c) => <A key={c.label + c.url} href={c.url} current={is(c.url)}>{c.label}</A>)}
              </div>
            </div>
          ) : (
            <div className="nav-item" key={it.label}><A href={it.url} current={is(it.url)}>{it.label}</A></div>
          )
        )}
      </nav>
      <CartButton />
    </>
  );
}
