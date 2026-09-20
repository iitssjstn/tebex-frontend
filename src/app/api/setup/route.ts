import { NextResponse } from "next/server";
import { sameOrigin, startSession } from "@/lib/auth";
import { runSetup, type SetupInput } from "@/lib/setup";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Blocked." }, { status: 403 });
  let body: SetupInput;
  try {
    body = (await req.json()) as SetupInput;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const r = await runSetup({
    username: String(body.username ?? ""), password: String(body.password ?? ""), confirm: String(body.confirm ?? ""), storeName: String(body.storeName ?? ""), ip: String(body.ip ?? ""), discord: String(body.discord ?? ""),
    timezone: String(body.timezone ?? ""), currency: String(body.currency ?? ""), publicToken: String(body.publicToken ?? ""), privateKey: String(body.privateKey ?? ""), gameServerSecret: String(body.gameServerSecret ?? ""),
  });
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
  startSession(r.userId);
  return NextResponse.json({ ok: true });
}
