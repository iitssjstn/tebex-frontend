import { NextResponse } from "next/server";
import { adminCount, sameOrigin, startSession, verifyLogin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Blocked." }, { status: 403 });
  if (adminCount() === 0) return NextResponse.json({ error: "Set up the store first.", setup: true }, { status: 409 });
  let body: { username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const r = await verifyLogin(String(body.username ?? "").slice(0, 100), String(body.password ?? "").slice(0, 300));
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 401 });
  startSession(r.user.id);
  return NextResponse.json({ ok: true });
}
