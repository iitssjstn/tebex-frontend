"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ToastProvider } from "./ui";

export type NavGroup = { title?: string; items: { href: string; label: string }[] };

export function AdminShell({ groups, user, storeName, children }: { groups: NavGroup[]; user: { name: string; role: string }; storeName: string; children: ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`));
  return (
    <ToastProvider>
      <div className="adm-top">
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>Menu</button>
        <b>{storeName}</b>
      </div>
      {open ? <div className="adm-scrim" onClick={() => setOpen(false)} /> : null}
      <div className="adm-shell">
        <aside className="adm-side" data-open={open} aria-label="Admin navigation">
          <Link href="/admin" className="brand"><i>{storeName.slice(0, 1).toUpperCase()}</i>{storeName}</Link>
          <nav className="adm-nav" style={{ display: "grid", gap: "1.1rem" }}>
            {groups.map((g, i) => (
              <div className="adm-group" key={i}>
                {g.title ? <h4>{g.title}</h4> : null}
                {g.items.map((it) => <Link key={it.href} href={it.href} aria-current={active(it.href) ? "page" : undefined}>{it.label}</Link>)}
              </div>
            ))}
          </nav>
          <div className="adm-user">
            <b>{user.name}</b>
            <span>{user.role}</span>
            <div style={{ display: "grid", gap: ".4rem", marginTop: ".5rem" }}>
              <a href="/" target="_blank" rel="noopener" style={{ color: "#c8cdd8" }}>View store</a>
              <Link href="/admin/account" style={{ color: "#c8cdd8" }}>My account</Link>
            </div>
            <button type="button" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); location.href = "/admin/login"; }}>Sign out</button>
          </div>
        </aside>
        <main className="adm-main">{children}</main>
      </div>
    </ToastProvider>
  );
}
