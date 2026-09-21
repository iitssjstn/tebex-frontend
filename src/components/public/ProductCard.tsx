import Link from "next/link";
import { savePercent, type Entry, type Product } from "@/lib/catalog";
import { getSetting } from "@/lib/settings";
import { formatMoney } from "@/lib/utils";
import { AddToCart } from "./cart";
import { OptionPicker } from "./OptionPicker";

export const toOpts = (options: Product[]) =>
  options.map((o) => ({ id: o.id, label: o.optionLabel || o.name, price: o.price, originalPrice: o.originalPrice, currency: o.currency, recurring: o.recurring, save: savePercent(o, options) }));

export function ProductCard({ entry, showCategory = false }: { entry: Entry; showCategory?: boolean }) {
  const p = entry.primary;
  const store = getSetting("store");
  const labels = getSetting("labels");
  const cart = getSetting("cart");
  const grouped = entry.options.length > 1;
  const discounted = !grouped && p.originalPrice !== null && p.originalPrice > p.price;
  const href = `/product/${p.id}`;
  const media = (
    <div className="p-media">
      {p.image ? <img src={p.image} alt="" loading="lazy" /> : <span className="ph" aria-hidden>{entry.name.slice(0, 1)}</span>}
      {store.showBadges && p.badge ? <span className="badge">{p.badge}</span> : null}
    </div>
  );
  return (
    <article className="p-card">
      {store.enableProductDetails ? <Link href={href} tabIndex={-1} aria-hidden>{media}</Link> : media}
      <div className="p-body">
        {showCategory ? <span className="p-cat">{p.categoryName}</span> : null}
        <h3>{store.enableProductDetails ? <Link href={href}>{entry.name}</Link> : entry.name}</h3>
        {grouped ? (
          <OptionPicker options={toOpts(entry.options)} currencyDisplay={store.currencyDisplay} cartEnabled={cart.enabled} labels={labels} />
        ) : (
          <>
            <div className="price">
              <strong>{formatMoney(p.price, p.currency, store.currencyDisplay)}</strong>
              {discounted && store.showOriginalPrice ? <s>{formatMoney(p.originalPrice!, p.currency, store.currencyDisplay)}</s> : null}
              {discounted && store.showDiscounts ? <span className="save">{labels.discountLabel} {formatMoney(p.originalPrice! - p.price, p.currency, store.currencyDisplay)}</span> : null}
            </div>
            {p.recurring && labels.recurringNote ? <p className="muted small" style={{ margin: 0 }}>{labels.recurringNote}</p> : null}
            {cart.enabled ? <AddToCart productId={p.id} disableQuantity={p.disableQuantity} /> : store.enableProductDetails ? <Link className="btn btn-sm btn-ghost" href={href}>{labels.viewDetails}</Link> : null}
          </>
        )}
      </div>
    </article>
  );
}
