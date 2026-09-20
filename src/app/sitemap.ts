import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog";
import { listPages } from "@/lib/pages";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const catalog = await getCatalog();
  return [
    { url: `${base}/` },
    { url: `${base}/store` },
    { url: `${base}/faq` },
    ...catalog.categories.map((c) => ({ url: `${base}/store/${c.slug}` })),
    ...catalog.categories.flatMap((c) => c.products.map((p) => ({ url: `${base}/product/${p.id}` }))),
    ...listPages().filter((p) => p.status === "published").map((p) => ({ url: `${base}${["terms", "privacy", "refunds"].includes(p.slug) ? "" : "/pages"}/${p.slug}` })),
  ];
}
