import { NextResponse } from "next/server";
import { getCurrentUser, sameOrigin } from "@/lib/auth";
import { restoreBackup } from "@/lib/backup";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";
const MAX_BYTES = 400 * 1024 * 1024;

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Blocked." }, { status: 403 });
  const u = getCurrentUser();
  if (!u || !can(u.role, "system")) return NextResponse.json({ error: "Only the owner can restore a backup." }, { status: 403 });
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BYTES) return NextResponse.json({ error: "That file is too large." }, { status: 413 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a backup file." }, { status: 400 });
    await restoreBackup(Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Restore failed." }, { status: 400 });
  }
}
