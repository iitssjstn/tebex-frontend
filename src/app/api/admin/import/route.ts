import { NextResponse } from "next/server";
import { getCurrentUser, sameOrigin } from "@/lib/auth";
import { importStore } from "@/lib/backup";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Blocked." }, { status: 403 });
  const u = getCurrentUser();
  if (!u || !can(u.role, "system")) return NextResponse.json({ error: "Only the owner can import a store." }, { status: 403 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose an export file." }, { status: 400 });
    return NextResponse.json({ ok: true, imported: importStore(Buffer.from(await file.arrayBuffer())) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Import failed." }, { status: 400 });
  }
}
