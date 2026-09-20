import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { CartProvider } from "@/components/public/cart";
import { Footer } from "@/components/public/Footer";
import { Header } from "@/components/public/Header";
import { adminCount } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { siteUrl } from "@/lib/site";
import { fontsHref, themeStyle } from "@/lib/theme";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  if (!getSetting("site").setupComplete) return {};
  const b = getSetting("branding");
  const seo = getSetting("seo");
  const name = b.browserTitle || b.storeName;
  const title = seo.title || name;
  let metadataBase: URL | undefined;
  try {
    metadataBase = new URL(siteUrl());
  } catch {
    metadataBase = undefined;
  }
  return {
    metadataBase,
    title: { default: title, template: `%s | ${name}` },
    description: seo.description || b.description,
    robots: { index: seo.robotsIndex, follow: seo.robotsFollow },
    icons: b.favicon ? { icon: b.favicon } : undefined,
    openGraph: { title: seo.ogTitle || title, description: seo.ogDescription || seo.description || b.description, images: seo.ogImage ? [seo.ogImage] : undefined, siteName: b.storeName, type: "website" },
  };
}

export default function PublicLayout({ children }: { children: ReactNode }) {
  if (adminCount() === 0 || !getSetting("site").setupComplete) redirect("/setup");
  const b = getSetting("branding");
  const cart = getSetting("cart");
  const store = getSetting("store");
  const labels = getSetting("labels");
  const fonts = fontsHref();
  return (
    <div className="site" style={themeStyle()} data-btn={b.buttonStyle}>
      {fonts ? (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link rel="stylesheet" href={fonts} />
        </>
      ) : null}
      <CartProvider config={{ enabled: cart.enabled, icon: cart.icon, title: cart.title, emptyMessage: cart.emptyMessage, checkoutText: cart.checkoutText, currencyDisplay: store.currencyDisplay, labels }}>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </CartProvider>
    </div>
  );
}
