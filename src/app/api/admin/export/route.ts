import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { exportStore } from "@/lib/backup";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = getCurrentUser();
  if (!u || !can(u.role, "system")) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  return new NextResponse(new Uint8Array(exportStore()), { headers: { "Content-Type": "application/zip", "Content-Disposition": 'attachment; filename="store-export.zip"', "Cache-Control": "no-store" } });
}
