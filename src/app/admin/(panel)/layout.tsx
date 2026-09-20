import type { ReactNode } from "react";
import { AdminShell, type NavGroup } from "@/components/admin/AdminShell";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSetting } from "@/lib/settings";

export default function PanelLayout({ children }: { children: ReactNode }) {
  const user = requireUser();
  const r = user.role;
  const groups: NavGroup[] = [
    { items: [{ href: "/admin", label: "Overview" }] },
    ...(can(r, "store")
      ? [{ title: "Store", items: [{ href: "/admin/products", label: "Products" }, { href: "/admin/categories", label: "Categories" }, { href: "/admin/orders", label: "Orders" }, { href: "/admin/customers", label: "Customers" }, { href: "/admin/store-settings", label: "Store settings" }] }]
      : []),
    {
      title: "Website",
      items: [{ href: "/admin/homepage", label: "Homepage" }, { href: "/admin/pages", label: "Pages" }, { href: "/admin/navigation", label: "Navigation" }, { href: "/admin/theme", label: "Theme" }, { href: "/admin/branding", label: "Branding" }, { href: "/admin/media", label: "Media" }, { href: "/admin/faq", label: "FAQ" }, { href: "/admin/footer", label: "Footer" }, { href: "/admin/social", label: "Social links" }, { href: "/admin/seo", label: "SEO" }],
    },
    { title: "Integrations", items: [...(can(r, "integrations") ? [{ href: "/admin/tebex", label: "Tebex" }] : []), { href: "/admin/discord", label: "Discord" }, { href: "/admin/server-status", label: "Server status" }] },
    ...(can(r, "system") ? [{ title: "System", items: [{ href: "/admin/admins", label: "Admins" }, { href: "/admin/settings", label: "Settings" }, { href: "/admin/backups", label: "Backups" }] }] : []),
  ];
  return (
    <AdminShell groups={groups} user={{ name: user.displayName, role: user.role }} storeName={getSetting("branding").storeName}>
      {children}
    </AdminShell>
  );
}
