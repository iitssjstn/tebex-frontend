import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CartContents } from "@/components/public/cart";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const generateMetadata = (): Metadata => ({ title: getSetting("cart").title });

export default function CartPage() {
  const cart = getSetting("cart");
  if (!cart.enabled) redirect("/store");
  return (
    <div className="container cart-page">
      <h1 style={{ fontSize: "2.4rem", marginBottom: "1.2rem" }}>{cart.title}</h1>
      <CartContents />
    </div>
  );
}
