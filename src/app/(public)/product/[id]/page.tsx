import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AddToCart } from "@/components/public/cart";
import { OptionPicker } from "@/components/public/OptionPicker";
import { toOpts } from "@/components/public/ProductCard";
import { findProduct, getCatalog, groupOf, productDescriptionHtml } from "@/lib/catalog";
import { getSetting } from "@/lib/settings";
import { plainText } from "@/lib/sanitize";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const p = findProduct(await getCatalog(), params.id);
  if (!p) return { title: getSetting("labels").productNotFound };
  const desc = plainText(productDescriptionHtml(p)).slice(0, 200);
  return { title: p.name, description: desc || undefined, openGraph: { title: p.name, description: desc || undefined, images: p.image ? [p.image] : undefined } };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const store = getSetting("store");
  if (!store.enableProductDetails) redirect("/store");
  const labels = getSetting("labels");
  const cart = getSetting("cart");
  const catalog = await getCatalog();
  const p = findProduct(catalog, params.id);
  if (!p) notFound();
  const group = groupOf(catalog, p);
  const grouped = group.length > 1;
  const title = grouped ? p.groupName : p.name;
  const discounted = p.originalPrice !== null && p.originalPrice > p.price;
  const cat = catalog.categories.find((c) => c.id === p.categoryId);
  return (
    <div className="container product">
      <div className="p-media">
        {p.image ? <img src={p.image} alt={p.name} /> : <span className="ph" aria-hidden>{p.name.slice(0, 1)}</span>}
        {store.showBadges && p.badge ? <span className="badge">{p.badge}</span> : null}
      </div>
      <div>
        <p className="crumbs">
          <Link href="/store">{store.title}</Link>
          {cat ? <> / <Link href={`/store/${cat.slug}`}>{cat.name}</Link></> : null}
        </p>
        <h1>{title}</h1>
        {grouped ? (
          <div style={{ marginTop: "1rem" }}>
            <OptionPicker options={toOpts(group)} initialId={p.id} currencyDisplay={store.currencyDisplay} cartEnabled={cart.enabled} labels={labels} big />
          </div>
        ) : (
          <>
            <div className="price" style={{ marginTop: "1rem" }}>
              <strong>{formatMoney(p.price, p.currency, store.currencyDisplay)}</strong>
              {discounted && store.showOriginalPrice ? <s>{formatMoney(p.originalPrice!, p.currency, store.currencyDisplay)}</s> : null}
              {discounted && store.showDiscounts ? <span className="save">{labels.discountLabel} {formatMoney(p.originalPrice! - p.price, p.currency, store.currencyDisplay)}</span> : null}
            </div>
            {p.recurring && labels.recurringNote ? <p className="muted small" style={{ margin: ".3rem 0 0" }}>{labels.recurringNote}</p> : null}
            {cart.enabled ? <AddToCart productId={p.id} disableQuantity={p.disableQuantity} withQuantity /> : null}
          </>
        )}
        <div className="prose" dangerouslySetInnerHTML={{ __html: productDescriptionHtml(p) }} />
      </div>
    </div>
  );
}
