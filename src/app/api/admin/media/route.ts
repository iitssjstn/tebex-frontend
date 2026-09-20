import { NextResponse } from "next/server";
import { getCurrentUser, sameOrigin } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { listMedia, mediaUrl, replaceUpload, saveUpload } from "@/lib/media";

export const dynamic = "force-dynamic";

function authorised() {
  const u = getCurrentUser();
  return u && can(u.role, "content") ? u : null;
}

export async function GET(req: Request) {
  if (!authorised()) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return NextResponse.json({ items: listMedia(q).map((m) => ({ ...m, url: mediaUrl(m.file) })) });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Blocked." }, { status: 403 });
  if (!authorised()) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  try {
    const form = await req.formData();
    const replaceId = new URL(req.url).searchParams.get("replace");
    if (replaceId) {
      const f = form.get("file");
      if (!(f instanceof File)) return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
      const row = await replaceUpload(replaceId, Buffer.from(await f.arrayBuffer()));
      return NextResponse.json({ items: [{ ...row, url: mediaUrl(row.file) }] });
    }
    const files = form.getAll("file").filter((f): f is File => f instanceof File);
    if (!files.length) return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
    const saved = [];
    for (const f of files.slice(0, 20)) saved.push(await saveUpload(Buffer.from(await f.arrayBuffer()), f.name));
    return NextResponse.json({ items: saved.map((m) => ({ ...m, url: mediaUrl(m.file) })) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed." }, { status: 400 });
  }
}
