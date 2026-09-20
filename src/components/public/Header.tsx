import Link from "next/link";
import { getSetting } from "@/lib/settings";
import { SiteNav } from "./SiteNav";

export function Header() {
  const b = getSetting("branding");
  const nav = getSetting("navigation");
  const items = nav.items.filter((i) => i.enabled).map((i) => ({ label: i.label, url: i.url, children: i.children.filter((c) => c.enabled).map((c) => ({ label: c.label, url: c.url })) }));
  return (
    <header className="site-header">
      <a href="#main" className="sr-only">Skip to content</a>
      <div className="container header-in">
        <Link href="/" className="brand">
          {b.logo ? <img src={b.logo} alt="" /> : null}
          <span>{b.storeName}</span>
        </Link>
        <SiteNav items={items} />
      </div>
    </header>
  );
}
