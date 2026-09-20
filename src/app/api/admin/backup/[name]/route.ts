import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { backupsDir, isBackupName } from "@/lib/backup";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { name: string } }) {
  const u = getCurrentUser();
  if (!u || !can(u.role, "system")) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  if (!isBackupName(params.name)) return NextResponse.json({ error: "Unknown backup." }, { status: 404 });
  const file = path.join(backupsDir(), params.name);
  if (!fs.existsSync(file)) return NextResponse.json({ error: "Unknown backup." }, { status: 404 });
  return new NextResponse(new Uint8Array(fs.readFileSync(file)), { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${params.name}"`, "Cache-Control": "no-store" } });
}
