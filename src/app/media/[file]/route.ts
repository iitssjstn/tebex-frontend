import fs from "node:fs";
import { NextResponse } from "next/server";
import { isMediaFile, mediaPath } from "@/lib/media";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { file: string } }) {
  const file = params.file;
  if (!isMediaFile(file)) return new NextResponse("Not found", { status: 404 });
  try {
    const data = fs.readFileSync(mediaPath(file));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": file.endsWith(".gif") ? "image/gif" : "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
