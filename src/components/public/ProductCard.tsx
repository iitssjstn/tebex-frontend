import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { getSetting } from "@/lib/settings";
import { formatMoney } from "@/lib/utils";
import { AddToCart } from "./cart";

export function ProductCard({ p, showCategory = false }: { p: Product; showCategory?: boolean }) {
  const store = getSetting("store");
  const labels = getSetting("labels");
  const cart = getSetting("cart");
  const discounted = p.originalPrice !== null && p.originalPrice > p.price;
  const href = `/product/${p.id}`;
  const media = (
    <div className="p-media">
      {p.image ? <img src={p.image} alt="" loading="lazy" /> : <span className="ph" aria-hidden>{p.name.slice(0, 1)}</span>}
      {store.showBadges && p.badge ? <span className="badge">{p.badge}</span> : null}
    </div>
  );
  return (
    <article className="p-card">
      {store.enableProductDetails ? <Link href={href} tabIndex={-1} aria-hidden>{media}</Link> : media}
      <div className="p-body">
        {showCategory ? <span className="p-cat">{p.categoryName}</span> : null}
        <h3>{store.enableProductDetails ? <Link href={href}>{p.name}</Link> : p.name}</h3>
        <div className="price">
          <strong>{formatMoney(p.price, p.currency, store.currencyDisplay)}</strong>
          {discounted && store.showOriginalPrice ? <s>{formatMoney(p.originalPrice!, p.currency, store.currencyDisplay)}</s> : null}
          {discounted && store.showDiscounts ? <span className="save">{labels.discountLabel} {formatMoney(p.originalPrice! - p.price, p.currency, store.currencyDisplay)}</span> : null}
        </div>
        {cart.enabled ? <AddToCart productId={p.id} disableQuantity={p.disableQuantity} /> : store.enableProductDetails ? <Link className="btn btn-sm btn-ghost" href={href}>{labels.viewDetails}</Link> : null}
      </div>
    </article>
  );
}
