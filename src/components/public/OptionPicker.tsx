"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/utils";
import { AddToCart } from "./cart";

export type Opt = { id: string; label: string; price: number; originalPrice: number | null; currency: string; recurring: boolean; save: number };

type Props = {
  options: Opt[];
  initialId?: string;
  currencyDisplay: "symbol" | "code";
  cartEnabled: boolean;
  labels: { duration: string; saveVsMonthly: string; recurringNote: string };
  big?: boolean;
};

/** One product, several Tebex packages: the visitor picks a duration and the matching package goes in the cart. */
export function OptionPicker({ options, initialId, currencyDisplay, cartEnabled, labels, big }: Props) {
  const [sel, setSel] = useState(options.find((o) => o.id === initialId)?.id ?? options[0].id);
  const o = options.find((x) => x.id === sel) ?? options[0];
  return (
    <div>
      <div className="opts" role="radiogroup" aria-label={labels.duration}>
        {options.map((x) => (
          <button key={x.id} type="button" role="radio" aria-checked={x.id === sel} className="opt" onClick={() => setSel(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <div className="price" style={big ? { marginTop: ".8rem" } : undefined}>
        <strong>{formatMoney(o.price, o.currency, currencyDisplay)}</strong>
        {o.originalPrice && o.originalPrice > o.price ? <s>{formatMoney(o.originalPrice, o.currency, currencyDisplay)}</s> : null}
        {o.save > 0 ? <span className="save">{labels.saveVsMonthly.replace("{percent}", String(o.save))}</span> : null}
      </div>
      {o.recurring && labels.recurringNote ? <p className="muted small" style={{ margin: ".3rem 0 0" }}>{labels.recurringNote}</p> : null}
      {cartEnabled ? <div style={{ marginTop: ".7rem" }}><AddToCart productId={o.id} disableQuantity /></div> : null}
    </div>
  );
}
