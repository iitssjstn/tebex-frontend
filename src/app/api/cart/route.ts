import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/auth";
import { addItem, applyCartCode, beginCheckout, changeUsername, clearCart, getCartView, removeItem, setQuantity } from "@/lib/cart";

export const dynamic = "force-dynamic";
const noStore = { headers: { "Cache-Control": "no-store" } };

export async function GET() {
  return NextResponse.json({ cart: await getCartView() }, noStore);
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Blocked." }, { status: 403 });
  let body: { action?: string; id?: unknown; quantity?: unknown; code?: unknown; username?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const id = typeof body.id === "string" || typeof body.id === "number" ? String(body.id).slice(0, 60) : "";
  const qty = Number(body.quantity);
  switch (body.action) {
    case "add":
      return NextResponse.json({ cart: await addItem(id, qty || 1, typeof body.username === "string" ? body.username.slice(0, 40) : undefined) }, noStore);
    case "setUsername":
      return NextResponse.json({ cart: await changeUsername(String(body.username ?? "").slice(0, 40)) }, noStore);
    case "remove":
      return NextResponse.json({ cart: await removeItem(id) }, noStore);
    case "setQuantity":
      return NextResponse.json({ cart: await setQuantity(id, qty) }, noStore);
    case "code": {
      const r = await applyCartCode(String(body.code ?? ""));
      return NextResponse.json({ cart: r, message: r.message }, noStore);
    }
    case "checkout":
      return NextResponse.json(await beginCheckout(), noStore);
    case "clear":
      clearCart();
      return NextResponse.json({ ok: true }, noStore);
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
}
