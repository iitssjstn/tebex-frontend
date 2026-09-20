"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { formatMoney } from "@/lib/utils";
import { CartIcon } from "./Icons";

export type CartItem = { id: string; name: string; image: string; quantity: number; linePrice: number; canChangeQuantity: boolean };
export type CartView = { source: "tebex" | "demo"; currency: string; items: CartItem[]; total: number; count: number; coupons: string[]; needsAuth: boolean; username: string; error?: string };

export type CartConfig = {
  enabled: boolean;
  icon: string;
  title: string;
  emptyMessage: string;
  checkoutText: string;
  currencyDisplay: "symbol" | "code";
  labels: Record<string, string>;
};

type CheckoutResult = { checkoutUrl?: string; authLinks?: { name: string; url: string }[]; error?: string };
type Ctx = {
  config: CartConfig;
  cart: CartView | null;
  busy: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (id: string, quantity?: number) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setQty: (id: string, quantity: number) => Promise<void>;
  applyCode: (code: string) => Promise<string>;
  checkout: () => Promise<CheckoutResult>;
  clear: () => Promise<void>;
};

const CartCtx = createContext<Ctx | null>(null);
export const useCart = (): Ctx => {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
};

async function post(body: Record<string, unknown>) {
  const r = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return (await r.json()) as { cart?: CartView; message?: string } & CheckoutResult;
}

export function CartProvider({ config, children }: { config: CartConfig; children: ReactNode }) {
  const [cart, setCart] = useState<CartView | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/cart", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { cart: CartView }) => setCart(j.cart))
      .catch(() => undefined);
  }, []);

  const run = useCallback(async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const j = await post(body);
      if (j.cart) setCart(j.cart);
      return j;
    } catch {
      setCart((c) => (c ? { ...c, error: "Something went wrong. Please try again." } : c));
      return {} as Awaited<ReturnType<typeof post>>;
    } finally {
      setBusy(false);
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      config,
      cart,
      busy,
      open,
      setOpen,
      add: async (id, quantity = 1) => {
        const j = await run({ action: "add", id, quantity });
        if (j.cart && !j.cart.error) setOpen(true);
      },
      remove: async (id) => void (await run({ action: "remove", id })),
      setQty: async (id, quantity) => void (await run({ action: "setQuantity", id, quantity })),
      applyCode: async (code) => (await run({ action: "code", code })).message ?? "",
      checkout: async () => {
        setBusy(true);
        try {
          return await post({ action: "checkout" });
        } catch {
          return { error: "Something went wrong. Please try again." };
        } finally {
          setBusy(false);
        }
      },
      clear: async () => {
        await post({ action: "clear" });
        setCart((c) => (c ? { ...c, items: [], count: 0, total: 0 } : c));
      },
    }),
    [config, cart, busy, open, run]
  );

  return (
    <CartCtx.Provider value={value}>
      {children}
      <CartDrawer />
    </CartCtx.Provider>
  );
}

export function CartButton() {
  const { config, cart, setOpen } = useCart();
  if (!config.enabled) return null;
  return (
    <button type="button" className="cart-btn" onClick={() => setOpen(true)} aria-label={`${config.title}${cart?.count ? ` (${cart.count})` : ""}`}>
      <CartIcon name={config.icon} />
      {cart && cart.count > 0 ? <span className="cart-count">{cart.count}</span> : null}
    </button>
  );
}

export function AddToCart({ productId, disableQuantity = false, withQuantity = false, className = "" }: { productId: string; disableQuantity?: boolean; withQuantity?: boolean; className?: string }) {
  const { config, add, busy } = useCart();
  const [qty, setQty] = useState(1);
  if (!config.enabled) return null;
  return (
    <div className={`buy ${className}`} style={withQuantity ? undefined : { margin: 0 }}>
      {withQuantity && !disableQuantity ? (
        <div className="qty" role="group" aria-label={config.labels.quantity}>
          <button type="button" aria-label="-" onClick={() => setQty((q) => Math.max(1, q - 1))}>&minus;</button>
          <input aria-label={config.labels.quantity} inputMode="numeric" value={qty} onChange={(e) => setQty(Math.min(99, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)))} />
          <button type="button" aria-label="+" onClick={() => setQty((q) => Math.min(99, q + 1))}>+</button>
        </div>
      ) : null}
      <button type="button" className={`btn ${withQuantity ? "" : "btn-sm"}`} disabled={busy} onClick={() => add(productId, qty)}>
        {config.labels.addToCart}
      </button>
    </div>
  );
}

export function CartContents() {
  const { config, cart, busy, remove, setQty, applyCode, checkout } = useCart();
  const [code, setCode] = useState("");
  const [note, setNote] = useState<{ text: string; kind: "ok" | "err" } | null>(null);
  const [auth, setAuth] = useState<{ name: string; url: string }[] | null>(null);
  const L = config.labels;
  const money = (n: number) => formatMoney(n, cart?.currency ?? "EUR", config.currencyDisplay);

  async function go() {
    setNote(null);
    const r = await checkout();
    if (r.checkoutUrl) {
      window.location.href = r.checkoutUrl;
      return;
    }
    if (r.authLinks) setAuth(r.authLinks);
    if (r.error) setNote({ text: r.error, kind: "err" });
  }

  // Returning from Tebex sign-in: continue straight to payment.
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current || !cart || cart.items.length === 0) return;
    if (new URLSearchParams(window.location.search).get("auth") === "1") {
      autoRan.current = true;
      void go();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  if (!cart) return <p className="muted">&hellip;</p>;
  if (cart.items.length === 0) return <p className="muted">{config.emptyMessage}</p>;

  return (
    <div>
      {cart.items.map((i) => (
        <div className="line" key={i.id}>
          {i.image ? <img className="thumb" src={i.image} alt="" loading="lazy" /> : <span className="thumb" />}
          <div>
            <b>{i.name}</b>
            {i.canChangeQuantity ? (
              <div className="qty" role="group" aria-label={L.quantity}>
                <button type="button" aria-label="-" disabled={busy || i.quantity <= 1} onClick={() => setQty(i.id, i.quantity - 1)}>&minus;</button>
                <input readOnly aria-label={L.quantity} value={i.quantity} />
                <button type="button" aria-label="+" disabled={busy} onClick={() => setQty(i.id, i.quantity + 1)}>+</button>
              </div>
            ) : (
              <small>&times; {i.quantity}</small>
            )}
            <div><button type="button" className="muted" style={{ background: "none", border: 0, padding: 0, cursor: "pointer", textDecoration: "underline" }} onClick={() => remove(i.id)}>{L.remove}</button></div>
          </div>
          <b>{money(i.linePrice)}</b>
        </div>
      ))}

      {cart.source === "tebex" ? (
        <form className="code-form" style={{ marginTop: "1rem" }} onSubmit={async (e) => { e.preventDefault(); if (!code.trim()) return; const m = await applyCode(code); setNote({ text: m, kind: /not valid|error/i.test(m) ? "err" : "ok" }); setCode(""); }}>
          <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder={L.couponPlaceholder} aria-label={L.couponPlaceholder} maxLength={60} />
          <button className="btn btn-ghost btn-sm" disabled={busy}>{L.applyCode}</button>
        </form>
      ) : null}

      <div className="totals" style={{ marginTop: "1.1rem" }}><span>{L.total}</span><span>{money(cart.total)}</span></div>
      {cart.error ? <p className="err">{cart.error}</p> : null}
      {note ? <p className={note.kind === "ok" ? "ok" : "err"} role="status">{note.text}</p> : null}

      {auth ? (
        <div className="auth-box" role="region" aria-label={L.authTitle}>
          <b>{L.authTitle}</b>
          <p className="muted" style={{ margin: ".3rem 0 .6rem" }}>{L.authText}</p>
          {auth.map((a) => (
            <a key={a.url} className="btn btn-sm" href={a.url}>{a.name}</a>
          ))}
        </div>
      ) : (
        <button type="button" className="btn" style={{ width: "100%", marginTop: "1rem" }} disabled={busy} onClick={go}>
          {config.checkoutText}
        </button>
      )}
    </div>
  );
}

function CartDrawer() {
  const { config, open, setOpen } = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, setOpen]);
  if (!open || !config.enabled) return null;
  return (
    <>
      <div className="drawer-back" onClick={() => setOpen(false)} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={config.title}>
        <header>
          <h2>{config.title}</h2>
          <button ref={closeRef} type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">&times;</button>
        </header>
        <div className="drawer-body">
          <CartContents />
        </div>
        <footer>
          <a className="muted" href="/cart" onClick={() => setOpen(false)}>{config.labels.cart}</a>
        </footer>
      </aside>
    </>
  );
}
