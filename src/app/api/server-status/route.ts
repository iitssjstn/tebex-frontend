import { NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";
import { getServerStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = getSetting("server");
  const status = await getServerStatus();
  return NextResponse.json(
    { available: status.available, online: status.online, players: s.showPlayers ? status.players : null, showStatus: s.showStatus, showPlayers: s.showPlayers },
    { headers: { "Cache-Control": "public, max-age=15" } }
  );
}
