import { NextResponse } from "next/server";
import { endSession, sameOrigin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Blocked." }, { status: 403 });
  endSession();
  return NextResponse.json({ ok: true });
}
