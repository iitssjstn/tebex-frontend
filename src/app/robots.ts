import type { MetadataRoute } from "next";
import { getSetting } from "@/lib/settings";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const seo = getSetting("seo");
  const rules = seo.robotsIndex ? { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/setup", "/cart"] } : { userAgent: "*", disallow: "/" };
  return { rules, sitemap: `${siteUrl()}/sitemap.xml` };
}
